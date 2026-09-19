import type { PrismaClient } from "@prisma/client";
import { estimateAiCostVnd, isPricedModel } from "@/lib/ai/pricing";
import type { PromptVersion } from "@/lib/ai/prompts";

/** Một nhóm (bản prompt, model) đã từng chạy, đọc từ database. */
export interface PromptUsageRow {
  versionId: string | null;
  model: string;
  runs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  thinkingTokens: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  firstAt: Date;
  lastAt: Date;
}

/** Một dòng trên `/admin/prompts`: bản prompt cộng số đo của chính nó. */
export interface PromptVersionSummary {
  id: string;
  model: string;
  /** Còn nằm trong `lib/ai/prompts/` hay không. Row cũ có thể trỏ vào id đã gỡ. */
  inRegistry: boolean;
  isActive: boolean;
  /** Model có giá trong `lib/ai/pricing.ts` hay không. Không có thì tiền chỉ là ước lượng. */
  priced: boolean;
  runs: number;
  avgInputTokens: number | null;
  /** Output cộng thinking — cùng một giá, và đây là phần phình theo prompt. */
  avgOutputTokens: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  costVnd: number;
  avgCostVnd: number | null;
  firstAt: Date | null;
  lastAt: Date | null;
}

const UNRECORDED_ID = "(chưa ghi)";

function average(total: number | null, runs: number): number | null {
  if (total === null || runs === 0) return null;
  return Math.round(total / runs);
}

/**
 * Ghép registry với số đo trong database.
 *
 * Hai phía không trùng nhau, và đó là chuyện bình thường: một version vừa
 * thêm chưa chạy lượt nào vẫn phải hiện ra (để biết nó tồn tại), còn một id
 * đã gỡ khỏi registry vẫn còn row trong database (phải thống kê được, không
 * thì lịch sử chi phí thủng một mảng). Row chưa kịp ghi `promptVersion` gom
 * vào một dòng riêng thay vì lặng lẽ biến mất.
 */
export function summarizePromptVersions(
  versions: readonly PromptVersion[],
  activeId: string,
  rows: readonly PromptUsageRow[],
): PromptVersionSummary[] {
  const summaries: PromptVersionSummary[] = rows.map((row) => {
    const id = row.versionId ?? UNRECORDED_ID;
    const costVnd = estimateAiCostVnd(row, row.model);
    // Không đo được token thì chi phí là chưa biết, không phải bằng không.
    // Một dòng "0đ/lượt" đọc như tin tốt, mà sự thật chỉ là thiếu số đo.
    const measured =
      row.inputTokens !== null || row.outputTokens !== null || row.thinkingTokens !== null;
    return {
      id,
      model: row.model,
      inRegistry: versions.some((version) => version.id === id),
      isActive: id === activeId,
      priced: isPricedModel(row.model),
      runs: row.runs,
      avgInputTokens: average(row.inputTokens, row.runs),
      avgOutputTokens: average(
        row.outputTokens === null && row.thinkingTokens === null
          ? null
          : (row.outputTokens ?? 0) + (row.thinkingTokens ?? 0),
        row.runs,
      ),
      latencyP50Ms: row.latencyP50Ms,
      latencyP95Ms: row.latencyP95Ms,
      costVnd,
      avgCostVnd: measured && row.runs > 0 ? Math.round(costVnd / row.runs) : null,
      firstAt: row.firstAt,
      lastAt: row.lastAt,
    };
  });

  for (const version of versions) {
    if (summaries.some((summary) => summary.id === version.id)) continue;
    summaries.push({
      id: version.id,
      model: version.model,
      inRegistry: true,
      isActive: version.id === activeId,
      priced: isPricedModel(version.model),
      runs: 0,
      avgInputTokens: null,
      avgOutputTokens: null,
      latencyP50Ms: null,
      latencyP95Ms: null,
      costVnd: 0,
      avgCostVnd: null,
      firstAt: null,
      lastAt: null,
    });
  }

  // Bản đang chạy lên đầu, còn lại theo số lượt giảm dần: trang này để so
  // sánh, mà so sánh thì cần cái đang chạy nằm sẵn trong tầm mắt.
  return summaries.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.runs - a.runs;
  });
}

/**
 * Số đo từng bản prompt, gom trong đúng một truy vấn.
 *
 * Dùng SQL thô vì `groupBy` của Prisma không có percentile. Trung bình latency
 * không đủ ở đây: một lượt sinh mất 28 giây và `maxDuration` là 60, nên thứ
 * cần nhìn là cái đuôi p95 sắp chạm trần, không phải con số giữa.
 */
export async function fetchPromptUsage(db: PrismaClient): Promise<PromptUsageRow[]> {
  return db.$queryRaw<PromptUsageRow[]>`
    SELECT "promptVersion"                                                     AS "versionId",
           "model",
           count(*)::int                                                       AS "runs",
           sum("inputTokens")::double precision                                AS "inputTokens",
           sum("outputTokens")::double precision                               AS "outputTokens",
           sum("thinkingTokens")::double precision                             AS "thinkingTokens",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY "latencyMs")::int       AS "latencyP50Ms",
           percentile_cont(0.95) WITHIN GROUP (ORDER BY "latencyMs")::int      AS "latencyP95Ms",
           min("createdAt")                                                    AS "firstAt",
           max("createdAt")                                                    AS "lastAt"
    FROM "AiInterpretation"
    GROUP BY "promptVersion", "model"
  `;
}
