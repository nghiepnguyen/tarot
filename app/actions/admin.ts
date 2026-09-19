"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getAdminUser } from "@/lib/auth/admin";
import { adjustCredits } from "@/lib/admin/credits";
import { writeAuditLog } from "@/lib/admin/audit";
import { refundOrder, reconcileOrder } from "@/lib/payments/orders";
import {
  AdjustCreditsSchema,
  ReconcileOrderSchema,
  RefundOrderSchema,
} from "@/lib/validation/admin";
import { reportHandledError } from "@/lib/monitoring/report";

export type AdminActionResult = { ok: true; message: string } | { ok: false; error: string };

const DENIED = { ok: false as const, error: "Không có quyền." };

/**
 * Mọi action ở đây tự kiểm quyền trong thân hàm, không dựa vào đường dẫn.
 * Server action là một POST tới URL của trang kèm header `Next-Action`: ai có
 * action id đều gọi được, bất kể họ có vào nổi `/admin` hay không.
 *
 * `getAdminUser()` đọc thẳng database chứ không tin `session.user.role`, nên
 * thu quyền có hiệu lực ngay chứ không phải sau năm phút.
 */
export async function adjustCreditsAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return DENIED;

  const parsed = AdjustCreditsSchema.safeParse({
    userId: formData.get("userId"),
    delta: Number(formData.get("delta")),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  try {
    const result = await adjustCredits(prisma, { ...parsed.data, adminUserId: admin.id });
    if (!result.ok) return result;

    revalidatePath(`/admin/users/${parsed.data.userId}`);
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/audit");
    return {
      ok: true,
      message: `Đã ${result.delta > 0 ? "cộng" : "trừ"} ${Math.abs(result.delta)} credit. Số dư mới: ${result.balanceAfter}.`,
    };
  } catch (error) {
    reportHandledError(error, {
      area: "admin-credit-adjust",
      userId: admin.id,
      extra: { targetUserId: parsed.data.userId, delta: parsed.data.delta },
    });
    return { ok: false, error: "Không chỉnh được credit. Thử lại sau." };
  }
}

/**
 * Chỉ thu hồi credit. PayOS không mở API hoàn tiền cho merchant, nên chân tiền
 * vẫn phải làm tay trên dashboard của họ — giao diện phải nói đúng điều đó,
 * như `scripts/refund-order.ts` vẫn in ra.
 */
export async function refundOrderAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return DENIED;

  const parsed = RefundOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  try {
    const result = await refundOrder(parsed.data.orderId, {
      adminUserId: admin.id,
      reason: parsed.data.reason,
    });
    if (!result.ok) return result;

    revalidatePath("/admin/orders");
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/audit");
    return {
      ok: true,
      message: `Đã thu hồi ${result.creditsReversed} credit. Số dư mới: ${result.balanceAfter}. Nhớ hoàn tiền cho khách trên dashboard PayOS.`,
    };
  } catch (error) {
    reportHandledError(error, {
      area: "admin-order-refund",
      userId: admin.id,
      extra: { orderId: parsed.data.orderId },
    });
    return { ok: false, error: "Không hoàn được đơn. Thử lại sau." };
  }
}

/**
 * Hỏi lại PayOS về một đơn còn PENDING. Bốn đường đối soát tự động đã phủ tình
 * huống này; nút ở đây là để không phải chờ cron khi có khách đang nhắn tin.
 */
export async function reconcileOrderAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return DENIED;

  const parsed = ReconcileOrderSchema.safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ." };

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return { ok: false, error: `Không tìm thấy đơn ${parsed.data.orderId}.` };

  try {
    const status = await reconcileOrder(order);

    await writeAuditLog(prisma, {
      adminUserId: admin.id,
      action: "order_reconcile",
      targetUserId: order.userId,
      targetOrderId: order.id,
      reason: `Đối soát tay, kết quả ${status}.`,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/audit");
    return { ok: true, message: `Đơn ${order.id} nay ở trạng thái ${status}.` };
  } catch (error) {
    reportHandledError(error, {
      area: "admin-order-reconcile",
      userId: admin.id,
      extra: { orderId: order.id },
    });
    return { ok: false, error: "Không hỏi được PayOS. Thử lại sau." };
  }
}
