import { describe, expect, it } from "vitest";
import { buildReviewPackets } from "../../scripts/prepare-benchmark-review";

const output = {
  summary: "Tóm tắt", overview: "Tổng quan", themes: ["Một chủ đề"],
  perCard: ["Bối cảnh", "Hiện tại", "Hướng đi"].map(position => ({ position, keyMessage: "Một ý", text: "Một góc nhìn" })),
  connections: "Liên hệ", actionSuggestions: ["Một bước"], reflectiveQuestion: "Điều gì?", closingNote: "Lời kết",
};
const pair = (index: number) => ({
  caseId: `hidden-case-${index}`, model: "hidden-model", baseline: "hidden-baseline", candidate: "hidden-candidate",
  question: `Câu hỏi ${index}?`, cards: [{ name: "The Fool", position: "Bối cảnh", orientation: "upright" as const }],
  reviewExpectation: "Chỉ dùng dữ kiện đã nêu.",
  results: [
    { version: "hidden-baseline", ok: true, result: output },
    { version: "hidden-candidate", ok: false, error: "timeout" },
  ],
});

describe("blind benchmark packets", () => {
  it("balances labels, preserves failures and maps each output back only through a separate key", () => {
    const { review, key } = buildReviewPackets(Array.from({ length: 8 }, (_, index) => pair(index)));
    expect(review).toHaveLength(8);
    expect(new Set(review.map(item => item.pairId)).size).toBe(8);
    expect(key.filter(item => item.A === "hidden-baseline")).toHaveLength(4);
    expect(JSON.stringify(review)).not.toMatch(/hidden-case|hidden-model|hidden-baseline|hidden-candidate|latencyMs|costVnd/);
    for (const item of review) {
      const mapping = key.find(row => row.pairId === item.pairId)!;
      expect(mapping).toBeDefined();
      for (const candidate of item.candidates) {
        expect(candidate.output).toEqual(mapping[candidate.label] === "hidden-baseline" ? output : null);
        expect(candidate.error).toBe(mapping[candidate.label] === "hidden-candidate" ? "timeout" : null);
        expect(Object.values(candidate.scores)).toEqual([null, null, null, null, null]);
        expect(Object.values(candidate.flags).every(flag => flag === null)).toBe(true);
      }
    }
  });

  it("balances each model/comparison independently and creates fresh anonymous IDs", () => {
    const pairs = [...Array.from({ length: 3 }, (_, i) => pair(i)), ...Array.from({ length: 3 }, (_, i) => ({ ...pair(i + 3), model: "another-model" }))];
    const first = buildReviewPackets(pairs);
    const second = buildReviewPackets(pairs);
    for (const model of ["hidden-model", "another-model"]) {
      const count = first.key.filter(row => row.model === model && row.A === "hidden-baseline").length;
      expect([1, 2]).toContain(count);
    }
    expect(first.review.map(item => item.pairId)).not.toEqual(second.review.map(item => item.pairId));
  });

  it("rejects missing, duplicated or mislabeled outputs instead of silently dropping an arm", () => {
    const missing = { ...pair(0), results: [pair(0).results[0]] };
    const duplicate = { ...pair(0), results: [pair(0).results[0], pair(0).results[0]] };
    const swapped = { ...pair(0), candidate: "not-in-results" };
    for (const invalid of [missing, duplicate, swapped]) {
      expect(() => buildReviewPackets([invalid])).toThrow("Invalid benchmark review pair");
    }
  });
});

it("prepares completed pairs from a stopped run with a separate non-overwritten key", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, readdir, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { main } = await import("../../scripts/prepare-benchmark-review");
  const root = await mkdtemp(join(tmpdir(), "tarot-blind-review-"));
  try {
    const run = join(root, "run");
    const out = join(root, "review");
    const key = join(root, "private-key.json");
    await mkdir(run);
    const input = { id: "hidden-case-0", question: "Câu hỏi 0?", cards: ["Bối cảnh", "Hiện tại", "Hướng đi"].map(position => ({ card: { name: "The Fool" }, position, orientation: "upright" })) };
    await writeFile(join(run, "input.json"), JSON.stringify([input, { ...input, id: "unattempted-case", question: "Câu chưa gọi provider?" }]));
    await writeFile(join(run, "run.json"), JSON.stringify({ baseline: "hidden-baseline", candidate: "hidden-candidate", model: "hidden-model" }));
    await writeFile(join(run, "results.json"), JSON.stringify(pair(0).results.map(row => ({ ...row, caseId: "hidden-case-0", model: "hidden-model" }))));
    await expect(main([`--output=${out}`, `--key=${join(out, "key.json")}`, run])).rejects.toThrow("outside");
    expect(await main([`--output=${out}`, `--key=${key}`, run])).toEqual({ output: out, pairs: 1 });
    expect((await readdir(out)).sort()).toEqual(["review.json", "review.md"]);
    expect(await readFile(join(out, "review.md"), "utf8")).not.toMatch(/hidden-case|hidden-model|hidden-baseline|hidden-candidate|Câu chưa gọi provider/);
    const storedKey = await readFile(key, "utf8");
    await expect(main([`--output=${out}`, `--key=${key}`, run])).rejects.toThrow();
    expect(await readFile(key, "utf8")).toBe(storedKey);
  } finally { await rm(root, { recursive: true, force: true }); }
});
