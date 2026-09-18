"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";
import "./globals.css";

/**
 * Lưới an toàn cuối cùng: React gọi file này khi lỗi văng ra khỏi chính
 * `app/layout.tsx`, nên nó thay luôn cả layout gốc và phải tự render
 * <html>/<body>. Font của layout gốc không còn, trang rơi về font hệ thống —
 * đổi lại là vẫn hiện được cái gì đó thay vì màn hình trắng.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
        <div className="space-y-3">
          <h1 className="text-2xl font-medium">Trang gặp sự cố</h1>
          <p className="text-sm opacity-80">
            Lỗi đã được ghi lại và chúng tôi đang xem. Bạn thử tải lại giúp nhé.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs opacity-60">Mã lỗi: {error.digest}</p>
          ) : null}
        </div>
        <Button onClick={reset}>Thử lại</Button>
      </body>
    </html>
  );
}
