"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adjustCreditsAction } from "@/app/actions/admin";

interface AdjustCreditsFormProps {
  userId: string;
  currentCredits: number;
}

export function AdjustCreditsForm({ userId, currentCredits }: AdjustCreditsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [delta, setDelta] = useState("");
  const { showToast } = useToast();

  const parsedDelta = Number(delta);
  const nextBalance = Number.isFinite(parsedDelta) ? currentCredits + parsedDelta : currentCredits;

  return (
    <form
      action={(formData) => {
        // Số dư âm được phép — khách có thể đã tiêu trước khi bị thu lại —
        // nhưng nó chặn họ mở khóa tiếp, nên hỏi lại một lần.
        if (
          nextBalance < 0 &&
          !window.confirm(
            `Số dư sẽ còn ${nextBalance} credit. Người dùng sẽ không mở khóa được cho tới khi nạp bù. Tiếp tục?`,
          )
        ) {
          return;
        }

        startTransition(async () => {
          const result = await adjustCreditsAction(formData);
          showToast(result.ok ? result.message : result.error);
          if (result.ok) setDelta("");
        });
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="delta">
          Số credit (số âm để trừ)
        </label>
        <Input
          id="delta"
          name="delta"
          type="number"
          inputMode="numeric"
          step={1}
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
          placeholder="ví dụ 10 hoặc -10"
          required
        />
        {delta && Number.isFinite(parsedDelta) && parsedDelta !== 0 ? (
          <p className="text-xs text-muted">
            {currentCredits} → {nextBalance} credit
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted" htmlFor="reason">
          Lý do
        </label>
        <Input
          id="reason"
          name="reason"
          maxLength={500}
          placeholder="Ghi cho người đọc nhật ký sáu tháng sau"
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Đang ghi..." : "Chỉnh credit"}
      </Button>
    </form>
  );
}
