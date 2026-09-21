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
  SetAiModelSchema,
} from "@/lib/validation/admin";
import { getAiModel } from "@/lib/ai/models";
import { getActiveAiModel, setActiveAiModel } from "@/lib/ai/settings";
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

/**
 * Đổi model sinh luận giải cho mọi lượt mở khóa kể từ lúc bấm.
 *
 * Không đụng vào prompt: bản prompt vẫn nằm trong code và vẫn đóng băng, chỉ
 * model đổi. Những row đã sinh giữ nguyên model của chính chúng, nên
 * `/admin/prompts` vẫn tách được số đo trước và sau lần đổi này — đó là lý do
 * `AiInterpretation` lưu cả `model` lẫn `promptVersion`.
 *
 * Ghi nhật ký trong cùng một transaction với lựa chọn: một lần đổi model là
 * quyết định của một con người, và hai bản ghi lệch nhau nghĩa là nửa năm sau
 * không ai biết vì sao chi phí mỗi lượt nhảy bậc.
 */
export async function setAiModelAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return DENIED;

  const parsed = SetAiModelSchema.safeParse({
    modelId: formData.get("modelId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const next = getAiModel(parsed.data.modelId);
  if (!next) return { ok: false, error: "Model không nằm trong danh sách cho phép." };

  const current = await getActiveAiModel();
  if (current.id === next.id) {
    return { ok: false, error: `Model đang dùng đã là ${next.label}.` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await setActiveAiModel(tx, next.id, admin.id);
      await writeAuditLog(tx, {
        adminUserId: admin.id,
        action: "ai_model_change",
        reason: `${current.id} → ${next.id}. ${parsed.data.reason}`,
      });
    });

    revalidatePath("/admin/prompts");
    revalidatePath("/admin/audit");
    return { ok: true, message: `Từ giờ mọi lượt mở khóa dùng ${next.label}.` };
  } catch (error) {
    reportHandledError(error, {
      area: "admin-ai-model",
      userId: admin.id,
      extra: { from: current.id, to: next.id },
    });
    return { ok: false, error: "Không đổi được model. Thử lại sau." };
  }
}
