import type { PrismaClient } from "@prisma/client";
import { writeAuditLog, type AuditWriter } from "@/lib/admin/audit";

/**
 * Người bấm nút, khi lệnh hoàn tới từ trang quản trị. Optional: script vận
 * hành `pnpm refund-order` gọi không kèm actor và đi tiếp như cũ.
 */
export interface RefundActor {
  adminUserId: string;
  reason: string;
}

export type RefundOutcome =
  | { ok: true; creditsReversed: number; balanceAfter: number }
  | { ok: false; error: string };

/**
 * Thu hồi credit của một đơn đã PAID, sau khi tiền đã được hoàn ở dashboard
 * PayOS. Chỉ đụng tới sổ credit — việc chuyển tiền lại cho khách nằm ngoài
 * hệ thống này, PayOS không mở API hoàn tiền cho merchant.
 *
 * Nhận `db` từ bên gọi thay vì import client dùng chung, để script vận hành
 * chạy ngoài Next (tsx) dùng lại được cùng một đoạn logic.
 *
 * Cho phép số dư âm: khách có thể đã tiêu credit trước khi yêu cầu hoàn. Ghi
 * âm vào sổ vẫn đúng hơn là im lặng bỏ qua, và chặn họ mở khóa tiếp cho tới
 * khi nạp bù.
 */
export async function refundOrder(
  db: PrismaClient,
  orderId: string,
  actor?: RefundActor,
): Promise<RefundOutcome> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: `Không tìm thấy đơn ${orderId}.` };
  if (order.status === "REFUNDED") return { ok: false, error: `Đơn ${orderId} đã được hoàn.` };
  if (order.status !== "PAID") {
    return {
      ok: false,
      error: `Đơn ${orderId} đang ở trạng thái ${order.status}, chưa thanh toán.`,
    };
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PAID" },
      data: { status: "REFUNDED" },
    });
    if (updated.count === 0) {
      return { ok: false as const, error: `Đơn ${orderId} vừa được xử lý bởi tiến trình khác.` };
    }

    const user = await tx.user.update({
      where: { id: order.userId },
      data: { credits: { decrement: order.creditsGranted } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: order.userId,
        type: "REFUND",
        amount: -order.creditsGranted,
        balanceAfter: user.credits,
        relatedOrderId: order.id,
      },
    });

    // Trong cùng transaction: dòng nhật ký không được phép commit rời khỏi
    // thứ nó mô tả.
    if (actor) {
      await writeAuditLog(tx as unknown as AuditWriter, {
        adminUserId: actor.adminUserId,
        action: "order_refund",
        targetUserId: order.userId,
        targetOrderId: order.id,
        amount: -order.creditsGranted,
        reason: actor.reason,
      });
    }

    return { ok: true as const, creditsReversed: order.creditsGranted, balanceAfter: user.credits };
  });
}
