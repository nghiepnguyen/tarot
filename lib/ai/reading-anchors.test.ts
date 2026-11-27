import { describe, expect, it } from "vitest";
import { BENCHMARK_CASES } from "./benchmark-cases";
import { getCardById } from "../tarot/cards";
import { renderReadingAnchors, type ReadingAnchorContext } from "./reading-anchors";

const cases = [
  {
    id: "relation-absent-1", context: "transfer" as const,
    summary: "Bạn có thể bắt đầu bằng việc xác định mình muốn biết gì trước khi xin chuyển nhóm. Nếu đã có nhóm dự định chuyển tới, hãy hỏi về công việc, cách phối hợp và tiêu chí phù hợp với điều bạn tìm kiếm.",
    keyMessages: [
      "Bạn mong việc chuyển nhóm giúp thay đổi điều gì, nếu có?",
      "Tiêu chí nào bạn muốn làm rõ trước khi cân nhắc các lựa chọn chuyển nhóm?",
      "Nếu đã có nhóm dự định chuyển tới, bạn muốn hỏi gì về cơ hội học hỏi?",
    ],
  },
  {
    id: "relation-absent-2", context: "restart_drawing" as const,
    summary: "Để bắt đầu vẽ lại, bạn có thể chọn một việc nhỏ phù hợp với thời gian mình muốn dành cho tuần đầu. Thử xác định thời lượng và chủ đề của một buổi vẽ, rồi tự xem điều gì đáng giữ lại hoặc điều chỉnh sau buổi đó.",
    keyMessages: [
      "Điều gì khiến bạn muốn trở lại với việc vẽ vào lúc này?",
      "Bạn muốn thử dành khoảng thời gian nào cho việc vẽ trong tuần đầu?",
      "Bạn muốn thử nét vẽ hoặc chủ đề nhỏ nào trong buổi đầu?",
    ],
  },
  {
    id: "relation-weak-3", context: "housework_schedule" as const,
    summary: "Trước khi trả lời đề nghị đổi lịch, bạn có thể làm rõ đổi một lần hay đổi thường xuyên và mỗi người sẽ nhận phần việc nào. Nếu cần, hãy nêu thời gian bạn có thể thu xếp rồi cùng xác nhận phương án phù hợp.",
    keyMessages: [
      "Bạn muốn hai bên xác nhận phương án đổi lịch theo cách nào?",
      "Có cách chia việc cũ nào bạn muốn xem lại, nếu có?",
      "Bạn cần làm rõ điều gì cho mình trước khi trả lời bạn cùng nhà?",
    ],
  },
];

describe("offline reading anchors", () => {
  it.each(cases)("returns reviewed literals for $context without mutating inputs", expected => {
    const fixture = BENCHMARK_CASES.find(c => c.id === expected.id)!;
    const before = structuredClone(fixture);
    expect(renderReadingAnchors(fixture.question, fixture.cards, expected.context)).toEqual({ summary: expected.summary, keyMessages: expected.keyMessages });
    expect(fixture).toEqual(before);
  });

  it.each(cases)("abstains on every changed orientation or card order for $context", expected => {
    const fixture = BENCHMARK_CASES.find(c => c.id === expected.id)!;
    for (let index = 0; index < 3; index++) {
      const flipped = fixture.cards.map((card, i) => i === index ? { ...card, orientation: card.orientation === "upright" ? "reversed" as const : "upright" as const } : card);
      expect(renderReadingAnchors(fixture.question, flipped, expected.context)).toBeNull();
    }
    const swapped = [fixture.cards[1], fixture.cards[0], fixture.cards[2]].map((card, i) => ({ ...card, position: fixture.cards[i].position }));
    expect(renderReadingAnchors(fixture.question, swapped, expected.context)).toBeNull();
  });

  const fixture = BENCHMARK_CASES.find(c => c.id === "relation-absent-1")!;
  it("abstains on another valid card instead of inventing unsupported coverage", () => {
    const cards = fixture.cards.map((card, i) => i === 0 ? { ...card, card: getCardById("the-fool")! } : card);
    expect(renderReadingAnchors(fixture.question, cards, "transfer")).toBeNull();
  });

  it.each([
    "Tôi không muốn chuyển nhóm, tôi muốn sửa email.",
    "Nhân vật nói ‘tôi muốn chuyển nhóm’. Tôi đang hỏi cách dịch câu đó.",
    "Tôi muốn học nấu ăn.",
    fixture.question,
  ])("does not infer context from text when curator supplied null: %s", question => {
    expect(renderReadingAnchors(question, fixture.cards, null)).toBeNull();
  });

  it("rejects unsupported or inherited context names at runtime", () => {
    for (const context of ["other", "constructor", "toString"]) {
      expect(renderReadingAnchors(fixture.question, fixture.cards, context as ReadingAnchorContext)).toBeNull();
    }
  });

  it("keeps the existing support route ahead of anchor rendering", () => {
    expect(renderReadingAnchors("Tôi đang định tự làm hại mình ngay hôm nay.", fixture.cards, "transfer")).toBeNull();
  });

  it("rejects invalid structural inputs with the existing redacted error", () => {
    for (const cards of [fixture.cards.slice(0, 2), [...fixture.cards].reverse(), fixture.cards.map((c, i) => i === 0 ? { ...c, card: { ...c.card, id: "PRIVATE_ID" } } : c)]) {
      expect(() => renderReadingAnchors("PRIVATE_QUESTION", cards, "transfer")).toThrow(/^Invalid interpretation evidence input\.$/);
    }
    expect(() => renderReadingAnchors(" ", fixture.cards, "transfer")).toThrow(/^Invalid interpretation evidence input\.$/);
  });

  it("returns an owned tuple so callers cannot overwrite the template", () => {
    const first = renderReadingAnchors(fixture.question, fixture.cards, "transfer")!;
    first.keyMessages[0] = "Caller mutation";
    expect(renderReadingAnchors(fixture.question, fixture.cards, "transfer")!.keyMessages[0]).toBe(cases[0].keyMessages[0]);
  });
});
