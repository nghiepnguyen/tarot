"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Xin link đặt lại mật khẩu.
 *
 * Gửi xong thì thay hẳn form bằng một lời xác nhận, khác với form gửi lại email
 * xác nhận vốn giữ nguyên form. Ở đây câu trả lời cố tình mơ hồ ("nếu địa chỉ
 * này có tài khoản"), nên để nguyên ô nhập kèm nút bấm chỉ mời người ta thử
 * từng địa chỉ một xem câu trả lời có đổi không — mà nó thì không bao giờ đổi.
 */
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.sent) {
    return (
      <p
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-sage-tint px-4 py-3 text-sm leading-relaxed text-foreground"
      >
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span>
          Nếu địa chỉ này có tài khoản, chúng tôi đã gửi một link đặt lại mật khẩu tới
          đó. Link sống trong 1 giờ. Nhớ xem cả mục spam.
        </span>
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
          Email đã đăng ký
        </label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          placeholder="ban@example.com"
          autoComplete="email"
          aria-describedby={state?.errors?.email || state?.message ? "forgot-error" : undefined}
          autoFocus
          required
        />
      </div>

      <div id="forgot-error" role="alert" className="empty:hidden">
        {state?.errors?.email?.map((error) => (
          <p key={error} className="text-sm text-red-600">{error}</p>
        ))}
        {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang gửi..." : "Gửi link đặt lại"}
      </Button>
    </form>
  );
}
