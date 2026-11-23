/** Filesystem-only spike. Never generate, charge credits or overwrite source artifacts. */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BENCHMARK_CASES } from "../lib/ai/benchmark-cases";
import { buildInterpretationEvidence } from "../lib/ai/evidence";
import { PROMPT_V9 } from "../lib/ai/prompts/v9";
import { READING_ANCHORS_VERSION, renderReadingAnchors, type ReadingAnchorContext } from "../lib/ai/reading-anchors";

const TARGETS: { fixtureId: string; context: ReadingAnchorContext }[] = [
  { fixtureId: "relation-absent-1", context: "transfer" },
  { fixtureId: "relation-absent-2", context: "restart_drawing" },
  { fixtureId: "relation-weak-3", context: "housework_schedule" },
];
const FROZEN_SOURCES = ["lib/ai/prompts/v9.ts", "lib/ai/evidence.ts", "lib/tarot/relations.ts"];
const STATES = ["v9-task4-diagnostic-state.json", "v9-task4-diagnostic-continuation-2026-11-21.json"];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const stateSchema = z.object({ sourceHashes: z.record(z.string(), z.string()), runs: z.array(z.string()) });
const inputSchema = z.array(z.object({
  id: z.string(), question: z.string(),
  cards: z.array(z.object({ card: z.object({ id: z.string() }), position: z.string(), orientation: z.enum(["upright", "reversed"]) })).length(3),
}));
const rowsSchema = z.array(z.object({ caseId: z.string(), version: z.string(), model: z.string(), ok: z.boolean(), result: z.unknown().optional(), usage: z.unknown().optional() }));
const runSchema = z.object({ candidate: z.string(), model: z.string(), prompts: z.array(z.object({ id: z.string(), systemInstructionHash: z.string(), schemaHash: z.string() })) });

function artifactDirectory(root: string, directory: string) {
  const resolved = path.resolve(root, directory);
  const relative = path.relative(path.resolve(root, ".model-compare"), resolved);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Invalid anchor experiment artifacts.");
  return resolved;
}

