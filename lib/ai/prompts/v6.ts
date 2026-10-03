import type { PromptVersion } from "./types";
import { PROMPT_V5 } from "./v5";
import { V6_SYSTEM_INSTRUCTION } from "./v6-system";

export const PROMPT_V6: PromptVersion = {
  ...PROMPT_V5,
  id: "v6-2026-10-03",
  systemInstruction: V6_SYSTEM_INSTRUCTION,
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
        priority: ["specificity", "insight", "evidence"],
        grounding: "strict",
        interpretationDepth: "high",
        questionSpecificity: "high",
        synthesisRequired: true,
        coreTensionRequired: true,
        hiddenQuestionRequired: true,
        decisionStyle: "reflective-not-predictive",
        allowUnsupportedAssumptions: false,
        avoidCardByCardParaphrase: true,
        avoidGenericAdvice: true,
        interpretationRules: {
          connectCards: true,
          identifyTension: true,
          identifyContradictions: true,
          identifyTradeoffs: true,
          deriveInsightBeyondBasicMeaning: true,
          answerOriginalQuestionDirectly: true,
          distinguishEvidenceFromInference: true,
          frameInferenceAsHypothesis: true,
        },
        engagementRules: {
          requireInterpretationThesis: true,
          requireNarrativeProgression: true,
          preferConcreteLanguage: true,
          preferThoughtProvokingInsight: true,
          avoidMeaningRepetition: true,
          avoidFiller: true,
          avoidFormulaicHealingLanguage: true,
          avoidUnsupportedPraise: true,
        },
        actionRules: {
          mustBeObservable: true,
          mustBeTestable: true,
          mustRelateToQuestion: true,
          mustRelateToCardEvidence: true,
          preferConversationOrExperiment: true,
        },
      },
    });
  },
  releasedAt: "2026-10-03",
  notes: "Giữ schema và validator của v5. Mở rộng outputRequirements trong input và thêm vào system instruction phần giải nghĩa từng cờ cấu hình: ưu tiên specificity → insight → evidence, bắt buộc tổng hợp, nêu mâu thuẫn cốt lõi và câu hỏi ẩn, tách bằng chứng khỏi suy luận, gợi ý hành động quan sát và kiểm chứng được.",
};
