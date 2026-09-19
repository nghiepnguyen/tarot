import type { PrismaClient } from "@prisma/client";
import { writeAuditLog, type AuditWriter } from "@/lib/admin/audit";

export type AdjustOutcome =
  | { ok: true; delta: number; balanceAfter: number }
  | { ok: false; error: string };

/**
 * Trần cho một lần chỉnh tay. Lỗi thật hay gặp không phải là cố ý phát sai số
 * lượng, mà là thừa một số 0.
 */
export const MAX_ADJUST = 1000;

export interface AdjustCreditsInput {
  userId: string;
  delta: number;
  reason: string;
  adminUserId: string;
}

/**
 * Cộng hoặc trừ credit của một tài khoản bằng tay, ghi sổ và ghi nhật ký trong
 * cùng một transaction.
 *
 * Nhận `db` từ bên gọi như `lib/payments/refund.ts`, để test chạy được với
 * Prisma giả.
 *
 * Cho phép số dư âm, cùng lý do đã ghi ở `refund.ts`: khách có thể đã tiêu
 * trước khi bị thu lại, ghi âm vẫn đúng hơn là im lặng bỏ qua, và nó chặn họ
 * mở khóa tiếp cho tới khi nạp bù.
 */
export async function adjustCredits(
  db: PrismaClient,
  input: AdjustCreditsInput,
): Promise<AdjustOutcome> {
  const delta = Math.trunc(input.delta);

  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: "Số credit phải khác 0." };
  }
  if (Math.abs(delta) > MAX_ADJUST) {
    return { ok: false, error: `Mỗi lần chỉnh tối đa ${MAX_ADJUST} credit.` };
  }

  const reason = input.reason.trim();
  if (reason.length < 3) {
    return { ok: false, error: "Phải ghi lý do." };
  }

  const target = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!target) {
    return { ok: false, error: `Không tìm thấy tài khoản ${input.userId}.` };
  }

  return db.$transaction(async (tx) => {
    // `increment` với số âm lo được cả hai chiều, không cần rẽ nhánh.
    const user = await tx.user.update({
      where: { id: input.userId },
      data: { credits: { increment: delta } },
    });

    // `balanceAfter` lấy từ giá trị update vừa trả về trong chính transaction
    // này, không đọc lại: một lần đọc lại là một khe cho tiến trình khác chen
    // vào giữa.
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "ADMIN_ADJUST",
        amount: delta,
        balanceAfter: user.credits,
      },
    });

    await writeAuditLog(tx as unknown as AuditWriter, {
      adminUserId: input.adminUserId,
      action: "credit_adjust",
      targetUserId: input.userId,
      amount: delta,
      reason,
    });

    return { ok: true as const, delta, balanceAfter: user.credits };
  });
}
