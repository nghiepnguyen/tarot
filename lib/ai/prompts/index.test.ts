import { describe, expect, it } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { isPricedModel } from "@/lib/ai/pricing";
import type { InterpretationCardInput } from "@/lib/ai/interpretation";
import { ACTIVE_PROMPT_VERSION, PROMPT_VERSIONS, getPromptVersion } from "./index";

const sampleCards: InterpretationCardInput[] = [
  { position: "Bối cảnh", card: TAROT_CARDS[0], orientation: "upright" },
  { position: "Hiện tại", card: TAROT_CARDS[1], orientation: "reversed" },
  { position: "Hướng đi", card: TAROT_CARDS[2], orientation: "upright" },
];

const VALID_RESULT = {
  summary: "Tóm tắt.",
  overview: "Tổng quan.",
  themes: ["Khởi đầu"],
  perCard: SPREAD_POSITIONS.map((position) => ({
    position,
    keyMessage: "Chốt ý.",
    text: "...",
  })),
  connections: "Liên hệ.",
  actionSuggestions: ["Gợi ý một."],
  reflectiveQuestion: "Câu hỏi?",
  closingNote: "Lời kết.",
};

describe("PROMPT_VERSIONS", () => {
  it("has no duplicate ids — the id is what rows in the database point back to", () => {
    const ids = PROMPT_VERSIONS.map((version) => version.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the active version, so the app never runs a prompt the registry can't name", () => {
    expect(getPromptVersion(ACTIVE_PROMPT_VERSION.id)).toBe(ACTIVE_PROMPT_VERSION);
  });

  it("returns null for an id that is not in the registry", () => {
    expect(getPromptVersion("v9-khong-ton-tai")).toBeNull();
  });

  it("runs on a model that has a price, or the admin numbers are guesses", () => {
    for (const version of PROMPT_VERSIONS) {
      expect(isPricedModel(version.model), version.id).toBe(true);
    }
  });
});

describe.each(PROMPT_VERSIONS.map((version) => [version.id, version] as const))(
  "prompt version %s",
  (_id, version) => {
    it("puts the question and every card's position, name and orientation in the prompt", () => {
      const prompt = version.buildPrompt("Tôi nên làm gì?", sampleCards);

      expect(prompt).toContain("Tôi nên làm gì?");
      for (const { position, card, orientation } of sampleCards) {
        expect(prompt).toContain(position);
        expect(prompt).toContain(card.name);
        expect(prompt).toContain(orientation === "reversed" ? "ngược" : "xuôi");
      }
    });

    it("accepts a well-formed result through its own schema", () => {
      expect(version.resultSchema.safeParse(VALID_RESULT).success).toBe(true);
    });

    it("rejects a result with the wrong number of per-card entries", () => {
      const invalid = { ...VALID_RESULT, perCard: VALID_RESULT.perCard.slice(0, 2) };
      expect(version.resultSchema.safeParse(invalid).success).toBe(false);
    });

    it("keeps the safety limits in the system instruction", () => {
      expect(version.systemInstruction).toContain("y tế");
      expect(version.systemInstruction).toContain("pháp lý");
    });
  },
);
