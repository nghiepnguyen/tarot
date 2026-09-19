import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

const LEGAL_UPDATED_AT = new Date("2026-09-05");

/**
 * Danh sách cho phép viết tay, cố ý: không có gì ở đây quét cây route, nên
 * trang mới chỉ vào sitemap khi có người thêm nó vào. Đừng "cải tiến" thành
 * quét tự động — `/admin` và các trang cần đăng nhập sẽ lọt ra ngay.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gioi-thieu`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
