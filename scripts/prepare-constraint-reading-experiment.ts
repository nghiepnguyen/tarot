/** Filesystem-only experiment. No model, database or credit operations. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getCardById } from "../lib/tarot/cards";
import { parseReadingInput } from "../lib/validation/reading";
import { InterpretationResultSchema } from "../lib/ai/interpretation";
import { PROMPT_V9 } from "../lib/ai/prompts/v9";
import { CONTROLLED_CARD_SYMBOLS } from "../lib/ai/controlled-reading";
import { CONSTRAINT_READING_VERSION, renderConstraintReading, validateConstraintInput, type ConstraintFact, type ConstraintReadingOutcome } from "../lib/ai/constraint-reading";
import { buildReviewPackets } from "./prepare-benchmark-review";

const SOURCE = ".model-compare/controlled-reading-offline-2026-11-21";
const BASELINE = "controlled-reading-offline-2026-11-21";
const ANNOTATION = "lib/ai/__fixtures__/constraint-reading-development.json";
const RENDERER = "lib/ai/constraint-reading.ts";
const TARGETS = ["controlled-holdout-transfer-1", "controlled-holdout-transfer-2", "controlled-holdout-housework-1", "controlled-holdout-housework-2"];
const PINNED = {
  "lib/ai/prompts/v9.ts": "3c681f077c786f5a44686ca8efef17b9443f093fc4ea48c13a1420bbb4e34c27",
  "lib/ai/reading-anchors.ts": "58467f66d2877289d647c0d6d39039d5e272b2b185f737616371e3bf7fbde996",
  "lib/ai/controlled-reading.ts": "e04ac815b5a53c3d648d40d87bffb76234e942e81cad47cefc87e806f242925b",
  "lib/tarot/cards.ts": "c1423fbe83daa3419e5a4b68cde5b59d147f709dab9a3698a4b75a4b4c487449",
  "lib/ai/evidence.ts": "d90352e0d78b8efc9c5fcb9e9aa3821b2e99f069db6140cbe4853a682e52ef14",
  "lib/tarot/relations.ts": "ff0d2cdee23108c2c3b914a8bac9c7c385a94b47b9ebafd68ec6f4d7df1f5ddc",
  "lib/ai/prompts/index.ts": "4eadf72e4e8506d10fb0dae73ef32c8b19d2b43c56caf5c981dd93fdc53fa667",
  ".model-compare/controlled-reading-offline-2026-11-21/holdout-results.json": "abe7d520942047aac866cd1ea73edaf2f90c72d6e7f4e166c7cd3262466dbd58",
  ".model-compare/controlled-reading-offline-2026-11-21/run.json": "22c33ef544afcf572e75fe9a346ed398180259d8455894513c72597516e12efc"
} as const;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const invalid = () => new Error("Invalid constraint reading experiment artifacts.");
const nonempty = z.string().refine(value => value.trim().length > 0);
const cardsSchema = z.array(z.object({ cardId: z.string(), position: z.string(), orientation: z.enum(["upright", "reversed"]) })).length(3);
const manifestSchema = z.object({ annotationProvenance: nonempty, cases: z.array(z.strictObject({
  id: nonempty, question: z.string(), cards: cardsSchema, context: z.enum(["transfer", "housework_schedule"]).nullable(),
  facts: z.array(z.unknown()), scopeSupported: z.boolean(), annotationComplete: z.boolean(),
  excludedConstraints: z.array(z.strictObject({ quote: nonempty, reason: nonempty })),
})) });
const sourceSchema = z.object({ rendererHash: z.string(), cases: z.array(z.object({ id: z.string(), question: z.string(), cards: cardsSchema, output: InterpretationResultSchema.nullable() })) });
type Gap = { factId?: string; quote?: string; reason: string };

function artifactDirectory(root: string, directory: string) {
  const resolved = path.resolve(root, directory);
  if (path.dirname(resolved) !== path.resolve(root, ".model-compare")) throw invalid();
  return resolved;
}
async function pinnedSources(root: string) {
  const texts: Record<string, string> = {};
  for (const [file, expected] of Object.entries(PINNED)) {
    const text = await readFile(path.join(root, file), "utf8");
    if (hash(text) !== expected) throw invalid();
    texts[file] = text;
  }
  return texts;
}

export async function prepareConstraintReadingExperiment(workspaceRoot: string, outputDir: string): Promise<string> {
  try {
    const output = artifactDirectory(workspaceRoot, outputDir);
    const sources = await pinnedSources(workspaceRoot);
    const source = sourceSchema.parse(JSON.parse(sources[`${SOURCE}/holdout-results.json`]));
    const sourceRun = z.object({ candidateTransformVersion: z.literal(BASELINE), rendererHash: z.string(), model: z.string() }).parse(JSON.parse(sources[`${SOURCE}/run.json`]));
    if (source.rendererHash !== sourceRun.rendererHash || sourceRun.rendererHash !== PINNED["lib/ai/controlled-reading.ts"]) throw invalid();
    const annotationText = await readFile(path.join(workspaceRoot, ANNOTATION), "utf8");
    const manifest = manifestSchema.parse(JSON.parse(annotationText));
    if (manifest.cases.length !== 4 || new Set(manifest.cases.map(c => c.id)).size !== 4 || manifest.cases.some(c => !TARGETS.includes(c.id))) throw invalid();
    // Validate the entire run before rendering or creating any output directory.
    const validated = manifest.cases.map(c => {
      const reading = parseReadingInput(c.question, c.cards);
      if (!reading) throw invalid();
      const cards = reading.cards.map(card => ({ card: getCardById(card.cardId)!, position: card.position, orientation: card.orientation }));
      const input = validateConstraintInput(c.question, cards, c.context, c.facts as ConstraintFact[]);
      const matches = source.cases.filter(old => old.id === c.id);
      if (matches.length !== 1 || !matches[0].output || matches[0].question !== c.question
        || JSON.stringify(matches[0].cards) !== JSON.stringify(c.cards)
        || c.excludedConstraints.some(e => !reading.question.includes(e.quote))) throw invalid();
      return { c, cards, input, control: matches[0].output };
    });
    const sourceHashes: Record<string, string> = { ...PINNED, [ANNOTATION]: hash(annotationText), [RENDERER]: hash(await readFile(path.join(workspaceRoot, RENDERER), "utf8")) };
    const rows = [], provenance = [];
    for (const { c, cards, input, control } of validated) {
      const manifestReason = !c.scopeSupported ? "unsupported_scope" : !c.annotationComplete || c.excludedConstraints.length ? "unsupported_constraints" : null;
      const outcome: ConstraintReadingOutcome = manifestReason ? { status: "not_applied", reason: manifestReason } : renderConstraintReading(c.question, cards, c.context, input.facts);
      const shared = { caseId: c.id, model: sourceRun.model };
      rows.push({ ...shared, version: BASELINE, ok: true, status: "applied", result: control, generationMode: "existing_artifact" });
      const controlQuality = PROMPT_V9.validateResult?.(control, cards);
      if (outcome.status === "applied") {
        rows.push({ ...shared, version: CONSTRAINT_READING_VERSION, ok: true, ...outcome, generationMode: "offline_rendering" });
      } else {
        const coverageGaps: Gap[] = [
          ...input.facts.map(f => ({ factId: f.id, quote: f.quote, reason: outcome.reason })),
          ...c.excludedConstraints.map(e => ({ quote: e.quote, reason: e.reason })),
          ...(!c.annotationComplete ? [{ reason: "annotation_incomplete" }] : []),
        ];
        rows.push({ ...shared, version: CONSTRAINT_READING_VERSION, ok: false, ...outcome, origin: manifestReason ? "manifest_gate" : "renderer", coverageGaps });
      }
      provenance.push({ fixtureId: c.id, context: c.context, facts: input.facts, scopeSupported: c.scopeSupported, annotationComplete: c.annotationComplete, excludedConstraints: c.excludedConstraints, status: outcome.status,
        controlQuality, candidateQuality: outcome.status === "applied" ? PROMPT_V9.validateResult?.(outcome.result, cards) : null,
        cardSources: input.evidence.cards.map((card, i) => ({ supportRef: card.id, cardId: card.cardId, position: card.position, orientation: card.orientation, canonicalMeaning: card.meaning, renderedSymbol: c.context ? CONTROLLED_CARD_SYMBOLS[c.context][i] : null })),
      });
    }
    const inputs = validated.map(({ c }) => c);
    const inputText = JSON.stringify(inputs, null, 2), resultsText = JSON.stringify(rows, null, 2);
    await mkdir(output);
    await writeFile(path.join(output, "input.json"), inputText, { flag: "wx" });
    await writeFile(path.join(output, "results.json"), resultsText, { flag: "wx" });
    await writeFile(path.join(output, "run.json"), JSON.stringify({ baseline: BASELINE, candidate: CONSTRAINT_READING_VERSION, model: sourceRun.model, modelRole: "historical_source_model_only",
      sourcePromptVersion: PROMPT_V9.id, controlTransformVersion: BASELINE, candidateTransformVersion: CONSTRAINT_READING_VERSION,
      generationCalls: 0, appliedCount: rows.filter(r => r.version === CONSTRAINT_READING_VERSION && r.ok).length,
      sourceHashes, annotationProvenance: manifest.annotationProvenance, provenance, createdAt: new Date().toISOString(), artifactHashes: { input: hash(inputText), results: hash(resultsText) },
    }, null, 2), { flag: "wx" });
    return output;
  } catch { throw invalid(); }
}

const reviewRowSchema = z.object({ caseId: z.string(), version: z.string(), model: z.string(), ok: z.literal(true), status: z.literal("applied"), result: InterpretationResultSchema });
export async function prepareConstraintReadingReview(workspaceRoot: string, experimentDir: string, reviewDir: string): Promise<string> {
  try {
    const experiment = artifactDirectory(workspaceRoot, experimentDir);
    const reviewPath = path.resolve(workspaceRoot, reviewDir);
    if (path.dirname(reviewPath) !== path.resolve(workspaceRoot, "docs/benchmarks")) throw invalid();
    await pinnedSources(workspaceRoot);
    const inputText = await readFile(path.join(experiment, "input.json"), "utf8"), resultsText = await readFile(path.join(experiment, "results.json"), "utf8");
    const meta = z.object({ baseline: z.literal(BASELINE), candidate: z.literal(CONSTRAINT_READING_VERSION), model: z.string(), appliedCount: z.literal(4), sourceHashes: z.record(z.string(), z.string()), artifactHashes: z.object({ input: z.string(), results: z.string() }) }).parse(JSON.parse(await readFile(path.join(experiment, "run.json"), "utf8")));
    if (hash(inputText) !== meta.artifactHashes.input || hash(resultsText) !== meta.artifactHashes.results) throw invalid();
    for (const file of [ANNOTATION, RENDERER]) if (hash(await readFile(path.join(workspaceRoot, file), "utf8")) !== meta.sourceHashes[file]) throw invalid();
    const inputs = manifestSchema.shape.cases.parse(JSON.parse(inputText));
    const rows = z.array(reviewRowSchema).length(8).parse(JSON.parse(resultsText));
    if (inputs.length !== 4 || new Set(inputs.map(c => c.id)).size !== 4 || inputs.some(c => !TARGETS.includes(c.id))) throw invalid();
    const { review, key } = buildReviewPackets(inputs.map(c => ({ caseId: c.id, model: meta.model, baseline: BASELINE, candidate: CONSTRAINT_READING_VERSION, question: c.question,
      cards: c.cards.map(card => ({ name: getCardById(card.cardId)!.name, position: card.position, orientation: card.orientation })),
      results: rows.filter(row => row.caseId === c.id && row.model === meta.model),
    })));
    const packets = review.map((pair, i) => ({ alias: `P${i + 1}`, pairId: pair.pairId, question: pair.question, cards: pair.cards,
      candidates: pair.candidates.map(c => ({ label: c.label, output: c.output })), preference: null }));
    await mkdir(reviewPath);
    await writeFile(path.join(experiment, "review-key.json"), JSON.stringify(key, null, 2), { flag: "wx", mode: 0o600 });
    await writeFile(path.join(reviewPath, "review.json"), JSON.stringify(packets, null, 2), { flag: "wx" });
    await writeFile(path.join(reviewPath, "preferences.json"), JSON.stringify(packets.map(p => ({ alias: p.alias, pairId: p.pairId, preference: null })), null, 2), { flag: "wx" });
    const markdown = ["# Phiếu chọn bài đọc P1–P4", "", "Mỗi cặp chọn A, B hoặc tie. Không cần điểm số. Điền lựa chọn trước khi xem khóa phiên bản.", "",
      ...packets.flatMap(p => [`## ${p.alias}`, "", `Pair: ${p.pairId}`, "", `Câu hỏi: ${p.question}`, "", ...p.cards.map(c => `- ${c.position}: ${c.name} (${c.orientation})`), "",
        ...p.candidates.flatMap(c => [`### Bản ${c.label}`, "", "```json", JSON.stringify(c.output, null, 2), "```", ""]), "Ưu tiên (A/B/tie): __", ""]),
    ].join("\n");
    await writeFile(path.join(reviewPath, "review.md"), markdown, { flag: "wx" });
    return reviewPath;
  } catch { throw invalid(); }
}

if (typeof require !== "undefined" && require.main === module) {
  prepareConstraintReadingExperiment(process.cwd(), process.argv[2] ?? ".model-compare/constraint-reading-offline-2026-11-22")
    .then(output => console.log(JSON.stringify({ output, generationCalls: 0 })))
    .catch(() => { console.error("Constraint experiment failed; sources were not modified."); process.exitCode = 1; });
}
