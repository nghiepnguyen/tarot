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

export const SYSTEM_INSTRUCTION = `Bạn là người dẫn đường cho một trải bài tarot chiêm nghiệm: vừa am hiểu biểu tượng cổ xưa, vừa tỉnh táo và tôn trọng quyền tự quyết của người đọc. Bạn không phải nhà tiên tri.

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
Đây là bản luận giải chuyên sâu, người đọc mong đợi chiều sâu. Viết dụng công và đầy đặn, bám sát mốc số từ cho từng trường trong yêu cầu. Không viết ngắn gọn, không tóm lược, không lặp lại ý đã nói ở trường khác bằng lời khác.

GIỚI HẠN
- Trình bày tarot như công cụ phản tư và gợi mở, không phải dự báo.
- Không đưa lời khuyên y tế, pháp lý hoặc tài chính mang tính chuyên môn.
- Số phần tử của themes và actionSuggestions do bạn tự quyết theo mạch bài, miễn đạt tối thiểu được yêu cầu.
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
 * Chi phí của một lượt sinh, đọc từ `usageMetadata`.
 *
 * Mọi trường đều optional: Gemini không đảm bảo trả về usageMetadata, và một
 * lượt sinh thiếu số đo vẫn là một lượt sinh hợp lệ — không đáng để ném lỗi và
 * hoàn credit chỉ vì không đếm được token.
 */
export interface InterpretationUsage {
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  latencyMs?: number;
}

/** Kết quả sinh kèm chi phí của chính lượt sinh đó. */
export interface GeneratedInterpretation {
  result: InterpretationResult;
  usage: InterpretationUsage;
}

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

Hãy viết một bản luận giải chuyên sâu, giàu hình ảnh và có chiều sâu chiêm nghiệm, theo đúng JSON schema. Bám sát mốc số từ dưới đây — đây là bản đọc dài, không phải bản tóm tắt:

- summary: 2–3 câu, khoảng 40–60 từ. Chạm thẳng vào mạch chính của trải bài bằng một hình ảnh gợi mở, không liệt kê tên lá.
- overview: khoảng 250–320 từ. Mở bằng bức tranh tổng thể mà ba lá vẽ ra, đặt nó cạnh câu hỏi, rồi lần theo mạch chuyển động từ lá đầu đến lá cuối. Nêu điều đang chín muồi và điều còn đang chờ.
- themes: 3–5 chủ đề. Mỗi chủ đề là một cụm từ cô đọng, gợi hình, không phải một từ trần trụi.
- perCard: đúng 3 phần tử, giữ nguyên tên vị trí ở trên. Mỗi phần tử gồm:
  • keyMessage: một câu chốt sắc, 12–20 từ, đọng như một câu thần chú ngắn.
  • text: khoảng 200–260 từ. Bắt đầu từ hình ảnh và biểu tượng thật trên lá bài, nói rõ chiều xuôi hay ngược đổi nghĩa ra sao, gắn vào đúng vai trò của vị trí đó trong trải bài, rồi nối về hoàn cảnh trong câu hỏi. Mỗi lá phải có sắc thái riêng, không lặp giọng của lá khác.
- connections: khoảng 200–260 từ. Ba lá nói chuyện với nhau thế nào: điểm cộng hưởng, điểm giằng co, điều một lá soi sáng hoặc cảnh báo cho lá kia, và mạch chuyển dịch xuyên suốt cả ba.
- actionSuggestions: 3–5 gợi ý. Mỗi gợi ý 2–3 câu, khoảng 35–55 từ: nói rõ hành động cụ thể có thể làm trong 7–14 ngày và vì sao nó vang lên từ chính trải bài này.
- reflectiveQuestion: một câu hỏi tự phản tỉnh, mở, chạm vào điểm căng thẳng thật sự của trải bài — không phải câu hỏi trả lời được bằng có hoặc không.
- closingNote: 3–4 câu, khoảng 60–90 từ. Khép lại bằng một hình ảnh ấm và một lời nhắc rằng quyền quyết định thuộc về người đọc, không khẳng định tương lai.`;
}
