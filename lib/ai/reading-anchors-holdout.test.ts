import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import holdout from "./__fixtures__/reading-anchors-holdout.json";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { getCardById } from "../tarot/cards";
import type { InterpretationCardInput } from "./interpretation";
import { renderReadingAnchors, type ReadingAnchorContext } from "./reading-anchors";

const rendererHash = createHash("sha256").update(readFileSync("lib/ai/reading-anchors.ts")).digest("hex");
const results = holdout.cases.map(c => {
  const cards = c.cards.map(card => ({ card: getCardById(card.cardId)!, position: card.position, orientation: card.orientation })) as InterpretationCardInput[];
  return { ...c, anchors: renderReadingAnchors(c.question, cards, c.context as ReadingAnchorContext | null) };
});

describe("independently curated frozen anchor holdout", () => {
  it("preserves the frozen renderer and independent input coverage", () => {
    expect(rendererHash).toBe(holdout.frozenRendererHash);
    expect(new Set(results.map(c => c.id)).size).toBe(9);
    expect(results.filter(c => c.expectedApplied)).toHaveLength(6);
    expect(results.filter(c => !c.expectedApplied)).toHaveLength(3);
    for (const context of ["transfer", "restart_drawing", "housework_schedule"]) {
      expect(results.filter(c => c.context === context)).toHaveLength(2);
    }
    for (const c of results) {
      expect(BENCHMARK_CASES.some(b => b.question === c.question)).toBe(false);
      expect(c.question.length).toBeLessThanOrEqual(300);
    }
  });

  it.each(results)("respects manually curated applicability for $id", c => {
    expect(c.anchors !== null).toBe(c.expectedApplied);
    if (c.anchors) {
      expect(c.anchors.summary.length).toBeGreaterThan(0);
      expect(c.anchors.keyMessages).toHaveLength(3);
    } else expect(c.context).toBeNull();
  });
});

