import { describe, expect, it } from "vitest";
import type { InterpretationCardInput } from "@/lib/ai/interpretation";
import { getCardById } from "@/lib/tarot/cards";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { PROMPT_V7 } from "./v7";
import { PROMPT_V8 } from "./v8";

function spread(...ids: string[]): InterpretationCardInput[] {
  return ids.map((id, index) => {
    const card = getCardById(id);
    if (!card) throw new Error(`Unknown card: ${id}`);
    return { card, position: SPREAD_POSITIONS[index], orientation: index === 1 ? "reversed" : "upright" };
  });
}

const question = "Tôi nên kiểm tra gì trước khi xin chuyển nhóm?";

describe("PROMPT_V8", () => {
  it("prioritizes the whole suit and limits overlapping observations to two", () => {
    const cards = spread("three-of-pentacles", "eight-of-pentacles", "ten-of-pentacles");
    const input = JSON.parse(PROMPT_V8.buildPrompt(question, cards));
    expect(input.cardRelations.map(({ kind }: { kind: string }) => kind)).toEqual([
      "same_suit_spread", "same_suit_progression",
    ]);
    expect(input.cardRelations[0].cards.map(({ cardId }: { cardId: string }) => cardId))
      .toEqual(cards.map(({ card }) => card.id));
    expect(input.cardRelations[1].ranks).toEqual([3, 8]);
  });

  it("uses spread order, position and orientation for a pair and recognizes equal ranks across suits", () => {
    const cards = spread("eight-of-pentacles", "three-of-pentacles", "three-of-swords");
    const input = JSON.parse(PROMPT_V8.buildPrompt(question, cards));
    expect(input.cardRelations).toEqual([
      {
        kind: "same_suit_progression",
        ranks: [8, 3],
        cards: [
          { cardId: "eight-of-pentacles", category: "pentacles", position: "Bối cảnh", orientation: "upright" },
          { cardId: "three-of-pentacles", category: "pentacles", position: "Hiện tại", orientation: "reversed" },
        ],
      },
      {
        kind: "same_rank",
        rank: 3,
        cards: [
          { cardId: "three-of-pentacles", category: "pentacles", position: "Hiện tại", orientation: "reversed" },
          { cardId: "three-of-swords", category: "swords", position: "Hướng đi", orientation: "upright" },
        ],
      },
    ]);
  });

  it.each([
    ["the-fool", "the-world", "the-star"],
    ["page-of-cups", "two-of-cups", "page-of-wands"],
  ])("uses the original v7 input without a supported relation (%s, %s, %s)", (...ids) => {
    const cards = spread(...ids);
    expect(PROMPT_V8.buildPrompt(question, cards)).toBe(PROMPT_V7.buildPrompt(question, cards));
  });

  it("preserves the v7 response contract", () => {
    expect(PROMPT_V8.resultSchema).toBe(PROMPT_V7.resultSchema);
    expect(PROMPT_V8.responseSchema).toBe(PROMPT_V7.responseSchema);
    expect(PROMPT_V8.validateResult).toBe(PROMPT_V7.validateResult);
  });
});
