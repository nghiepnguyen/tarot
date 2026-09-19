import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /**
       * Bản sao của `User.role` lúc token được đối chiếu gần nhất. Dùng để
       * quyết định hiển thị (ví dụ mục "Quản trị" trên menu), không dùng để
       * cho phép thao tác — chỗ đó gọi `getAdminUser()` đọc thẳng database.
       */
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    /** Mốc đổi mật khẩu gần nhất, đọc từ database lúc `authorize`. */
    passwordChangedAt?: Date | null;
    /** Quyền của tài khoản, đọc từ database lúc `authorize`. */
    role?: Role;
  }
}

/**
 * Token JWT còn mang thêm bốn trường do chính dự án đặt, khai báo ở đây cho
 * người đọc chứ không cho trình biên dịch: khai báo bổ sung cho
 * `@auth/core/jwt` không tới được `auth.ts` trong cây pnpm, nên chỗ đó vẫn
 * phải tự thu hẹp kiểu.
 *
 * - `id`: id người dùng.
 * - `pwdAt`: `passwordChangedAt` của tài khoản lúc phát token, tính bằng ms
 *   (0 nghĩa là chưa bao giờ đổi). Lệch với database thì token này là tàn dư
 *   của một mật khẩu đã bị thay.
 * - `pwdCheckedAt`: lần gần nhất `pwdAt` được đối chiếu với database.
 * - `role`: quyền của tài khoản, làm mới trong cùng lần đối chiếu đó. Là bản
 *   cache, có thể trễ tối đa `PASSWORD_CHECK_INTERVAL_MS`.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    pwdAt?: number;
    pwdCheckedAt?: number;
    role?: Role;
  }
}
