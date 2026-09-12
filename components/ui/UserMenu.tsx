"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

// Opening on hover alone left the menu unreachable on phones: Safari does
// not focus a button on tap, so neither hover nor focus-within ever fired.
// A click toggle works the same for mouse, touch and keyboard.
export function UserMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const itemClass =
    "flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm text-foreground transition-colors duration-300 hover:bg-sage-tint hover:text-accent";

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-border min-h-11 px-3 text-sm text-foreground transition-colors duration-300 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-2 sm:px-3"
      >
        <span className="min-w-0 max-w-[4.5rem] truncate sm:max-w-[8rem]">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 w-40 pt-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]">
            <Link href="/history" className={itemClass} onClick={() => setOpen(false)}>
              Lịch sử
            </Link>
            <Link href="/profile" className={itemClass} onClick={() => setOpen(false)}>
              Hồ sơ
            </Link>
            <form action={logoutAction}>
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
