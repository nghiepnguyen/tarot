import { describe, expect, it } from "vitest";
import type { InterpretationCardInput } from "@/lib/ai/interpretation";
import { getCardById } from "./cards";
import { SPREAD_POSITIONS } from "./draw";
import { buildCardRelations } from "./relations";

function spread(...ids: string[]): InterpretationCardInput[] {
  return ids.map((id, index) => ({
    card: getCardById(id)!, position: SPREAD_POSITIONS[index],
    orientation: index === 1 ? "reversed" : "upright",
  }));
}

describe("buildCardRelations", () => {
  it("keeps descending ranks in position order and equal ranks across suits", () => {
    expect(buildCardRelations(spread("eight-of-pentacles", "three-of-pentacles", "three-of-swords"))).toEqual([
      { kind: "same_suit_progression", ranks: [8, 3], cards: [
        { cardId: "eight-of-pentacles", category: "pentacles", position: "Bối cảnh", orientation: "upright" },
        { cardId: "three-of-pentacles", category: "pentacles", position: "Hiện tại", orientation: "reversed" },
      ] },
      { kind: "same_rank", rank: 3, cards: [
        { cardId: "three-of-pentacles", category: "pentacles", position: "Hiện tại", orientation: "reversed" },
        { cardId: "three-of-swords", category: "swords", position: "Hướng đi", orientation: "upright" },
      ] },
    ]);
  });

  it("prioritizes the whole suit then the first pair and caps observations at two", () => {
    const relations = buildCardRelations(spread("three-of-pentacles", "eight-of-pentacles", "ten-of-pentacles"));
    expect(relations).toHaveLength(2);
    expect(relations[0]).toMatchObject({ kind: "same_suit_spread" });
    expect(relations[0].cards.map(card => card.cardId)).toEqual(["three-of-pentacles", "eight-of-pentacles", "ten-of-pentacles"]);
    expect(relations[1]).toMatchObject({ kind: "same_suit_progression", ranks: [3, 8] });
  });

  it("allows a court-only same suit without inventing numerical ranks", () => {
    const relations = buildCardRelations(spread("page-of-cups", "queen-of-cups", "king-of-cups"));
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({ kind: "same_suit_spread" });
    expect(relations[0]).not.toHaveProperty("ranks");
    expect(relations[0]).not.toHaveProperty("rank");
  });

  it.each([
    ["the-fool", "the-world", "the-star"],
    ["page-of-cups", "two-of-cups", "page-of-wands"],
  ])("returns no supported relation for %s, %s, %s", (...ids) => {
    expect(buildCardRelations(spread(...ids))).toEqual([]);
  });

  it("retains orientation without mutating cards or changing structural membership", () => {
    const cards = spread("two-of-swords", "five-of-swords", "queen-of-swords");
    const before = structuredClone(cards);
    const initial = buildCardRelations(cards);
    expect(cards).toEqual(before);
    const flipped = buildCardRelations(cards.map(card => ({ ...card, orientation: "reversed" })));
    expect(flipped.map(relation => relation.kind)).toEqual(initial.map(relation => relation.kind));
    expect(flipped[0].cards.map(card => card.orientation)).toEqual(["reversed", "reversed", "reversed"]);
    expect(cards).toEqual(before);
  });
});
