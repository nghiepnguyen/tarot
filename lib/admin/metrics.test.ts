import { describe, expect, it } from "vitest";
import { intersectUserIds, ratio, toFunnel } from "./metrics";

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
