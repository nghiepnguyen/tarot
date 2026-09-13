"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { reconcileMyPendingOrdersAction } from "@/app/actions/payments";

/**
 * Người dùng có đơn treo mở lại trang nạp credit — thường là để xem credit đã về
 * chưa. Hỏi lại PayOS ngay tại đó thay vì bắt họ đợi lượt quét cron kế tiếp,
 * vốn chỉ chạy mỗi ngày một lần trên gói Hobby.
 *
 * Trang cha chỉ render component này khi thật sự có đơn treo, nên lần mở
 * trang bình thường không tốn lượt gọi nào sang PayOS.
 */
export function PendingOrdersReconciler() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { settled } = await reconcileMyPendingOrdersAction();
      // Chốt được đơn nào thì số credit và danh sách đơn treo đều đã khác;
      // render lại từ dữ liệu thật. Không chốt được thì để nguyên màn hình,
      // lần mở trang sau sẽ thử lại.
      if (!cancelled && settled > 0) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
