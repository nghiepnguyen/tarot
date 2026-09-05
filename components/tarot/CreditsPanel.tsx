"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { topUpCreditsAction } from "@/app/actions/ai";
import { DEMO_TOPUP_AMOUNT } from "@/lib/ai/interpretation";

interface CreditsPanelProps {
  credits: number;
}

export function CreditsPanel({ credits }: CreditsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex max-w-sm flex-col gap-3">
      <div>
        <p className="text-xs text-muted">Credit hiện có</p>
        <p className="text-2xl font-semibold text-foreground">{credits}</p>
      </div>
      <p className="text-xs text-muted">
        Đây là bản demo nạp credit nội bộ, chưa qua cổng thanh toán thật.
      </p>
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => startTransition(() => topUpCreditsAction())}
        className="self-start"
      >
        {isPending ? "Đang nạp..." : `Nạp ${DEMO_TOPUP_AMOUNT} credit (demo)`}
      </Button>
    </Card>
  );
}
