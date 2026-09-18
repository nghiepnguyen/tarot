"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Button, buttonClasses } from "@/components/ui/Button";

/**
 * Lỗi trong một route segment. Khác `global-error.tsx` ở chỗ layout gốc vẫn
 * sống, nên còn font, còn ToastProvider — chỉ phần nội dung bị thay.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Lỗi ném ra ở server đã đi qua `onRequestError` trong instrumentation.ts
    // và mang theo `digest`. Bắt lại ở đây thì Sentry có hai event cho cùng
    // một sự cố, nên chỉ báo những lỗi phát sinh trong lúc render ở trình
    // duyệt — loại không có digest.
    if (!error.digest) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:px-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-medium">Trang này đang gặp sự cố</h1>
        <p className="text-sm opacity-80">
          Lỗi đã được ghi lại. Bạn thử lại giúp nhé — lần trải bài trước đó vẫn
          nằm trong lịch sử.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs opacity-60">Mã lỗi: {error.digest}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Link href="/" className={buttonClasses("secondary")}>
          Về trang bốc bài
        </Link>
      </div>
    </main>
  );
}
