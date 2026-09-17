"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Đặt mật khẩu mới.
 *
 * Token đi kèm trong một input ẩn chứ không đọc từ URL: action chạy ở server,
 * nó không thấy thanh địa chỉ.
 *
 * Link có thể chết ngay giữa lúc người dùng đang gõ — hết hạn, hoặc có người
 * vừa xin link mới. Lúc đó bỏ hẳn form đi: để lại ô nhập mật khẩu bên dưới một
 * dòng báo lỗi chỉ mời người ta gõ lại lần nữa cho cùng một kết quả.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);

  if (state?.tokenDead) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm leading-relaxed text-red-600">
          {state.message}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium tracking-wide text-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          Xin link mới
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
          Mật khẩu mới
        </label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-describedby="new-password-hint"
          autoFocus
          required
        />
        <p id="new-password-hint" className="text-sm text-muted">
          Ít nhất 8 ký tự, gồm cả chữ cái và chữ số.
        </p>
        <div role="alert" className="empty:hidden">
          {state?.errors?.password?.map((error) => (
            <p key={error} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
          Nhập lại mật khẩu mới
        </label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div role="alert" className="empty:hidden">
          {state?.errors?.confirmPassword?.map((error) => (
            <p key={error} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      </div>

      <div role="alert" className="empty:hidden">
        {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang đặt lại..." : "Đặt mật khẩu mới"}
      </Button>
    </form>
  );
}
