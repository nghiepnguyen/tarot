export type AdminAction = "credit_adjust" | "order_refund" | "order_reconcile";

export interface AdminAuditEntry {
  adminUserId: string;
  action: AdminAction;
  targetUserId?: string | null;
  targetOrderId?: string | null;
  amount?: number | null;
  reason: string;
}

/**
 * Client tối thiểu mà `writeAuditLog` cần. Khai báo hẹp thế này để hàm nhận
 * được cả `PrismaClient`, cả client transaction, cả bản fake trong test.
 */
export interface AuditWriter {
  adminAuditLog: {
    create(args: { data: Omit<AdminAuditEntry, "reason"> & { reason: string } }): Promise<unknown>;
  };
}

/** `reason` chỉ để người đọc lại về sau; cắt bớt thay vì để một lần dán nhầm
 * mười nghìn ký tự vào làm hỏng trang nhật ký. */
const MAX_REASON_LENGTH = 500;

/**
 * Ghi một dòng nhật ký quản trị.
 *
 * Nhận client từ bên gọi để dùng được bên trong `$transaction`: dòng nhật ký
 * phải commit cùng lúc với thứ nó mô tả, không thì sẽ có lúc credit đã đổi mà
 * không ai ký tên, hoặc ngược lại.
 */
export async function writeAuditLog(db: AuditWriter, entry: AdminAuditEntry): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetUserId: entry.targetUserId ?? null,
      targetOrderId: entry.targetOrderId ?? null,
      amount: entry.amount ?? null,
      reason: entry.reason.trim().slice(0, MAX_REASON_LENGTH),
    },
  });
}
