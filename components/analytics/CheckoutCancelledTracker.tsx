"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/gtag";

export function CheckoutCancelledTracker({ orderId }: { orderId: string }) {
  useEffect(() => {
    trackEvent("checkout_cancelled", { transaction_id: orderId });
  }, [orderId]);

  return null;
}
