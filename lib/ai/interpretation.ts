import { z } from "zod";
import type { AiInterpretation } from "@prisma/client";
import type { TarotCard } from "@/lib/tarot/cards";
import type { Orientation } from "@/lib/tarot/draw";

export const COST_PER_INTERPRETATION = 10;
export const DEMO_TOPUP_AMOUNT = 50;
export const GEMINI_MODEL = "gemini-3-flash-preview";

export const FREE_TRIAL_UNLOCKS = 2;
export const FREE_TRIAL_CREDITS = FREE_TRIAL_UNLOCKS * COST_PER_INTERPRETATION;

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
- Diễn giải chi tiết, giàu ý nghĩa, tránh chung chung sáo rỗng.
- Số lượng phần tử trong các mảng (themes, actionSuggestions) do bạn tự quyết định theo mức độ phù hợp, miễn có ít nhất một phần tử.
- Luôn trả lời bằng tiếng Việt, đúng theo JSON schema được cung cấp.`;

// perCard stays fixed at exactly 3 entries (one per drawn card); themes and
// actionSuggestions are open-ended arrays the model sizes itself.
export const INTERPRETATION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    overview: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    perCard: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "string" },
          keyMessage: { type: "string" },
          text: { type: "string" },
        },
        required: ["position", "keyMessage", "text"],
      },
    },
    connections: { type: "string" },
    actionSuggestions: { type: "array", items: { type: "string" } },
    reflectiveQuestion: { type: "string" },
    closingNote: { type: "string" },
  },
  required: [
    "summary",
    "overview",
    "themes",
    "perCard",
    "connections",
    "actionSuggestions",
    "reflectiveQuestion",
    "closingNote",
  ],
} as const;

export const InterpretationResultSchema = z.object({
  summary: z.string().min(1),
  overview: z.string().min(1),
  themes: z.array(z.string().min(1)).min(1),
  perCard: z
    .array(
      z.object({
        position: z.string().min(1),
        keyMessage: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .length(3),
  connections: z.string().min(1),
  actionSuggestions: z.array(z.string().min(1)).min(1),
  reflectiveQuestion: z.string().min(1),
  closingNote: z.string().min(1),
});

/** Full shape a fresh Gemini generation must satisfy. */
export type InterpretationResult = z.infer<typeof InterpretationResultSchema>;

/**
 * Shape used for rendering. Readings generated before summary/themes/
 * closingNote existed have those columns as null in the database, so the
 * UI treats them as optional and simply omits those sections rather than
 * erroring — old interpretations just show less than new ones.
 */
export interface DisplayInterpretation {
  summary?: string | null;
  overview: string;
  themes?: string[] | null;
  perCard: Array<{ position: string; keyMessage?: string | null; text: string }>;
  connections: string;
  actionSuggestions: string[];
  reflectiveQuestion: string;
  closingNote?: string | null;
}

export function toDisplayInterpretation(row: AiInterpretation): DisplayInterpretation {
  return {
    summary: row.summary,
    overview: row.overview,
    themes: row.themes as unknown as string[] | null,
    perCard: row.perCard as unknown as DisplayInterpretation["perCard"],
    connections: row.connections,
    actionSuggestions:
      (row.actionSuggestionsList as unknown as string[] | null) ?? [row.actionSuggestions],
    reflectiveQuestion: row.reflectiveQuestion,
    closingNote: row.closingNote,
  };
}

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

Hãy viết diễn giải chi tiết, giàu ý nghĩa theo đúng JSON schema, gồm:
- summary: một câu tóm tắt ngắn, súc tích tinh thần chính của trải bài này.
- overview: tổng quan chi tiết về trải bài trong bối cảnh câu hỏi.
- themes: các chủ đề chính nổi bật lên từ trải bài (một hoặc nhiều, tự quyết định số lượng phù hợp).
- perCard: diễn giải riêng cho từng lá theo đúng ba vị trí ở trên (đúng 3 phần tử, giữ nguyên tên vị trí). Mỗi phần tử gồm keyMessage (một câu chốt ngắn gọn) và text (diễn giải đầy đủ hơn).
- connections: mối liên hệ giữa ba lá.
- actionSuggestions: danh sách gợi ý hành động thực tế, cụ thể (một hoặc nhiều gợi ý, tự quyết định số lượng phù hợp).
- reflectiveQuestion: một câu hỏi tự phản tỉnh để người dùng suy ngẫm thêm.
- closingNote: một câu kết nhẹ nhàng, khích lệ, không khẳng định tương lai.`;
}
