"use client";

import { useTransition } from "react";
import { setReflectionEnabledAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ReflectionSettingForm({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <form
      className="flex flex-wrap items-center gap-3"
      action={() => {
        startTransition(async () => {
          const result = await setReflectionEnabledAction(!enabled);
          showToast(result.ok ? result.message : result.error);
        });
      }}
    >
      <p className="text-sm text-muted" role="status">{enabled ? "Đang bật" : "Đang tắt"}</p>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Đang lưu…" : enabled ? "Tắt tạo câu hỏi phản tư" : "Bật tạo câu hỏi phản tư"}
      </Button>
    </form>
  );
}
