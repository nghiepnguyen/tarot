"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Gửi lại link xác nhận. Người dùng phải nhập lại email thay vì được điền sẵn:
 * trang này mở được từ một link đã hết hạn, không có phiên đăng nhập nào để
 * biết họ là ai, và nhét email vào URL thì địa chỉ đó nằm lại trong lịch sử
 * trình duyệt lẫn referrer.
 *
 * Gửi xong form vẫn ở nguyên đó. Thư xác nhận là thứ hay lạc vào spam hoặc tới
 * chậm; thay form bằng một dòng "đã gửi" là lấy mất đúng cái nút người dùng
 * cần khi năm phút sau vẫn chưa thấy gì (rate limit lo phần chống lạm dụng).
 */
export function ResendVerificationForm({ label }: { label?: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div aria-live="polite">
        {state?.sent ? (
          <p className="mb-3 flex items-start gap-2 rounded-2xl bg-sage-tint px-4 py-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Đã gửi lại email xác nhận. Kiểm tra hộp thư và cả mục spam.</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resend-email" className="text-sm font-medium text-foreground">
          {label ?? "Email đã đăng ký"}
        </label>
        <Input
          id="resend-email"
          name="email"
          type="email"
          placeholder="ban@example.com"
          autoComplete="email"
          aria-describedby={state?.errors?.email || state?.message ? "resend-error" : undefined}
          required
        />
      </div>

      <div id="resend-error" role="alert" className="empty:hidden">
        {state?.errors?.email?.map((error) => (
          <p key={error} className="text-sm text-red-600">{error}</p>
        ))}
        {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      </div>

      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "Đang gửi..." : "Gửi lại email xác nhận"}
      </Button>
    </form>
  );
}
