"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/gtag";

/**
 * Số credit ở header, đồng thời là lối vào trang nạp tiền. Người nhìn số dư là
 * người sắp nghĩ tới chuyện nạp thêm, nên bấm vào chính con số đó là đường ngắn
 * nhất — không bắt họ đi vòng qua hồ sơ.
 */
export function CreditBadge({ credits }: { credits: number }) {
  return (
    <Link
      href="/credits"
      aria-label={`Nạp credit. Bạn đang có ${credits} credit.`}
      onClick={() => trackEvent("nav_click", { destination: "/credits", source: "credit_badge" })}
      className="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full bg-sage-tint px-2.5 text-sm font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {credits} credit
    </Link>
  );
}
