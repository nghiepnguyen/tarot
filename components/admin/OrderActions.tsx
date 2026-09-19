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
      <summary className="cursor-pointer text-sm text-muted transition-colors duration-300 hover:text-accent">
        Hoàn credit
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
        <Input name="reason" maxLength={500} placeholder="Lý do hoàn" required />
        <Button type="submit" disabled={isPending} className="self-start">
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
        className="cursor-pointer text-sm text-muted transition-colors duration-300 hover:text-accent disabled:opacity-40"
      >
        {isPending ? "Đang hỏi PayOS..." : "Đối soát lại"}
      </button>
    </form>
  );
}
