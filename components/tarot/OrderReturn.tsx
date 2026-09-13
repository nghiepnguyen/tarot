import { prisma } from "@/lib/db/prisma";
import { RECONCILE_GRACE_MS } from "@/lib/payments/orders";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { CheckoutCancelledTracker } from "@/components/analytics/CheckoutCancelledTracker";
import { OrderStatusWatcher } from "@/components/tarot/OrderStatusWatcher";
import { PendingOrdersReconciler } from "@/components/tarot/PendingOrdersReconciler";

interface OrderReturnProps {
  userId: string;
  /** `?order=` và `?status=` PayOS gắn vào URL khi trả người dùng về. */
  orderId?: string;
  status?: string;
}

/**
 * Mọi việc phải làm khi PayOS trả người dùng về: báo `purchase`, theo dõi đơn
 * chưa chốt, và đối soát đơn treo từ lần trước.
 *
 * Dùng chung cho `/credits` lẫn `/profile`. Link thanh toán mới trỏ về
 * `/credits`, nhưng những đơn tạo trước khi tách trang vẫn mang `returnUrl` cũ
 * trỏ về `/profile` — chúng đang nằm ở PayOS và không sửa được nữa, nên trang
 * cũ phải tiếp tục xử lý được.
 */
export async function OrderReturn({ userId, orderId, status }: OrderReturnProps) {
  const returnedOrder = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { package: true },
      })
    : null;

  // `purchase` không tin vào query param: đơn phải thật sự PAID trong database,
  // và phải thuộc về người đang đăng nhập. Webhook mới là nguồn sự thật.
  const paidOrder = returnedOrder?.status === "PAID" ? returnedOrder : null;

  // PayOS đẩy người dùng về gần như ngay lập tức, thường trước webhook. Đơn còn
  // PENDING nghĩa là chưa chốt được, không phải thất bại.
  const settlingOrder =
    status === "success" && returnedOrder?.status === "PENDING" ? returnedOrder : null;

  // Đơn treo từ lần trước: webhook trượt và người dùng đã đóng tab. Chỉ đếm ở
  // đây; việc gọi PayOS nằm trong server action.
  const hasStale =
    settlingOrder === null && (await hasStalePendingOrder(userId));

  return (
    <>
      {paidOrder ? (
        <PurchaseTracker
          transactionId={paidOrder.id}
          value={paidOrder.amountVnd}
          itemId={paidOrder.packageId}
          itemName={paidOrder.package.name}
          credits={paidOrder.creditsGranted}
        />
      ) : null}
      {status === "cancelled" && returnedOrder ? (
        <CheckoutCancelledTracker orderId={returnedOrder.id} />
      ) : null}
      {settlingOrder ? <OrderStatusWatcher orderId={settlingOrder.id} /> : null}
      {hasStale ? <PendingOrdersReconciler /> : null}
    </>
  );
}

/**
 * Chỉ kiểm tra sự tồn tại. Đọc đồng hồ trong lúc render là việc không thuộc về
 * component, nên nó nằm ở đây thay vì viết thẳng vào thân hàm trên.
 */
async function hasStalePendingOrder(userId: string): Promise<boolean> {
  const count = await prisma.order.count({
    where: {
      userId,
      status: "PENDING",
      createdAt: { lte: new Date(Date.now() - RECONCILE_GRACE_MS) },
    },
  });
  return count > 0;
}
