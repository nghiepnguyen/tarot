import { describe, expect, it } from "vitest";
import { estimateAiCostVnd } from "@/lib/ai/pricing";
import { ACTIVE_PROMPT_VERSION, PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { summarizePromptVersions, type PromptUsageRow } from "./prompt-stats";

const MODEL = ACTIVE_PROMPT_VERSION.model;
const ACTIVE = ACTIVE_PROMPT_VERSION.id;

function row(overrides: Partial<PromptUsageRow> = {}): PromptUsageRow {
  return {
    versionId: ACTIVE,
    model: MODEL,
    runs: 10,
    inputTokens: 12_330,
    outputTokens: 22_080,
    thinkingTokens: 22_860,
    latencyP50Ms: 28_000,
    latencyP95Ms: 41_000,
    reviews: 0,
    avgAccuracy: null,
    avgClarity: null,
    avgActionability: null,
    firstAt: new Date("2026-09-13T00:00:00Z"),
    lastAt: new Date("2026-09-19T00:00:00Z"),
    ...overrides,
  };
}

describe("điểm người đọc chấm", () => {
  it("carries the average and the number of ratings it was averaged over", () => {
    const [summary] = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ runs: 40, reviews: 12, avgAccuracy: 4.25, avgClarity: 3.5, avgActionability: 4 }),
    ]);

    expect(summary.reviews).toBe(12);
    expect(summary.avgAccuracy).toBe(4.25);
    expect(summary.avgClarity).toBe(3.5);
    expect(summary.avgActionability).toBe(4);
  });

  it("leaves the scores null when nobody rated, rather than reading as zero stars", () => {
    // 0 sao đọc như một điểm kém; sự thật chỉ là chưa ai chấm.
    const [summary] = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [row({ runs: 40 })]);

    expect(summary.reviews).toBe(0);
    expect(summary.avgAccuracy).toBeNull();
  });

  it("gives a version that has never run zero ratings, not a missing field", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, []);

    expect(summaries.every((summary) => summary.reviews === 0)).toBe(true);
    expect(summaries.every((summary) => summary.avgClarity === null)).toBe(true);
  });
});

describe("summarizePromptVersions", () => {
  it("averages tokens per run and folds thinking into output", () => {
    const [summary] = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [row()]);

    expect(summary.runs).toBe(10);
    expect(summary.avgInputTokens).toBe(1_233);
    expect(summary.avgOutputTokens).toBe(4_494);
    expect(summary.avgCostVnd).toBe(estimateAiCostVnd({ inputTokens: 1_233, outputTokens: 4_494, thinkingTokens: 0 }, MODEL));
  });

  it("shows a registry version that has never run instead of hiding it", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, []);

    expect(summaries).toHaveLength(PROMPT_VERSIONS.length);
    expect(summaries.every((summary) => summary.runs === 0)).toBe(true);
    expect(summaries.every((summary) => summary.inRegistry)).toBe(true);
  });

  it("keeps a version that is no longer in the registry, flagged as such", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ versionId: "v0-legacy", runs: 4 }),
    ]);
    const legacy = summaries.find((summary) => summary.id === "v0-legacy");

    expect(legacy?.inRegistry).toBe(false);
    expect(legacy?.runs).toBe(4);
  });

  it("gives rows with no promptVersion a line of their own", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ versionId: null, runs: 2 }),
    ]);

    expect(summaries.some((summary) => summary.id === "(chưa ghi)")).toBe(true);
  });

  it("puts the active version first, then the busiest", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ versionId: "v0-legacy", runs: 900 }),
      row({ versionId: ACTIVE, runs: 3 }),
    ]);

    expect(summaries[0].id).toBe(ACTIVE);
    expect(summaries[0].isActive).toBe(true);
    expect(summaries[1].id).toBe("v0-legacy");
  });

  it("leaves averages null when the token columns are null, rather than showing zero", () => {
    const [summary] = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ inputTokens: null, outputTokens: null, thinkingTokens: null, latencyP50Ms: null }),
    ]);

    expect(summary.avgInputTokens).toBeNull();
    expect(summary.avgOutputTokens).toBeNull();
    expect(summary.latencyP50Ms).toBeNull();
    // Chi phí chưa biết, không phải bằng không.
    expect(summary.avgCostVnd).toBeNull();
    expect(summary.costVnd).toBe(0);
  });

  it("flags a model that has no price so the cost column is not read as fact", () => {
    const summaries = summarizePromptVersions(PROMPT_VERSIONS, ACTIVE, [
      row({ versionId: "v0-legacy", model: "model-chua-co-gia" }),
    ]);
    const unpriced = summaries.find((summary) => summary.model === "model-chua-co-gia");

    expect(unpriced?.priced).toBe(false);
  });
});
