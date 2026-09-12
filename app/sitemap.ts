import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

const LEGAL_UPDATED_AT = new Date("2026-09-05");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
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