export async function prepareAnchorExperiment(workspaceRoot: string, outputDir: string): Promise<string> {
  const records = [];
  const inputs = [];
  const provenance = [];
  let model = "";
  let transformHash = "";
  try {
    const sourceHashes = Object.fromEntries(await Promise.all(FROZEN_SOURCES.map(async file => [file, hash(await readFile(path.join(workspaceRoot, file), "utf8"))])));
    transformHash = hash(await readFile(path.join(workspaceRoot, "lib/ai/reading-anchors.ts"), "utf8"));
    const runs = [];
    for (const stateFile of STATES) {
      const state = stateSchema.parse(JSON.parse(await readFile(path.join(workspaceRoot, ".model-compare", stateFile), "utf8")));
      if (FROZEN_SOURCES.some(file => state.sourceHashes[file] !== sourceHashes[file])) throw new Error("Source drift");
      for (const run of state.runs) {
        const dir = artifactDirectory(workspaceRoot, run);
        const sourceInput = await readFile(path.join(dir, "input.json"), "utf8");
        const sourceResults = await readFile(path.join(dir, "results.json"), "utf8");
        const sourceRun = await readFile(path.join(dir, "run.json"), "utf8");
        const metadata = runSchema.parse(JSON.parse(sourceRun));
        const fingerprint = metadata.prompts.find(prompt => prompt.id === PROMPT_V9.id);
        if (metadata.candidate !== PROMPT_V9.id || fingerprint?.systemInstructionHash !== hash(PROMPT_V9.systemInstruction)
          || fingerprint.schemaHash !== hash(JSON.stringify(PROMPT_V9.responseSchema))) throw new Error("Prompt mismatch");
        runs.push({ dir, inputs: inputSchema.parse(JSON.parse(sourceInput)), rows: rowsSchema.parse(JSON.parse(sourceResults)), metadata,
          sourceHashes: { input: hash(sourceInput), results: hash(sourceResults), run: hash(sourceRun) } });
      }
    }

    for (const target of TARGETS) {
      const fixture = BENCHMARK_CASES.find(fixture => fixture.id === target.fixtureId)!;
      const matches = runs.flatMap(run => run.rows.filter(row => row.caseId === target.fixtureId && row.version === PROMPT_V9.id).map(row => ({ run, row })));
      if (matches.length !== 1) throw new Error("Missing or duplicate source");
      const { run, row } = matches[0];
      const sourceInputs = run.inputs.filter(input => input.id === target.fixtureId);
      if (sourceInputs.length !== 1 || sourceInputs[0].question !== fixture.question || !row.ok || row.model !== run.metadata.model) throw new Error("Invalid source");
      const sourceCards = sourceInputs[0].cards.map(({ card, position, orientation }) => ({ cardId: card.id, position, orientation }));
      const expectedCards = fixture.cards.map(({ card, position, orientation }) => ({ cardId: card.id, position, orientation }));
      if (JSON.stringify(sourceCards) !== JSON.stringify(expectedCards)) throw new Error("Card mismatch");
      if (model && model !== row.model) throw new Error("Mixed source models");
      model = row.model;
      const control = PROMPT_V9.resultSchema.parse(row.result);
      const controlQuality = PROMPT_V9.validateResult?.(control, fixture.cards);
      const anchors = renderReadingAnchors(fixture.question, fixture.cards, target.context);
      const base = { fixtureId: fixture.id, context: target.context, sourcePath: path.relative(workspaceRoot, path.join(run.dir, "results.json")),
        sourceHashes: run.sourceHashes, fingerprint: expectedCards, sourcePromptVersion: PROMPT_V9.id, transformVersion: READING_ANCHORS_VERSION, transformHash };
      if (!anchors) { provenance.push({ ...base, status: "not_applied", changedFields: [] }); continue; }
      const transformed = { ...control, summary: anchors.summary, perCard: control.perCard.map((card, index) => ({ ...card, keyMessage: anchors.keyMessages[index] })) };
      PROMPT_V9.resultSchema.parse(transformed);
      const transformedQuality = PROMPT_V9.validateResult?.(transformed, fixture.cards);
      const evidence = buildInterpretationEvidence(fixture.question, fixture.cards);
      inputs.push({ ...fixture, reviewExpectation: "Đánh giá summary và ba keyMessage theo dữ kiện câu hỏi; ghi riêng lỗi/mâu thuẫn còn lại trong body và mức liên quan tới lá. Human chỉ cần chọn A/B/tie." });
      for (const variant of [{ version: PROMPT_V9.id, result: control, mode: "existing_artifact" }, { version: READING_ANCHORS_VERSION, result: transformed, mode: "offline_transform" }]) {
        records.push({ caseId: fixture.id, version: variant.version, model, ok: true, result: variant.result,
          generationMode: variant.mode, sourcePromptVersion: PROMPT_V9.id, sourceUsage: row.usage });
      }
      provenance.push({ ...base, status: "applied", facts: evidence.facts,
        changedFields: ["summary", "perCard[0].keyMessage", "perCard[1].keyMessage", "perCard[2].keyMessage"], controlQuality, transformedQuality });
    }
  } catch { throw new Error("Invalid anchor experiment artifacts."); }

  const output = artifactDirectory(workspaceRoot, outputDir);
  await mkdir(output);
  await writeFile(path.join(output, "input.json"), JSON.stringify(inputs, null, 2));
  await writeFile(path.join(output, "results.json"), JSON.stringify(records, null, 2));
  await writeFile(path.join(output, "run.json"), JSON.stringify({
    baseline: PROMPT_V9.id, candidate: READING_ANCHORS_VERSION, model, modelRole: "source_generation_model",
    createdAt: new Date().toISOString(), sourcePromptVersion: PROMPT_V9.id, transformVersion: READING_ANCHORS_VERSION,
    transformHash, generationCalls: 0, appliedCount: inputs.length, provenance,
  }, null, 2));
  return output;
}

if (typeof require !== "undefined" && require.main === module) {
  if (!process.argv[2]) { console.error("Use an output directory under .model-compare/."); process.exitCode = 1; }
  else prepareAnchorExperiment(process.cwd(), process.argv[2]).then(output => console.log(JSON.stringify({ output, generationCalls: 0 }))).catch(() => {
    console.error("Anchor experiment failed; source artifacts were not modified."); process.exitCode = 1;
  });
}
