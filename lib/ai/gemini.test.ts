import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "./interpretation";
import { generateInterpretation, MissingApiKeyError } from "./gemini";

const cards: InterpretationCardInput[] = [
  { position: "Bối cảnh", card: TAROT_CARDS[0], orientation: "upright" },
  { position: "Hiện tại", card: TAROT_CARDS[1], orientation: "reversed" },
  { position: "Hướng đi", card: TAROT_CARDS[2], orientation: "upright" },
];

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("generateInterpretation", () => {
  it("throws MissingApiKeyError instead of calling Gemini when GEMINI_API_KEY is unset", async () => {
    await expect(generateInterpretation("Câu hỏi?", cards)).rejects.toBeInstanceOf(
      MissingApiKeyError,
    );
  });

  it("uses a Vietnamese message so the UI can show it directly", async () => {
    await expect(generateInterpretation("Câu hỏi?", cards)).rejects.toThrow(
      "GEMINI_API_KEY chưa được cấu hình.",
    );
  });
});
