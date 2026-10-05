"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bot,
  ExternalLink,
  LayoutDashboard,
  Layers,
  ReceiptText,
  ScrollText,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/orders", label: "Đơn hàng", icon: ReceiptText },
  { href: "/admin/transactions", label: "Sổ credit", icon: ArrowLeftRight },
  { href: "/admin/audit", label: "Nhật ký", icon: ScrollText },
  { href: "/admin/prompts", label: "Prompt & model", icon: Bot },
  { href: "/admin/deck", label: "Bộ bài", icon: Layers },
];

/**
 * Client component chỉ vì `usePathname`: layout không render lại khi đi giữa
 * các trang anh em, nên mục đang chọn phải tính ở trình duyệt.
 */
export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav
      aria-label="Khu vực quản trị"
      className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0"
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150 ${
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted transition-colors duration-150 hover:bg-background hover:text-foreground lg:mt-4 lg:border-t lg:border-border lg:pt-4"
      >
        <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
        Về trang khách
      </Link>
    </nav>
  );
}
