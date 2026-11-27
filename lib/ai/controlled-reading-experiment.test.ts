import { afterEach, describe, expect, it } from "vitest";
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import sourceFixture from "./__fixtures__/controlled-reading-controls.json";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { CONTROLLED_CARD_SYMBOLS, CONTROLLED_READING_VERSION, renderControlledReading } from "./controlled-reading";
import { prepareControlledReadingExperiment, prepareControlledReadingReview } from "../../scripts/prepare-controlled-reading-experiment";

const roots: string[] = [];
const source = ".model-compare/anchors-offline-2026-11-21";
const output = ".model-compare/controlled-reading";
const sourceFiles = ["input.json", "results.json", "run.json"].map(name => `${source}/${name}`);
const codeFiles = ["lib/ai/reading-anchors.ts", "lib/ai/prompts/v9.ts", "lib/ai/evidence.ts", "lib/tarot/relations.ts", "lib/tarot/cards.ts", "lib/ai/controlled-reading.ts"];
const targets = [["relation-absent-1", "transfer"], ["relation-absent-2", "restart_drawing"], ["relation-weak-3", "housework_schedule"]] as const;
async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), "tarot-controlled-")); roots.push(root);
  for (const file of codeFiles) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await copyFile(file, path.join(root, file));
  }
  for (const file of sourceFiles) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), sourceFixture[path.basename(file) as keyof typeof sourceFixture]);
  }
  await mkdir(path.join(root, "docs/benchmarks"), { recursive: true });
  return root;
}
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("controlled reading filesystem experiment", () => {
  it("creates six valid rows from pinned controls without carrying their body into candidates", async () => {
    const root = await workspace();
    const before = await readFile(path.join(root, source, "results.json"), "utf8");
    const dir = await prepareControlledReadingExperiment(root, output);
    const rows = JSON.parse(await readFile(path.join(dir, "results.json"), "utf8"));
    const metadata = JSON.parse(await readFile(path.join(dir, "run.json"), "utf8"));
    expect(rows).toHaveLength(6);
    expect(metadata).toMatchObject({ generationCalls: 0, appliedCount: 3, sourcePromptVersion: "v9-2026-11-20", candidateTransformVersion: CONTROLLED_READING_VERSION });
    for (const [id, context] of targets) {
      const fixture = BENCHMARK_CASES.find(c => c.id === id)!;
      const old = JSON.parse(before).find((r: { caseId: string; version: string }) => r.caseId === id && r.version === "anchors-offline-2026-11-21");
      const control = rows.find((r: { caseId: string; version: string }) => r.caseId === id && r.version === old.version);
      const candidate = rows.find((r: { caseId: string; version: string }) => r.caseId === id && r.version === CONTROLLED_READING_VERSION);
      expect(control.result).toEqual(old.result);
      expect(candidate.result).toEqual(renderControlledReading(fixture.question, fixture.cards, context));
      expect(candidate).not.toHaveProperty("usage");
      expect(candidate).not.toHaveProperty("sourceUsage");
      expect(candidate.result.overview).not.toBe(old.result.overview);
      expect(candidate.result.connections).not.toBe(old.result.connections);
      for (let i = 0; i < 3; i++) expect(candidate.result.perCard[i].text).not.toBe(old.result.perCard[i].text);
      const provenance = metadata.provenance.find((p: { fixtureId: string }) => p.fixtureId === id);
      expect(provenance.cardSources.map((c: { renderedSymbol: string }) => c.renderedSymbol)).toEqual(CONTROLLED_CARD_SYMBOLS[context]);
      for (const [i, card] of fixture.cards.entries()) expect(provenance.cardSources[i]).toMatchObject({ supportRef: `C${i + 1}`, canonicalMeaning: card.orientation === "upright" ? card.card.basicMeaning : card.card.reversedMeaning });
    }
    expect(await readFile(path.join(root, source, "results.json"), "utf8")).toBe(before);
    await expect(prepareControlledReadingExperiment(root, output)).rejects.toThrow(/^Invalid controlled reading experiment artifacts\.$/);
  });

  it.each(["missing", "duplicate", "version", "model", "schema", "question", "cards", "manifest", "frozen"])("rejects %s drift before writing", async failure => {
    const root = await workspace();
    const file = path.join(root, source, failure === "question" || failure === "cards" ? "input.json" : failure === "manifest" ? "run.json" : "results.json");
    const data = JSON.parse(await readFile(file, "utf8"));
    if (failure === "missing") data.splice(1, 1);
    if (failure === "duplicate") data.push(data[1]);
    if (failure === "version") data[1].version = "PRIVATE_VERSION";
    if (failure === "model") data[1].model = "PRIVATE_MODEL";
    if (failure === "schema") data[1].result.perCard = [];
    if (failure === "question") data[0].question = "PRIVATE_QUESTION";
    if (failure === "cards") data[0].cards[0].card.id = "the-fool";
    if (failure === "manifest") data.transformHash = "PRIVATE_HASH";
    if (failure === "frozen") await writeFile(path.join(root, "lib/ai/evidence.ts"), "PRIVATE_SOURCE");
    else await writeFile(file, JSON.stringify(data));
    await expect(prepareControlledReadingExperiment(root, output)).rejects.toThrow(/^Invalid controlled reading experiment artifacts\.$/);
    await expect(access(path.join(root, output))).rejects.toThrow();
  });

  it("refuses output outside the artifact directory", async () => {
    const root = await workspace();
    await expect(prepareControlledReadingExperiment(root, "docs/unwanted")).rejects.toThrow(/^Invalid controlled reading experiment artifacts\.$/);
    await expect(access(path.join(root, "docs/unwanted"))).rejects.toThrow();
  });

  it("writes anonymous preference-only packets with a separate key and refuses overwrite", async () => {
    const root = await workspace();
    await prepareControlledReadingExperiment(root, output);
    const reviewDir = "docs/benchmarks/v9-2-review";
    await prepareControlledReadingReview(root, output, reviewDir);
    const review = JSON.parse(await readFile(path.join(root, reviewDir, "review.json"), "utf8"));
    const markdown = await readFile(path.join(root, reviewDir, "review.md"), "utf8");
    const key = JSON.parse(await readFile(path.join(root, output, "review-key.json"), "utf8"));
    expect(review).toHaveLength(3); expect(key).toHaveLength(3);
    expect(new Set(key.map((k: { pairId: string }) => k.pairId))).toEqual(new Set(review.map((r: { pairId: string }) => r.pairId)));
    for (const pair of review) {
      expect(pair.candidates.map((c: { label: string }) => c.label)).toEqual(["A", "B"]);
      expect(pair).not.toHaveProperty("scores");
      expect(pair.candidates[0]).not.toHaveProperty("scores");
    }
    for (const text of [markdown, JSON.stringify(review)]) {
      expect(text).not.toContain(CONTROLLED_READING_VERSION);
      expect(text).not.toContain("anchors-offline");
      expect(text).not.toContain("provenance");
    }
    await expect(access(path.join(root, reviewDir, "review-key.json"))).rejects.toThrow();
    await expect(prepareControlledReadingReview(root, output, reviewDir)).rejects.toThrow();
  });
});
