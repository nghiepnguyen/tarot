import type { CreditTransactionType, OrderStatus } from "@prisma/client";

/**
 * Nhãn và tông màu dùng chung cho mọi trang quản trị. Trước đây mỗi trang tự
 * khai một bản, và ba bản `CREDIT_TYPE_LABEL` chỉ cần lệch nhau một chữ là
 * cùng một dòng sổ đọc ra hai tên.
 */
export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED", "REFUNDED"];

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone; hint: string }> = {
  PENDING: { label: "Chờ thanh toán", tone: "warning", hint: "Đã tạo link PayOS, chưa nhận tiền." },
  PAID: { label: "Đã trả", tone: "success", hint: "Đã nhận tiền và cộng credit." },
  FAILED: { label: "Lỗi", tone: "danger", hint: "Tạo link PayOS lỗi, hoặc PayOS báo thanh toán lỗi." },
  EXPIRED: { label: "Hết hạn", tone: "neutral", hint: "Quá hạn mà không nhận được tiền." },
  CANCELLED: { label: "Đã huỷ", tone: "neutral", hint: "PayOS báo đơn đã huỷ." },
  REFUNDED: { label: "Đã hoàn", tone: "violet", hint: "Đã thu hồi credit; tiền hoàn tay trên PayOS." },
};

export const CREDIT_TYPES: CreditTransactionType[] = ["FREE_GRANT", "PURCHASE", "UNLOCK_SPEND", "REFUND", "ADMIN_ADJUST"];

export const CREDIT_TYPE: Record<CreditTransactionType, { label: string; tone: Tone }> = {
  FREE_GRANT: { label: "Tặng dùng thử", tone: "info" },
  PURCHASE: { label: "Nạp tiền", tone: "success" },
  UNLOCK_SPEND: { label: "Mở khóa AI", tone: "neutral" },
  REFUND: { label: "Hoàn lại", tone: "warning" },
  ADMIN_ADJUST: { label: "Chỉnh tay", tone: "danger" },
};

export const AUDIT_ACTION: Record<string, { label: string; tone: Tone }> = {
  credit_adjust: { label: "Chỉnh credit", tone: "danger" },
  order_refund: { label: "Hoàn đơn", tone: "violet" },
  order_reconcile: { label: "Đối soát đơn", tone: "info" },
  ai_model_change: { label: "Đổi model AI", tone: "warning" },
};
