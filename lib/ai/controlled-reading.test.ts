import frozen from "./__fixtures__/controlled-reading-development.json";
import { describe, expect, it } from "vitest";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { InterpretationResultSchema } from "./interpretation";
import { getCardById } from "../tarot/cards";
import type { ReadingAnchorContext } from "./reading-anchors";
import { CONTROLLED_CARD_SYMBOLS, renderControlledReading } from "./controlled-reading";

const targets = [
  ["relation-absent-1", "transfer"], ["relation-absent-2", "restart_drawing"], ["relation-weak-3", "housework_schedule"],
] as const;

describe("controlled full reading offline", () => {
  it.each(frozen)("keeps reviewed development literals for $id", c => {
    const input = BENCHMARK_CASES.find(b => b.id === c.id)!;
    expect(renderControlledReading(input.question, input.cards, c.context as ReadingAnchorContext)).toEqual(c.output);
  });
  it.each(targets)("renders validated complete output for %s", (id, context) => {
    const input = BENCHMARK_CASES.find(c => c.id === id)!;
    const before = structuredClone(input);
    const result = renderControlledReading(input.question, input.cards, context)!;
    expect(InterpretationResultSchema.safeParse(result).success).toBe(true);
    for (const [i, card] of input.cards.entries()) {
      expect(result.perCard[i].position).toBe(card.position);
      expect(result.perCard[i].text).toContain(card.card.name);
      expect(result.perCard[i].text).toContain(card.orientation === "upright" ? "xuôi" : "ngược");
      expect(result.perCard[i].text).toContain(CONTROLLED_CARD_SYMBOLS[context][i]);
    }
    expect(input).toEqual(before);
    result.themes[0] = "mutated";
    result.perCard[0].text = "mutated";
    result.actionSuggestions[0] = "mutated";
    expect(JSON.stringify(renderControlledReading(input.question, input.cards, context))).not.toContain("mutated");
  });

  it.each(targets)("abstains for changed fingerprint on %s", (id, context) => {
    const input = BENCHMARK_CASES.find(c => c.id === id)!;
    for (let index = 0; index < 3; index++) {
      const cards = input.cards.map((c, i) => i === index ? { ...c, orientation: c.orientation === "upright" ? "reversed" as const : "upright" as const } : c);
      expect(renderControlledReading(input.question, cards, context)).toBeNull();
    }
    const swapped = [input.cards[1], input.cards[0], input.cards[2]].map((c, i) => ({ ...c, position: input.cards[i].position }));
    expect(renderControlledReading(input.question, swapped, context)).toBeNull();
    expect(renderControlledReading(input.question, input.cards.map((c, i) => i ? c : { ...c, card: getCardById("the-fool")! }), context)).toBeNull();
  });

  const input = BENCHMARK_CASES.find(c => c.id === targets[0][0])!;
  it("never infers context and preserves support precedence", () => {
    for (const context of [null, "other", "constructor", "toString"]) expect(renderControlledReading(input.question, input.cards, context as ReadingAnchorContext | null)).toBeNull();
    expect(renderControlledReading("Tôi đang định tự làm hại mình ngay hôm nay.", input.cards, "transfer")).toBeNull();
    expect(renderControlledReading("Tôi không chuyển nhóm, tôi hỏi cách sửa email.", input.cards, null)).toBeNull();
  });

  it("rejects invalid structure without exposing private input", () => {
    expect(() => renderControlledReading(" ", input.cards, "transfer")).toThrow(/^Invalid interpretation evidence input\.$/);
    for (const cards of [input.cards.slice(1), [...input.cards].reverse(), input.cards.map((c, i) => i ? c : { ...c, card: { ...c.card, id: "PRIVATE_ID" } })]) {
      expect(() => renderControlledReading("PRIVATE_QUESTION", cards, "transfer")).toThrow(/^Invalid interpretation evidence input\.$/);
    }
  });

  it("offers the concrete optional actions required in each context", () => {
    const actions = Object.fromEntries(targets.map(([id, context]) => {
      const c = BENCHMARK_CASES.find(c => c.id === id)!;
      return [context, renderControlledReading(c.question, c.cards, context)!.actionSuggestions.join(" ")];
    }));
    for (const text of ["quy trình", "điều kiện", "thời điểm"]) expect(actions.transfer).toContain(text);
    for (const text of ["đồ vật", "5 phút", "điều chỉnh"]) expect(actions.restart_drawing).toContain(text);
    for (const text of ["giờ mới", "một lần", "phần việc", "giờ khác"]) expect(actions.housework_schedule).toContain(text);
  });
});
