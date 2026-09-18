"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { menuItemClass } from "@/components/ui/navLink";
import { useDismissable } from "@/components/ui/useDismissable";

interface NavLink {
  href: string;
  label: string;
}

/**
 * Bản mobile của điều hướng chính. Chỉ chứa link toàn site: phần tài khoản vẫn
 * nằm ở `UserMenu` bên cạnh, để hai menu không cùng nói về một thứ.
 */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, containerRef, close);

  return (
    <div ref={containerRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Đóng menu" : "Mở menu"}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 w-44 pt-2">
          {/* Cố tình không phải <nav>: `NavLinks` bản desktop vẫn nằm trong
              DOM và đã mang landmark "Điều hướng chính". Thêm một landmark
              trùng tên nữa thì người dùng screen reader liệt kê landmark sẽ
              thấy hai mục y hệt. Đây là nội dung của một popup menu, nút mở
              đã khai báo aria-haspopup. */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={menuItemClass(active)}
                  onClick={close}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
