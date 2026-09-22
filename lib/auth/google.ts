import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { FREE_TRIAL_CREDITS } from "@/lib/ai/interpretation";

/**
 * Đăng nhập bằng tài khoản Google.
 *
 * Không dùng adapter database của Auth.js: session vẫn là JWT và bảng `User`
 * vẫn là chỗ duy nhất định nghĩa một người dùng. Tất cả những gì luồng OAuth
 * cần làm với database gói trong một hàm ở đây, để `auth.ts` chỉ còn việc gọi
 * nó và nhét id vào token.
 *
 * Hai điều kiện phải đúng trước khi hàm này được gọi (chốt nằm ở callback
 * `signIn` trong `auth.ts`):
 *
 * 1. `profile.email_verified` là true. Đó là toàn bộ cơ sở để gắn một tài
 *    khoản Google vào một tài khoản email sẵn có — thiếu nó thì ai lập được
 *    một tài khoản Google mang địa chỉ người khác cũng chiếm được tài khoản ở
 *    đây.
 * 2. Có địa chỉ email. Không có thì không biết gắn vào đâu.
 */

export interface GoogleAccountInput {
  /** `sub` trong id token — định danh tài khoản Google, không phải email. */
  googleId: string;
  email: string;
  name?: string | null;
}

/** Vừa đủ cho callback `jwt` dựng token, không trả cả hàng `User` ra ngoài. */
export interface LinkedGoogleUser {
  id: string;
  passwordChangedAt: Date | null;
  role: Role;
}

/**
 * Bật/tắt theo biến môi trường: thiếu credential thì provider không được đăng
 * ký và nút "Tiếp tục với Google" không hiện. Hiện một nút dẫn thẳng tới lỗi
 * 500 còn tệ hơn là không có nút.
 */
export function isGoogleLoginEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** Cùng trần 60 ký tự với form hồ sơ, tên Google đưa về có thể dài hơn. */
function cleanName(name: string | null | undefined): string | null {
  return name?.trim().slice(0, 60) || null;
}

/**
 * Tìm (hoặc tạo) tài khoản ứng với một danh tính Google, rồi trả về thứ token
 * cần. Ba tình huống, theo đúng thứ tự hàm xử lý:
 *
 * - **Chưa có gì**: tạo tài khoản mới, `passwordHash` null, email coi như đã
 *   xác nhận, credit dùng thử cộng ngay. Google đã làm đúng việc mà link xác
 *   nhận của chúng ta làm, nên bắt người ta xác nhận thêm một lần nữa là thừa.
 * - **Đã đăng ký bằng mật khẩu, cùng email**: gắn `googleId` vào tài khoản đó.
 *   Từ đây hai đường đăng nhập cùng trỏ vào một tài khoản, một lịch sử trải
 *   bài, một số dư credit.
 * - **Đã đăng ký nhưng chưa bấm link xác nhận**: gắn `googleId`, đặt luôn
 *   `emailVerifiedAt` và cộng credit. Đăng nhập Google là bằng chứng mạnh hơn
 *   cái link trong hộp thư, nên tài khoản không có lý do gì còn bị khoá.
 *
 * Credit dùng thử chỉ cộng khi `freeCreditsGrantedAt` còn null, và điều kiện
 * đó nằm trong mệnh đề `where` của chính lệnh ghi (giống
 * `consumeVerificationToken`): hai lần đăng nhập song song thì chỉ một lệnh
 * đếm được 1 dòng, cái còn lại thấy 0 và không cộng lần hai.
 */
export async function linkGoogleAccount(
  input: GoogleAccountInput,
): Promise<LinkedGoogleUser> {
  const email = input.email.trim().toLowerCase();
  const name = cleanName(input.name);

  return prisma.$transaction(async (tx) => {
    // Tra `googleId` trước rồi mới tới email: người dùng đổi địa chỉ Gmail
    // chính vẫn về đúng tài khoản cũ thay vì đẻ ra một tài khoản thứ hai.
    const existing =
      (await tx.user.findUnique({ where: { googleId: input.googleId } })) ??
      (await tx.user.findUnique({ where: { email } }));

    const now = new Date();

    if (!existing) {
      const created = await tx.user.create({
        data: {
          email,
          name,
          googleId: input.googleId,
          emailVerifiedAt: now,
          credits: FREE_TRIAL_CREDITS,
          freeCreditsGrantedAt: now,
        },
      });
      await tx.creditTransaction.create({
        data: {
          userId: created.id,
          type: "FREE_GRANT",
          amount: FREE_TRIAL_CREDITS,
          balanceAfter: created.credits,
        },
      });
      return {
        id: created.id,
        passwordChangedAt: created.passwordChangedAt,
        role: created.role,
      };
    }

    const updated = await tx.user.update({
      where: { id: existing.id },
      data: {
        // `??` chứ không ghi đè: `googleId` đã có nghĩa là hàng này tìm được
        // bằng chính nó, còn tên thì tên người dùng tự đặt trong hồ sơ phải
        // thắng tên Google đưa về.
        googleId: existing.googleId ?? input.googleId,
        emailVerifiedAt: existing.emailVerifiedAt ?? now,
        name: existing.name ?? name,
      },
    });

    const { count } = await tx.user.updateMany({
      where: { id: existing.id, freeCreditsGrantedAt: null },
      data: {
        credits: { increment: FREE_TRIAL_CREDITS },
        freeCreditsGrantedAt: now,
      },
    });

    if (count > 0) {
      const withCredits = await tx.user.findUniqueOrThrow({
        where: { id: existing.id },
        select: { credits: true },
      });
      await tx.creditTransaction.create({
        data: {
          userId: existing.id,
          type: "FREE_GRANT",
          amount: FREE_TRIAL_CREDITS,
          balanceAfter: withCredits.credits,
        },
      });
    }

    return {
      id: updated.id,
      passwordChangedAt: updated.passwordChangedAt,
      role: updated.role,
    };
  });
}
