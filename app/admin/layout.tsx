import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Layout không render lại khi điều hướng giữa các trang anh em, nên mỗi
  // trang bên dưới vẫn tự gọi `requireAdmin()`. `cache()` trong
  // `lib/auth/admin.ts` khiến lần gọi thứ hai trong cùng request không tốn
  // thêm truy vấn nào.
  const admin = await requireAdmin();

  return (
    <div className="admin-ui flex min-h-dvh flex-1 flex-col lg:flex-row">
      <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-start lg:gap-1 lg:px-6 lg:py-5">
          <Link href="/admin" className="shrink-0 whitespace-nowrap text-base font-semibold text-foreground">
            Tarot · Quản trị
          </Link>
          <span className="min-w-0 max-w-full truncate text-xs text-muted" title={admin.email}>
            {admin.email}
          </span>
        </div>
        <AdminNav />
        <p className="hidden px-6 pt-6 text-xs leading-relaxed text-muted lg:block">
          Mọi mốc giờ hiển thị theo giờ Việt Nam (UTC+7).
        </p>
      </aside>

      <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
