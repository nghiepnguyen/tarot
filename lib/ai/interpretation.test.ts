import { describe, expect, it } from "vitest";
import {
  COST_PER_INTERPRETATION,
  FREE_TRIAL_CREDITS,
  FREE_TRIAL_UNLOCKS,
  InterpretationResultSchema,
  buildInterpretationPrompt,
  toDisplayInterpretation,
  type InterpretationCardInput,
} from "./interpretation";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { AiInterpretation } from "@prisma/client";

describe("FREE_TRIAL_CREDITS", () => {
  it("grants exactly enough credit for FREE_TRIAL_UNLOCKS unlocks, no partial unlock left over", () => {
    expect(FREE_TRIAL_CREDITS).toBe(FREE_TRIAL_UNLOCKS * COST_PER_INTERPRETATION);
    expect(FREE_TRIAL_CREDITS % COST_PER_INTERPRETATION).toBe(0);
  });
});

const sampleCards: InterpretationCardInput[] = [
  { position: "Bối cảnh", card: TAROT_CARDS[0], orientation: "upright" },
  { position: "Hiện tại", card: TAROT_CARDS[1], orientation: "reversed" },
  { position: "Hướng đi", card: TAROT_CARDS[2], orientation: "upright" },
];

describe("buildInterpretationPrompt", () => {
  it("includes the question and every card's position, name, and orientation", () => {
    const prompt = buildInterpretationPrompt("Tôi nên làm gì?", sampleCards);

    expect(prompt).toContain("Tôi nên làm gì?");
    for (const { position, card, orientation } of sampleCards) {
      expect(prompt).toContain(position);
      expect(prompt).toContain(card.name);
      expect(prompt).toContain(orientation === "reversed" ? "ngược" : "xuôi");
    }
  });
});

describe("InterpretationResultSchema", () => {
  const valid = {
    summary: "Tóm tắt.",
    overview: "Tổng quan.",
    themes: ["Khởi đầu"],
    perCard: [
      { position: "Bối cảnh", keyMessage: "Chốt ý.", text: "..." },
      { position: "Hiện tại", keyMessage: "Chốt ý.", text: "..." },
      { position: "Hướng đi", keyMessage: "Chốt ý.", text: "..." },
    ],
    connections: "Liên hệ.",
    actionSuggestions: ["Gợi ý một."],
    reflectiveQuestion: "Câu hỏi?",
    closingNote: "Lời kết.",
  };

  it("accepts a well-formed result", () => {
    expect(InterpretationResultSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts themes and actionSuggestions of any non-zero length (model decides count)", () => {
    const wide = {
      ...valid,
      themes: ["A", "B", "C", "D", "E"],
      actionSuggestions: ["1", "2", "3", "4"],
    };
    expect(InterpretationResultSchema.safeParse(wide).success).toBe(true);
  });

  it("rejects empty themes or actionSuggestions arrays", () => {
    expect(InterpretationResultSchema.safeParse({ ...valid, themes: [] }).success).toBe(false);
    expect(
      InterpretationResultSchema.safeParse({ ...valid, actionSuggestions: [] }).success,
    ).toBe(false);
  });

  it("rejects a result with the wrong number of per-card entries", () => {
    const invalid = { ...valid, perCard: valid.perCard.slice(0, 2) };
    expect(InterpretationResultSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a result missing a required field", () => {
    const invalid: Partial<typeof valid> = { ...valid };
    delete invalid.overview;
    expect(InterpretationResultSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("toDisplayInterpretation", () => {
  const baseRow = {
    id: "ai_1",
    readingId: "reading_1",
    overview: "Tổng quan.",
    connections: "Liên hệ.",
    reflectiveQuestion: "Câu hỏi?",
    model: "gemini-3-flash-preview",
    createdAt: new Date(),
  } as unknown as AiInterpretation;

  it("falls back gracefully for a legacy row missing the new columns", () => {
    const legacyRow: AiInterpretation = {
      ...baseRow,
      summary: null,
      themes: null,
      perCard: [{ position: "Bối cảnh", text: "..." }],
      actionSuggestions: "Một gợi ý duy nhất dạng đoạn văn cũ.",
      actionSuggestionsList: null,
      closingNote: null,
    };

    const display = toDisplayInterpretation(legacyRow);

    expect(display.summary).toBeNull();
    expect(display.themes).toBeNull();
    expect(display.closingNote).toBeNull();
    expect(display.actionSuggestions).toEqual([
      "Một gợi ý duy nhất dạng đoạn văn cũ.",
    ]);
  });

  it("passes through every field for a fresh row", () => {
    const freshRow: AiInterpretation = {
      ...baseRow,
      summary: "Tóm tắt.",
      themes: ["Khởi đầu"],
      perCard: [{ position: "Bối cảnh", keyMessage: "Chốt ý.", text: "..." }],
      actionSuggestions: "Gợi ý một.",
      actionSuggestionsList: ["Gợi ý một.", "Gợi ý hai."],
      closingNote: "Lời kết.",
    };

    const display = toDisplayInterpretation(freshRow);

    expect(display.summary).toBe("Tóm tắt.");
    expect(display.themes).toEqual(["Khởi đầu"]);
    expect(display.actionSuggestions).toEqual(["Gợi ý một.", "Gợi ý hai."]);
    expect(display.closingNote).toBe("Lời kết.");
  });
});
