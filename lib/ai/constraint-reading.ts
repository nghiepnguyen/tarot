import { z } from "zod";
import { buildInterpretationEvidence } from "./evidence";
import { needsReadingSupport } from "./reading-support";
import { InterpretationResultSchema, type InterpretationCardInput, type InterpretationResult } from "./interpretation";
import { CONTROLLED_CARD_SYMBOLS } from "./controlled-reading";

export const CONSTRAINT_READING_VERSION = "constraint-reading-offline-2026-11-22";
const contextSchema = z.enum(["transfer", "housework_schedule"]).nullable();
const factSchema = z.strictObject({
  id: z.string().refine(value => value.trim().length > 0),
  kind: z.enum(["handover_obligation", "existing_skill_goal", "learning_capacity", "unavailable_time", "time_budget", "available_window", "task_share_goal"]),
  start: z.number().int().nonnegative(), end: z.number().int().nonnegative(),
  quote: z.string().refine(value => value.trim().length > 0),
});
export type ConstraintContext = z.infer<typeof contextSchema>;
export type ConstraintFact = z.infer<typeof factSchema>;
export type ConstraintKind = ConstraintFact["kind"];
export type ConstraintCoverage = { factId: string; supportRef: "F1"; actionIndex: number };
export type ConstraintReadingOutcome =
  | { status: "applied"; result: InterpretationResult; coverage: ConstraintCoverage[] }
  | { status: "not_applied"; reason: "unsupported_scope" | "unsupported_constraints" | "needs_support" };

export function validateConstraintInput(question: string, cards: InterpretationCardInput[], context: ConstraintContext, facts: ConstraintFact[]) {
  try {
    const evidence = buildInterpretationEvidence(question, cards);
    const parsedContext = contextSchema.parse(context);
    const parsedFacts = z.array(factSchema).max(7).parse(facts);
    const source = evidence.facts[0].text;
    if (new Set(parsedFacts.map(f => f.id)).size !== parsedFacts.length
      || parsedFacts.some(f => f.start >= f.end || f.end > source.length || source.slice(f.start, f.end) !== f.quote)) throw new Error();
    return { evidence, context: parsedContext, facts: parsedFacts };
  } catch { throw new Error("Invalid constraint reading input."); }
}

const RULES: Record<ConstraintKind, { context: Exclude<ConstraintContext, null>; action: string }> = {
  handover_obligation: { context: "transfer", action: "Hỏi ai là người nhận bàn giao, cần chuyển những phần việc nào và tiêu chí nào xác nhận đã hoàn tất. Đề nghị đầu mối phụ trách đối chiếu thời điểm chuyển nhóm với hạn bàn giao bạn nêu; chưa coi hai mốc đã được thống nhất." },
  existing_skill_goal: { context: "transfer", action: "Hỏi nhiệm vụ nào ở nhóm dự kiến sử dụng kỹ năng hiện tại của bạn. Đối chiếu câu trả lời với mong muốn tiếp tục dùng kỹ năng đã nêu, không mặc định vai trò mới sẽ đáp ứng hoặc tự đoán đó là kỹ năng gì." },
  learning_capacity: { context: "transfer", action: "Hỏi yêu cầu và nhịp học của vai trò dự kiến, rồi đối chiếu với khả năng học bạn nêu. Nếu chưa rõ thời lượng mỗi buổi hoặc lịch đào tạo, hãy xác nhận thêm trước khi nhận cam kết; số buổi không tự cho biết số giờ hoặc bảo đảm vừa sức." },
  unavailable_time: { context: "housework_schedule", action: "Khi trao đổi, hãy giữ khoảng vướng đã nêu để tránh đề xuất giờ dọn trùng vào đó. Hỏi người cùng nhà về giờ thay thế, rồi cùng kiểm tra khả năng tham gia; không tự suy ra một giờ mà cả hai đều rảnh." },
  time_budget: { context: "housework_schedule", action: "Hỏi phạm vi và thời lượng dự kiến của phần việc bạn nhận để so với giới hạn đã nêu. Nếu vượt giới hạn, bạn có thể đề nghị thu hẹp, chia lại phần việc hoặc trao đổi thời điểm khác; chưa thể bảo đảm sẽ làm xong trong khoảng đó." },
  available_window: { context: "housework_schedule", action: "Đề xuất người cùng nhà xác nhận họ có thể tham gia trong cửa sổ thời gian bạn nêu hay không. Đây chưa phải giờ đã thống nhất; nếu không khớp, cần trao đổi phương án khác thay vì tự chọn thời gian ngoài khả năng của bạn." },
  task_share_goal: { context: "housework_schedule", action: "Cùng liệt kê phần việc và thống nhất tiêu chí chia đều, chẳng hạn công sức hoặc thời lượng dự kiến, trước khi chốt ai nhận việc gì. Hỏi thêm nếu chưa rõ mức công việc; số lượng đầu việc bằng nhau chưa chắc là công sức ngang nhau, và mong muốn này không chứng minh lịch cũ bất công." },
};

