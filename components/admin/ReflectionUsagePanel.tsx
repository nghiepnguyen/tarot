import { DataTable, EmptyRow, Panel, Td, Th, Tr } from "@/components/admin/Panel";
import { vnStartOfDaysAgo, formatVnDateTime } from "@/lib/admin/time";
import { REFLECTION_METRIC_VERSION } from "@/lib/ai/dynamic-reflection";
import { estimateAiCostVnd, type TokenSums } from "@/lib/ai/pricing";
import { prisma } from "@/lib/db/prisma";

const number = (value: number | null) => value?.toLocaleString("vi-VN") ?? "—";
const cost = (usage: TokenSums, model: string) =>
  Object.values(usage).every(value => value === null)
    ? "—"
    : `${number(estimateAiCostVnd(usage, model))} đ`;

const OUTCOMES: Record<string, string> = {
  success: "Thành công",
  invalid_output: "Đầu ra không hợp lệ",
  timeout: "Quá thời gian",
  provider_error: "Lỗi nhà cung cấp",
};

export async function ReflectionUsagePanel({ days }: { days: number }) {
  const where = { promptVersion: REFLECTION_METRIC_VERSION, createdAt: { gte: vnStartOfDaysAgo(days, new Date()) } };
  const [totals, recent] = await Promise.all([
    prisma.aiGenerationMetric.groupBy({
      by: ["model"],
      where,
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, thinkingTokens: true },
      orderBy: { model: "asc" },
    }),
    prisma.aiGenerationMetric.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 25,
      select: { id: true, createdAt: true, model: true, outcome: true, inputTokens: true, outputTokens: true, thinkingTokens: true },
    }),
  ]);

  return (
    <Panel
      title="Tạo câu hỏi phản tư"
      note="Chi phí ước tính theo bảng giá của từng model, gồm thinking. Dấu — nghĩa là chưa có số liệu token hoặc chi phí tương ứng."
    >
      {totals.length === 0 ? <EmptyRow>Chưa ghi nhận lượt tạo phản tư trong kỳ.</EmptyRow> : (
        <div className="space-y-5">
          <DataTable>
            <thead><tr>
              <Th>Model</Th><Th>Số lượt</Th><Th>Input</Th><Th>Output</Th><Th>Thinking</Th><Th>Chi phí ước tính</Th>
            </tr></thead>
            <tbody>{totals.map(row => (
              <Tr key={row.model}>
                <Td>{row.model}</Td><Td>{number(row._count._all)}</Td>
                <Td>{number(row._sum.inputTokens)}</Td><Td>{number(row._sum.outputTokens)}</Td>
                <Td>{number(row._sum.thinkingTokens)}</Td><Td>{cost(row._sum, row.model)}</Td>
              </Tr>
            ))}</tbody>
          </DataTable>
          <h3 className="text-sm font-semibold">25 lượt gần nhất trong kỳ</h3>
          <DataTable>
            <thead><tr>
              <Th>Thời gian</Th><Th>Model</Th><Th>Kết quả</Th><Th>Input</Th><Th>Output</Th><Th>Thinking</Th><Th>Chi phí ước tính</Th>
            </tr></thead>
            <tbody>{recent.map(({ id, createdAt, model, outcome, ...usage }) => (
              <Tr key={id}>
                <Td>{formatVnDateTime(createdAt)}</Td><Td>{model}</Td><Td>{OUTCOMES[outcome] ?? outcome}</Td>
                <Td>{number(usage.inputTokens)}</Td><Td>{number(usage.outputTokens)}</Td>
                <Td>{number(usage.thinkingTokens)}</Td><Td>{cost(usage, model)}</Td>
              </Tr>
            ))}</tbody>
          </DataTable>
        </div>
      )}
    </Panel>
  );
}
