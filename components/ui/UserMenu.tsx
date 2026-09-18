"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { trackEvent } from "@/lib/analytics/gtag";
import { menuItemClass } from "@/components/ui/navLink";
import { useDismissable } from "@/components/ui/useDismissable";

export function UserMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, containerRef, close);

  const itemClass = menuItemClass();

  return (
    <div ref={containerRef} className="relative min-w-0">
      {/* Dưới 768px chỉ còn icon: chỗ trên thanh phải chia cho badge credit và
          nút hamburger nữa, tên người dùng dạng chữ chiếm khoảng 110px là quá
          nhiều. Từ md trở lên mới hiện tên. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Tài khoản: ${label}`}
        className="flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-full border border-border text-sm text-foreground transition-colors duration-300 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent w-11 md:w-auto md:gap-2 md:px-3"
      >
        <User className="h-5 w-5 shrink-0 md:hidden" strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden min-w-0 max-w-[8rem] truncate md:inline">{label}</span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-300 md:block ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 w-40 pt-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]">
            <Link
              href="/credits"
              className={itemClass}
              onClick={() => {
                trackEvent("nav_click", { destination: "/credits", source: "user_menu" });
                close();
              }}
            >
              Nạp credit
            </Link>
            <Link
              href="/history"
              className={itemClass}
              onClick={() => {
                trackEvent("nav_click", { destination: "/history", source: "user_menu" });
                close();
              }}
            >
              Lịch sử
            </Link>
            <Link
              href="/profile"
              className={itemClass}
              onClick={() => {
                trackEvent("nav_click", { destination: "/profile", source: "user_menu" });
                close();
              }}
            >
              Hồ sơ
            </Link>
            <form action={logoutAction} onSubmit={() => trackEvent("logout")}>
              <button type="submit" className={`w-full text-left ${itemClass}`}>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