const TEXT = {
  transfer: {
    cards: [["the-hermit", "upright"], ["two-of-swords", "upright"], ["eight-of-pentacles", "reversed"]],
    summary: "Bạn có thể chuẩn bị việc xin chuyển nhóm bằng cách biến các điều kiện mình đã nêu thành những điểm cần xác nhận. Các bước bên dưới tập trung vào thông tin cần hỏi, không coi việc chuyển hoặc một phương án cụ thể đã được chấp thuận.",
    overview: "Ba lá gợi ba góc tham khảo: điều mình coi trọng, thông tin cần làm rõ và cách dùng công sức học nghề. Những góc nhìn này có thể giúp sắp xếp cuộc trao đổi; các điều kiện cụ thể trong câu hỏi vẫn là căn cứ để lựa chọn hành động. Không cần suy ra động cơ hoặc cảm xúc của bạn từ biểu tượng.",
    themes: ["Điều kiện đã nêu", "Thông tin cần xác nhận", "Công việc và học nghề"],
    keyMessages: ["Dùng ưu tiên của mình làm tiêu chí trao đổi.", "Đối chiếu điều đã biết với thông tin còn cần xác nhận.", "Hỏi cách công việc và việc học phù hợp với điều kiện đã nêu."],
    applications: [
      "Ở vị trí Bối cảnh, bạn có thể dùng góc nhìn này để xem điều kiện nào trong câu hỏi cần giữ khi trao đổi về chuyển nhóm. Đây là lời mời xác định tiêu chí, không phải kết luận về quá trình suy ngẫm hay lý do muốn chuyển của bạn.",
      "Ở vị trí Hiện tại, bạn có thể phân biệt điều đã nêu với điều cần hỏi đầu mối phụ trách. Những chi tiết còn thiếu cần được xác nhận; không thể từ lá suy ra bạn do dự, trì hoãn hoặc sợ lựa chọn.",
      "Ở vị trí Hướng đi, góc nhìn này gợi việc xem công sức học và làm sẽ được sử dụng ra sao trong vai trò dự kiến. Bạn có thể đối chiếu yêu cầu thực tế với điều kiện của mình, không coi chiều ngược là bằng chứng thiếu kiên nhẫn hoặc làm việc đối phó.",
    ],
    connections: "Có thể đặt việc xác định tiêu chí, làm rõ thông tin và xem xét công sức cạnh nhau để chuẩn bị câu hỏi. Đây là cách tổ chức cuộc trao đổi, không phải chuỗi nguyên nhân mà các lá xác nhận. Các hành động theo dữ kiện bên dưới mới chỉ ra điểm cụ thể cần hỏi thêm; bạn có thể bỏ góc biểu tượng nào không giúp ích.",
    baseAction: "Xác nhận thêm quy trình, điều kiện và thời điểm xin chuyển với đầu mối phù hợp. Nếu đã có nhóm đích, hỏi về nhiệm vụ thực tế; chưa coi câu trả lời cho một điểm là sự chấp thuận toàn bộ đề nghị.",
    reflectiveQuestion: "Điểm nào cần được xác nhận để phương án chuyển nhóm phù hợp với những điều kiện bạn đã nêu?",
    closingNote: "Bạn có thể dùng các bước này để chuẩn bị cuộc trao đổi rồi quyết định từ thông tin thực tế. Lá bài không xác nhận chính sách nơi làm việc hoặc thay cho sự thống nhất giữa những người liên quan.",
  },
  housework_schedule: {
    cards: [["six-of-wands", "upright"], ["six-of-cups", "reversed"], ["the-hermit", "upright"]],
    summary: "Bạn có thể trả lời đề nghị đổi lịch bằng cách làm rõ giờ và phần việc, đồng thời đối chiếu với các điều kiện mình đã nêu. Chỉ sau khi hai bên xác nhận mới coi đó là phương án chung; chưa cần đồng ý hoặc tự đoán lịch của người cùng nhà.",
    overview: "Ba lá gợi các góc nhìn về ghi nhận công sức, xem lại cách làm cũ khi cần và dành một lúc xác định điều mình có thể nhận. Những góc này không kể lại lịch sử chung sống hoặc quyết định ai đã đóng góp nhiều hơn. Các giới hạn và mong muốn bạn nêu là căn cứ cho những câu hỏi cụ thể bên dưới.",
    themes: ["Điều kiện tham gia", "Phạm vi phần việc", "Xác nhận phương án chung"],
    keyMessages: ["Ghi nhận công sức cụ thể nếu có điều muốn ghi nhận.", "Xem lại cách làm theo yêu cầu hiện tại thay vì mặc định phải giữ hoặc bỏ lịch cũ.", "Dùng điều kiện đã nêu để xác định phương án mình có thể nhận."],
    applications: [
      "Ở vị trí Bối cảnh, bạn có thể dùng góc nhìn này để hỏi cách hai bên ghi nhận phần việc đã làm, nếu cần. Nó không chứng minh đã có thành công chung hoặc ai đang đóng góp nhiều hơn; việc phân chia vẫn cần thỏa thuận thực tế.",
      "Ở vị trí Hiện tại, bạn có thể xem lịch hoặc cách chia việc cũ còn phù hợp với đề nghị và điều kiện hiện tại hay không. Không cần suy ra ai đang bám víu quá khứ hoặc cho rằng một thỏa thuận trước đây đã thất bại.",
      "Ở vị trí Hướng đi, bạn có thể dùng các điều kiện mình đã nêu để xác định điều cần nói rõ trước khi trả lời. Khoảng cân nhắc này là lựa chọn chuẩn bị, không phải dấu hiệu né tránh người cùng nhà hoặc sợ trao đổi thẳng thắn.",
    ],
    connections: "Ghi nhận công sức, rà lại cách làm khi cần và tự xác định điều mình có thể nhận là ba góc tham khảo. Chúng không chứng minh có xung đột hoặc điều kiện sống đã thay đổi. Để chốt việc đổi lịch, hãy đối chiếu đề nghị với điều kiện cụ thể rồi hỏi những chi tiết còn thiếu, thay vì để biểu tượng quyết định lịch chung.",
    baseAction: "Hỏi giờ mới, việc đổi lịch áp dụng một lần hay thường xuyên và phần việc mỗi người. Nhắc lại phương án sau khi hai bên xác nhận để kiểm tra đã hiểu giống nhau; không mặc định đổi giờ đồng nghĩa phải đổi cách chia việc.",
    reflectiveQuestion: "Bạn còn cần câu trả lời nào để biết phương án đổi lịch có phù hợp với các điều kiện đã nêu?",
    closingNote: "Bạn có thể hỏi thêm hoặc đề xuất điều chỉnh trước khi trả lời. Một phương án chỉ trở thành thỏa thuận chung khi hai bên cùng xác nhận, không phải vì lá bài dự đoán sẽ thuận lợi.",
  },
} as const;

