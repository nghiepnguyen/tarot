import { describe, expect, it } from "vitest";
import { SPREAD_POSITIONS } from "../tarot/draw";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { PROMPT_V8 } from "./prompts/v8";

describe("prompt benchmark cases", () => {
  it.each([
    ["relation-weak", 4, true],
    ["relation-absent", 4, false],
    ["relation-strong", 4, true],
    ["orientation", 1, true],
    ["position", 1, true],
  ] as const)("freezes the v8.1 %s group", (topic, count, hasRelation) => {
    const cases = BENCHMARK_CASES.filter(fixture => fixture.topic === topic);
    expect(cases).toHaveLength(count);
    for (const fixture of cases) {
      expect(fixture.reviewExpectation).toMatch(/Dữ kiện: .+ Kiểm chứng: .+ Kỳ vọng: .+/);
      expect(fixture.question.length).toBeLessThanOrEqual(300);
      expect(fixture.cards).toHaveLength(3);
      expect(fixture.cards.map(card => card.position)).toEqual(SPREAD_POSITIONS);
      expect(fixture.cards.every(card => ["upright", "reversed"].includes(card.orientation))).toBe(true);
      const input = JSON.parse(PROMPT_V8.buildPrompt(fixture.question, fixture.cards));
      expect(Boolean(input.cardRelations?.length)).toBe(hasRelation);
    }
  });

  it("keeps the original style cases and adds reviewed relation and safety groups", () => {
    expect(BENCHMARK_CASES.filter(testCase => testCase.topic === "style-challenge")).toHaveLength(12);
    for (const topic of ["relation-strong", "relation-weak", "relation-absent", "orientation", "position", "safety"]) {
      const fixtures = BENCHMARK_CASES.filter(testCase => testCase.topic === topic);
      expect(fixtures.length, topic).toBeGreaterThan(0);
      for (const fixture of fixtures) {
        expect(fixture.reviewExpectation).toBeTruthy();
        expect(fixture.cards.map(card => card.position)).toEqual(SPREAD_POSITIONS);
        expect(new Set(fixture.cards.map(({ card }) => card.id)).size).toBe(3);
      }
    }
    expect(BENCHMARK_CASES.filter(fixture => fixture.topic === "safety")).toHaveLength(5);
    expect(new Set(BENCHMARK_CASES.map(fixture => fixture.id)).size).toBe(BENCHMARK_CASES.length);
  });

  it("uses the same question and cards for the orientation and position comparisons", () => {
    const baseline = BENCHMARK_CASES.find(fixture => fixture.id === "relation-strong-1")!;
    const orientation = BENCHMARK_CASES.find(fixture => fixture.id === "orientation-1")!;
    const position = BENCHMARK_CASES.find(fixture => fixture.id === "position-1")!;
    expect(orientation.question).toBe(baseline.question);
    expect(position.question).toBe(baseline.question);
    expect(orientation.cards.map(({ card }) => card.id)).toEqual(baseline.cards.map(({ card }) => card.id));
    expect(orientation.cards.map(card => card.orientation)).not.toEqual(baseline.cards.map(card => card.orientation));
    expect(position.cards).toEqual([1, 0, 2].map((index, slot) => ({
      ...baseline.cards[index],
      position: SPREAD_POSITIONS[slot],
    })));
  });
});
