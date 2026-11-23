import type { InterpretationCardInput } from "./interpretation";
import { buildInterpretationEvidence } from "./evidence";
import { needsReadingSupport } from "./reading-support";

export const READING_ANCHORS_VERSION = "anchors-offline-2026-11-21";

const ANCHORS = {
  transfer: {
    cards: [["the-hermit", "upright"], ["two-of-swords", "upright"], ["eight-of-pentacles", "reversed"]],
    summary: "Bạn có thể bắt đầu bằng việc xác định mình muốn biết gì trước khi xin chuyển nhóm. Nếu đã có nhóm dự định chuyển tới, hãy hỏi về công việc, cách phối hợp và tiêu chí phù hợp với điều bạn tìm kiếm.",
    keyMessages: [
      "Bạn mong việc chuyển nhóm giúp thay đổi điều gì, nếu có?",
      "Tiêu chí nào bạn muốn làm rõ trước khi cân nhắc các lựa chọn chuyển nhóm?",
      "Nếu đã có nhóm dự định chuyển tới, bạn muốn hỏi gì về cơ hội học hỏi?",
    ],
  },
  restart_drawing: {
    cards: [["the-star", "upright"], ["two-of-pentacles", "reversed"], ["page-of-wands", "upright"]],
    summary: "Để bắt đầu vẽ lại, bạn có thể chọn một việc nhỏ phù hợp với thời gian mình muốn dành cho tuần đầu. Thử xác định thời lượng và chủ đề của một buổi vẽ, rồi tự xem điều gì đáng giữ lại hoặc điều chỉnh sau buổi đó.",
    keyMessages: [
      "Điều gì khiến bạn muốn trở lại với việc vẽ vào lúc này?",
      "Bạn muốn thử dành khoảng thời gian nào cho việc vẽ trong tuần đầu?",
      "Bạn muốn thử nét vẽ hoặc chủ đề nhỏ nào trong buổi đầu?",
    ],
  },
  housework_schedule: {
    cards: [["six-of-wands", "upright"], ["six-of-cups", "reversed"], ["the-hermit", "upright"]],
    summary: "Trước khi trả lời đề nghị đổi lịch, bạn có thể làm rõ đổi một lần hay đổi thường xuyên và mỗi người sẽ nhận phần việc nào. Nếu cần, hãy nêu thời gian bạn có thể thu xếp rồi cùng xác nhận phương án phù hợp.",
    keyMessages: [
      "Bạn muốn hai bên xác nhận phương án đổi lịch theo cách nào?",
      "Có cách chia việc cũ nào bạn muốn xem lại, nếu có?",
      "Bạn cần làm rõ điều gì cho mình trước khi trả lời bạn cùng nhà?",
    ],
  },
} as const;

export type ReadingAnchorContext = keyof typeof ANCHORS;

export function renderReadingAnchors(
  question: string,
  cards: InterpretationCardInput[],
  context: ReadingAnchorContext | null,
): { summary: string; keyMessages: [string, string, string] } | null {
  const evidence = buildInterpretationEvidence(question, cards);
  if (needsReadingSupport(evidence.facts[0].text) || typeof context !== "string" || !Object.hasOwn(ANCHORS, context)) return null;

  const template = ANCHORS[context];
  // Positions are fixed by evidence validation; context must be curated, never inferred here.
  if (evidence.cards.some((card, index) => card.cardId !== template.cards[index][0] || card.orientation !== template.cards[index][1])) return null;
  return { summary: template.summary, keyMessages: [...template.keyMessages] };
}
