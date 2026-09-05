"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <Card className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Tạo tài khoản
        </h1>
        <p className="text-sm text-muted">
          Lưu lịch sử trải bài và xem lại bất cứ lúc nào.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Input name="name" placeholder="Tên hiển thị" autoComplete="name" required />
          {state?.errors?.name?.map((error) => (
            <p key={error} className="text-xs text-red-600">{error}</p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
          {state?.errors?.email?.map((error) => (
            <p key={error} className="text-xs text-red-600">{error}</p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            autoComplete="new-password"
            required
          />
          {state?.errors?.password?.map((error) => (
            <p key={error} className="text-xs text-red-600">{error}</p>
          ))}
        </div>

        {state?.message ? <p className="text-xs text-red-600">{state.message}</p> : null}

        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Đang tạo tài khoản..." : "Đăng ký"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}
