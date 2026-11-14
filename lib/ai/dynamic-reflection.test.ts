import { expect, it } from "vitest";
import { getCardById } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";
import { buildReflectionInput, parseReflectionOutput } from "./dynamic-reflection";

const cards = ["five-of-cups", "eight-of-swords", "queen-of-swords"].map((cardId, index) => ({
  cardId,
  position: SPREAD_POSITIONS[index],
  orientation: index === 2 ? "reversed" : "upright",
}));
const input = buildReflectionInput("  Tôi muốn làm rõ điều gì?  ", cards)!;
const valid = {
  intro: "Nếu muốn, hãy nhìn lại ba lá.",
  questions: ["Bạn chú ý đến lá nào?", "Five of Cups và Queen of Swords gợi điều gì cần làm rõ?", "Bạn có thể kiểm tra điều gì?"],
  cardRefs: ["five-of-cups", "queen-of-swords"],
};

it("packs trimmed user input and trusted card metadata as data", () => {
  expect(input.question).toBe("Tôi muốn làm rõ điều gì?");
  expect(input.cards[2]).toEqual({
    ...cards[2], name: "Queen of Swords", category: "swords",
    meaning: getCardById("queen-of-swords")?.reversedMeaning,
  });
});

it("rejects incomplete, reordered and duplicate spreads", () => {
  for (const invalid of [cards.slice(1), [cards[1], cards[0], cards[2]], [cards[0], { ...cards[1], cardId: cards[0].cardId }, cards[2]]]) {
    expect(buildReflectionInput("Câu hỏi?", invalid)).toBeNull();
  }
});

it("rejects oversized or empty questions", () => {
  expect(buildReflectionInput("a".repeat(301), cards)).toBeNull();
  expect(buildReflectionInput("  ", cards)).toBeNull();
});

it("accepts properly grounded card references and the exact word limit", () => {
  const used = valid.questions.join(" ").split(/\s+/).length;
  const atLimit = { ...valid, intro: "từ ".repeat(150 - used).trim() };
  expect(parseReflectionOutput(JSON.stringify(valid), input)).toEqual(valid);
  expect(parseReflectionOutput(JSON.stringify(atLimit), input)).toEqual(atLimit);
});

it.each([
  { questions: ["Một câu?"] },
  { questions: ["?", "Five of Cups?", "  "] },
  { cardRefs: ["five-of-cups", "five-of-cups"] },
  { cardRefs: ["the-fool"] },
  { cardRefs: [] },
  { questions: ["?", "Five of CupsXYZ và Queen of Swords?", "?"] },
  { questions: ["?", "Five of Cups và Queen of Swords, cùng The Tower?", "?"] },
  { intro: "từ ".repeat(151) },
  { extra: true },
])("rejects invalid output (%j)", (override) => {
  expect(parseReflectionOutput(JSON.stringify({ ...valid, ...override }), input)).toBeNull();
});

it("rejects malformed JSON", () => {
  expect(parseReflectionOutput("{", input)).toBeNull();
});
