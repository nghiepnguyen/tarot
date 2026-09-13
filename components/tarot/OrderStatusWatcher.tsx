"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { getOrderStatusAction } from "@/app/actions/payments";
import { trackEvent } from "@/lib/analytics/gtag";

const POLL_INTERVAL_MS = 3_000;
const MAX_ATTEMPTS = 20; // ~1 phút

const STATUS_MESSAGE: Partial<Record<OrderStatus, string>> = {
  FAILED: "Thanh toán không thành công. Bạn chưa bị trừ tiền cho đơn này.",
  CANCELLED: "Đơn hàng đã bị hủy.",
  EXPIRED: "Link thanh toán đã hết hạn. Vui lòng tạo đơn mới.",
  REFUNDED: "Đơn hàng này đã được hoàn tiền.",
};

const GIVE_UP_MESSAGE =
  "Chúng tôi chưa nhận được xác nhận từ cổng thanh toán. Nếu bạn đã bị trừ tiền, " +
  "credit sẽ được cộng tự động trong ít phút tới — tải lại trang để kiểm tra.";

/**
 * PayOS đẩy người dùng về `/profile` ngay sau khi họ trả tiền, thường trước
 * khi webhook kịp tới. Không có gì ở đây thì người dùng nhìn thấy số credit cũ
 * và tưởng mất tiền.
 *
 * Component này hỏi lại trạng thái đơn (server sẽ đối soát với PayOS) cho tới
 * khi đơn chốt, rồi refresh để số credit và event `purchase` được render lại
 * từ dữ liệu thật.
 */
export function OrderStatusWatcher({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const hasTrackedPending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    if (!hasTrackedPending.current) {
      hasTrackedPending.current = true;
      trackEvent("purchase_pending", { transaction_id: orderId });
    }

    const poll = async () => {
      attempts += 1;
      const result = await getOrderStatusAction(orderId);
      if (cancelled) return;

      if (!result.ok) {
        setMessage(result.error);
        setIsSettled(true);
        return;
      }

      if (result.status === "PAID") {
        setIsSettled(true);
        // Server component đọc lại đơn đã PAID và tự bắn `purchase`.
        router.refresh();
        return;
      }

      if (result.status !== "PENDING") {
        setMessage(STATUS_MESSAGE[result.status] ?? "Đơn hàng chưa hoàn tất.");
        setIsSettled(true);
        trackEvent("purchase_unsettled", {
          transaction_id: orderId,
          order_status: result.status,
        });
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        setMessage(GIVE_UP_MESSAGE);
        setIsSettled(true);
        trackEvent("purchase_unsettled", { transaction_id: orderId, order_status: "PENDING" });
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, router]);

  if (isSettled && !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-3xl px-6 pt-6"
    >
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
        {message ?? "Đang xác nhận thanh toán với cổng thanh toán, vui lòng đợi…"}
      </div>
    </div>
  );
}
