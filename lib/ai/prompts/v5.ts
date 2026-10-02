import { z } from "zod";
import type { PromptVersion } from "./types";
import { DEFAULT_AI_MODEL_ID } from "../models";
import { assessInterpretationQuality, assertPositions } from "../quality";
import { V5_SYSTEM_INSTRUCTION } from "./v5-system";
import { V5_RESPONSE_SCHEMA } from "./v5-schema";

const text = z.string().trim().min(1);
const resultSchema = z.strictObject({
  summary: text, overview: text,
  themes: z.array(z.string().trim().min(3)).min(3).max(5),
  perCard: z.array(z.strictObject({ position: text, keyMessage: text, text })).length(3),
  connections: text, actionSuggestions: z.array(text).min(3).max(5),
  reflectiveQuestion: text, closingNote: text,
});

export const PROMPT_V5: PromptVersion = {
  id: "v5-2026-10-02", model: DEFAULT_AI_MODEL_ID,
  systemInstruction: V5_SYSTEM_INSTRUCTION,
  responseSchema: V5_RESPONSE_SCHEMA, schemaFormat: "json",
  resultSchema,
  buildPrompt(question, cards) {
    return JSON.stringify({
      question, context: "",
      spread: { name: "Three Card", cards: cards.map(({ position, card, orientation }) => ({
        position, cardId: card.id, card: card.name, orientation,
        keywords: card.keywords,
        basicMeaning: orientation === "reversed" ? card.reversedMeaning : card.basicMeaning,
      })) },
      outputRequirements: {
        themesMin: 3, themesMax: 5,
        actionSuggestionsMin: 3, actionSuggestionsMax: 5,
        actionTimeframe: "7–14 ngày",
        priority: "evidence-first",
      },
    });
  },
  validateResult(result, cards) {
    assertPositions(result, cards.map(card => card.position));
    return assessInterpretationQuality(result);
  },
  releasedAt: "2026-10-02",
  notes: "Evidence-first; mở bằng luận điểm trung tâm; phân vai rõ từng field; hạn chế lời trấn an, sáo ngữ và ẩn dụ trang trí. Giữ nguyên hợp đồng dữ liệu v4.",
};
