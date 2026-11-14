/** API thật; chỉ dùng câu hỏi giả định. Không đọc/ghi dữ liệu người dùng hoặc trừ credit. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BENCHMARK_CASES } from "../lib/ai/benchmark-cases";
import { generateInterpretation } from "../lib/ai/generate";
import { getAiModel, DEFAULT_AI_MODEL_ID, PROVIDER_API_KEY_ENV } from "../lib/ai/models";
import { getPromptVersion, type PromptVersion } from "../lib/ai/prompts";
import { assessInterpretationQuality, InterpretationValidationError } from "../lib/ai/quality";
import { estimateAiCostVnd } from "../lib/ai/pricing";

export async function main(args: string[]) {
  const baselineId = args.find(a => a.startsWith("--baseline="))?.slice(11) ?? "v4-2026-09-30";
  const candidateId = args.find(a => a.startsWith("--candidate="))?.slice(12) ?? "v5-2026-10-02";
  const baseline = getPromptVersion(baselineId);
  const candidate = getPromptVersion(candidateId);
  if (!baseline) throw new Error(`Unknown baseline prompt ID: ${baselineId}`);
  if (!candidate) throw new Error(`Unknown candidate prompt ID: ${candidateId}`);
  if (baseline.id === candidate.id) throw new Error("Select two distinct prompt IDs");
  const model = getAiModel(args.find(a => a.startsWith("--model="))?.slice(8) ?? DEFAULT_AI_MODEL_ID);
  if (!model) throw new Error("Unknown model");
  if (!process.env[PROVIDER_API_KEY_ENV[model.provider]]) throw new Error(`Missing ${PROVIDER_API_KEY_ENV[model.provider]}`);
  const caseId = args.find(a => a.startsWith("--case="))?.slice(7);
  const cases = caseId ? BENCHMARK_CASES.filter(c => c.id === caseId) : BENCHMARK_CASES;
  if (cases.length === 0) throw new Error("Unknown benchmark case");
  const limit = Number(args.find(a => a.startsWith("--limit="))?.slice(8) ?? BENCHMARK_CASES.length);
  if (!Number.isInteger(limit) || limit < 1 || limit > BENCHMARK_CASES.length) throw new Error(`limit must be 1–${BENCHMARK_CASES.length}`);
  const fixtures = cases.slice(0, limit);
  const dir = path.join(".model-compare", `${baseline.id}-vs-${candidate.id}-${model.id}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "input.json"), JSON.stringify(fixtures, null, 2));
  console.log(`OUTPUT ${dir}`);

  const run = async (fixture: (typeof fixtures)[number], version: PromptVersion) => {
    const start = Date.now();
    const metadata = { caseId: fixture.id, topic: fixture.topic, version: version.id, model: model.id };
    let generated;
    try {
      generated = await generateInterpretation(fixture.question, fixture.cards, version, model);
    } catch (error) {
      const code = error instanceof InterpretationValidationError ? error.code : "provider_error";
      // Không in lỗi SDK: thông báo có thể chứa key hoặc phản hồi thô.
      return { ...metadata, ok: false as const, latencyMs: Date.now() - start, error: code };
    }
    const latencyMs = generated.usage.latencyMs ?? Date.now() - start;
    const quality = generated.quality ?? assessInterpretationQuality(generated.result);
    const costVnd = estimateAiCostVnd({ inputTokens: generated.usage.inputTokens ?? null, outputTokens: generated.usage.outputTokens ?? null, thinkingTokens: generated.usage.thinkingTokens ?? null }, model.id);
    const record = { ...metadata, ok: true as const, latencyMs, usage: generated.usage, costVnd, quality, result: generated.result };
    await writeFile(path.join(dir, `${fixture.id}--${version.id}.json`), JSON.stringify(record, null, 2));
    return record;
  };

  const pairs: Awaited<ReturnType<typeof run>>[][] = [];
  // Tối đa hai request, hai bản của cùng một trường hợp chịu cùng mức tải mạng.
  for (const [index, fixture] of fixtures.entries()) {
    const versions = index % 2 === 0 ? [baseline, candidate] : [candidate, baseline];
    const pair = await Promise.all(versions.map(version => run(fixture, version)));
    pairs.push(pair);
    await writeFile(path.join(dir, "results.json"), JSON.stringify(pairs.flat(), null, 2));
    for (const row of pair) console.log(JSON.stringify({ caseId: row.caseId, version: row.version, ok: row.ok, latencyMs: row.latencyMs, ...(row.ok ? { usage: row.usage, costVnd: row.costVnd } : { error: row.error }) }));
  }
  const blindReview = fixtures.map((fixture, index) => ({
    caseId: fixture.id,
    topic: fixture.topic,
    question: fixture.question,
    cards: fixture.cards.map(({ card, position, orientation }) => ({ name: card.name, position, orientation })),
    reviewExpectation: fixture.reviewExpectation,
    candidates: pairs[index].map((row, candidateIndex) => ({
      label: candidateIndex === 0 ? "A" : "B",
      output: row.ok ? row.result : null,
      scores: {
        specificity: null,
        sharpness: null,
        grounding: null,
        voice: null,
        engagement: null,
        actionability: null,
      },
      flags: {
        genericLanguage: false,
        ungroundedClaim: false,
        repeatedInsight: false,
        unearnedReassurance: false,
        decorativeMetaphor: false,
        safetyOverreach: false,
      },
    })),
    preference: null,
    notes: "",
  }));
  const blindKey = pairs.map(([a, b]) => ({ caseId: a.caseId, A: a.version, B: b.version }));
  await writeFile(path.join(dir, "blind-review.json"), JSON.stringify(blindReview, null, 2));
  await writeFile(path.join(dir, "blind-key.json"), JSON.stringify(blindKey, null, 2));
  const rows = pairs.flat();
  console.log(`COMPLETE ${rows.filter(r => r.ok).length}/${rows.length} ${dir}`);
}
if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof Error ? error.message : "Benchmark failed");
    process.exitCode = 1;
  });
}
