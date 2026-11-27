import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { PROMPT_V9 } from "./prompts/v9";
import { prepareAnchorExperiment } from "../../scripts/prepare-anchor-experiment";

const roots: string[] = [];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const ids = ["relation-absent-1", "relation-absent-2", "relation-weak-3"];
const stateNames = ["v9-task4-diagnostic-state.json", "v9-task4-diagnostic-continuation-2026-11-21.json"];

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), "tarot-anchor-experiment-"));
  roots.push(root);
  const sourceHashes: Record<string, string> = {};
  for (const file of ["lib/ai/prompts/v9.ts", "lib/ai/evidence.ts", "lib/tarot/relations.ts", "lib/ai/reading-anchors.ts"]) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await copyFile(path.join(process.cwd(), file), path.join(root, file));
    sourceHashes[file] = hash(await readFile(path.join(root, file), "utf8"));
  }
  const dir = path.join(root, ".model-compare/source-run");
  await mkdir(dir, { recursive: true });
  const fixtures = ids.map(id => BENCHMARK_CASES.find(c => c.id === id)!);
  const results = fixtures.map(fixture => ({
    caseId: fixture.id, version: PROMPT_V9.id, model: "gemini-3.8-flash", ok: true,
    usage: { inputTokens: 100, outputTokens: 200, thinkingTokens: 0 },
    result: {
      summary: "Original summary.", overview: "Original overview.", themes: ["Chủ đề một", "Chủ đề hai", "Chủ đề ba"],
      perCard: fixture.cards.map(card => ({ position: card.position, keyMessage: "Original key message.", text: "Original card body." })),
      connections: "Original connections.", actionSuggestions: ["Bước một", "Bước hai", "Bước ba"], reflectiveQuestion: "Câu hỏi gốc?", closingNote: "Original closing.",
    },
  }));
  await writeFile(path.join(dir, "input.json"), JSON.stringify(fixtures));
  await writeFile(path.join(dir, "results.json"), JSON.stringify(results));
  await writeFile(path.join(dir, "run.json"), JSON.stringify({
    baseline: "v8.1-2026-11-12", candidate: PROMPT_V9.id, model: "gemini-3.8-flash",
    prompts: [{ id: PROMPT_V9.id, systemInstructionHash: hash(PROMPT_V9.systemInstruction), schemaHash: hash(JSON.stringify(PROMPT_V9.responseSchema)) }],
  }));
  for (const [index, name] of stateNames.entries()) {
    await writeFile(path.join(root, ".model-compare", name), JSON.stringify({ sourceHashes, runs: index === 0 ? [".model-compare/source-run"] : [] }));
  }
  return { root, dir, results };
}
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("offline anchor experiment", () => {
  it("creates three valid comparisons, changes only four fields and keeps source data intact", async () => {
    const { root, dir, results } = await workspace();
    const before = await readFile(path.join(dir, "results.json"), "utf8");
    const out = await prepareAnchorExperiment(root, ".model-compare/anchors");
    const output = JSON.parse(await readFile(path.join(out, "results.json"), "utf8"));
    const metadata = JSON.parse(await readFile(path.join(out, "run.json"), "utf8"));
    expect(output).toHaveLength(6);
    expect(metadata).toMatchObject({ generationCalls: 0, sourcePromptVersion: PROMPT_V9.id, transformVersion: "anchors-offline-2026-11-21", appliedCount: 3 });
    expect(metadata.provenance).toHaveLength(3);
    for (const original of results) {
      const control = output.find((row: { caseId: string; version: string }) => row.caseId === original.caseId && row.version === PROMPT_V9.id);
      const variant = output.find((row: { caseId: string; version: string }) => row.caseId === original.caseId && row.version === metadata.transformVersion);
      expect(control.result).toEqual(original.result);
      expect(variant.result.summary).not.toBe(original.result.summary);
      expect(variant.result.perCard.every((c: { keyMessage: string }) => c.keyMessage.endsWith("?"))).toBe(true);
      expect({ ...variant.result, summary: original.result.summary, perCard: variant.result.perCard.map((c: { keyMessage: string }, i: number) => ({ ...c, keyMessage: original.result.perCard[i].keyMessage })) }).toEqual(original.result);
      expect(PROMPT_V9.resultSchema.safeParse(variant.result).success).toBe(true);
      expect(variant).not.toHaveProperty("usage");
      expect(variant.sourceUsage).toEqual(original.usage);
    }
    expect(await readFile(path.join(dir, "results.json"), "utf8")).toBe(before);
    await expect(prepareAnchorExperiment(root, ".model-compare/anchors")).rejects.toThrow();
  });

  it.each(["duplicate", "missing", "question", "cards", "hash"])("refuses %s source evidence without writing output", async failure => {
    const { root, dir, results } = await workspace();
    if (failure === "duplicate") await writeFile(path.join(dir, "results.json"), JSON.stringify([...results, results[0]]));
    if (failure === "missing") await writeFile(path.join(dir, "results.json"), JSON.stringify(results.slice(1)));
    if (failure === "question" || failure === "cards") {
      const input = JSON.parse(await readFile(path.join(dir, "input.json"), "utf8"));
      if (failure === "question") input[0].question = "PRIVATE_MISMATCH";
      else input[0].cards[0].card.id = "the-fool";
      await writeFile(path.join(dir, "input.json"), JSON.stringify(input));
    }
    if (failure === "hash") await writeFile(path.join(root, "lib/ai/evidence.ts"), "PRIVATE_MODIFIED_SOURCE");
    await expect(prepareAnchorExperiment(root, ".model-compare/anchors")).rejects.toThrow(/^Invalid anchor experiment artifacts\.$/);
    await expect(access(path.join(root, ".model-compare/anchors"))).rejects.toThrow();
  });
});
