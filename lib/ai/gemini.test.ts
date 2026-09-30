import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "./interpretation";
import { ACTIVE_PROMPT_VERSION } from "./prompts";
import { PROMPT_V4 } from "./prompts/v4";
import { generateInterpretation, MissingApiKeyError } from "./gemini";

const generateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  ThinkingLevel: { LOW: "LOW" },
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const VALID_RESULT = {
  summary: "Tóm tắt.",
  overview: "Tổng quan.",
  themes: ["Khởi đầu", "Chuyển hướng", "Cân bằng"],
  perCard: [
    { position: "Bối cảnh", keyMessage: "Chốt ý.", text: "..." },
    { position: "Hiện tại", keyMessage: "Chốt ý.", text: "..." },
    { position: "Hướng đi", keyMessage: "Chốt ý.", text: "..." },
  ],
  connections: "Liên hệ.",
  actionSuggestions: ["Gợi ý một.", "Gợi ý hai.", "Gợi ý ba."],
  reflectiveQuestion: "Câu hỏi?",
  closingNote: "Lời kết.",
};

const MODEL = "gemini-3.8-flash";

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
    await expect(generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL)).rejects.toBeInstanceOf(
      MissingApiKeyError,
    );
  });

  it("uses a Vietnamese message so the UI can show it directly", async () => {
    await expect(generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL)).rejects.toThrow(
      "GEMINI_API_KEY chưa được cấu hình.",
    );
  });
});

describe("generateInterpretation usage", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContent.mockReset();
  });

  it("reports what the generation cost, keeping thinking tokens separate", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify(VALID_RESULT),
      usageMetadata: {
        promptTokenCount: 1233,
        candidatesTokenCount: 2208,
        thoughtsTokenCount: 2286,
      },
    });

    const { result, usage } = await generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL);

    expect(result.summary).toBe("Tóm tắt.");
    expect(usage.inputTokens).toBe(1233);
    expect(usage.outputTokens).toBe(2208);
    expect(usage.thinkingTokens).toBe(2286);
    expect(usage.latencyMs).toBeTypeOf("number");
  });

  it("sends the model it was handed and the system instruction of that version, not a global constant", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(VALID_RESULT) });

    await generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL);

    const [request] = generateContent.mock.calls[0];
    expect(request.model).toBe(MODEL);
    expect(request.config.systemInstruction).toBe(ACTIVE_PROMPT_VERSION.systemInstruction);
    expect(request.config.thinkingConfig).toEqual({ thinkingLevel: "LOW" });
    expect(request.contents).toContain("Câu hỏi?");
  });

  it("still returns the reading when Gemini reports no usage at all", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(VALID_RESULT) });

    const { result, usage } = await generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL);

    // Một lượt sinh thiếu số đo vẫn là một lượt sinh hợp lệ: không đáng ném lỗi
    // và hoàn credit chỉ vì không đếm được token.
    expect(result.overview).toBe("Tổng quan.");
    expect(usage.inputTokens).toBeUndefined();
    expect(usage.thinkingTokens).toBeUndefined();
    expect(usage.latencyMs).toBeTypeOf("number");
  });

  it("uses JSON Schema for v4 and rejects reordered sections without exposing the output", async () => {
    const output = { ...VALID_RESULT, themes: ["Chủ đề một", "Chủ đề hai", "Chủ đề ba"], actionSuggestions: ["Một", "Hai", "Ba"], perCard: [...VALID_RESULT.perCard].reverse() };
    generateContent.mockResolvedValue({ text: JSON.stringify(output) });
    await expect(generateInterpretation("Câu hỏi?", cards, PROMPT_V4, MODEL)).rejects.toThrow("position_mismatch");
    const [request] = generateContent.mock.calls[0];
    expect(request.config.responseJsonSchema).toBe(PROMPT_V4.responseSchema);
    expect(request.config.responseSchema).toBeUndefined();
  });

  it("redacts invalid JSON/schema errors instead of passing user content into error tracking", async () => {
    generateContent.mockResolvedValue({ text: "PRIVATE USER TEXT" });
    await expect(generateInterpretation("Câu hỏi?", cards, PROMPT_V4, MODEL)).rejects.toThrow("invalid_json");
    generateContent.mockResolvedValue({ text: JSON.stringify({ private: "PRIVATE USER TEXT" }) });
    await expect(generateInterpretation("Câu hỏi?", cards, PROMPT_V4, MODEL)).rejects.toThrow("invalid_schema");
  });
});
