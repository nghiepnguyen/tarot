import { describe, expect, it } from "vitest";
import { BENCHMARK_CASES } from "../benchmark-cases";
import { PROMPT_V8 } from "./v8";
import { PROMPT_V8_1 } from "./v8-1";

describe("PROMPT_V8_1", () => {
  it.each(["relation-strong-4", "orientation-1", "position-1", "relation-weak-1"])(
    "keeps v8 observations, card order and orientation for %s",
    (id) => {
      const { question, cards } = BENCHMARK_CASES.find(fixture => fixture.id === id)!;
      const prompt = PROMPT_V8_1.buildPrompt(question, cards);
      expect(prompt).toBe(PROMPT_V8.buildPrompt(question, cards));
      const { spread, cardRelations } = JSON.parse(prompt);
      expect(spread.cards).toMatchObject(cards.map(({ card, position, orientation }) => ({
        cardId: card.id, position, orientation,
      })));
      expect(cardRelations.length).toBeGreaterThan(0);
      expect(cardRelations.length).toBeLessThanOrEqual(2);
    },
  );

  it("keeps the relation-free input and response contract", () => {
    const { question, cards } = BENCHMARK_CASES.find(fixture => fixture.id === "relation-absent-1")!;
    const prompt = PROMPT_V8_1.buildPrompt(question, cards);
    expect(prompt).toBe(PROMPT_V8.buildPrompt(question, cards));
    expect(JSON.parse(prompt)).not.toHaveProperty("cardRelations");
    expect(PROMPT_V8_1.resultSchema).toBe(PROMPT_V8.resultSchema);
    expect(PROMPT_V8_1.responseSchema).toBe(PROMPT_V8.responseSchema);
    expect(PROMPT_V8_1.validateResult).toBe(PROMPT_V8.validateResult);
  });
});
