import { z } from "zod";
import type { AiInterpretation } from "@prisma/client";
import { getModelPersona } from "@/lib/ai/models";
import type { TarotCard } from "@/lib/tarot/cards";
import type { Orientation } from "@/lib/tarot/draw";
import type { InterpretationQuality } from "./quality";

export const COST_PER_INTERPRETATION = 10;

/**
 * Trần thời gian cho một lượt sinh, tính từ lúc gửi request.
 *
 * Đây không phải chuyện hiệu năng mà là chuyện tiền. Credit trừ *trước* khi
 * gọi model, và đường hoàn nằm trong khối `catch` của `app/actions/ai.ts`.
 * `maxDuration` của Vercel là 60 giây; chạm trần thì function bị giết giữa
 * chừng, `catch` không bao giờ chạy, và người dùng mất credit mà không có bài
 * đọc nào. Cắt ở 45 giây để lỗi luôn quay về dạng một exception mình bắt
 * được, còn dư 15 giây cho hai lệnh ghi hoàn tiền.
 *
 * Gói Vercel free không nâng được `maxDuration`, nên con số này là thứ duy
 * nhất giữ cho cửa sổ đó đóng.
 */
export const GENERATION_TIMEOUT_MS = 45_000;
export const DEMO_TOPUP_AMOUNT = 50;

export const FREE_TRIAL_UNLOCKS = 2;
export const FREE_TRIAL_CREDITS = FREE_TRIAL_UNLOCKS * COST_PER_INTERPRETATION;

export interface InterpretationCardInput {
  position: string;
  card: TarotCard;
  orientation: Orientation;
}

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
  quality?: InterpretationQuality;
}

/** Thang sao của mỗi tiêu chí. 1 là thấp nhất, không có 0. */
export const MIN_STARS = 1;
export const MAX_STARS = 5;

/**
 * Ba tiêu chí người đọc chấm, theo đúng thứ tự hiện trên màn hình.
 *
 * Để ở đây chứ không ở `lib/ai/reviews.ts` vì hộp chấm điểm là client
 * component, mà `reviews.ts` khai `server-only`. Khoá trùng tên cột trong
 * `InterpretationReview`, nên thêm tiêu chí thứ tư là một migration chứ không
 * phải một dòng trong mảng này.
 */
export const REVIEW_CRITERIA = [
  {
    key: "accuracy",
    label: "Độ chính xác",
    english: "Accuracy",
    hint: "Bài đọc có bám đúng lá bài và câu hỏi của bạn không?",
  },
  {
    key: "clarity",
    label: "Độ rõ ràng & Dễ hiểu",
    english: "Clarity",
    hint: "Chữ nghĩa có dễ theo không, hay phải đọc lại mới hiểu?",
  },
  {
    key: "actionability",
    label: "Tính hữu ích & Giải pháp",
    english: "Actionability",
    hint: "Đọc xong bạn có biết mình làm gì tiếp theo không?",
  },
] as const;

export type ReviewCriterionKey = (typeof REVIEW_CRITERIA)[number]["key"];

/** Điểm một người đã chấm cho một bản diễn giải. */
export interface InterpretationReviewInput {
  accuracy: number;
  clarity: number;
  actionability: number;
  comment?: string | null;
}

/**
 * Shape used for rendering. Readings generated before summary/themes/
 * closingNote existed have those columns as null in the database, so the
 * UI treats them as optional and simply omits those sections rather than
 * erroring — old interpretations just show less than new ones.
 */
export interface DisplayInterpretation {
  /** Id của chính row `AiInterpretation` — hộp chấm điểm ghi ngược về đây. */
  id: string;
  /**
   * Bút danh của model đã viết bài này, hoặc `null` với model đã gỡ khỏi danh
   * sách. Người đọc thấy tên này thay cho tên model, xem `AiModel.persona`.
   */
  reader?: string | null;
  /** Điểm người này đã chấm, nếu đã chấm. Hộp chấm điểm mở sẵn với điểm cũ. */
  review?: InterpretationReviewInput | null;
  summary?: string | null;
  overview: string;
  themes?: string[] | null;
  perCard: Array<{ position: string; keyMessage?: string | null; text: string }>;
  connections: string;
  actionSuggestions: string[];
  reflectiveQuestion: string;
  closingNote?: string | null;
}

export function toDisplayInterpretation(
  row: AiInterpretation,
  review?: InterpretationReviewInput | null,
): DisplayInterpretation {
  return {
    id: row.id,
    reader: getModelPersona(row.model),
    review: review ?? null,
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
