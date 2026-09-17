import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/resend";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/seo/site";

/**
 * Đặt lại mật khẩu qua email.
 *
 * Cùng một hình dạng với xác nhận email — token ngẫu nhiên, chỉ lưu bản băm,
 * cấp mới thì huỷ cái cũ — nhưng khác ở hai điểm mà cả hai đều quan trọng:
 *
 * 1. Hạn 1 giờ thay vì 24. Token này đổi được mật khẩu người khác, nên cửa sổ
 *    để một email bị đọc trộm còn dùng được phải hẹp hết mức còn chịu được.
 * 2. Token **không** bị tiêu lúc mở link. Mở link mới chỉ là hiện form; mật
 *    khẩu đổi ở bước submit, và token chết ở đó. Tiêu ngay lúc GET thì trình
 *    quét thư của nhà cung cấp sẽ đốt sạch link trước khi người dùng kịp bấm.
 */

/** Hạn của link. Ngắn có chủ đích — xem ghi chú ở trên. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

export type ResetTokenState = "valid" | "expired" | "invalid";
export type ResetResult = "reset" | "expired" | "invalid";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetUrl(token: string): string {
  return `${SITE_URL}/reset-password?token=${token}`;
}

/**
 * Cấp token mới và huỷ mọi token chưa dùng trước đó của cùng tài khoản: bấm
 * "quên mật khẩu" lần thứ hai phải làm link lần đầu chết, nếu không thì mỗi
 * lần bấm lại là thêm một chiếc chìa khoá còn hiệu lực nằm trong hộp thư.
 */
export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  if (Math.random() < 0.05) {
    await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lte: new Date() }, usedAt: null },
    });
  }

  return token;
}

export interface PasswordResetEmailInput {
  to: string;
  name: string | null;
  token: string;
}

/**
 * Gửi email chứa link đặt lại. Trả `false` khi không gửi được — chỗ gọi vẫn
 * phải trả lời người dùng y như lúc gửi thành công, xem `requestPasswordReset`
 * trong `app/actions/auth.ts`.
 */
export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
): Promise<boolean> {
  const url = passwordResetUrl(input.token);

  const sent = await sendEmail({
    to: input.to,
    from: process.env.AUTH_EMAIL_FROM,
    subject: `[${SITE_NAME}] Đặt lại mật khẩu`,
    text: [
      `Chào ${input.name?.trim() || "bạn"},`,
      "",
      "Có người vừa yêu cầu đặt lại mật khẩu cho tài khoản này. Bấm vào link",
      "dưới đây để chọn mật khẩu mới:",
      "",
      url,
      "",
      "Link có hiệu lực trong 1 giờ và chỉ dùng được một lần.",
      "",
      "Nếu bạn không yêu cầu điều này, bỏ qua email — mật khẩu hiện tại của bạn",
      "vẫn nguyên và không ai vào được tài khoản chỉ nhờ email này.",
      "",
      `Cần hỗ trợ? Trả lời email này hoặc liên hệ ${SUPPORT_EMAIL}.`,
    ].join("\n"),
  });

  if (!sent) {
    console.warn(`[auth] Không gửi được email đặt lại mật khẩu cho ${input.to}. Link: ${url}`);
  }
  return sent;
}

/**
 * Token còn dùng được không — chỉ đọc, không đổi gì.
 *
 * Trang `/reset-password` gọi hàm này lúc render để khỏi bắt người dùng gõ
 * xong mật khẩu mới rồi mới báo link đã hỏng.
 */
export async function checkPasswordResetToken(token: string): Promise<ResetTokenState> {
  if (!token) return "invalid";

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { usedAt: true, expiresAt: true },
  });

  if (!row || row.usedAt) return "invalid";
  if (row.expiresAt <= new Date()) return "expired";
  return "valid";
}

/**
 * Đổi mật khẩu và tiêu token.
 *
 * `updateMany` có điều kiện `usedAt: null` là chốt chống dùng lại: hai request
 * cùng gửi một token thì chỉ một cái đếm được 1 dòng, cái còn lại dừng tại chỗ
 * thay vì ghi đè mật khẩu vừa được đặt.
 *
 * `passwordChangedAt` là thứ hạ mọi session đã phát trước đó (xem callback
 * `jwt` trong `auth.ts`). Người đi đặt lại mật khẩu thường đang nghi tài khoản
 * bị chiếm; đổi mật khẩu mà để phiên của kẻ kia sống tiếp thì việc đổi gần như
 * vô nghĩa.
 */
export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<ResetResult> {
  if (!token) return "invalid";

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!row || row.usedAt) return "invalid";
  if (row.expiresAt <= new Date()) return "expired";

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const now = new Date();

  const applied = await prisma.$transaction(async (tx) => {
    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: now },
    });
    if (count === 0) return false;

    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash, passwordChangedAt: now },
    });
    return true;
  });

  return applied ? "reset" : "invalid";
}
