"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateProfileAction } from "@/app/actions/auth";

interface ProfileFormProps {
  email: string;
  name: string;
}

export function ProfileForm({ email, name }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateProfileAction(formData);
          showToast("Đã lưu thay đổi hồ sơ.");
        });
      }}
      className="flex max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="email">
          Email
        </label>
        <Input id="email" value={email} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="name">
          Tên hiển thị
        </label>
        <Input id="name" name="name" defaultValue={name} maxLength={60} />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 self-start">
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
