"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogleAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/gtag";

/**
 * Logo Google, vẽ tay thay vì lấy từ lucide: bộ icon đó cố tình không có
 * nhãn hiệu nào. Bốn màu là màu chính thức trong hướng dẫn nhận diện của
 * Google cho nút đăng nhập — đổi màu hay tô một sắc là sai hướng dẫn đó.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/**
 * Tách riêng để đọc được `useFormStatus` — hook đó chỉ thấy form khi nó nằm
 * trong một component con của form, không phải component dựng ra form.
 */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" disabled={pending} className="w-full">
      {pending ? (
        "Đang chuyển sang Google..."
      ) : (
        <>
          <GoogleMark />
          {label}
        </>
      )}
    </Button>
  );
}

/**
 * Nút "Tiếp tục với Google". Là một `<form>` chứ không phải `<button onClick>`
 * vì `signInWithGoogleAction` chạy ở server: người tắt JavaScript vẫn bấm được.
 *
 * Chỗ gọi phải tự quyết định có hiện nút hay không — `isGoogleLoginEnabled()`
 * trong `lib/auth/google.ts`, đọc ở component server. Không có credential thì
 * nút này dẫn thẳng tới một trang lỗi.
 */
export function GoogleSignInButton({
  label = "Tiếp tục với Google",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted">hoặc</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        action={signInWithGoogleAction}
        onSubmit={() => trackEvent("login_submit", { method: "google" })}
      >
        <SubmitButton label={label} />
      </form>
    </div>
  );
}
