import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Panel, EmptyRow } from "@/components/admin/Panel";
import { ACTIVE_PROMPT_VERSION, PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { getModelPricing } from "@/lib/ai/pricing";
import { fetchPromptUsage, summarizePromptVersions } from "@/lib/admin/prompt-stats";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "@/lib/ai/interpretation";

const vnd = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const num = (value: number | null) => (value === null ? "—" : value.toLocaleString("vi-VN"));
const secs = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)}s`);
const day = (value: Date | null) =>
  value === null ? "—" : value.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/**
 * Trải bài giả, cố định, chỉ để dựng prompt mẫu cho người đọc trang này xem.
 * Không đụng vào dữ liệu thật: xem prompt của một lượt sinh cụ thể đồng nghĩa
 * với xem câu hỏi của người dùng, mà câu hỏi thì không thuộc về trang quản trị.
 */
const SAMPLE_QUESTION = "Tôi có nên nhận lời mời công việc mới không?";
const SAMPLE_CARDS: InterpretationCardInput[] = SPREAD_POSITIONS.map((position, index) => ({
  position,
  card: TAROT_CARDS[index],
  orientation: index === 1 ? "reversed" : "upright",
}));

/**
 * Chỉ đọc, cùng lý do với trang Bộ bài — nhưng gắt hơn.
 *
 * Prompt cột chặt vào JSON schema gửi Gemini và vào schema parse lại kết quả,
 * và nó chứa cả ràng buộc an toàn. Sửa nó bằng một ô textarea trên web thì bỏ
 * qua được cả hai, nên đổi prompt vẫn đi qua code review và deploy. Việc của
 * trang này là trả lời một câu: bản prompt đang chạy đáng giá bao nhiêu so với
 * bản trước.
 */
export default async function AdminPromptsPage() {
  await requireAdmin();

  const usage = await fetchPromptUsage(prisma);
  const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE_PROMPT_VERSION.id, usage);
  const activePricing = getModelPricing(ACTIVE_PROMPT_VERSION.model);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Prompt và model</h1>
        <p className="text-sm text-muted">
          Đọc từ <code className="font-mono text-xs">lib/ai/prompts/</code>. Đổi prompt hay đổi model
          là thêm một version mới trong code rồi deploy — không có đường nào sửa từ đây, vì prompt
          cột chặt vào JSON schema và chứa cả ràng buộc an toàn.
        </p>
      </div>

      <Panel
        title="Bản đang chạy"
        note="Mọi lượt mở khóa từ lúc deploy gần nhất đều đi qua đúng bản này, và ghi id của nó vào AiInterpretation.promptVersion."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted">Prompt</dt>
            <dd className="font-mono text-sm text-foreground">{ACTIVE_PROMPT_VERSION.id}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted">Model</dt>
            <dd className="font-mono text-sm text-foreground">
              {ACTIVE_PROMPT_VERSION.model}
              {activePricing ? null : (
                <span className="ml-2 font-sans text-xs text-muted">chưa có trong bảng giá</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted">
          {activePricing
            ? `Giá đang dùng để tính tiền: ${activePricing.note}`
            : "Model này chưa có giá trong lib/ai/pricing.ts, nên mọi con số tiền bên dưới và trên trang Tổng quan đều là ước lượng tính bằng giá mặc định."}
        </p>
      </Panel>

      <Panel
        title="Số đo theo bản prompt"
        note="Tính trên toàn bộ lịch sử, không lọc theo kỳ: câu hỏi ở đây là bản prompt nào tốn bao nhiêu, mà một bản chỉ chạy trong khoảng thời gian nó được deploy. p95 đáng nhìn hơn trung bình — maxDuration là 60 giây, nên cái đuôi mới là thứ sắp chạm trần."
      >
        {summaries.length === 0 ? (
          <EmptyRow>Chưa có lượt sinh nào.</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 font-normal">Bản prompt</th>
                  <th className="py-2 font-normal">Model</th>
                  <th className="py-2 text-right font-normal">Lượt</th>
                  <th className="py-2 text-right font-normal">Input TB</th>
                  <th className="py-2 text-right font-normal">Output+think TB</th>
                  <th className="py-2 text-right font-normal">p50</th>
                  <th className="py-2 text-right font-normal">p95</th>
                  <th className="py-2 text-right font-normal">Chi phí/lượt</th>
                  <th className="py-2 text-right font-normal">Tổng chi phí</th>
                  <th className="py-2 text-right font-normal">Chạy tới</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr key={`${row.id}-${row.model}`} className="border-b border-border/60">
                    <td className="py-2 font-mono text-xs text-foreground">
                      {row.id}
                      {row.isActive ? (
                        <span className="ml-2 font-sans text-xs text-accent">đang chạy</span>
                      ) : null}
                      {row.inRegistry ? null : (
                        <span className="ml-2 font-sans text-xs text-muted">
                          không còn trong registry
                        </span>
                      )}
                    </td>
                    <td className="py-2 font-mono text-xs text-muted">
                      {row.model}
                      {row.priced ? null : <span className="ml-1 font-sans">*</span>}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.runs.toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-right tabular-nums">{num(row.avgInputTokens)}</td>
                    <td className="py-2 text-right tabular-nums">{num(row.avgOutputTokens)}</td>
                    <td className="py-2 text-right tabular-nums">{secs(row.latencyP50Ms)}</td>
                    <td className="py-2 text-right tabular-nums">{secs(row.latencyP95Ms)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {row.avgCostVnd === null ? "—" : vnd(row.avgCostVnd)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{vnd(row.costVnd)}</td>
                    <td className="py-2 text-right text-xs text-muted">{day(row.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted">
          <span className="font-mono">(chưa ghi)</span> là những lượt sinh trước khi có cột{" "}
          <span className="font-mono">promptVersion</span>. Lúc thêm cột chỉ backfill được những row
          có token usage — số còn lại không có bằng chứng nào chỉ ra prompt nào đã sinh ra chúng, và
          cũng không có số đo nào để so sánh. Dấu <span className="font-mono">*</span> nghĩa là model
          chưa có trong bảng giá, tiền chỉ là ước lượng.
        </p>
      </Panel>

      {PROMPT_VERSIONS.map((version) => (
        <Panel
          key={version.id}
          title={`${version.id}${version.id === ACTIVE_PROMPT_VERSION.id ? " — đang chạy" : ""}`}
          note={`Phát hành ${version.releasedAt}, model ${version.model}. ${version.notes}`}
        >
          <details className="rounded-xl border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm text-foreground">System instruction</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted">
              {version.systemInstruction}
            </pre>
          </details>
          <details className="rounded-xl border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm text-foreground">
              Prompt mẫu (trải bài giả, không phải dữ liệu người dùng)
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted">
              {version.buildPrompt(SAMPLE_QUESTION, SAMPLE_CARDS)}
            </pre>
          </details>
        </Panel>
      ))}
    </div>
  );
}
