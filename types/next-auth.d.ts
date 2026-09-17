import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    /** Mốc đổi mật khẩu gần nhất, đọc từ database lúc `authorize`. */
    passwordChangedAt?: Date | null;
  }
}

/**
 * Token JWT còn mang thêm ba trường do chính dự án đặt, khai báo ở đây cho
 * người đọc chứ không cho trình biên dịch: khai báo bổ sung cho
 * `@auth/core/jwt` không tới được `auth.ts` trong cây pnpm, nên chỗ đó vẫn
 * phải tự thu hẹp kiểu.
 *
 * - `id`: id người dùng.
 * - `pwdAt`: `passwordChangedAt` của tài khoản lúc phát token, tính bằng ms
 *   (0 nghĩa là chưa bao giờ đổi). Lệch với database thì token này là tàn dư
 *   của một mật khẩu đã bị thay.
 * - `pwdCheckedAt`: lần gần nhất `pwdAt` được đối chiếu với database.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    pwdAt?: number;
    pwdCheckedAt?: number;
  }
}
