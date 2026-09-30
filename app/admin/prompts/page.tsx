import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Panel, EmptyRow } from "@/components/admin/Panel";
import { ACTIVE_PROMPT_VERSION, PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { getModelPricing, isPricedModel } from "@/lib/ai/pricing";
import { AI_MODELS, RANDOM_AI_MODEL_LABEL, RANDOM_AI_MODEL_VALUE } from "@/lib/ai/models";
import { getActiveAiSelection, getMissingApiKeyEnvs } from "@/lib/ai/settings";
import { AiModelForm } from "@/components/admin/AiModelForm";
import { fetchPromptUsage, summarizePromptVersions } from "@/lib/admin/prompt-stats";
import { fetchQualitySummary } from "@/lib/admin/quality-stats";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "@/lib/ai/interpretation";
import { ChevronDown } from "lucide-react";

const vnd = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const num = (value: number | null) => (value === null ? "—" : value.toLocaleString("vi-VN"));
const secs = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)}s`);
const stars = (value: number | null) => (value === null ? "—" : value.toFixed(1));
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
 * Prompt chỉ đọc, model thì sửa được.
 *
 * Prompt cột chặt vào JSON schema gửi cho model và vào schema parse lại kết
 * quả, và nó chứa cả ràng buộc an toàn. Sửa nó bằng một ô textarea trên web
 * thì bỏ qua được cả hai, nên đổi prompt vẫn đi qua code review và deploy.
 *
 * Model thì khác: đổi model không đổi hợp đồng đầu ra — mọi lượt sinh đều parse
 * lại bằng cùng `resultSchema` — mà lại là thứ cần lùi trong vài phút khi một
 * nhà cung cấp hỏng hoặc đội giá.
 * Nên nó nằm trong database, chọn từ một danh sách cho phép trong code.
 */
export default async function AdminPromptsPage() {
  await requireAdmin();

  const [usage, selection, quality] = await Promise.all([
    fetchPromptUsage(prisma),
    getActiveAiSelection(),
    fetchQualitySummary(prisma),
  ]);
  const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE_PROMPT_VERSION.id, usage);
  const isRandom = selection.kind === "random";
  const activeId = isRandom ? RANDOM_AI_MODEL_VALUE : selection.model.id;
  // Ở chế độ ngẫu nhiên không có "model đang chạy" để tra giá: lượt tới có thể
  // là bất kỳ model nào trong danh sách.
  const activePricing = isRandom ? null : getModelPricing(selection.model.id);
  // Key đọc ở đây, trên máy chủ, và chỉ *tên biến* đi xuống trình duyệt: người
  // chọn model phải biết ngay máy chủ này có gọi nổi model đó không, chứ không
  // phát hiện ra ở lượt mở khóa đầu tiên của một người dùng thật.
  const modelOptions = [
    ...AI_MODELS.map((model) => ({
      id: model.id,
      label: `${model.label} — ${model.persona}`,
      note: model.note,
      priced: isPricedModel(model.id),
      missingKeys: getMissingApiKeyEnvs([model]),
    })),
    {
      id: RANDOM_AI_MODEL_VALUE,
      label: `${RANDOM_AI_MODEL_LABEL} (${AI_MODELS.map((m) => m.persona).join(" / ")})`,
      note: "Mỗi lượt mở khóa bốc một model, xác suất đều. Người đọc chỉ thấy bút danh, nên điểm họ chấm ở cuối bài là điểm chấm mù — đó là cách duy nhất so được chất lượng hai model trên cùng một tập câu hỏi thật.",
      priced: AI_MODELS.every((model) => isPricedModel(model.id)),
      missingKeys: getMissingApiKeyEnvs(AI_MODELS),
    },
  ];
  const activeMissingKeys = getMissingApiKeyEnvs(
    isRandom ? AI_MODELS : [selection.model],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Prompt và model</h1>
        <p className="text-sm text-muted">
          Đổi model có hiệu lực ngay. Prompt chỉ đọc; phát hành phiên bản mới qua code review và deploy.
        </p>
      </div>

      <Panel
        title="Bản đang chạy"
        note="Mọi lượt mở khóa đều đi qua đúng cặp prompt và model này, và ghi cả hai vào AiInterpretation — nên số đo trước và sau một lần đổi model không lẫn vào nhau."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted">Prompt</dt>
            <dd className="font-mono text-sm text-foreground">{ACTIVE_PROMPT_VERSION.id}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted">Model</dt>
            <dd className="font-mono text-sm text-foreground">
              {isRandom ? RANDOM_AI_MODEL_VALUE : selection.model.id}
              {isRandom ? (
                <span className="ml-2 font-sans text-xs text-muted">
                  mỗi lượt bốc một model trong {AI_MODELS.length}
                </span>
              ) : null}
              {isRandom || selection.model.id === ACTIVE_PROMPT_VERSION.model ? null : (
                <span className="ml-2 font-sans text-xs text-muted">
                  khác mặc định của bản prompt ({ACTIVE_PROMPT_VERSION.model})
                </span>
              )}
              {isRandom || activePricing ? null : (
                <span className="ml-2 font-sans text-xs text-muted">chưa có trong bảng giá</span>
              )}
            </dd>
          </div>
        </dl>
        {activeMissingKeys.length > 0 ? (
          <p className="text-xs text-red-600">
            Máy chủ này chưa có {activeMissingKeys.join(", ")}.{" "}
            {isRandom
              ? "Lượt nào bốc trúng model thiếu key sẽ báo lỗi và hoàn credit — nhìn từ bảng số đo thì trông như model đó chập chờn, không như một biến môi trường còn thiếu."
              : "Mọi lượt mở khóa đang báo lỗi và hoàn credit."}
          </p>
        ) : null}
        <p className="text-xs text-muted">
          {isRandom
            ? `Đang bốc ngẫu nhiên giữa ${AI_MODELS.map((model) => `${model.label} (${model.persona})`).join(" và ")}. Mỗi lượt sinh vẫn ghi đúng model đã chạy, nên bảng bên dưới tách được số đo của từng model.`
            : activePricing
              ? `Giá đang dùng để tính tiền: ${activePricing.note}`
              : "Model này chưa có giá trong lib/ai/pricing.ts, nên mọi con số tiền bên dưới và trên trang Tổng quan đều là ước lượng tính bằng giá mặc định."}
        </p>
      </Panel>

      <Panel
        title="Đổi model"
        note="Có hiệu lực ngay với lượt mở khóa tiếp theo, không cần deploy. Lượt đã sinh giữ nguyên model của chính nó. Mỗi lần đổi ghi một dòng vào Nhật ký."
      >
        <AiModelForm currentId={activeId} options={modelOptions} />
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
                  <th className="py-2 text-right font-normal">Chấm</th>
                  <th className="py-2 text-right font-normal">Acc</th>
                  <th className="py-2 text-right font-normal">Cla</th>
                  <th className="py-2 text-right font-normal">Act</th>
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
                      {row.reviews.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 text-right tabular-nums">{stars(row.avgAccuracy)}</td>
                    <td className="py-2 text-right tabular-nums">{stars(row.avgClarity)}</td>
                    <td className="py-2 text-right tabular-nums">{stars(row.avgActionability)}</td>
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
          chưa có trong bảng giá, tiền chỉ là ước lượng. <span className="font-mono">Chấm</span> là
          số lượt người đọc đã chấm điểm, còn <span className="font-mono">Acc</span>/
          <span className="font-mono">Cla</span>/<span className="font-mono">Act</span> là điểm
          trung bình trên chính những lượt đó — độ chính xác, độ rõ ràng, tính hữu ích, thang 5
          sao. Đọc hai con số cùng nhau: 5,0 trên một lượt chấm không nói gì.
        </p>
      </Panel>

      <Panel title="Chất lượng đầu ra" note="Đếm các lượt gọi model kể từ khi bật đo lường, gồm lượt lỗi. Cảnh báo độ dài/lặp câu là kiểm tra cơ học, không phải điểm văn phong; chỉ v4 có cảnh báo biên tập. Không lưu câu hỏi hay nội dung vào số đo.">
        {quality.length === 0 ? <EmptyRow>Chưa có số đo chất lượng.</EmptyRow> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted">
                {["Prompt", "Model", "Lượt gọi", "Thành công", "JSON/schema", "Vị trí", "Nhà cung cấp", "Độ dài", "Lặp nội dung"].map(label => <th key={label} className="px-2 py-2 font-normal">{label}</th>)}
              </tr></thead>
              <tbody>{quality.map(row => <tr key={`${row.promptVersion}-${row.model}`} className="border-b border-border/60">
                <td className="px-2 py-2 font-mono text-xs">{row.promptVersion}</td><td className="px-2 py-2 font-mono text-xs">{row.model}</td>
                <td className="px-2 py-2">{row.attempts}</td><td className="px-2 py-2">{row.successes}/{row.attempts}</td>
                {[row.schemaErrors, row.positionErrors, row.providerErrors].map((count, i) => <td key={i} className="px-2 py-2">{count}/{row.attempts}</td>)}
                {[row.lengthWarnings, row.duplicateWarnings].map((count, i) => <td key={i} className="px-2 py-2">{row.promptVersion.startsWith("v4-") && row.successes > 0 ? `${count}/${row.successes}` : "—"}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title={`Các phiên bản prompt (${PROMPT_VERSIONS.length})`}
        note="Chọn một phiên bản để xem ghi chú và nội dung. Prompt mẫu dùng trải bài giả."
      >
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {[...PROMPT_VERSIONS]
            .sort((a, b) => Number(b.id === ACTIVE_PROMPT_VERSION.id) - Number(a.id === ACTIVE_PROMPT_VERSION.id))
            .map((version) => (
              <details key={version.id} name="prompt-version" className="group/version">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                  <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="break-all font-mono text-xs text-foreground">{version.id}</span>
                      {version.id === ACTIVE_PROMPT_VERSION.id ? (
                        <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Đang chạy</span>
                      ) : null}
                    </span>
                    <span className="text-xs tabular-nums text-muted">
                      <span className="sm:hidden">Phát hành </span>{version.releasedAt}
                    </span>
                    <span className="break-all font-mono text-xs text-muted">{version.model}</span>
                  </div>
                  <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open/version:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 border-t border-border bg-background/50 p-4">
                  <p className="text-sm leading-relaxed text-muted">{version.notes}</p>
                  <details className="rounded-lg border border-border bg-surface px-3 py-2.5">
                    <summary className="cursor-pointer text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent">System instruction</summary>
                    <pre tabIndex={0} aria-label={`System instruction của ${version.id}`} className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-relaxed text-muted focus-visible:outline-2 focus-visible:outline-accent">
                      {version.systemInstruction}
                    </pre>
                  </details>
                  <details className="rounded-lg border border-border bg-surface px-3 py-2.5">
                    <summary className="cursor-pointer text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent">Prompt mẫu</summary>
                    <pre tabIndex={0} aria-label={`Prompt mẫu của ${version.id}`} className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-relaxed text-muted focus-visible:outline-2 focus-visible:outline-accent">
                      {version.buildPrompt(SAMPLE_QUESTION, SAMPLE_CARDS)}
                    </pre>
                  </details>
                </div>
              </details>
            ))}
        </div>
      </Panel>
    </div>
  );
}
