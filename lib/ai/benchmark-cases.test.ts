import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BENCHMARK_CASES } from "./benchmark-cases";

describe("prompt benchmark cases", () => {
  it("includes twelve style-challenge cases alongside the original corpus", () => {
    expect(BENCHMARK_CASES).toHaveLength(36);
    expect(BENCHMARK_CASES.filter(testCase => testCase.topic === "style-challenge")).toHaveLength(12);
  });
  it("benchmarks v4 against v5 and emits a blind-review manifest", () => {
    const script = readFileSync("scripts/benchmark-prompts.ts", "utf8");
    expect(script).toContain("PROMPT_V5");
    expect(script).toContain('"blind-review.json"');
    expect(script).toContain("BENCHMARK_CASES.length");
  });
});
