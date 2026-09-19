import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Panel, Stat } from "@/components/admin/Panel";
import { estimateAiCostVnd, fetchDashboardRaw, ratio, toFunnel } from "@/lib/admin/metrics";

const RANGES = [7, 30, 90];

const vnd = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const CREDIT_TYPE_LABEL: Record<string, string> = {
  FREE_GRANT: "Tặng dùng thử",
  PURCHASE: "Nạp tiền",
  UNLOCK_SPEND: "Mở khóa AI",
  REFUND: "Hoàn lại",
  ADMIN_ADJUST: "Chỉnh tay",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const days = RANGES.includes(Number(params.days)) ? Number(params.days) : 30;
  const raw = await fetchDashboardRaw(prisma, days);

  const funnel = toFunnel({
    usersTotal: raw.usersTotal,
    usersVerified: raw.usersVerified,
    usersDrawing: new Set(raw.drawingUserIds).size,
    usersUnlocking: new Set(raw.unlockingUserIds).size,
    usersPaying: new Set(raw.paidUserIds).size,
    freeGrantUserIds: raw.freeGrantUserIds,
    paidUserIds: raw.paidUserIds,
  });

  const aiCostVnd = estimateAiCostVnd(raw.aiTokens);
  const ordersTotal = raw.ordersByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const unlockSpends = raw.creditsByType.find((row) => row.type === "UNLOCK_SPEND")?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tổng quan</h1>
        <nav className="flex gap-3" aria-label="Khoảng thời gian">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin?days=${range}`}
              aria-current={range === days ? "page" : undefined}
              className={`text-sm transition-colors duration-300 hover:text-accent ${
                range === days ? "text-accent" : "text-muted"
              }`}
            >
              {range} ngày
            </Link>
          ))}
        </nav>
      </div>

      <Panel
        title="Doanh thu"
        note="Số lấy từ bảng Order trong database, không lấy từ GA4: event purchase đếm thiếu những đơn được cứu ở đường đối soát, nên GA4 luôn thấp hơn chỗ này."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Doanh thu ròng" value={vnd(raw.revenueVnd)} hint={`${raw.paidOrders} đơn đã trả`} />
          <Stat label="Đã hoàn" value={vnd(raw.refundedVnd)} hint={`${raw.refundedOrders} đơn`} />
          <Stat
            label="Tỷ lệ chốt đơn"
            value={pct(ratio(raw.paidOrders, ordersTotal))}
            hint={`${ordersTotal} đơn được tạo`}
          />
          <Stat
            label="Chi phí AI"
            value={vnd(aiCostVnd)}
            hint={`${raw.aiRuns} lượt sinh, ${raw.aiRuns > 0 ? vnd(Math.round(aiCostVnd / raw.aiRuns)) : "—"}/lượt`}
          />
        </div>
      </Panel>

      <Panel
        title="Phễu"
        note="Phễu này bắt đầu từ reading đã lưu. Người chưa đăng nhập gõ câu hỏi và bốc bài không vào database — đỉnh phễu ẩn danh chỉ xem được trên GA4."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          <Stat label="Tài khoản" value={String(funnel.usersTotal)} hint={`+${raw.usersNew} trong kỳ`} />
          <Stat label="Đã xác nhận email" value={String(funnel.usersVerified)} hint={pct(funnel.verifiedRate)} />
          <Stat label="Có bốc bài" value={String(funnel.usersDrawing)} hint={`${pct(funnel.drawRate)} người đã xác nhận`} />
          <Stat label="Có mở khóa AI" value={String(funnel.usersUnlocking)} hint={`${pct(funnel.unlockRate)} người bốc bài`} />
          <Stat label="Đã trả tiền" value={String(funnel.usersPaying)} hint={`free→paid ${pct(funnel.freeToPaidRate)}`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Lượt trải bài" value={String(raw.readings)} />
          <Stat
            label="Lượt sinh AI thành công"
            value={String(raw.interpretations)}
            hint={`${unlockSpends} lượt trừ credit — chênh lệch là lượt hỏng đã hoàn credit`}
          />
          <Stat
            label="Thời gian sinh trung bình"
            value={raw.aiLatencyMs ? `${(raw.aiLatencyMs / 1000).toFixed(1)}s` : "—"}
          />
        </div>
      </Panel>

      <Panel
        title="Sổ credit"
        note="Chỉnh tay nằm chung bảng này có chủ đích: đó là cách rẻ nhất để thấy nếu có ai đang lặng lẽ phát credit."
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 font-normal">Loại</th>
              <th className="py-2 text-right font-normal">Số lượt</th>
              <th className="py-2 text-right font-normal">Tổng credit</th>
            </tr>
          </thead>
          <tbody>
            {raw.creditsByType.map((row) => (
              <tr key={row.type} className="border-b border-border/50 last:border-0">
                <td className="py-2 text-foreground">{CREDIT_TYPE_LABEL[row.type] ?? row.type}</td>
                <td className="py-2 text-right tabular-nums text-muted">{row._count._all}</td>
                <td className="py-2 text-right tabular-nums text-foreground">
                  {(row._sum.amount ?? 0).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
            {raw.creditsByType.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted">
                  Chưa có giao dịch nào trong kỳ.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
