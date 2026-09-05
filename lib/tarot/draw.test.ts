import { describe, expect, it } from "vitest";
import { drawSpreadPool, DECK_SPREAD_SIZE, SPREAD_POSITIONS } from "./draw";
import { TAROT_CARDS } from "./cards";

describe("drawSpreadPool", () => {
  it("returns the full deck by default with no duplicate cards", () => {
    const pool = drawSpreadPool();
    expect(pool).toHaveLength(DECK_SPREAD_SIZE);
    const ids = pool.map((drawn) => drawn.card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("respects a custom size", () => {
    const pool = drawSpreadPool(3);
    expect(pool).toHaveLength(3);
  });

  it("only assigns upright or reversed orientation", () => {
    const pool = drawSpreadPool();
    for (const drawn of pool) {
      expect(["upright", "reversed"]).toContain(drawn.orientation);
    }
  });
});

describe("SPREAD_POSITIONS", () => {
  it("defines exactly three positions", () => {
    expect(SPREAD_POSITIONS).toHaveLength(3);
  });
});

describe("TAROT_CARDS", () => {
  it("has no duplicate ids", () => {
    const ids = TAROT_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every card has name, image, keywords, and both meanings", () => {
    for (const c of TAROT_CARDS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.image.length).toBeGreaterThan(0);
      expect(c.keywords.length).toBeGreaterThan(0);
      expect(c.basicMeaning.length).toBeGreaterThan(0);
      expect(c.reversedMeaning.length).toBeGreaterThan(0);
    }
  });
});
