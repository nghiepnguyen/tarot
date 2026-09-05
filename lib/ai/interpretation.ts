import { z } from "zod";
import type { TarotCard } from "@/lib/tarot/cards";
import type { Orientation } from "@/lib/tarot/draw";

export const COST_PER_INTERPRETATION = 10;
export const DEMO_TOPUP_AMOUNT = 50;
export const GEMINI_MODEL = "gemini-3-flash-preview";

export interface InterpretationCardInput {
  position: string;
  card: TarotCard;
  orientation: Orientation;
}

export const SYSTEM_INSTRUCTION = `Bạn là trợ lý diễn giải tarot cho một sản phẩm tự phản tỉnh, không phải chuyên gia tâm linh hay nhà tiên tri.
Quy tắc bắt buộc:
- Trình bày tarot như công cụ tham khảo và gợi mở suy nghĩ, không khẳng định tương lai là chắc chắn.
- Không đưa ra lời khuyên y tế, pháp lý hoặc tài chính mang tính chuyên môn.
- Giọng văn nhẹ nhàng, tôn trọng, khuyến khích người đọc tự chiêm nghiệm thay vì áp đặt kết luận.
- Luôn trả lời bằng tiếng Việt, đúng theo JSON schema được cung cấp.`;

export const INTERPRETATION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overview: { type: "string" },
    perCard: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "string" },
          text: { type: "string" },
        },
        required: ["position", "text"],
      },
    },
    connections: { type: "string" },
    actionSuggestions: { type: "string" },
    reflectiveQuestion: { type: "string" },
  },
  required: [
    "overview",
    "perCard",
    "connections",
    "actionSuggestions",
    "reflectiveQuestion",
  ],
} as const;

export const InterpretationResultSchema = z.object({
  overview: z.string().min(1),
  perCard: z
    .array(
      z.object({
        position: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .length(3),
  connections: z.string().min(1),
  actionSuggestions: z.string().min(1),
  reflectiveQuestion: z.string().min(1),
});

export type InterpretationResult = z.infer<typeof InterpretationResultSchema>;

export function buildInterpretationPrompt(
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

Hãy viết diễn giải chi tiết theo đúng JSON schema, gồm:
- overview: tổng quan về trải bài trong bối cảnh câu hỏi.
- perCard: diễn giải riêng cho từng lá theo đúng ba vị trí ở trên (đúng 3 phần tử, giữ nguyên tên vị trí).
- connections: mối liên hệ giữa ba lá.
- actionSuggestions: gợi ý hành động thực tế người dùng có thể cân nhắc.
- reflectiveQuestion: một câu hỏi tự phản tỉnh để người dùng suy ngẫm thêm.`;
}
