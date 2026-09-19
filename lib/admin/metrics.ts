import type { PrismaClient } from "@prisma/client";

/** Số người có mặt ở cả hai tập. Dùng cho tỷ lệ free-to-paid. */
export function intersectUserIds(a: readonly string[], b: readonly string[]): string[] {
  const right = new Set(b);
  return [...new Set(a)].filter((id) => right.has(id));
}

export function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

export interface FunnelInput {
  usersTotal: number;
  usersVerified: number;
  usersDrawing: number;
  usersUnlocking: number;
  usersPaying: number;
  freeGrantUserIds: readonly string[];
  paidUserIds: readonly string[];
}

export interface Funnel {
  usersTotal: number;
  usersVerified: number;
  usersDrawing: number;
  usersUnlocking: number;
  usersPaying: number;
  verifiedRate: number;
  drawRate: number;
  unlockRate: number;
  freeToPaidRate: number;
}

/**
 * Phễu tính trên *người*, không trên lượt: câu hỏi ở đây là bao nhiêu phần
 * người đăng ký đi được tới bước sau, chứ không phải tổng số lần bốc bài.
 *
 * Phễu này bắt đầu từ reading đã lưu. Người chưa đăng nhập gõ câu hỏi và bốc
 * bài không bao giờ vào Postgres (`app/actions/readings.ts` thoát sớm khi
 * không có session), nên đỉnh phễu ẩn danh chỉ có trên GA4.
 */
export function toFunnel(input: FunnelInput): Funnel {
  return {
    usersTotal: input.usersTotal,
    usersVerified: input.usersVerified,
    usersDrawing: input.usersDrawing,
    usersUnlocking: input.usersUnlocking,
    usersPaying: input.usersPaying,
    verifiedRate: ratio(input.usersVerified, input.usersTotal),
    drawRate: ratio(input.usersDrawing, input.usersVerified),
    unlockRate: ratio(input.usersUnlocking, input.usersDrawing),
    freeToPaidRate: ratio(
      intersectUserIds(input.freeGrantUserIds, input.paidUserIds).length,
      new Set(input.freeGrantUserIds).size,
    ),
  };
}

/**
 * Toàn bộ phần chạm database của dashboard. Tách riêng khỏi phần số học ở trên
 * để phần số học test được — Vitest chỉ quét `lib/**` trong env node, không
 * dựng nổi một Prisma thật.
 */
export async function fetchDashboardRaw(db: PrismaClient, days: number) {
  // Mốc thời gian tính ở đây chứ không ở component: đọc đồng hồ là việc không
  // thuần, và `react-hooks/purity` chặn nó ngay trong thân một Server
  // Component.
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    paid,
    refunded,
    ordersByStatus,
    creditsByType,
    usersTotal,
    usersVerified,
    usersNew,
    readings,
    interpretations,
    drawingUsers,
    unlockingUsers,
    freeGrantUsers,
    paidUsers,
    aiUsage,
    aiUsageByModel,
  ] = await Promise.all([
    // Tiền lấy từ `Order`, không từ sổ credit: `refundOrder` lật PAID sang
    // REFUNDED, nên lọc theo trạng thái ra luôn doanh thu ròng. Đếm dòng
    // `PURCHASE` trong sổ thì tính trùng đơn đã hoàn, vì dòng PURCHASE vẫn nằm
    // đó và chỉ được nối thêm một dòng REFUND.
    db.order.aggregate({
      _sum: { amountVnd: true },
      _count: { _all: true },
      where: { status: "PAID", paidAt: { gte: since } },
    }),
    db.order.aggregate({
      _sum: { amountVnd: true },
      _count: { _all: true },
      where: { status: "REFUNDED", createdAt: { gte: since } },
    }),
    db.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    db.creditTransaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    db.user.count(),
    db.user.count({ where: { emailVerifiedAt: { not: null } } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.reading.count({ where: { createdAt: { gte: since } } }),
    db.aiInterpretation.count({ where: { createdAt: { gte: since } } }),
    db.reading.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }),
    db.creditTransaction.groupBy({
      by: ["userId"],
      where: { type: "UNLOCK_SPEND", createdAt: { gte: since } },
    }),
    db.creditTransaction.groupBy({ by: ["userId"], where: { type: "FREE_GRANT" } }),
    db.order.groupBy({ by: ["userId"], where: { status: "PAID" } }),
    db.aiInterpretation.aggregate({
      _avg: { latencyMs: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    // Token gom theo model chứ không cộng một cục: giá khác nhau theo model
    // (`lib/ai/pricing.ts`), nên một kỳ có hai model mà cộng chung thì ra sai
    // tiền. Gộp lại được, tách ra thì không.
    db.aiInterpretation.groupBy({
      by: ["model"],
      _sum: { inputTokens: true, outputTokens: true, thinkingTokens: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
  ]);

  return {
    revenueVnd: paid._sum.amountVnd ?? 0,
    paidOrders: paid._count._all,
    refundedVnd: refunded._sum.amountVnd ?? 0,
    refundedOrders: refunded._count._all,
    ordersByStatus,
    creditsByType,
    usersTotal,
    usersVerified,
    usersNew,
    readings,
    // Không bằng số dòng `UNLOCK_SPEND`: khi Gemini hỏng, `unlockAiInterpretationAction`
    // hoàn lại credit và ghi một dòng REFUND nhưng không tạo `AiInterpretation`.
    // Khoảng cách giữa hai con số chính là tỷ lệ sinh hỏng.
    interpretations,
    drawingUserIds: drawingUsers.map((row) => row.userId),
    unlockingUserIds: unlockingUsers.map((row) => row.userId),
    freeGrantUserIds: freeGrantUsers.map((row) => row.userId),
    paidUserIds: paidUsers.map((row) => row.userId),
    aiTokensByModel: aiUsageByModel.map((row) => ({
      model: row.model,
      inputTokens: row._sum.inputTokens,
      outputTokens: row._sum.outputTokens,
      thinkingTokens: row._sum.thinkingTokens,
      runs: row._count._all,
    })),
    aiLatencyMs: aiUsage._avg.latencyMs,
    aiRuns: aiUsage._count._all,
  };
}

export type DashboardRaw = Awaited<ReturnType<typeof fetchDashboardRaw>>;
