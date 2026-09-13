export const SITE_NAME = "Tarot Reading Web";

/**
 * Origin dùng cho canonical, Open Graph, sitemap và robots.
 * Production đặt NEXT_PUBLIC_APP_URL; preview deployment không có biến này nên
 * rơi về VERCEL_URL của chính deployment đó thay vì localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

/**
 * Địa chỉ nhận mọi yêu cầu hỗ trợ: sự cố thanh toán, hoàn tiền, yêu cầu xóa dữ
 * liệu. Chính sách hoàn tiền và chính sách riêng tư đều hứa "liên hệ", nên đây
 * là chỗ duy nhất định nghĩa kênh đó — đổi ở đây là đổi toàn site.
 */
export const SUPPORT_EMAIL = "thanhnghiep.top@gmail.com";

/** Link mailto kèm sẵn tiêu đề, để thư gửi tới đã được phân loại. */
export function supportMailto(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
