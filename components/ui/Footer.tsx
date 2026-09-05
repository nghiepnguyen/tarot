import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/privacy", label: "Chính sách riêng tư" },
  { href: "/refund", label: "Chính sách hoàn tiền" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-6 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} Tarot Reading Web</span>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-300 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
