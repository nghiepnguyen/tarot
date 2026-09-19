import { cache } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Đường đọc có thẩm quyền cho quyền quản trị.
 *
 * `session.user.role` chỉ là bản cache trong JWT, trễ tối đa năm phút (xem
 * `auth.ts`). Hàm này đọc thẳng `User.role` từ database, nên thu quyền chặn
 * được thao tác ngay lập tức thay vì chờ token hết hạn.
 *
 * Bọc `cache()`: một request có thể gọi nó ở layout, ở page và ở server
 * action, nhưng chỉ tốn đúng một truy vấn khoá chính.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;

  return { id: user.id, email: user.email };
});

/**
 * Bản dành cho layout và page. Không có quyền thì trả 404, không redirect:
 * người đăng nhập thường dò `/admin` không học được gì về việc khu vực đó có
 * tồn tại hay không.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}
