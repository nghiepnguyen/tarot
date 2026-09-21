import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "./interpretation";
import { ACTIVE_PROMPT_VERSION } from "./prompts";
import { MissingApiKeyError } from "./errors";
import { generateInterpretation } from "./claude";

const create = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

const MODEL = "claude-haiku-4-5-20251001";

const VALID_RESULT = {
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

function reply(overrides: Record<string, unknown> = {}) {
  return {
    stop_reason: "end_turn",
    stop_details: null,
    content: [{ type: "text", text: JSON.stringify(VALID_RESULT) }],
    usage: { input_tokens: 1233, output_tokens: 2208, output_tokens_details: null },
    ...overrides,
  };
}

const cards: InterpretationCardInput[] = [
  { position: "Bối cảnh", card: TAROT_CARDS[0], orientation: "upright" },
  { position: "Hiện tại", card: TAROT_CARDS[1], orientation: "reversed" },
  { position: "Hướng đi", card: TAROT_CARDS[2], orientation: "upright" },
];

const run = () => generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("generateInterpretation without a key", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  it("names the Anthropic key, not the Gemini one, so the UI can show it directly", async () => {
    await expect(run()).rejects.toBeInstanceOf(MissingApiKeyError);
    await expect(run()).rejects.toThrow("ANTHROPIC_API_KEY chưa được cấu hình.");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("generateInterpretation", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    create.mockReset();
  });

  it("sends the model it was handed and the system instruction of that version", async () => {
    create.mockResolvedValue(reply());

    await run();

    const [request] = create.mock.calls[0];
    expect(request.model).toBe(MODEL);
    expect(request.system).toBe(ACTIVE_PROMPT_VERSION.systemInstruction);
    expect(request.messages[0].content).toContain("Câu hỏi?");
  });

  it("closes every object in the schema, which structured outputs requires", async () => {
    create.mockResolvedValue(reply());

    await run();

    const [request] = create.mock.calls[0];
    const schema = request.output_config.format.schema;
    expect(request.output_config.format.type).toBe("json_schema");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.perCard.items.additionalProperties).toBe(false);
    // Bản dùng chung phải giữ nguyên: Gemini từ chối khóa lạ trong responseSchema.
    expect(
      (ACTIVE_PROMPT_VERSION.responseSchema as Record<string, unknown>).additionalProperties,
    ).toBeUndefined();
  });

  it("subtracts thinking tokens from output, because Anthropic counts them inside it", async () => {
    create.mockResolvedValue(
      reply({
        usage: {
          input_tokens: 1233,
          output_tokens: 2208,
          output_tokens_details: { thinking_tokens: 500 },
        },
      }),
    );

    const { usage } = await run();

    // Hai cột trong database mang nghĩa của Gemini: cộng lại mới ra tổng. Cộng
    // thẳng số của Anthropic vào thì `lib/ai/pricing.ts` tính phần thinking hai lần.
    expect(usage.outputTokens).toBe(1708);
    expect(usage.thinkingTokens).toBe(500);
    expect(usage.inputTokens).toBe(1233);
    expect(usage.latencyMs).toBeTypeOf("number");
  });

  it("reports no thinking tokens when the response carries no breakdown", async () => {
    create.mockResolvedValue(reply());

    const { result, usage } = await run();

    expect(result.summary).toBe("Tóm tắt.");
    expect(usage.outputTokens).toBe(2208);
    expect(usage.thinkingTokens).toBe(0);
  });

  it("throws on a truncated reading instead of letting the JSON parse fail obscurely", async () => {
    create.mockResolvedValue(
      reply({ stop_reason: "max_tokens", content: [{ type: "text", text: '{"summary":' }] }),
    );

    await expect(run()).rejects.toThrow("max_tokens");
  });

  it("throws when Claude refuses, naming the category for Sentry", async () => {
    create.mockResolvedValue(
      reply({ stop_reason: "refusal", stop_details: { type: "refusal", category: "cyber" } }),
    );

    await expect(run()).rejects.toThrow("cyber");
  });
});
