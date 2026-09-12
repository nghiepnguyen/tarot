"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/analytics/gtag";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  // Thành công thì server redirect, state không bao giờ quay lại — nên ở đây
  // chỉ có thể ghi nhận thất bại. Conversion thành công do AuthSuccessTracker
  // bắn sau khi về trang chủ.
  useEffect(() => {
    if (!state) return;
    const fieldErrors = Object.keys(state.errors ?? {});
    trackEvent("login_failed", {
      reason: state.message ? "server" : "validation",
      fields: fieldErrors.join(",") || undefined,
    });
  }, [state]);

  return (
    <Card className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Đăng nhập
        </h1>
        <p className="text-sm text-muted">Xem lại lịch sử trải bài của bạn.</p>
      </div>

      <form
        action={action}
        onSubmit={() => trackEvent("login_submit")}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
          {state?.errors?.email?.map((error) => (
            <p key={error} className="text-sm text-red-600">{error}</p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            autoComplete="current-password"
            required
          />
          {state?.errors?.password?.map((error) => (
            <p key={error} className="text-sm text-red-600">{error}</p>
          ))}
        </div>

        {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}

        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link href="/signup" className="inline-flex min-h-11 items-center px-1 font-medium text-accent underline underline-offset-4">
          Đăng ký
        </Link>
      </p>
    </Card>
  );
}