export function renderConstraintReading(question: string, cards: InterpretationCardInput[], context: ConstraintContext, facts: ConstraintFact[]): ConstraintReadingOutcome {
  const input = validateConstraintInput(question, cards, context, facts);
  if (needsReadingSupport(input.evidence.facts[0].text)) return { status: "not_applied", reason: "needs_support" };
  if (input.context === null) return { status: "not_applied", reason: "unsupported_scope" };
  const template = TEXT[input.context];
  if (input.evidence.cards.some((card, i) => card.cardId !== template.cards[i][0] || card.orientation !== template.cards[i][1])) return { status: "not_applied", reason: "unsupported_scope" };
  if (!input.facts.length || input.facts.some(f => RULES[f.kind].context !== input.context)) return { status: "not_applied", reason: "unsupported_constraints" };
  const result = InterpretationResultSchema.parse({
    summary: template.summary, overview: template.overview, themes: [...template.themes],
    perCard: input.evidence.cards.map((card, i) => ({ position: card.position, keyMessage: template.keyMessages[i], text: `${card.name} (${card.orientation === "upright" ? "xuôi" : "ngược"}): ${CONTROLLED_CARD_SYMBOLS[input.context!][i]} ${template.applications[i]}` })),
    connections: template.connections,
    actionSuggestions: [...input.facts.map(f => `Với điều bạn nêu: “${f.quote}”: ${RULES[f.kind].action}`), template.baseAction],
    reflectiveQuestion: template.reflectiveQuestion, closingNote: template.closingNote,
  });
  return { status: "applied", result, coverage: input.facts.map((f, actionIndex) => ({ factId: f.id, supportRef: "F1", actionIndex })) };
}
