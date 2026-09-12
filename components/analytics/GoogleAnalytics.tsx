"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, initGtag, trackPageView } from "@/lib/analytics/gtag";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";

// gtag không tự bắn page_view (`send_page_view: false`) vì App Router điều
// hướng ở client, gtag chỉ thấy được lần load đầu tiên. Effect này phụ trách
// cả lần đầu lẫn mọi lần chuyển route.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  // Consent Mode v2: script nạp cho mọi người, nhưng initGtag đặt
  // `analytics_storage: denied` làm mặc định nên chưa đồng ý thì không có
  // cookie nào được ghi. Chạy trong effect (không phải thẻ script inline) để
  // thứ tự `consent default` trước `config` luôn xác định.
  useEffect(() => {
    initGtag();
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      {/* useSearchParams làm cây client bên trên nó phải render ở client;
          bọc Suspense để phần còn lại của trang vẫn được prerender. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      <ConsentBanner />
    </>
  );
}
