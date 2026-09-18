"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinkClass } from "@/components/ui/navLink";

interface NavLink {
  href: string;
  label: string;
}

/**
 * Client leaf duy nhất trong header, chỉ để biết trang nào đang mở. Khớp đúng
 * bằng `===` là đủ: hai đường này đều không có route con, dùng `startsWith`
 * thì "/" sẽ luôn khớp mọi trang.
 */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 md:flex">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={navLinkClass(active ? "active" : "default")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
