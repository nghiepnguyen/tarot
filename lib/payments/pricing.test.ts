import { describe, expect, it } from "vitest";
import { formatVnd, pricePerUnlock, savingPercent, unlocksIn } from "./pricing";

const starter = { credits: 50, priceVnd: 19_000 };
const deep = { credits: 500, priceVnd: 149_000 };

describe("pricing", () => {
  it("prices one unlock", () => {
    expect(unlocksIn(starter)).toBe(5);
    expect(pricePerUnlock(starter)).toBe(3_800);
    expect(formatVnd(pricePerUnlock(starter))).toBe("3.800đ");
  });

  it("measures saving against the most expensive package per unlock", () => {
    expect(savingPercent(starter, [starter, deep])).toBe(0);
    expect(savingPercent(deep, [starter, deep])).toBe(22);
  });
});
