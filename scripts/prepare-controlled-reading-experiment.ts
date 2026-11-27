/** Filesystem-only controlled-reading experiment; never generate or charge credits. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BENCHMARK_CASES } from "../lib/ai/benchmark-cases";
import { buildInterpretationEvidence } from "../lib/ai/evidence";
import { InterpretationResultSchema } from "../lib/ai/interpretation";
import { PROMPT_V9 } from "../lib/ai/prompts/v9";
import { CONTROLLED_CARD_SYMBOLS, CONTROLLED_READING_VERSION, renderControlledReading } from "../lib/ai/controlled-reading";
import { buildReviewPackets } from "./prepare-benchmark-review";

const SOURCE = ".model-compare/anchors-offline-2026-11-21";
const BASELINE = "anchors-offline-2026-11-21";
const RENDERER = "lib/ai/controlled-reading.ts";
const TARGETS = [
  { fixtureId: "relation-absent-1", context: "transfer" },
  { fixtureId: "relation-absent-2", context: "restart_drawing" },
  { fixtureId: "relation-weak-3", context: "housework_schedule" },
] as const;
// Pins the already validated v9.1 provenance chain, including original source references.
const PINNED = {
  ".model-compare/anchors-offline-2026-11-21/input.json": "cda5d372247ebcd2c3f8bb938c5debaf0b3054e014a9319444fb337b5dfbe680",
  ".model-compare/anchors-offline-2026-11-21/results.json": "78ac308953ba0d5e14312b2e6f4a41005916c7df682a465d1195fe152952cc2b",
  ".model-compare/anchors-offline-2026-11-21/run.json": "2309120bd7cb6c9211b96d3d93259e858ab40cf245e23d464e17ed412eb2ff68",
  "lib/ai/reading-anchors.ts": "58467f66d2877289d647c0d6d39039d5e272b2b185f737616371e3bf7fbde996",
  "lib/ai/prompts/v9.ts": "3c681f077c786f5a44686ca8efef17b9443f093fc4ea48c13a1420bbb4e34c27",
  "lib/ai/evidence.ts": "d90352e0d78b8efc9c5fcb9e9aa3821b2e99f069db6140cbe4853a682e52ef14",
  "lib/tarot/relations.ts": "ff0d2cdee23108c2c3b914a8bac9c7c385a94b47b9ebafd68ec6f4d7df1f5ddc",
  "lib/tarot/cards.ts": "c1423fbe83daa3419e5a4b68cde5b59d147f709dab9a3698a4b75a4b4c487449"
} as const;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const error = () => new Error("Invalid controlled reading experiment artifacts.");
const rowSchema = z.object({ caseId: z.string(), version: z.string(), model: z.string(), ok: z.literal(true), result: InterpretationResultSchema, sourceUsage: z.unknown().optional() });
const rowsSchema = z.array(rowSchema);
const sourceInputSchema = z.array(z.object({ id: z.string(), question: z.string(), cards: z.array(z.object({ card: z.object({ id: z.string() }), position: z.string(), orientation: z.enum(["upright", "reversed"]) })).length(3) }));
const fingerprint = (cards: { card: { id: string }; position: string; orientation: string }[]) => cards.map(c => ({ cardId: c.card.id, position: c.position, orientation: c.orientation }));

function artifactDirectory(root: string, directory: string) {
  const resolved = path.resolve(root, directory);
  // Experiments are direct children, so nested traversal cannot alias another run.
  if (path.dirname(resolved) !== path.resolve(root, ".model-compare")) throw error();
  return resolved;
}

export async function prepareControlledReadingExperiment(workspaceRoot: string, outputDir: string): Promise<string> {
  try {
    const output = artifactDirectory(workspaceRoot, outputDir);
    const texts: Record<string, string> = {};
    for (const [file, expected] of Object.entries(PINNED)) {
      const text = await readFile(path.join(workspaceRoot, file), "utf8");
      if (hash(text) !== expected) throw error();
      texts[file] = text;
    }
    const sourceRows = rowsSchema.parse(JSON.parse(texts[`${SOURCE}/results.json`]));
    const sourceInputs = sourceInputSchema.parse(JSON.parse(texts[`${SOURCE}/input.json`]));
    const metadata = z.object({ model: z.string(), transformVersion: z.literal(BASELINE), transformHash: z.string() }).parse(JSON.parse(texts[`${SOURCE}/run.json`]));
    if (metadata.transformHash !== PINNED["lib/ai/reading-anchors.ts"]) throw error();
    const sourceHashes = Object.fromEntries(Object.entries(PINNED));
    const rendererHash = hash(await readFile(path.join(workspaceRoot, RENDERER), "utf8"));
    const rows = [], inputs = [], provenance = [];
    for (const target of TARGETS) {
      const fixture = BENCHMARK_CASES.find(c => c.id === target.fixtureId)!;
      const matches = sourceRows.filter(row => row.caseId === fixture.id && row.version === BASELINE);
      const matchingInputs = sourceInputs.filter(c => c.id === fixture.id);
      if (matches.length !== 1 || matchingInputs.length !== 1 || matches[0].model !== metadata.model
        || matchingInputs[0].question !== fixture.question || JSON.stringify(fingerprint(matchingInputs[0].cards)) !== JSON.stringify(fingerprint(fixture.cards))) throw error();
      const control = matches[0];
      const controlQuality = PROMPT_V9.validateResult?.(control.result, fixture.cards);
      const candidate = renderControlledReading(fixture.question, fixture.cards, target.context);
      if (!candidate) { provenance.push({ ...target, status: "not_applied" }); continue; }
      const candidateQuality = PROMPT_V9.validateResult?.(candidate, fixture.cards);
      const evidence = buildInterpretationEvidence(fixture.question, fixture.cards);
      rows.push({ caseId: fixture.id, version: BASELINE, model: metadata.model, ok: true, result: control.result, generationMode: "existing_artifact", sourceUsage: control.sourceUsage });
      rows.push({ caseId: fixture.id, version: CONTROLLED_READING_VERSION, model: metadata.model, ok: true, result: candidate, generationMode: "offline_rendering" });
      inputs.push({ id: fixture.id, question: fixture.question, cards: fixture.cards });
      provenance.push({ ...target, status: "applied", fingerprint: fingerprint(fixture.cards), controlQuality, candidateQuality,
        cardSources: evidence.cards.map((card, i) => ({ supportRef: card.id, cardId: card.cardId, orientation: card.orientation, position: card.position, canonicalMeaning: card.meaning, renderedSymbol: CONTROLLED_CARD_SYMBOLS[target.context][i] })) });
    }
    const inputText = JSON.stringify(inputs, null, 2), resultsText = JSON.stringify(rows, null, 2);
    await mkdir(output);
    await writeFile(path.join(output, "input.json"), inputText, { flag: "wx" });
    await writeFile(path.join(output, "results.json"), resultsText, { flag: "wx" });
    await writeFile(path.join(output, "run.json"), JSON.stringify({
      baseline: BASELINE, candidate: CONTROLLED_READING_VERSION, model: metadata.model, modelRole: "historical_source_model_only",
      sourcePromptVersion: PROMPT_V9.id, controlTransformVersion: BASELINE, candidateTransformVersion: CONTROLLED_READING_VERSION,
      rendererHash, sourceHashes, generationCalls: 0, appliedCount: inputs.length, createdAt: new Date().toISOString(), provenance,
      artifactHashes: { input: hash(inputText), results: hash(resultsText) },
    }, null, 2), { flag: "wx" });
    return output;
  } catch { throw error(); }
}

export async function prepareControlledReadingReview(workspaceRoot: string, experimentDir: string, reviewDir: string): Promise<string> {
  try {
    const experiment = artifactDirectory(workspaceRoot, experimentDir);
    const reviewPath = path.resolve(workspaceRoot, reviewDir);
    if (path.dirname(reviewPath) !== path.resolve(workspaceRoot, "docs/benchmarks")) throw error();
    const inputText = await readFile(path.join(experiment, "input.json"), "utf8");
    const resultsText = await readFile(path.join(experiment, "results.json"), "utf8");
    const metadata = z.object({ baseline: z.literal(BASELINE), candidate: z.literal(CONTROLLED_READING_VERSION), model: z.string(), appliedCount: z.literal(3), rendererHash: z.string(), artifactHashes: z.object({ input: z.string(), results: z.string() }) }).parse(JSON.parse(await readFile(path.join(experiment, "run.json"), "utf8")));
    if (hash(inputText) !== metadata.artifactHashes.input || hash(resultsText) !== metadata.artifactHashes.results
      || hash(await readFile(path.join(workspaceRoot, RENDERER), "utf8")) !== metadata.rendererHash) throw error();
    const inputs = sourceInputSchema.parse(JSON.parse(inputText));
    const rows = rowsSchema.parse(JSON.parse(resultsText));
    if (inputs.length !== 3 || rows.length !== 6 || new Set(inputs.map(c => c.id)).size !== 3) throw error();
    const { review, key } = buildReviewPackets(inputs.map(input => ({
      caseId: input.id, baseline: metadata.baseline, candidate: metadata.candidate, model: metadata.model, question: input.question,
      cards: input.cards.map(c => ({ name: BENCHMARK_CASES.find(b => b.id === input.id)!.cards.find(b => b.card.id === c.card.id)!.card.name, position: c.position, orientation: c.orientation })),
      results: rows.filter(row => row.caseId === input.id && row.model === metadata.model),
    })));
    const packets = review.map((pair, i) => ({ alias: `N${i + 1}`, pairId: pair.pairId, question: pair.question, cards: pair.cards,
      candidates: pair.candidates.map(c => ({ label: c.label, output: c.output })), preference: null }));
    // Create both exclusively: a repeated call must never replace a packet the human has seen.
    await mkdir(reviewPath, { recursive: false });
    await writeFile(path.join(experiment, "review-key.json"), JSON.stringify(key, null, 2), { flag: "wx", mode: 0o600 });
    await writeFile(path.join(reviewPath, "review.json"), JSON.stringify(packets, null, 2), { flag: "wx" });
    await writeFile(path.join(reviewPath, "preferences.json"), JSON.stringify(packets.map(p => ({ alias: p.alias, pairId: p.pairId, preference: null })), null, 2), { flag: "wx" });
    const markdown = ["# Phiếu chọn bài đọc N1–N3", "", "Mỗi cặp chọn A, B hoặc tie. Không cần điểm số. Điền lựa chọn dưới từng cặp trước khi xem khóa phiên bản.", "",
      ...packets.flatMap(p => [`## ${p.alias}`, "", `Pair: ${p.pairId}`, "", `Câu hỏi: ${p.question}`, "", ...p.cards.map(c => `- ${c.position}: ${c.name} (${c.orientation})`), "",
        ...p.candidates.flatMap(c => [`### Bản ${c.label}`, "", "```json", JSON.stringify(c.output, null, 2), "```", ""]), "Ưu tiên (A/B/tie): __", ""]),
    ].join("\n");
    await writeFile(path.join(reviewPath, "review.md"), markdown, { flag: "wx" });
    return reviewPath;
  } catch { throw error(); }
}

if (typeof require !== "undefined" && require.main === module) {
  prepareControlledReadingExperiment(process.cwd(), process.argv[2] ?? ".model-compare/controlled-reading-offline-2026-11-21")
    .then(output => console.log(JSON.stringify({ output, generationCalls: 0 })))
    .catch(() => { console.error("Controlled reading experiment failed; source artifacts were not modified."); process.exitCode = 1; });
}
