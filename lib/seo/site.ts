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
