import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/resend";
import { FREE_TRIAL_CREDITS } from "@/lib/ai/interpretation";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/seo/site";

/**
 * Xác nhận email khi đăng ký.
 *
 * Tài khoản được tạo ngay lúc submit form nhưng ở trạng thái chưa xác nhận:
 * `User.emailVerifiedAt` null, chưa có credit dùng thử, và `authorize` trong
 * `auth.ts` từ chối đăng nhập. Bấm link trong email mới là bước hoàn tất —
 * lúc đó mới cộng credit, để một địa chỉ email bịa ra không đẻ được credit.
 */

/** Link sống 24 giờ: đủ dài cho người đọc mail hôm sau, đủ ngắn để không tồn kho. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerificationResult =
  | "verified"
  | "already-verified"
  | "expired"
  | "invalid";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verificationUrl(token: string): string {
  return `${SITE_URL}/verify-email?token=${token}`;
}

/**
 * Cấp token mới và huỷ mọi token chưa dùng trước đó của cùng tài khoản.
 *
 * Huỷ token cũ để "gửi lại" có nghĩa là gửi lại: nếu để tất cả cùng sống thì
 * một link rò rỉ từ email cũ vẫn kích hoạt được tài khoản.
 */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  // Token hết hạn của người khác không ai tra lại nữa. Quét từ một phần nhỏ
  // các lần cấp token là đủ giữ bảng không phình, khỏi cần job riêng.
  if (Math.random() < 0.05) {
    await prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lte: new Date() }, usedAt: null },
    });
  }

  return token;
}

export interface VerificationEmailInput {
  to: string;
  name: string | null;
  token: string;
}

/**
 * Gửi email chứa link xác nhận. Trả `false` khi không gửi được — chỗ gọi phải
 * nói cho người dùng biết, vì họ đang đứng chờ chính lá thư này.
 *
 * Không cấu hình Resend (local, preview) thì in link ra log để vẫn chạy được
 * luồng đăng ký mà không cần hộp thư thật.
 */
export async function sendVerificationEmail(
  input: VerificationEmailInput,
): Promise<boolean> {
  const url = verificationUrl(input.token);

  const sent = await sendEmail({
    to: input.to,
    from: process.env.AUTH_EMAIL_FROM,
    subject: `[${SITE_NAME}] Xác nhận địa chỉ email của bạn`,
    text: [
      `Chào ${input.name?.trim() || "bạn"},`,
      "",
      `Bấm vào link dưới đây để hoàn tất đăng ký tài khoản ${SITE_NAME}:`,
      "",
      url,
      "",
      "Link có hiệu lực trong 24 giờ. Sau khi xác nhận, bạn nhận ngay credit dùng thử.",
      "",
      "Nếu bạn không đăng ký tài khoản nào, bỏ qua email này — tài khoản sẽ không",
      "bao giờ được kích hoạt.",
      "",
      `Cần hỗ trợ? Trả lời email này hoặc liên hệ ${SUPPORT_EMAIL}.`,
    ].join("\n"),
  });

  if (!sent) {
    console.warn(`[auth] Không gửi được email xác nhận cho ${input.to}. Link: ${url}`);
  }
  return sent;
}

/**
 * Đổi token lấy một tài khoản đã xác nhận.
 *
 * Token dùng một lần, nhưng bấm lại link cũ không được báo lỗi: trình quét
 * email của nhiều nhà cung cấp mở sẵn mọi link trước khi người dùng kịp bấm,
 * nên lần bấm "thật" thường là lần thứ hai. Token đã dùng mà tài khoản đã xác
 * nhận thì trả `already-verified` — với người dùng, cả hai đều là thành công.
 */
export async function consumeVerificationToken(
  token: string,
): Promise<VerificationResult> {
  if (!token) return "invalid";

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, credits: true, emailVerifiedAt: true } } },
  });

  if (!row) return "invalid";
  if (row.user.emailVerifiedAt) return "already-verified";
  if (row.usedAt) return "invalid";
  if (row.expiresAt <= new Date()) return "expired";

  // Đánh dấu token đã dùng bằng `updateMany` có điều kiện `usedAt: null`:
  // hai request song song (người dùng bấm hai lần, hoặc trình quét bấm cùng
  // lúc) thì chỉ một cái đếm được 1 dòng và đi tiếp, cái còn lại dừng ở đây
  // thay vì cộng credit lần thứ hai.
  const verified = await prisma.$transaction(async (tx) => {
    const { count } = await tx.emailVerificationToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) return false;

    const user = await tx.user.update({
      where: { id: row.user.id },
      data: {
        emailVerifiedAt: new Date(),
        credits: { increment: FREE_TRIAL_CREDITS },
        freeCreditsGrantedAt: new Date(),
      },
    });
    await tx.creditTransaction.create({
      data: {
        userId: row.user.id,
        type: "FREE_GRANT",
        amount: FREE_TRIAL_CREDITS,
        balanceAfter: user.credits,
      },
    });
    return true;
  });

  return verified ? "verified" : "already-verified";
}
