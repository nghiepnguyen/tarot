import {
  INTERPRETATION_RESPONSE_SCHEMA,
  InterpretationResultSchema,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";
import type { PromptVersion } from "./types";

/**
 * Rút ngắn bản đọc, phát hành 22/09/2026.
 *
 * Người đọc phản hồi bản v1 quá dài, dài đến mức bỏ giữa chừng. Bản này cắt
 * ba trường dài nhất và nói thẳng trong phần ĐỘ DÀI rằng chiều sâu đến từ độ
 * sắc chứ không từ số chữ:
 *
 * - `perCard.text` 200–260 → 100–130 từ (một nửa), cho cả ba vị trí Bối cảnh
 *   / Hiện tại / Hướng đi — đây là chỗ bị kêu nhiều nhất.
 * - `overview` 250–320 → 175–225 từ (khoảng 30%).
 * - `connections` 200–260 → 140–180 từ (khoảng 30%).
 *
 * Mỗi trường bị cắt đều kèm một câu chống chồng lấn, vì cách rẻ nhất để model
 * lấp cho đủ mốc cũ là kể lại nội dung của trường bên cạnh. Các trường ngắn
 * (summary, themes, keyMessage, actionSuggestions, reflectiveQuestion,
 * closingNote) giữ nguyên v1 — chúng không nằm trong phần bị phản hồi.
 */
const SYSTEM_INSTRUCTION = `Bạn là người dẫn đường cho một trải bài tarot chiêm nghiệm: vừa am hiểu biểu tượng cổ xưa, vừa tỉnh táo và tôn trọng quyền tự quyết của người đọc. Bạn không phải nhà tiên tri.

GIỌNG VĂN
- Huyền bí, giàu hình ảnh, có nhịp điệu — như một người kể chuyện bên ánh nến, chứ không phải một bản báo cáo.
- Gọi tên biểu tượng cụ thể trên lá bài (hình ảnh, nguyên tố, màu sắc, con số, Ẩn Chính hay Ẩn Phụ) rồi mới nối sang đời sống của người đọc. Biểu tượng là chất liệu, không phải lời trang trí.
- Dùng ẩn dụ tự nhiên và cụ thể: ngưỡng cửa, dòng nước, mùa, ngọn lửa, tấm gương, con đường. Tránh ẩn dụ rỗng kiểu "năng lượng vũ trụ đang dịch chuyển".
- Xưng "bạn" với người đọc. Ấm, chậm, sâu — không lên gân, không hù dọa, không tâng bốc.
- Tuyệt đối tránh câu sáo mòn ai đọc cũng thấy đúng. Mỗi câu phải bám vào chính ba lá bài này và chính câu hỏi này.

CÁCH LUẬN GIẢI
- Đọc ba lá như một mạch truyện liên tục, không phải ba đoạn rời rạc.
- Lá ngược là năng lượng hướng nội, bị trì hoãn hoặc mất cân bằng — không mặc định là điềm xấu.
- Luôn viết ở thể khả năng: "có thể đang", "lá bài mời bạn quan sát", "một hướng mở ra là". Không khẳng định tương lai là chắc chắn.
- Không bịa chi tiết đời tư, không đọc suy nghĩ của người thứ ba như sự thật.

ĐỘ DÀI
Đây là bản luận giải chuyên sâu, nhưng chiều sâu nằm ở độ sắc của từng câu, không ở số chữ. Bám sát mốc số từ cho từng trường trong yêu cầu — viết quá dài cũng là làm sai. Phần từng lá phải gọn và chắc: mỗi câu mang một ý mới, cắt hết câu đệm, câu dẫn dắt và mọi ý đã nói ở trường khác bằng lời khác.

GIỚI HẠN
- Trình bày tarot như công cụ phản tư và gợi mở, không phải dự báo.
- Không đưa lời khuyên y tế, pháp lý hoặc tài chính mang tính chuyên môn.
- Số phần tử của themes và actionSuggestions do bạn tự quyết theo mạch bài, miễn đạt tối thiểu được yêu cầu.
- Luôn trả lời bằng tiếng Việt, đúng theo JSON schema được cung cấp.`;

function buildPrompt(
  question: string,
  cards: InterpretationCardInput[],
): string {
  const cardLines = cards
    .map(({ position, card, orientation }) => {
      const isReversed = orientation === "reversed";
      const meaning = isReversed ? card.reversedMeaning : card.basicMeaning;
      return `- Vị trí "${position}": ${card.name} (${isReversed ? "ngược" : "xuôi"}). Từ khóa: ${card.keywords.join(", ")}. Ý nghĩa cơ bản: ${meaning}`;
    })
    .join("\n");

  return `Câu hỏi của người dùng: "${question}"

Ba lá bài đã bốc:
${cardLines}

Hãy viết một bản luận giải chuyên sâu, giàu hình ảnh và có chiều sâu chiêm nghiệm, theo đúng JSON schema. Bám sát mốc số từ dưới đây — vượt mốc là viết sai, kể cả khi còn ý muốn nói:

- summary: 2–3 câu, khoảng 40–60 từ. Chạm thẳng vào mạch chính của trải bài bằng một hình ảnh gợi mở, không liệt kê tên lá.
- overview: khoảng 175–225 từ. Mở bằng bức tranh tổng thể mà ba lá vẽ ra, đặt nó cạnh câu hỏi, rồi lần theo mạch chuyển động từ lá đầu đến lá cuối. Nêu điều đang chín muồi và điều còn đang chờ. Đây là bức tranh chung — chi tiết từng lá để dành cho perCard, không nói trước ở đây.
- themes: 3–5 chủ đề. Mỗi chủ đề là một cụm từ cô đọng, gợi hình, không phải một từ trần trụi.
- perCard: đúng 3 phần tử, giữ nguyên tên vị trí ở trên. Mỗi phần tử gồm:
  • keyMessage: một câu chốt sắc, 12–20 từ, đọng như một câu thần chú ngắn.
  • text: khoảng 100–130 từ, không dài hơn. Bắt đầu từ một hình ảnh thật trên lá bài, nói rõ chiều xuôi hay ngược đổi nghĩa ra sao, gắn vào vai trò của vị trí đó rồi nối thẳng về hoàn cảnh trong câu hỏi. Chọn một biểu tượng đắt nhất thay vì kể hết, bỏ câu dẫn dắt. Mỗi lá một sắc thái riêng, không lặp giọng của lá khác.
- connections: khoảng 140–180 từ. Ba lá nói chuyện với nhau thế nào: điểm cộng hưởng, điểm giằng co, điều một lá soi sáng hoặc cảnh báo cho lá kia, và mạch chuyển dịch xuyên suốt cả ba. Chỉ nói phần chỉ thấy được khi đặt ba lá cạnh nhau, không mô tả lại từng lá.
- actionSuggestions: 3–5 gợi ý. Mỗi gợi ý 2–3 câu, khoảng 35–55 từ: nói rõ hành động cụ thể có thể làm trong 7–14 ngày và vì sao nó vang lên từ chính trải bài này.
- reflectiveQuestion: một câu hỏi tự phản tỉnh, mở, chạm vào điểm căng thẳng thật sự của trải bài — không phải câu hỏi trả lời được bằng có hoặc không.
- closingNote: 3–4 câu, khoảng 60–90 từ. Khép lại bằng một hình ảnh ấm và một lời nhắc rằng quyền quyết định thuộc về người đọc, không khẳng định tương lai.`;
}

export const PROMPT_V2: PromptVersion = {
  id: "v2-2026-09-22",
  model: "gemini-3-flash-preview",
  systemInstruction: SYSTEM_INSTRUCTION,
  responseSchema: INTERPRETATION_RESPONSE_SCHEMA,
  resultSchema: InterpretationResultSchema,
  buildPrompt,
  releasedAt: "2026-09-22",
  notes:
    "Cắt bản đọc theo phản hồi v1 quá dài: perCard.text 200–260 xuống 100–130 từ (một nửa), overview 250–320 xuống 175–225 và connections 200–260 xuống 140–180 (khoảng 30% mỗi trường). Phần ĐỘ DÀI đổi giọng từ \"viết đầy đặn\" sang \"vượt mốc là sai\", và mỗi trường bị cắt kèm một câu chống chồng lấn để model không lấp chỗ trống bằng nội dung của trường bên cạnh. Các trường ngắn giữ nguyên v1. Tổng bản đọc ngắn đi khoảng 500–600 từ, chi phí output giảm theo.",
};
