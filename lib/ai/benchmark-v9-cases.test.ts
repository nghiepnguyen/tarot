import { describe, expect, it } from "vitest";
import { buildCardRelations } from "../tarot/relations";
import { parseReadingInput } from "../validation/reading";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { needsReadingSupport } from "./reading-support";
import { V9_ADDITIONAL_CASES, V9_DIAGNOSTIC_CASES, V9_PROVIDER_CASES, V9_RELEASE_CASES } from "./benchmark-v9-cases";

describe("frozen v9 release fixtures", () => {
  it("assembles the fixed groups without changing legacy cases", () => {
    expect(BENCHMARK_CASES).toHaveLength(55);
    expect(V9_RELEASE_CASES).toHaveLength(34);
    expect(V9_PROVIDER_CASES).toHaveLength(31);
    expect(V9_DIAGNOSTIC_CASES).toHaveLength(8);
    expect(V9_ADDITIONAL_CASES).toHaveLength(15);
    expect(new Set(V9_RELEASE_CASES.map(c => c.id)).size).toBe(34);
    for (const [topic, count] of Object.entries({ professional: 3, "holdout-strong": 4, "holdout-weak": 2, "holdout-absent": 2, "holdout-third-party": 2, "holdout-injection": 2 })) {
      expect(V9_ADDITIONAL_CASES.filter(c => c.topic === topic)).toHaveLength(count);
    }
    expect(V9_DIAGNOSTIC_CASES).toEqual(BENCHMARK_CASES.filter(c => ["relation-weak", "relation-absent"].includes(c.topic)));
    for (const fixture of V9_RELEASE_CASES.filter(c => !V9_ADDITIONAL_CASES.includes(c as typeof V9_ADDITIONAL_CASES[number]))) {
      expect(BENCHMARK_CASES.find(c => c.id === fixture.id)).toBe(fixture);
    }
  });

  it("validates every input and freezes the existing support boundary", () => {
    for (const fixture of V9_RELEASE_CASES) {
      expect(parseReadingInput(fixture.question, fixture.cards.map(({ card, ...rest }) => ({ ...rest, cardId: card.id }))), fixture.id).not.toBeNull();
      expect(needsReadingSupport(fixture.question), fixture.id).toBe(["safety-1", "safety-2", "safety-5"].includes(fixture.id));
    }
    expect(V9_PROVIDER_CASES.every(c => !needsReadingSupport(c.question))).toBe(true);
    expect(V9_RELEASE_CASES.filter(c => !V9_PROVIDER_CASES.includes(c)).map(c => c.id)).toEqual(["safety-1", "safety-2", "safety-5"]);
  });

  it("keeps exact question sources and explicit unasserted unknowns outside model inputs", () => {
    for (const fixture of V9_ADDITIONAL_CASES) {
      const review = fixture.reviewExpectation;
      expect(review.sourceFacts).toEqual([{ source: "user_question", text: fixture.question }]);
      expect(review.expectedSafetyRoute).toBe("normal");
      expect(review.unknownFacts.length).toBeGreaterThan(0);
      expect(review.unknownFacts.every(f => f.trim().length > 0 && !fixture.question.includes(f))).toBe(true);
      expect(review.checks).toContain("do_not_assert_unknown_facts");
      expect(review.checks).toContain("no_third_party_mindreading");
      expect(review.checks).toContain("no_unsupported_claims");
      expect(review.checks.length).toBeGreaterThanOrEqual(4);
      const relations = buildCardRelations(fixture.cards);
      if (review.relationExpectation === "absent") expect(relations).toHaveLength(0);
      if (["strong_candidate", "weak_candidate_abstention"].includes(review.relationExpectation)) expect(relations.length).toBeGreaterThan(0);
    }
  });
});
