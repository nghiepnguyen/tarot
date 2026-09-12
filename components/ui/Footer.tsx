import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";

const LEGAL_LINKS = [
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/privacy", label: "Chính sách riêng tư" },
  { href: "/refund", label: "Chính sách hoàn tiền" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} Tarot Reading Web</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center px-2 transition-colors duration-300 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton />
        </nav>
      </div>
    </footer>
  );
}
