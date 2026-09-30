/** API thật; chỉ dùng câu hỏi giả định. Không đọc/ghi dữ liệu người dùng hoặc trừ credit. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BENCHMARK_CASES } from "../lib/ai/benchmark-cases";
import { generateInterpretation } from "../lib/ai/generate";
import { getAiModel, DEFAULT_AI_MODEL_ID, PROVIDER_API_KEY_ENV } from "../lib/ai/models";
import { PROMPT_V3 } from "../lib/ai/prompts/v3";
import { PROMPT_V4 } from "../lib/ai/prompts/v4";
import { assessInterpretationQuality, InterpretationValidationError } from "../lib/ai/quality";
import { estimateAiCostVnd } from "../lib/ai/pricing";

async function main() {
  const args = process.argv.slice(2);
  const model = getAiModel(args.find(a => a.startsWith("--model="))?.slice(8) ?? DEFAULT_AI_MODEL_ID);
  if (!model) throw new Error("Unknown model");
  if (!process.env[PROVIDER_API_KEY_ENV[model.provider]]) throw new Error(`Missing ${PROVIDER_API_KEY_ENV[model.provider]}`);
  const caseId = args.find(a => a.startsWith("--case="))?.slice(7);
  const cases = caseId ? BENCHMARK_CASES.filter(c => c.id === caseId) : BENCHMARK_CASES;
  if (cases.length === 0) throw new Error("Unknown benchmark case");
  const limit = Number(args.find(a => a.startsWith("--limit="))?.slice(8) ?? 24);
  if (!Number.isInteger(limit) || limit < 1 || limit > 24) throw new Error("limit must be 1–24");
  const dir = path.join(".model-compare", `v4-${model.id}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "input.json"), JSON.stringify(cases.slice(0, limit), null, 2));
  console.log(`OUTPUT ${dir}`);
  const rows: Record<string, unknown>[] = [];
  // Tối đa hai request, hai bản của cùng một trường hợp chịu cùng mức tải mạng.
  for (const fixture of cases.slice(0, limit)) {
    const versions = rows.length % 4 === 0 ? [PROMPT_V3, PROMPT_V4] : [PROMPT_V4, PROMPT_V3];
    const pair = await Promise.all(versions.map(async version => {
      const start = Date.now();
      try {
        const generated = await generateInterpretation(fixture.question, fixture.cards, version, model);
        const quality = generated.quality ?? assessInterpretationQuality(generated.result);
        const costVnd = estimateAiCostVnd({ inputTokens: generated.usage.inputTokens ?? null, outputTokens: generated.usage.outputTokens ?? null, thinkingTokens: generated.usage.thinkingTokens ?? null }, model.id);
        const record = { caseId: fixture.id, topic: fixture.topic, version: version.id, model: model.id, ok: true as const, usage: generated.usage, costVnd, quality, result: generated.result };
        await writeFile(path.join(dir, `${fixture.id}--${version.id}.json`), JSON.stringify(record, null, 2));
        return record;
      } catch (error) {
        const code = error instanceof InterpretationValidationError ? error.code : "provider_error";
        // Không in lỗi SDK: thông báo có thể chứa key hoặc phản hồi thô.
        return { caseId: fixture.id, topic: fixture.topic, version: version.id, model: model.id, ok: false as const, latencyMs: Date.now() - start, error: code };
      }
    }));
    rows.push(...pair);
    await writeFile(path.join(dir, "results.json"), JSON.stringify(rows, null, 2));
    for (const row of pair) console.log(JSON.stringify({ caseId: row.caseId, version: row.version, ok: row.ok, ...(row.ok ? { usage: row.usage, costVnd: row.costVnd } : { error: row.error, latencyMs: row.latencyMs }) }));
  }
  console.log(`COMPLETE ${rows.filter(r => r.ok).length}/${rows.length} ${dir}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Benchmark failed"); process.exitCode = 1; });
