import { describe, expect, it } from "vitest";
import {
  InterpretationResultSchema,
  buildInterpretationPrompt,
  type InterpretationCardInput,
} from "./interpretation";
import { TAROT_CARDS } from "@/lib/tarot/cards";

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
    overview: "Tổng quan.",
    perCard: [
      { position: "Bối cảnh", text: "..." },
      { position: "Hiện tại", text: "..." },
      { position: "Hướng đi", text: "..." },
    ],
    connections: "Liên hệ.",
    actionSuggestions: "Gợi ý.",
    reflectiveQuestion: "Câu hỏi?",
  };

  it("accepts a well-formed result", () => {
    expect(InterpretationResultSchema.safeParse(valid).success).toBe(true);
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
