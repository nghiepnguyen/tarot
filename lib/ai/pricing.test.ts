import { describe, expect, it } from "vitest";
import {
  estimateAiCostVnd,
  getModelPricing,
  isPricedModel,
  sumAiCostVnd,
} from "./pricing";
import { AI_MODELS } from "./models";

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
    expect(estimateAiCostVnd(sums, "model-chua-co-gia")).toBeGreaterThan(0);
  });

  it("never guesses low for a model it has no price for", () => {
    // Ước lượng thấp đọc như tin tốt. Giá mặc định phải không rẻ hơn bất kỳ
    // model nào đang cho phép chạy, để con số sai về phía không ai mừng hụt.
    const sums = { inputTokens: 1_233, outputTokens: 2_208, thinkingTokens: 2_286 };
    const fallback = estimateAiCostVnd(sums, "model-chua-co-gia");
    for (const model of AI_MODELS) {
      expect(fallback).toBeGreaterThanOrEqual(estimateAiCostVnd(sums, model.id));
    }
  });
});

describe("bảng giá và danh sách model", () => {
  it("prices every model the admin page can pick", () => {
    // Chọn được một model không có giá nghĩa là mọi con số tiền trên /admin
    // lặng lẽ thành ước lượng. Danh sách cho phép và bảng giá phải đi cùng nhau.
    for (const model of AI_MODELS) {
      expect(isPricedModel(model.id), model.id).toBe(true);
    }
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
