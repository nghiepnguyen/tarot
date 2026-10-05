import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Badge, DataTable, FilterTabs, PageHeader, Panel, Stat, Td, Th, TextLink, Tr } from "@/components/admin/Panel";
import { fetchDashboardRaw, ratio, toFunnel } from "@/lib/admin/metrics";
import { isPricedModel, sumAiCostVnd } from "@/lib/ai/pricing";
import { CREDIT_TYPE, CREDIT_TYPES, ORDER_STATUS, ORDER_STATUSES } from "@/lib/admin/labels";
import { formatVnDateTime } from "@/lib/admin/time";

const RANGES = [
  { days: 1, label: "Hôm nay" },
  { days: 7, label: "7 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 90, label: "90 ngày" },
];

const vnd = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const n = (value: number) => value.toLocaleString("vi-VN");

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const days = RANGES.some((range) => range.days === Number(params.days)) ? Number(params.days) : 30;
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

  const aiCostVnd = sumAiCostVnd(raw.aiTokensByModel);
  // Model không có trong bảng giá vẫn ra một con số, tính bằng giá mặc định.
  // Nói thẳng ra là ước lượng thay vì để người đọc tưởng đó là tiền thật.
  const unpricedModels = raw.aiTokensByModel
    .filter((row) => !isPricedModel(row.model))
    .map((row) => row.model);
  const ordersTotal = raw.ordersByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const orderCount = (status: string) => raw.ordersByStatus.find((row) => row.status === status)?._count._all ?? 0;
  const unlockSpends = raw.creditsByType.find((row) => row.type === "UNLOCK_SPEND")?._count._all ?? 0;
  const failedGenerations = Math.max(0, unlockSpends - raw.interpretations);
  const grossMarginVnd = raw.revenueVnd - aiCostVnd;

  const funnelRows = [
    { step: "Tài khoản", count: funnel.usersTotal, rate: null, base: "toàn bộ lịch sử" },
    { step: "Đã xác nhận email", count: funnel.usersVerified, rate: funnel.verifiedRate, base: "/ tài khoản" },
    { step: "Có bốc bài", count: funnel.usersDrawing, rate: funnel.drawRate, base: "/ đã xác nhận" },
    { step: "Có mở khóa AI", count: funnel.usersUnlocking, rate: funnel.unlockRate, base: "/ có bốc bài" },
    { step: "Đã trả tiền", count: funnel.usersPaying, rate: null, base: "toàn bộ lịch sử" },
  ];

  return (
    <>
      <PageHeader
        title="Tổng quan"
        meta={
          <>
            <span>
              Kỳ: từ <strong className="font-medium text-foreground">{formatVnDateTime(raw.since)}</strong> tới nay
            </span>
            <span>Số liệu lúc {formatVnDateTime(raw.generatedAt)} (giờ VN)</span>
            <span>Nguồn: Postgres, không lấy từ GA4</span>
          </>
        }
        actions={
          <FilterTabs
            label="Khoảng thời gian"
            options={RANGES.map((range) => ({
              href: `/admin?days=${range.days}`,
              label: range.label,
              active: range.days === days,
            }))}
          />
        }
      />

      {raw.pendingOrders > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span>
            <strong className="font-semibold tabular-nums">{n(raw.pendingOrders)}</strong> đơn đang chờ thanh toán (mọi
            thời điểm). Đơn đã trả mà webhook không tới sẽ nằm ở đây cho tới khi đối soát.
          </span>
          <TextLink href="/admin/orders?status=PENDING">Xem và đối soát →</TextLink>
        </div>
      ) : null}

      <section aria-label="Tiền" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Doanh thu ròng"
          value={vnd(raw.revenueVnd)}
          tone="success"
          hint={`${n(raw.paidOrders)} đơn PAID trong kỳ`}
          formula="Σ tiền đơn PAID, lọc theo paidAt"
          href={`/admin/orders?status=PAID`}
        />
        <Stat
          label="Đã hoàn"
          value={vnd(raw.refundedVnd)}
          tone={raw.refundedOrders > 0 ? "violet" : undefined}
          hint={`${n(raw.refundedOrders)} đơn REFUNDED`}
          formula="Σ tiền đơn REFUNDED, lọc theo ngày tạo đơn"
          href={`/admin/orders?status=REFUNDED`}
        />
        <Stat
          label="Chi phí AI"
          value={vnd(aiCostVnd)}
          tone={unpricedModels.length > 0 ? "warning" : undefined}
          hint={
            <>
              {n(raw.aiRuns)} lượt sinh · {raw.aiRuns > 0 ? vnd(Math.round(aiCostVnd / raw.aiRuns)) : "—"}/lượt
              {unpricedModels.length > 0 ? (
                <span className="block text-amber-700 dark:text-amber-400">
                  Ước lượng — chưa có giá cho {unpricedModels.join(", ")}
                </span>
              ) : null}
            </>
          }
          formula="Σ token × giá theo model (lib/ai/pricing.ts)"
        />
        <Stat
          label="Doanh thu trừ chi phí AI"
          value={vnd(grossMarginVnd)}
          tone={grossMarginVnd < 0 ? "danger" : undefined}
          hint="Chưa trừ phí PayOS, hosting, thuế"
          formula="doanh thu ròng − chi phí AI"
        />
      </section>

      <section aria-label="Hoạt động" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Tài khoản mới"
          value={n(raw.usersNew)}
          hint={`Tổng ${n(raw.usersTotal)} tài khoản`}
          href="/admin/users"
        />
        <Stat label="Lượt trải bài" value={n(raw.readings)} hint="Chỉ người đã đăng nhập" />
        <Stat
          label="Lượt sinh AI thành công"
          value={n(raw.interpretations)}
          hint={
            failedGenerations > 0 ? (
              <span className="text-red-700 dark:text-red-400">
                {n(failedGenerations)} lượt hỏng đã hoàn credit ({pct(ratio(failedGenerations, unlockSpends))})
              </span>
            ) : (
              `${n(unlockSpends)} lượt trừ credit, không lượt nào hỏng`
            )
          }
          formula="lượt hỏng = lượt UNLOCK_SPEND − AiInterpretation"
        />
        <Stat
          label="Thời gian sinh trung bình"
          value={raw.aiLatencyMs ? `${(raw.aiLatencyMs / 1000).toFixed(1)}s` : "—"}
          hint="Trần maxDuration 60s; xem p95 ở trang Prompt"
          href="/admin/prompts"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Đơn hàng trong kỳ"
          note="Theo ngày tạo đơn. Bấm vào trạng thái để mở danh sách đã lọc."
          flush
        >
          <DataTable minWidth="min-w-md">
            <thead>
              <tr>
                <Th>Trạng thái</Th>
                <Th align="right">Số đơn</Th>
                <Th align="right">Tỷ lệ</Th>
              </tr>
            </thead>
            <tbody>
              {ORDER_STATUSES.map((status) => (
                <Tr key={status}>
                  <Td>
                    <Link href={`/admin/orders?status=${status}`} className="inline-flex items-center gap-2" title={ORDER_STATUS[status].hint}>
                      <Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>
                      <span className="font-mono text-xs text-muted">{status}</span>
                    </Link>
                  </Td>
                  <Td align="right">{n(orderCount(status))}</Td>
                  <Td align="right" className="text-muted">
                    {pct(ratio(orderCount(status), ordersTotal))}
                  </Td>
                </Tr>
              ))}
              <tr className="font-semibold">
                <Td>Tổng</Td>
                <Td align="right">{n(ordersTotal)}</Td>
                <Td align="right" className="text-muted">
                  chốt {pct(ratio(orderCount("PAID") + orderCount("REFUNDED"), ordersTotal))}
                </Td>
              </tr>
            </tbody>
          </DataTable>
          <p className="px-3 py-2 text-xs text-muted">Tỷ lệ chốt = (PAID + REFUNDED) / tổng đơn tạo trong kỳ.</p>
        </Panel>

        <Panel
          title="Sổ credit trong kỳ"
          note="Chỉnh tay nằm chung bảng có chủ đích: đó là cách rẻ nhất để thấy nếu có ai đang lặng lẽ phát credit."
          flush
        >
          <DataTable minWidth="min-w-md">
            <thead>
              <tr>
                <Th>Loại</Th>
                <Th align="right">Số dòng</Th>
                <Th align="right">Tổng credit</Th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_TYPES.map((type) => {
                const row = raw.creditsByType.find((item) => item.type === type);
                return (
                  <Tr key={type}>
                    <Td>
                      <Link href={`/admin/transactions?type=${type}`} className="inline-flex items-center gap-2">
                        <Badge tone={CREDIT_TYPE[type].tone}>{CREDIT_TYPE[type].label}</Badge>
                        <span className="font-mono text-xs text-muted">{type}</span>
                      </Link>
                    </Td>
                    <Td align="right">{n(row?._count._all ?? 0)}</Td>
                    <Td align="right">{n(row?._sum.amount ?? 0)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </DataTable>
        </Panel>
      </div>

      <Panel
        title="Phễu người dùng"
        note="Tính trên người, không trên lượt. Bước bốc bài và mở khóa lọc theo kỳ; tài khoản, xác nhận email và trả tiền là toàn bộ lịch sử. Người chưa đăng nhập không vào database — đỉnh phễu ẩn danh chỉ có trên GA4."
        flush
      >
        <DataTable minWidth="min-w-lg">
          <thead>
            <tr>
              <Th>Bước</Th>
              <Th align="right">Số người</Th>
              <Th align="right">Tỷ lệ</Th>
              <Th>Mẫu số</Th>
              <Th className="w-1/3">
                <span className="sr-only">Biểu đồ</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {funnelRows.map((row) => (
              <Tr key={row.step}>
                <Td className="font-medium">{row.step}</Td>
                <Td align="right">{n(row.count)}</Td>
                <Td align="right">{row.rate === null ? "—" : pct(row.rate)}</Td>
                <Td className="text-xs text-muted">{row.base}</Td>
                <Td>
                  <div className="h-2 rounded bg-background" aria-hidden="true">
                    <div
                      className="h-2 rounded bg-accent"
                      style={{ width: `${Math.round(ratio(row.count, funnel.usersTotal) * 100)}%` }}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
            <Tr>
              <Td className="font-medium">Free → paid</Td>
              <Td align="right">—</Td>
              <Td align="right">{pct(funnel.freeToPaidRate)}</Td>
              <Td className="text-xs text-muted">người đã trả / người nhận credit dùng thử</Td>
              <Td />
            </Tr>
          </tbody>
        </DataTable>
      </Panel>
    </>
  );
}
