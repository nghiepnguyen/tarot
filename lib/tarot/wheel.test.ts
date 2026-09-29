import { describe, expect, it } from "vitest";
import {
  cardAngle,
  carryOffset,
  centerPosition,
  computeWheelLayout,
  mod,
  offsetToCenter,
  randomStartOffset,
  renderedPositions,
  ringShifts,
  snapOffset,
  stepDeg,
  wheelDeltaPx,
  wrapSigned,
} from "./wheel";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("mod / wrapSigned", () => {
  it("keeps mod non-negative", () => {
    expect(mod(-1, 78)).toBe(77);
    expect(mod(79, 78)).toBe(1);
  });

  it("wraps slot distances into [-n/2, n/2)", () => {
    expect(wrapSigned(0, 78)).toBe(0);
    expect(wrapSigned(77, 78)).toBe(-1);
    expect(wrapSigned(-77, 78)).toBe(1);
    expect(wrapSigned(39, 78)).toBe(-39);
    expect(wrapSigned(38.5, 77)).toBe(-38.5);
  });
});

describe("computeWheelLayout", () => {
  it("shows roughly 9-13 cards on a phone", () => {
    for (const width of [320, 375, 390, 430]) {
      const layout = computeWheelLayout(width, 78);
      expect(layout.compact).toBe(true);
      const visible = layout.halfVisible * 2 + 1;
      expect(visible).toBeGreaterThanOrEqual(9);
      expect(visible).toBeLessThanOrEqual(13);
    }
  });

  it("shows roughly 15-21 cards on a desktop", () => {
    for (const width of [1024, 1280, 1440, 1920]) {
      const layout = computeWheelLayout(width, 78);
      expect(layout.compact).toBe(false);
      const visible = layout.halfVisible * 2 + 1;
      expect(visible).toBeGreaterThanOrEqual(15);
      expect(visible).toBeLessThanOrEqual(21);
    }
  });

  it("keeps the card ratio and a positive radius", () => {
    const layout = computeWheelLayout(390, 78);
    expect(layout.cardHeight).toBe(Math.round(layout.cardWidth * 1.57));
    expect(layout.radius).toBeGreaterThan(0);
    expect(layout.windowHeight).toBeGreaterThan(layout.cardHeight);
  });

  it("never renders more cards than the ring holds", () => {
    const layout = computeWheelLayout(1920, 7);
    expect(layout.halfRendered * 2 + 1).toBeLessThanOrEqual(7);
  });
});

describe("cardAngle", () => {
  it("puts the offset card on top and spaces the rest evenly", () => {
    expect(cardAngle(10, 10, 78)).toBe(0);
    expect(cardAngle(11, 10, 78)).toBeCloseTo(stepDeg(78), 2);
    expect(cardAngle(9, 10, 78)).toBeCloseTo(-stepDeg(78), 2);
  });

  it("has no seam where the last card meets the first", () => {
    expect(cardAngle(0, 77, 78)).toBeCloseTo(stepDeg(78), 2);
    expect(cardAngle(77, 0, 78)).toBeCloseTo(-stepDeg(78), 2);
    expect(cardAngle(0, 78 * 5 + 77, 78)).toBeCloseTo(stepDeg(78), 2);
  });
});

describe("renderedPositions", () => {
  it("renders a window around the top, sorted by ring position", () => {
    expect(renderedPositions(10, 78, 2)).toEqual([8, 9, 10, 11, 12]);
  });

  it("wraps across the seam without moving existing entries", () => {
    expect(renderedPositions(0, 78, 2)).toEqual([0, 1, 2, 76, 77]);
    expect(renderedPositions(-1, 78, 2)).toEqual([0, 1, 75, 76, 77]);
  });

  it("does not duplicate cards on a small ring", () => {
    expect(renderedPositions(0, 3, 5)).toEqual([0, 1, 2]);
    expect(renderedPositions(0, 0, 5)).toEqual([]);
  });
});

describe("snapOffset / randomStartOffset / centerPosition", () => {
  it("snaps to the nearest slot, including negatives", () => {
    expect(snapOffset(3.4)).toBe(3);
    expect(snapOffset(3.6)).toBe(4);
    expect(snapOffset(-2.6)).toBe(-3);
  });

  it("picks a whole slot within the ring", () => {
    expect(randomStartOffset(78, () => 0)).toBe(0);
    expect(randomStartOffset(78, () => 0.999)).toBe(77);
    expect(randomStartOffset(78, () => 0.5)).toBe(39);
  });

  it("finds the card on top for any offset", () => {
    expect(centerPosition(-1, 78)).toBe(77);
    expect(centerPosition(78 * 2 + 5.4, 78)).toBe(5);
  });
});

describe("offsetToCenter", () => {
  it("goes the short way round", () => {
    expect(offsetToCenter(1, 77, 78)).toBe(79);
    expect(offsetToCenter(76, 1, 78)).toBe(-2);
    expect(offsetToCenter(12, 10, 78)).toBe(12);
  });
});

describe("wheelDeltaPx", () => {
  it("uses the dominant axis", () => {
    expect(wheelDeltaPx({ deltaX: 2, deltaY: 30, deltaMode: 0 })).toBe(30);
    expect(wheelDeltaPx({ deltaX: -40, deltaY: 3, deltaMode: 0 })).toBe(-40);
  });

  it("converts line and page modes to pixels", () => {
    expect(wheelDeltaPx({ deltaX: 0, deltaY: 3, deltaMode: 1 })).toBe(48);
    expect(wheelDeltaPx({ deltaX: 0, deltaY: 1, deltaMode: 2 }, 700)).toBe(700);
  });
});

describe("carryOffset", () => {
  it("keeps the top card on top when a card before it leaves", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 3);
    // Card 10 was on top at offset 10; it now sits at ring position 9.
    expect(carryOffset(10, prev, next)).toBe(9);
    expect(next[carryOffset(10, prev, next)]).toBe(10);
  });

  it("lets the next card take the top when the top card leaves", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 10);
    expect(next[carryOffset(10, prev, next)]).toBe(11);
  });

  it("wraps to the first card when the last card on top leaves", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 77);
    expect(carryOffset(77, prev, next)).toBe(0);
  });

  it("keeps the fractional part of a mid-turn offset", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 3);
    expect(carryOffset(10.3, prev, next)).toBeCloseTo(9.3, 5);
  });

  it("normalises an unbounded offset into the new ring", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 3);
    expect(carryOffset(78 * 3 + 10, prev, next)).toBe(9);
  });

  it("handles a card coming back to the ring", () => {
    const prev = range(78).filter((id) => id !== 3);
    const next = range(78);
    expect(next[carryOffset(9, prev, next)]).toBe(10);
  });
});

describe("ringShifts", () => {
  it("moves the cards on the near side of a removed card by one slot", () => {
    const prev = range(78);
    const next = prev.filter((id) => id !== 8);
    const nextOffset = carryOffset(10, prev, next);
    const shifts = ringShifts(prev, 10, next, nextOffset);
    // Card 10 stays on top, cards after it don't move.
    expect(shifts.has(10)).toBe(false);
    expect(shifts.has(11)).toBe(false);
    // Cards before the gap slide one slot toward it.
    expect(shifts.get(7)).toBeCloseTo(-1, 5);
    expect(shifts.has(8)).toBe(false);
  });

  it("reports nothing when the ring did not change", () => {
    const ring = range(78);
    expect(ringShifts(ring, 4, ring, 4).size).toBe(0);
  });
});
