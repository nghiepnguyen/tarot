"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { reconcileOrderAction, refundOrderAction } from "@/app/actions/admin";

/**
 * Nút hoàn chỉ thu hồi credit. PayOS không mở API hoàn tiền cho merchant nên
 * tiền vẫn phải chuyển tay trên dashboard của họ — câu này phải hiện ra trước
 * khi bấm, không thì sẽ có người bấm xong và coi như đã hoàn tiền cho khách.
 */
export function RefundOrderForm({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <details className="w-full">
      <summary className="inline-flex min-h-8 cursor-pointer list-none items-center rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition-colors duration-150 hover:border-red-400 hover:text-red-700 dark:hover:text-red-400 [&::-webkit-details-marker]:hidden">
        Hoàn credit…
      </summary>
      <form
        action={(formData) => {
          startTransition(async () => {
            const result = await refundOrderAction(formData);
            showToast(result.ok ? result.message : result.error);
          });
        }}
        className="mt-3 flex flex-col gap-3"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <p className="text-xs text-muted">
          Chỉ thu hồi credit và đổi đơn sang REFUNDED. Tiền phải hoàn tay trên dashboard PayOS.
        </p>
        <Input name="reason" maxLength={500} placeholder="Lý do hoàn" aria-label="Lý do hoàn" required />
        <Button type="submit" disabled={isPending} className="self-start px-3! py-1.5! text-xs!">
          {isPending ? "Đang hoàn..." : "Xác nhận hoàn"}
        </Button>
      </form>
    </details>
  );
}

export function ReconcileOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await reconcileOrderAction(formData);
          showToast(result.ok ? result.message : result.error);
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-8 cursor-pointer items-center rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition-colors duration-150 hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? "Đang hỏi PayOS..." : "Đối soát lại"}
      </button>
    </form>
  );
}
