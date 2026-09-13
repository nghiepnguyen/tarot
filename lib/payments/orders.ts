import "server-only";
import type { Order, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getPaymentLink } from "./payos";
import { alertAmountMismatch } from "./alerts";
import { refundOrder as refundOrderWith } from "./refund";

export type { RefundOutcome } from "./refund";

/**
 * Link thanh toán sống 30 phút. Hết hạn thì đơn PENDING không còn khả năng
 * được trả tiền, nên có thể đóng lại mà không cần hỏi PayOS.
 */
export const ORDER_TTL_MS = 30 * 60 * 1000;

/**
 * Đơn mới tạo trong khoảng này thì bỏ qua, để không đua với webhook đang trên
 * đường tới. Chỉ áp cho các đường quét nền; trang trả về sau thanh toán đối
 * soát ngay vì ở đó người dùng đang ngồi đợi.
 */
export const RECONCILE_GRACE_MS = 5 * 60 * 1000;

export type SettleOutcome =
  | "credited"
  | "already_paid"
  | "not_found"
  | "not_pending"
  | "amount_mismatch";

/**
 * Cộng credit cho một đơn đã thanh toán. An toàn khi gọi lại nhiều lần:
 * webhook PayOS có thể retry, và job đối soát có thể chạy song song với nó.
 *
 * `paidAmountVnd` là số tiền provider báo đã nhận. Chữ ký webhook đã phủ field
 * này nên không giả mạo được, nhưng vẫn đối chiếu với giá gói đã chốt lúc tạo
 * đơn: nếu lệch thì dừng lại cho người thật xử lý thay vì phát credit sai.
 */
export async function creditPaidOrder(
  providerOrderId: string,
  paidAmountVnd: number,
): Promise<SettleOutcome> {
  const order = await prisma.order.findUnique({ where: { providerOrderId } });
  if (!order) return "not_found";
  if (order.status === "PAID") return "already_paid";
  if (order.status !== "PENDING") return "not_pending";

  if (paidAmountVnd !== order.amountVnd) {
    console.error(
      `[payos] Số tiền lệch cho đơn ${order.id} (orderCode ${providerOrderId}): ` +
        `nhận ${paidAmountVnd}, chờ ${order.amountVnd}. Không cộng credit.`,
    );
    // Không ai đọc Runtime Logs. Đây là tình huống duy nhất trong cả luồng
    // thanh toán mà không đường tự động nào gỡ được, nên phải chủ động báo.
    await alertAmountMismatch({
      orderId: order.id,
      providerOrderId,
      expectedVnd: order.amountVnd,
      paidVnd: paidAmountVnd,
    });
    return "amount_mismatch";
  }

  let credited = false;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), reconciledAt: new Date() },
    });
    // count === 0: một webhook retry hoặc job đối soát khác đã chốt đơn này.
    if (updated.count === 0) return;

    const user = await tx.user.update({
      where: { id: order.userId },
      data: { credits: { increment: order.creditsGranted } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: order.userId,
        type: "PURCHASE",
        amount: order.creditsGranted,
        balanceAfter: user.credits,
        relatedOrderId: order.id,
      },
    });
    credited = true;
  });

  return credited ? "credited" : "already_paid";
}

/**
 * Đóng một đơn chưa trả tiền. Chỉ tác động lên đơn còn PENDING, nên không bao
 * giờ ghi đè lên một đơn đã PAID do webhook về trước.
 */
export async function closeUnpaidOrder(
  providerOrderId: string,
  status: Extract<OrderStatus, "FAILED" | "EXPIRED" | "CANCELLED">,
): Promise<boolean> {
  const updated = await prisma.order.updateMany({
    where: { providerOrderId, status: "PENDING" },
    data: { status, reconciledAt: new Date() },
  });
  return updated.count > 0;
}

/**
 * Hỏi PayOS trạng thái thật của một đơn rồi áp lại vào database. Đây là đường
 * phục hồi khi webhook không tới: người dùng đã trả tiền nhưng đơn vẫn PENDING.
 *
 * Trả về trạng thái của đơn sau khi đối soát.
 */
