import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/transactions", label: "Giao dịch" },
  { href: "/admin/audit", label: "Nhật ký" },
  { href: "/admin/deck", label: "Bộ bài" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Layout không render lại khi điều hướng giữa các trang anh em, nên mỗi
  // trang bên dưới vẫn tự gọi `requireAdmin()`. `cache()` trong
  // `lib/auth/admin.ts` khiến lần gọi thứ hai trong cùng request không tốn
  // thêm truy vấn nào.
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 sm:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <Link href="/admin" className="text-lg font-semibold tracking-tight text-foreground">
              Quản trị
            </Link>
            <span className="text-sm text-muted">{admin.email}</span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Khu vực quản trị">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="ml-auto text-sm text-muted transition-colors duration-300 hover:text-accent"
            >
              Về trang khách
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
