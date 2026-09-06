import { describe, expect, it } from "vitest";
import { getCardById, TAROT_CARDS } from "./cards";

describe("TAROT_CARDS", () => {
  it("has the full standard 78-card deck", () => {
    expect(TAROT_CARDS).toHaveLength(78);
  });

  it("has 22 major arcana and 14 cards in each of the four suits", () => {
    const counts = TAROT_CARDS.reduce<Record<string, number>>((acc, card) => {
      acc[card.category] = (acc[card.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      "major-arcana": 22,
      cups: 14,
      pentacles: 14,
      swords: 14,
      wands: 14,
    });
  });

  it("has a unique id for every card", () => {
    const ids = TAROT_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card a non-empty basic and reversed meaning", () => {
    for (const card of TAROT_CARDS) {
      expect(card.basicMeaning.length).toBeGreaterThan(0);
      expect(card.reversedMeaning.length).toBeGreaterThan(0);
      expect(card.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("getCardById", () => {
  it("finds every card in the deck by its own id", () => {
    for (const card of TAROT_CARDS) {
      expect(getCardById(card.id)).toEqual(card);
    }
  });

  it("returns undefined for an id that doesn't exist", () => {
    expect(getCardById("not-a-real-card")).toBeUndefined();
  });
});
