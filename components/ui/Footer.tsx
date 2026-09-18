import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { navLinkClass } from "@/components/ui/navLink";
import { supportMailto } from "@/lib/seo/site";

// Không còn thuần link pháp lý: trang giới thiệu đứng đầu vì đây là đường
// duy nhất dẫn tới nó từ trong site, cần có mặt ở mọi trang để bot bò tới.
const FOOTER_LINKS = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/privacy", label: "Chính sách riêng tư" },
  { href: "/refund", label: "Chính sách hoàn tiền" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8">
        {/* Link xếp thành hàng riêng, dòng bản quyền nằm dưới. Nhét cả hai vào
            một hàng thì từ 640px trở lên sáu nhãn dài đã phải xuống dòng lởm
            chởm, đó mới là thứ làm chân trang trông rối. */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-0">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass()}>
              {link.label}
            </Link>
          ))}

          {/* Kênh hỗ trợ phải có mặt ở mọi trang: người gặp sự cố thanh toán
              không nhất thiết đang đứng ở trang chính sách. */}
          <a href={supportMailto("Hỗ trợ Tarot Reading Web")} className={navLinkClass()}>
            Liên hệ
          </a>

          <CookieSettingsButton className={navLinkClass()} />
        </nav>

        <p className="mt-3 text-xs text-muted">
          © {new Date().getFullYear()} Tarot Reading Web
        </p>
      </div>
    </footer>
  );
}
