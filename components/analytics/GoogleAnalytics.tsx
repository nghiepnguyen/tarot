"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, initGtag, trackPageView } from "@/lib/analytics/gtag";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { useConsent } from "@/components/analytics/useConsent";

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
  const { value } = useConsent();
  const isGranted = value === "granted";

  // Định nghĩa window.gtag và gửi config ngay khi có đồng ý, không chờ script
  // tải xong: dataLayer là hàng đợi nên gọi sớm vẫn an toàn, và đây là mốc để
  // xả những event đã xếp hàng từ trước.
  useEffect(() => {
    if (isGranted) initGtag();
  }, [isGranted]);

  return (
    <>
      {/* Chưa đồng ý thì script không được nạp, nên không có cookie _ga nào
          được đặt. Từ chối rồi thì các lần tải trang sau cũng không nạp lại. */}
      {isGranted ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      ) : null}

      {/* useSearchParams làm cây client bên trên nó phải render ở client;
          bọc Suspense để phần còn lại của trang vẫn được prerender. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      <ConsentBanner />
    </>
  );
}
