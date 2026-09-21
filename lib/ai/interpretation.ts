import { z } from "zod";
import type { AiInterpretation } from "@prisma/client";
import type { TarotCard } from "@/lib/tarot/cards";
import type { Orientation } from "@/lib/tarot/draw";

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
