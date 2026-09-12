"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/gtag";

interface PurchaseTrackerProps {
  transactionId: string;
  value: number;
  itemId: string;
  itemName: string;
  credits: number;
}

const SENT_KEY_PREFIX = "tarot:purchaseTracked:";

/**
 * PayOS trả người dùng về /profile?order=...&status=success. Người dùng có thể
 * tải lại trang đó nhiều lần, nên chốt lại bằng sessionStorage để mỗi đơn chỉ
 * bắn `purchase` một lần.
 */
export function PurchaseTracker({
  transactionId,
  value,
  itemId,
  itemName,
  credits,
}: PurchaseTrackerProps) {
  useEffect(() => {
    const key = `${SENT_KEY_PREFIX}${transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage bị chặn: vẫn bắn event, chấp nhận rủi ro đếm trùng khi reload.
    }

    trackEvent("purchase", {
      transaction_id: transactionId,
      currency: "VND",
      value,
      items: [{ item_id: itemId, item_name: itemName, price: value, quantity: 1 }],
      credits_granted: credits,
    });
  }, [transactionId, value, itemId, itemName, credits]);

  return null;
}
