"use client";

import { useState, useTransition } from "react";
import type { CreditPackage } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { topUpCreditsAction } from "@/app/actions/ai";
import { createOrderAction } from "@/app/actions/payments";
import { COST_PER_INTERPRETATION, DEMO_TOPUP_AMOUNT } from "@/lib/ai/interpretation";

interface CreditsPanelProps {
  credits: number;
  packages: CreditPackage[];
  showDemoTopup?: boolean;
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function CreditsPanel({ credits, packages, showDemoTopup }: CreditsPanelProps) {
  const [isDemoPending, startDemoTransition] = useTransition();
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startOrderTransition] = useTransition();

  const remainingUnlocks = Math.floor(credits / COST_PER_INTERPRETATION);

  const handleBuy = (packageId: string) => {
    setError(null);
    setPendingPackageId(packageId);
    startOrderTransition(async () => {
      const result = await createOrderAction(packageId);
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
        setPendingPackageId(null);
      }
    });
  };

  return (
    <Card className="flex max-w-lg flex-col gap-5">
      <div>
        <p className="text-sm text-muted">Còn lại</p>
        <p className="text-2xl font-semibold text-foreground">
          {remainingUnlocks} lượt diễn giải chuyên sâu
        </p>
        <p className="text-sm text-muted">({credits} credit)</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted">Nạp thêm credit</p>
        <div className="grid grid-cols-2 gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              disabled={pendingPackageId !== null}
              onClick={() => handleBuy(pkg.id)}
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors duration-200 hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-sm font-medium text-foreground">{pkg.name}</span>
              <span className="text-sm text-muted">
                {pkg.credits / COST_PER_INTERPRETATION} lượt
              </span>
              <span className="text-sm font-semibold text-accent">
                {pendingPackageId === pkg.id ? "Đang chuyển..." : formatVnd(pkg.priceVnd)}
              </span>
            </button>
          ))}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      {showDemoTopup ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm text-muted">
            Nút dưới đây chỉ hiện ở môi trường dev, dùng để test không cần thanh toán thật.
          </p>
          <Button
            variant="secondary"
            disabled={isDemoPending}
            onClick={() => startDemoTransition(() => topUpCreditsAction())}
            className="self-start"
          >
            {isDemoPending ? "Đang nạp..." : `Nạp ${DEMO_TOPUP_AMOUNT} credit (demo)`}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