export async function reconcileOrder(order: Order): Promise<OrderStatus> {
  if (order.status !== "PENDING") return order.status;

  let info;
  try {
    info = await getPaymentLink(order.providerPaymentLinkId ?? order.providerOrderId);
  } catch (error) {
    console.error(`[payos] Không đối soát được đơn ${order.id}:`, error);
    // PayOS đang lỗi. Đơn quá hạn thì vẫn đóng được dựa trên đồng hồ của
    // chính mình — link đã hết hạn thì không ai trả tiền vào đó nữa.
    if (isExpired(order)) {
      await closeUnpaidOrder(order.providerOrderId, "EXPIRED");
      return "EXPIRED";
    }
    return "PENDING";
  }

  if (!info) {
    // PayOS không biết link này: payment request chưa từng tạo thành công.
    if (isExpired(order)) {
      await closeUnpaidOrder(order.providerOrderId, "EXPIRED");
      return "EXPIRED";
    }
    return "PENDING";
  }

  switch (info.status) {
    case "PAID": {
      const outcome = await creditPaidOrder(order.providerOrderId, info.amountPaid);
      return outcome === "amount_mismatch" ? "PENDING" : "PAID";
    }
    case "CANCELLED":
      await closeUnpaidOrder(order.providerOrderId, "CANCELLED");
      return "CANCELLED";
    case "EXPIRED":
      await closeUnpaidOrder(order.providerOrderId, "EXPIRED");
      return "EXPIRED";
    default: {
      // PENDING hoặc PROCESSING bên PayOS. Chỉ tự đóng khi link đã quá hạn.
      if (isExpired(order)) {
        await closeUnpaidOrder(order.providerOrderId, "EXPIRED");
        return "EXPIRED";
      }
      await prisma.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { reconciledAt: new Date() },
      });
      return "PENDING";
    }
  }
}

function isExpired(order: Order, now = new Date()): boolean {
  const deadline = order.expiresAt ?? new Date(order.createdAt.getTime() + ORDER_TTL_MS);
  return deadline <= now;
}

export interface ReconcileSweepResult {
  checked: number;
  paid: number;
  closed: number;
  stillPending: number;
}

/**
 * Quét các đơn còn PENDING quá lâu và đối soát từng cái với PayOS. Chạy theo
 * lịch để đơn không nằm PENDING vĩnh viễn, và để người đã trả tiền vẫn nhận
 * được credit dù webhook trượt.
 *
 * Bỏ qua đơn vừa tạo trong `graceMs` để không đua với webhook đang trên đường.
 */
export async function reconcileStaleOrders(
  limit = 50,
  graceMs = RECONCILE_GRACE_MS,
): Promise<ReconcileSweepResult> {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING", createdAt: { lte: new Date(Date.now() - graceMs) } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const result: ReconcileSweepResult = { checked: 0, paid: 0, closed: 0, stillPending: 0 };
  for (const order of orders) {
    const status = await reconcileOrder(order);
    result.checked += 1;
    if (status === "PAID") result.paid += 1;
    else if (status === "PENDING") result.stillPending += 1;
    else result.closed += 1;
  }
  return result;
}

/**
 * Đối soát các đơn còn `PENDING` của một người dùng cụ thể, trả về số đơn đã
 * chốt được.
 *
 * Dùng khi chính người đó mở lại trang nạp credit: rẻ hơn quét toàn hệ thống, và
 * nhắm đúng người đang thắc mắc credit của mình đâu.
 */
export async function reconcileUserPendingOrders(
  userId: string,
  limit = 3,
  graceMs = RECONCILE_GRACE_MS,
): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: "PENDING",
      createdAt: { lte: new Date(Date.now() - graceMs) },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let settled = 0;
  for (const order of orders) {
    if ((await reconcileOrder(order)) !== "PENDING") settled += 1;
  }
  return settled;
}

/** Xem `lib/payments/refund.ts`. Bọc lại với client dùng chung của app. */
export function refundOrder(orderId: string) {
  return refundOrderWith(prisma, orderId);
}
