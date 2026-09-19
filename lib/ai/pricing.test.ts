import { describe, expect, it } from "vitest";
import {
  estimateAiCostVnd,
  getModelPricing,
  isPricedModel,
  sumAiCostVnd,
} from "./pricing";

const GEMINI = "gemini-3-flash-preview";

describe("estimateAiCostVnd", () => {
  it("matches the hand-measured ~365đ per unlock", () => {
    // Đo ngày 13/09/2026: input 1.233, output + thinking 4.494.
    const cost = estimateAiCostVnd(
      { inputTokens: 1_233, outputTokens: 2_208, thinkingTokens: 2_286 },
      GEMINI,
    );
    expect(cost).toBeGreaterThan(340);
    expect(cost).toBeLessThan(390);
  });

  it("prices thinking tokens like output tokens", () => {
    const asOutput = estimateAiCostVnd(
      { inputTokens: 0, outputTokens: 1_000, thinkingTokens: 0 },
      GEMINI,
    );
    const asThinking = estimateAiCostVnd(
      { inputTokens: 0, outputTokens: 0, thinkingTokens: 1_000 },
      GEMINI,
    );
    expect(asThinking).toBe(asOutput);
  });

  it("treats null sums as zero — the columns are nullable by design", () => {
    expect(
      estimateAiCostVnd(
        { inputTokens: null, outputTokens: null, thinkingTokens: null },
        GEMINI,
      ),
    ).toBe(0);
    expect(
      estimateAiCostVnd({ inputTokens: 1_233, outputTokens: null, thinkingTokens: null }, GEMINI),
    ).toBeGreaterThan(0);
  });

  it("still returns a number for a model with no price, so the dashboard never blanks out", () => {
    const sums = { inputTokens: 1_233, outputTokens: 2_208, thinkingTokens: 2_286 };
    expect(isPricedModel("model-chua-co-gia")).toBe(false);
    expect(estimateAiCostVnd(sums, "model-chua-co-gia")).toBe(estimateAiCostVnd(sums, GEMINI));
  });
});

describe("getModelPricing", () => {
  it("prices the model the active prompt version runs on", () => {
    expect(getModelPricing(GEMINI)).not.toBeNull();
  });

  it("returns null for an unknown model instead of guessing silently", () => {
    expect(getModelPricing("gpt-khong-ton-tai")).toBeNull();
  });
});

describe("sumAiCostVnd", () => {
  it("prices each model group with its own price rather than pooling tokens", () => {
    const groups = [
      { model: GEMINI, inputTokens: 1_000, outputTokens: 1_000, thinkingTokens: 0 },
      { model: GEMINI, inputTokens: 500, outputTokens: 500, thinkingTokens: 0 },
    ];
    const pooled = estimateAiCostVnd(
      { inputTokens: 1_500, outputTokens: 1_500, thinkingTokens: 0 },
      GEMINI,
    );
    // Cùng một model thì gộp hay tách phải ra cùng số (sai lệch tối đa một
    // đồng do làm tròn từng nhóm).
    expect(Math.abs(sumAiCostVnd(groups) - pooled)).toBeLessThanOrEqual(1);
  });

  it("is zero for an empty period", () => {
    expect(sumAiCostVnd([])).toBe(0);
  });
});
