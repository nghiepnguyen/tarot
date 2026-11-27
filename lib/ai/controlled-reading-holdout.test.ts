import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import holdout from "./__fixtures__/controlled-reading-holdout.json";
import priorHoldout from "./__fixtures__/reading-anchors-holdout.json";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { InterpretationResultSchema } from "./interpretation";
import { parseReadingInput } from "../validation/reading";
import { getCardById } from "../tarot/cards";
import { renderControlledReading } from "./controlled-reading";
import type { ReadingAnchorContext } from "./reading-anchors";

const cases = holdout.cases.map(c => {
  const input = parseReadingInput(c.question, c.cards);
  if (!input) throw new Error("Invalid independently curated holdout input.");
  const cards = input.cards.map(card => ({ card: getCardById(card.cardId)!, position: card.position, orientation: card.orientation }));
  return { ...c, cards, output: renderControlledReading(c.question, cards, c.context as ReadingAnchorContext | null) };
});

describe("frozen full-reading holdout", () => {
  it("uses new independent inputs without changing the renderer", () => {
    expect(createHash("sha256").update(readFileSync("lib/ai/controlled-reading.ts")).digest("hex")).toBe(holdout.frozenRendererHash);
    expect(cases).toHaveLength(9);
    expect(new Set(cases.map(c => c.id)).size).toBe(9);
    expect(new Set(cases.map(c => c.question)).size).toBe(9);
    expect(cases.filter(c => c.expectedApplied)).toHaveLength(6);
    expect(cases.filter(c => !c.expectedApplied)).toHaveLength(3);
    for (const context of ["transfer", "restart_drawing", "housework_schedule"]) expect(cases.filter(c => c.context === context)).toHaveLength(2);
    const oldQuestions = new Set([...BENCHMARK_CASES, ...priorHoldout.cases].map(c => c.question));
    for (const c of cases) {
      expect(oldQuestions.has(c.question)).toBe(false);
      expect(c.question.length).toBeLessThanOrEqual(300);
    }
  });

  it.each(cases)("matches manual applicability and schema for $id", c => {
    expect(c.output !== null).toBe(c.expectedApplied);
    if (c.output) {
      expect(InterpretationResultSchema.safeParse(c.output).success).toBe(true);
      expect(c.output.perCard.map(card => card.position)).toEqual(c.cards.map(card => card.position));
    } else expect(c.context).toBeNull();
  });

  it.each(cases.filter(c => c.expectedApplied))("abstains for changed orientations and order on $id", c => {
    for (let index = 0; index < 3; index++) {
      const cards = c.cards.map((card, i) => i === index ? { ...card, orientation: card.orientation === "upright" ? "reversed" as const : "upright" as const } : card);
      expect(renderControlledReading(c.question, cards, c.context as ReadingAnchorContext)).toBeNull();
    }
    const swapped = [c.cards[1], c.cards[0], c.cards[2]].map((card, i) => ({ ...card, position: c.cards[i].position }));
    expect(renderControlledReading(c.question, swapped, c.context as ReadingAnchorContext)).toBeNull();
  });
});
