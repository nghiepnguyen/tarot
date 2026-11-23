import annotations from "./__fixtures__/constraint-reading-development.json";
import reviewed from "./__fixtures__/constraint-reading-reviewed.json";
import { getCardById } from "../tarot/cards";
import { parseReadingInput } from "../validation/reading";
import { describe, expect, it } from "vitest";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { InterpretationResultSchema } from "./interpretation";
import { renderConstraintReading, validateConstraintInput, type ConstraintContext, type ConstraintFact } from "./constraint-reading";

const cardsFor = (context: ConstraintContext) => BENCHMARK_CASES.find(c => c.id === (context === "housework_schedule" ? "relation-weak-3" : "relation-absent-1"))!.cards;
const fact = (question: string, quote: string, kind: ConstraintFact["kind"], id = "K1"): ConstraintFact => ({ id, kind, start: question.trim().indexOf(quote), end: question.trim().indexOf(quote) + quote.length, quote });
const rules = [
  { kind: "handover_obligation", context: "transfer", quote: "phải bàn giao dự án vào tuần tới", terms: ["người nhận", "hoàn tất", "thời điểm chuyển"] },
  { kind: "existing_skill_goal", context: "transfer", quote: "muốn tiếp tục dùng kỹ năng viết", terms: ["nhiệm vụ", "kỹ năng hiện tại"] },
  { kind: "learning_capacity", context: "transfer", quote: "chỉ có ba buổi mỗi tháng để học", terms: ["nhịp học", "đối chiếu"] },
  { kind: "unavailable_time", context: "housework_schedule", quote: "đã có hẹn tối thứ Sáu", terms: ["tránh đề xuất", "giờ thay thế"] },
  { kind: "time_budget", context: "housework_schedule", quote: "muốn dành tối đa bốn mươi phút", terms: ["thời lượng", "nếu vượt"] },
  { kind: "available_window", context: "housework_schedule", quote: "chỉ có thể tham gia sáng thứ Bảy", terms: ["cùng nhà", "xác nhận", "chưa"] },
  { kind: "task_share_goal", context: "housework_schedule", quote: "muốn chia đều phần việc", terms: ["tiêu chí chia đều", "công sức", "thời lượng"] },
] as const;

