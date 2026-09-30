import { describe, expect, it } from "vitest";
import { parseReadingInput } from "./reading";
import { TAROT_CARDS } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";
const cards = SPREAD_POSITIONS.map((position, i) => ({ position, cardId: TAROT_CARDS[i].id, orientation: "upright" }));
describe("reading input", () => {
  it("accepts three distinct known cards in canonical positions", () => { expect(parseReadingInput(" Câu hỏi? ", cards)?.question).toBe("Câu hỏi?"); });
  it("rejects duplicate cards, arbitrary positions, malformed payloads and long questions", () => {
    expect(parseReadingInput("Câu hỏi", cards.map(c => ({ ...c, cardId: cards[0].cardId })))).toBeNull();
    expect(parseReadingInput("Câu hỏi", cards.map(c => ({ ...c, position: "bí mật" })))).toBeNull();
    expect(parseReadingInput(123, null)).toBeNull();
    expect(parseReadingInput("a".repeat(301), cards)).toBeNull();
  });
});
