import { afterEach, describe, expect, it, vi } from "vitest";
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import annotations from "./__fixtures__/constraint-reading-development.json";
import controls from "./__fixtures__/constraint-reading-controls.json";
import * as renderer from "./constraint-reading";
import { prepareConstraintReadingExperiment, prepareConstraintReadingReview } from "../../scripts/prepare-constraint-reading-experiment";

const roots: string[] = [];
const source = ".model-compare/controlled-reading-offline-2026-11-21";
const output = ".model-compare/constraints";
const annotationPath = "lib/ai/__fixtures__/constraint-reading-development.json";
const codeFiles = ["lib/ai/prompts/v9.ts", "lib/ai/reading-anchors.ts", "lib/ai/controlled-reading.ts", "lib/tarot/cards.ts", "lib/ai/evidence.ts", "lib/tarot/relations.ts", "lib/ai/prompts/index.ts", "lib/ai/constraint-reading.ts"];
async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), "tarot-constraints-")); roots.push(root);
  for (const file of [...codeFiles, annotationPath]) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await copyFile(file, path.join(root, file));
  }
  await mkdir(path.join(root, source), { recursive: true });
  for (const [name, text] of Object.entries(controls)) await writeFile(path.join(root, source, name), text);
  await mkdir(path.join(root, "docs/benchmarks"), { recursive: true });
  return root;
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("constraint experiment files", () => {
  it("creates four comparisons with source-backed provenance and unchanged controls", async () => {
    const root = await workspace();
    const dir = await prepareConstraintReadingExperiment(root, output);
    const rows = JSON.parse(await readFile(path.join(dir, "results.json"), "utf8"));
    const metadata = JSON.parse(await readFile(path.join(dir, "run.json"), "utf8"));
    expect(rows).toHaveLength(8);
    expect(metadata).toMatchObject({ generationCalls: 0, appliedCount: 4, candidate: renderer.CONSTRAINT_READING_VERSION });
    const oldCases = JSON.parse(controls["holdout-results.json"]).cases;
    for (const c of annotations.cases) {
      const old = rows.find((r: { caseId: string; version: string }) => r.caseId === c.id && r.version === metadata.baseline);
      const candidate = rows.find((r: { caseId: string; version: string }) => r.caseId === c.id && r.version === metadata.candidate);
      expect(old.result).toEqual(oldCases.find((old: { id: string }) => old.id === c.id).output);
      expect(candidate.status).toBe("applied");
      expect(candidate.coverage).toEqual(c.facts.map((f, actionIndex) => ({ factId: f.id, supportRef: "F1", actionIndex })));
      expect(candidate).not.toHaveProperty("usage"); expect(candidate).not.toHaveProperty("sourceUsage"); expect(candidate).not.toHaveProperty("coverageGaps");
      const provenance = metadata.provenance.find((p: { fixtureId: string }) => p.fixtureId === c.id);
      expect(provenance.facts).toEqual(c.facts); expect(provenance.cardSources).toHaveLength(3);
    }
    expect(await readFile(path.join(root, source, "holdout-results.json"), "utf8")).toBe(controls["holdout-results.json"]);
    await expect(prepareConstraintReadingExperiment(root, output)).rejects.toThrow(/^Invalid constraint reading experiment artifacts\.$/);
  });

  it.each(["missing_field", "kind", "span", "duplicate_fact", "missing_control", "duplicate_control", "question", "card", "version", "source", "frozen"])("rejects %s before writing even when last case is invalid", async failure => {
    const root = await workspace();
    const a = structuredClone(annotations), last = a.cases.at(-1)!;
    if (failure === "missing_field") delete (last as Partial<typeof last>).annotationComplete;
    if (failure === "kind") last.facts[0].kind = "unsupported";
    if (failure === "span") last.facts[0].end = 999;
    if (failure === "duplicate_fact") last.facts.push(last.facts[0]);
    if (failure === "question") last.question = "PRIVATE_CHANGED";
    if (failure === "card") last.cards[0].cardId = "the-fool";
    await writeFile(path.join(root, annotationPath), JSON.stringify(a));
    if (failure === "missing_control" || failure === "duplicate_control") {
      const old = JSON.parse(controls["holdout-results.json"]);
      if (failure === "missing_control") old.cases = old.cases.filter((c: { id: string }) => c.id !== last.id);
      else old.cases.push(old.cases.find((c: { id: string }) => c.id === last.id));
      await writeFile(path.join(root, source, "holdout-results.json"), JSON.stringify(old));
    }
    if (failure === "version" || failure === "source") {
      const run = JSON.parse(controls["run.json"]); run.candidateTransformVersion = "PRIVATE_VERSION";
      await writeFile(path.join(root, source, "run.json"), JSON.stringify(run));
    }
    if (failure === "frozen") await writeFile(path.join(root, "lib/ai/controlled-reading.ts"), "PRIVATE_CHANGED");
    await expect(prepareConstraintReadingExperiment(root, output)).rejects.toThrow(/^Invalid constraint reading experiment artifacts\.$/);
    await expect(access(path.join(root, output))).rejects.toThrow();
  });

  it.each(["scope", "incomplete", "excluded"])("records valid %s manifest abstention without rendering", async gate => {
    const root = await workspace(); const a = structuredClone(annotations);
    for (const c of a.cases) {
      if (gate === "scope") c.scopeSupported = false;
      if (gate === "incomplete") c.annotationComplete = false;
      if (gate === "excluded") (c.excludedConstraints as { quote: string; reason: string }[]).push({ quote: c.facts[0].quote, reason: "Not supported" });
    }
    await writeFile(path.join(root, annotationPath), JSON.stringify(a));
    const spy = vi.spyOn(renderer, "renderConstraintReading").mockImplementation(() => { throw new Error("Must not render"); });
    const dir = await prepareConstraintReadingExperiment(root, output);
    expect(spy).not.toHaveBeenCalled();
    const rows = JSON.parse(await readFile(path.join(dir, "results.json"), "utf8"));
    const candidateRows = rows.filter((r: { version: string }) => r.version === renderer.CONSTRAINT_READING_VERSION);
    expect(candidateRows).toHaveLength(4);
    for (const row of candidateRows) {
      expect(row).toMatchObject({ status: "not_applied", origin: "manifest_gate", reason: gate === "scope" ? "unsupported_scope" : "unsupported_constraints" });
      expect(row).not.toHaveProperty("result"); expect(row).not.toHaveProperty("coverage");
      expect(row.coverageGaps.length).toBeGreaterThan(0);
      if (gate === "incomplete") expect(row.coverageGaps).toContainEqual({ reason: "annotation_incomplete" });
      if (gate === "excluded") expect(row.coverageGaps.some((g: { factId?: string }) => !g.factId)).toBe(true);
    }
    await expect(prepareConstraintReadingReview(root, output, "docs/benchmarks/review")).rejects.toThrow();
    await expect(access(path.join(root, "docs/benchmarks/review"))).rejects.toThrow();
  });

  it("abstains for an out-of-context fact without dropping it", async () => {
    const root = await workspace(); const a = structuredClone(annotations); a.cases[0].facts[0].kind = "time_budget";
    await writeFile(path.join(root, annotationPath), JSON.stringify(a));
    const dir = await prepareConstraintReadingExperiment(root, output);
    const rows = JSON.parse(await readFile(path.join(dir, "results.json"), "utf8"));
    const row = rows.find((r: { caseId: string; version: string }) => r.caseId === a.cases[0].id && r.version === renderer.CONSTRAINT_READING_VERSION);
    expect(row).toMatchObject({ origin: "renderer", reason: "unsupported_constraints", status: "not_applied" });
    expect(row.coverageGaps[0].factId).toBe(a.cases[0].facts[0].id); expect(row).not.toHaveProperty("result");
  });

  it("creates four anonymous preference-only pairs and refuses overwrite", async () => {
    const root = await workspace(); await prepareConstraintReadingExperiment(root, output);
    const dir = await prepareConstraintReadingReview(root, output, "docs/benchmarks/review");
    const packets = JSON.parse(await readFile(path.join(dir, "review.json"), "utf8"));
    expect(packets.map((p: { alias: string }) => p.alias)).toEqual(["P1", "P2", "P3", "P4"]);
    const key = JSON.parse(await readFile(path.join(root, output, "review-key.json"), "utf8"));
    expect(key).toHaveLength(4); expect(key.filter((k: { A: string }) => k.A === renderer.CONSTRAINT_READING_VERSION)).toHaveLength(2);
    const publicText = JSON.stringify(packets) + await readFile(path.join(dir, "review.md"), "utf8");
    for (const privateText of [renderer.CONSTRAINT_READING_VERSION, "controlled-reading-offline", "coverage", "provenance", "annotationComplete", "scores"]) expect(publicText).not.toContain(privateText);
    await expect(access(path.join(dir, "review-key.json"))).rejects.toThrow();
    await expect(prepareConstraintReadingReview(root, output, "docs/benchmarks/review")).rejects.toThrow();
  });

  it.each(["annotation", "renderer", "source", "results"])("refuses packets after %s drift", async kind => {
    const root = await workspace(); await prepareConstraintReadingExperiment(root, output);
    const file = kind === "annotation" ? annotationPath : kind === "renderer" ? "lib/ai/constraint-reading.ts" : kind === "source" ? `${source}/run.json` : `${output}/results.json`;
    await writeFile(path.join(root, file), "PRIVATE_CHANGED");
    await expect(prepareConstraintReadingReview(root, output, "docs/benchmarks/review")).rejects.toThrow(/^Invalid constraint reading experiment artifacts\.$/);
    await expect(access(path.join(root, "docs/benchmarks/review"))).rejects.toThrow();
  });

  it("rejects output outside the artifact directory", async () => {
    const root = await workspace();
    await expect(prepareConstraintReadingExperiment(root, "docs/outside")).rejects.toThrow();
    await expect(access(path.join(root, "docs/outside"))).rejects.toThrow();
  });
});