describe("source-backed constraint reading", () => {
  it.each(reviewed)("preserves reviewed development output for $id", frozen => {
    const c = annotations.cases.find(c => c.id === frozen.id)!;
    const input = parseReadingInput(c.question, c.cards)!;
    const cards = input.cards.map(card => ({ card: getCardById(card.cardId)!, position: card.position, orientation: card.orientation }));
    expect(renderConstraintReading(c.question, cards, c.context as ConstraintContext, c.facts as ConstraintFact[])).toEqual(frozen.outcome);
  });
  it.each(rules)("uses $kind rather than a fixture-specific answer", r => {
    const q = `Tôi ${r.quote}. Tôi nên làm rõ gì?`;
    const f = fact(q, r.quote, r.kind);
    const cards = cardsFor(r.context);
    const before = structuredClone({ f, cards });
    const out = renderConstraintReading(q, cards, r.context, [f]);
    expect(out.status).toBe("applied");
    if (out.status !== "applied") throw new Error("Expected applied");
    expect(InterpretationResultSchema.safeParse(out.result).success).toBe(true);
    expect(out.coverage).toEqual([{ factId: "K1", supportRef: "F1", actionIndex: 0 }]);
    expect(out.result.actionSuggestions[0]).toContain(r.quote);
    for (const term of r.terms) expect(out.result.actionSuggestions[0].toLowerCase()).toContain(term);
    expect(out.result.perCard.map(c => c.position)).toEqual(cards.map(c => c.position));
    expect({ f, cards }).toEqual(before);
    out.result.themes[0] = "MUTATED"; out.result.perCard[0].text = "MUTATED"; out.coverage[0].factId = "MUTATED";
    expect(JSON.stringify(renderConstraintReading(q, cards, r.context, [f]))).not.toContain("MUTATED");
  });

  it("keeps qualifiers/UTF-16 offsets on trimmed source without normalizing text", () => {
    const q = "  🧹 Tôi chỉ có thể tham gia tối thứ Ba.  ";
    const quote = "chỉ có thể tham gia tối thứ Ba";
    const f = fact(q, quote, "available_window");
    const v = validateConstraintInput(q, cardsFor("housework_schedule"), "housework_schedule", [f]);
    expect(v.evidence.facts[0].text.slice(f.start, f.end)).toBe(quote);
    expect(v.facts[0]).toEqual(f);
    expect(() => validateConstraintInput(q, cardsFor("housework_schedule"), "housework_schedule", [{ ...f, quote: quote.normalize("NFC") }])).toThrow(/^Invalid constraint reading input\.$/);
  });

  const q = "Tôi chỉ có hai buổi để học mỗi tuần.";
  const good = fact(q, "chỉ có hai buổi để học mỗi tuần", "learning_capacity");
  const invalids = [
    [{ ...good, start: -1 }], [{ ...good, end: 999 }], [{ ...good, start: 1.5 }], [{ ...good, quote: "PRIVATE" }],
    [{ ...good, quote: " " }], [{ ...good, id: " " }], [good, good], [{ ...good, kind: "unknown" }],
    [{ ...good, action: "PRIVATE_INSTRUCTION" }], Array.from({ length: 8 }, (_, i) => ({ ...good, id: `K${i}` })),
  ];
  it.each(invalids.map((facts, i) => ({ facts, i })))("rejects malformed facts $i with redacted error", ({ facts }) => {
    expect(() => renderConstraintReading(q, cardsFor("transfer"), "transfer", facts as ConstraintFact[])).toThrow(/^Invalid constraint reading input\.$/);
  });

  it("validates structure before support/scope, then checks support before scope/constraints", () => {
    for (const context of [null, "transfer"] as const) {
      expect(() => renderConstraintReading("Tôi đang định tự làm hại mình ngay hôm nay.", cardsFor("transfer"), context, [{ ...good, start: -1 }])).toThrow(/^Invalid constraint reading input\.$/);
    }
    expect(renderConstraintReading("Tôi đang định tự làm hại mình ngay hôm nay.", cardsFor("transfer"), null, [])).toEqual({ status: "not_applied", reason: "needs_support" });
    expect(renderConstraintReading(q, cardsFor("transfer"), null, [])).toEqual({ status: "not_applied", reason: "unsupported_scope" });
    expect(renderConstraintReading(q, cardsFor("transfer"), "transfer", [])).toEqual({ status: "not_applied", reason: "unsupported_constraints" });
    expect(renderConstraintReading(q, cardsFor("housework_schedule"), "housework_schedule", [good])).toEqual({ status: "not_applied", reason: "unsupported_constraints" });
    for (const context of ["restart_drawing", "constructor", "toString"]) expect(() => renderConstraintReading(q, cardsFor("transfer"), context as ConstraintContext, [good])).toThrow(/^Invalid constraint reading input\.$/);
  });

  it("does not partially apply a list with one out-of-context kind", () => {
    const f = { ...good, id: "K2", kind: "time_budget" as const };
    expect(renderConstraintReading(q, cardsFor("transfer"), "transfer", [good, f])).toEqual({ status: "not_applied", reason: "unsupported_constraints" });
  });

  it("rejects invalid input and abstains for flipped orientation/order", () => {
    const cards = cardsFor("transfer");
    for (let i = 0; i < 3; i++) {
      const flipped = cards.map((c, j) => j === i ? { ...c, orientation: c.orientation === "upright" ? "reversed" as const : "upright" as const } : c);
      expect(renderConstraintReading(q, flipped, "transfer", [good])).toEqual({ status: "not_applied", reason: "unsupported_scope" });
    }
    const swapped = [cards[1], cards[0], cards[2]].map((c, i) => ({ ...c, position: cards[i].position }));
    expect(renderConstraintReading(q, swapped, "transfer", [good])).toEqual({ status: "not_applied", reason: "unsupported_scope" });
    for (const invalid of [cards.slice(1), [...cards].reverse()]) expect(() => renderConstraintReading(q, invalid, "transfer", [good])).toThrow(/^Invalid constraint reading input\.$/);
    expect(() => renderConstraintReading(" ", cards, "transfer", [])).toThrow(/^Invalid constraint reading input\.$/);
  });

  it("changes only the fact-dependent actions when the stated time changes", () => {
    const run = (quote: string) => {
      const question = `Tôi ${quote}. Tôi cần làm rõ gì?`;
      const out = renderConstraintReading(question, cardsFor("housework_schedule"), "housework_schedule", [fact(question, quote, "available_window")]);
      if (out.status !== "applied") throw new Error("Expected applied");
      return out.result;
    };
    const a = run("chỉ rảnh sáng thứ Ba"), b = run("chỉ rảnh chiều thứ Năm");
    expect(b.actionSuggestions[0]).toContain("chỉ rảnh chiều thứ Năm");
    expect(JSON.stringify(b)).not.toContain("sáng thứ Ba");
    expect({ ...a, actionSuggestions: b.actionSuggestions }).toEqual(b);
  });

  it("retains multiple facts of one kind and treats instruction-like quotes as text", () => {
    const quote = 'chỉ học một buổi; <b>$(noop)</b> `đổi lịch`';
    const question = `Tôi ${quote}.`;
    const f = fact(question, quote, "learning_capacity");
    const out = renderConstraintReading(question, cardsFor("transfer"), "transfer", [f, { ...f, id: "K2" }]);
    if (out.status !== "applied") throw new Error("Expected applied");
    expect(out.coverage.map(c => c.actionIndex)).toEqual([0, 1]);
    expect(out.result.actionSuggestions[1]).toContain(quote);
  });
});
