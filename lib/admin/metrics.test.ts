import { describe, expect, it } from "vitest";
import { estimateAiCostVnd, intersectUserIds, ratio, toFunnel } from "./metrics";

describe("estimateAiCostVnd", () => {
  it("matches the hand-measured ~365đ per unlock", () => {
    // Đo ngày 13/09/2026: input 1.233, output + thinking 4.494.
    const cost = estimateAiCostVnd({
      inputTokens: 1_233,
      outputTokens: 2_208,
      thinkingTokens: 2_286,
    });
    expect(cost).toBeGreaterThan(340);
    expect(cost).toBeLessThan(390);
  });

  it("prices thinking tokens like output tokens", () => {
    const asOutput = estimateAiCostVnd({ inputTokens: 0, outputTokens: 1_000, thinkingTokens: 0 });
    const asThinking = estimateAiCostVnd({ inputTokens: 0, outputTokens: 0, thinkingTokens: 1_000 });
    expect(asThinking).toBe(asOutput);
  });

  it("treats null sums as zero — the columns are nullable by design", () => {
    expect(
      estimateAiCostVnd({ inputTokens: null, outputTokens: null, thinkingTokens: null }),
    ).toBe(0);
    expect(estimateAiCostVnd({ inputTokens: 1_233, outputTokens: null, thinkingTokens: null }))
      .toBeGreaterThan(0);
  });
});

describe("intersectUserIds", () => {
  it("counts each user once even when the left side repeats", () => {
    expect(intersectUserIds(["a", "a", "b", "c"], ["a", "c", "d"])).toEqual(["a", "c"]);
  });

  it("returns nothing when the sets are disjoint", () => {
    expect(intersectUserIds(["a"], ["b"])).toEqual([]);
  });
});

describe("ratio", () => {
  it("returns 0 instead of NaN on an empty denominator", () => {
    expect(ratio(0, 0)).toBe(0);
    expect(ratio(5, 0)).toBe(0);
  });
});

describe("toFunnel", () => {
  const BASE = {
    usersTotal: 100,
    usersVerified: 80,
    usersDrawing: 40,
    usersUnlocking: 20,
    usersPaying: 5,
    freeGrantUserIds: ["a", "b", "c", "d"],
    paidUserIds: ["a", "z"],
  };

  it("chains each rate off the step before it, not off the total", () => {
    const funnel = toFunnel(BASE);
    expect(funnel.verifiedRate).toBeCloseTo(0.8);
    expect(funnel.drawRate).toBeCloseTo(0.5);
    expect(funnel.unlockRate).toBeCloseTo(0.5);
    expect(funnel.freeToPaidRate).toBeCloseTo(0.25);
  });

  it("survives an empty database", () => {
    const funnel = toFunnel({
      usersTotal: 0,
      usersVerified: 0,
      usersDrawing: 0,
      usersUnlocking: 0,
      usersPaying: 0,
      freeGrantUserIds: [],
      paidUserIds: [],
    });
    expect(funnel.verifiedRate).toBe(0);
    expect(funnel.freeToPaidRate).toBe(0);
  });
});
