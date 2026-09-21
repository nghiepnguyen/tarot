import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { InterpretationCardInput } from "./interpretation";
import { ACTIVE_PROMPT_VERSION } from "./prompts";
import { MissingApiKeyError } from "./errors";
import { generateInterpretation } from "./deepseek";

const fetchMock = vi.fn();

const MODEL = "deepseek-flash";

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

function reply(completion: Record<string, unknown> = {}, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => "",
    json: async () => ({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(VALID_RESULT) },
        },
      ],
      usage: { prompt_tokens: 1233, completion_tokens: 2208 },
      ...completion,
    }),
  };
}

const cards: InterpretationCardInput[] = [
  { position: "Bối cảnh", card: TAROT_CARDS[0], orientation: "upright" },
  { position: "Hiện tại", card: TAROT_CARDS[1], orientation: "reversed" },
  { position: "Hướng đi", card: TAROT_CARDS[2], orientation: "upright" },
];

const run = () => generateInterpretation("Câu hỏi?", cards, ACTIVE_PROMPT_VERSION, MODEL);

/** Body của request cuối cùng, đã parse lại từ JSON. */
function lastRequestBody(): {
  model: string;
  max_tokens: number;
  messages: Array<{ role: string; content: string }>;
  response_format: { type: string };
  thinking: { type: string };
} {
  const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse(init.body);
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("generateInterpretation without a key", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
  });

  it("names the DeepSeek key, not another provider's, so the UI can show it directly", async () => {
    await expect(run()).rejects.toBeInstanceOf(MissingApiKeyError);
    await expect(run()).rejects.toThrow("DEEPSEEK_API_KEY chưa được cấu hình.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("generateInterpretation", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
  });

  it("sends the model it was handed and the system instruction of that version", async () => {
    fetchMock.mockResolvedValue(reply());

    await run();

    const body = lastRequestBody();
    expect(body.model).toBe(MODEL);
    expect(body.messages[0].content).toContain(ACTIVE_PROMPT_VERSION.systemInstruction);
    expect(body.messages[1].content).toContain("Câu hỏi?");
  });

  it("carries the schema in the prompt, because json_object mode enforces no shape", async () => {
    fetchMock.mockResolvedValue(reply());

    await run();

    const body = lastRequestBody();
    expect(body.response_format.type).toBe("json_object");
    // Chế độ này đòi chữ "json" trong lời nhắc, và hình dạng thì phải tự nói.
    expect(body.messages[0].content.toLowerCase()).toContain("json");
    expect(body.messages[0].content).toContain("reflectiveQuestion");
    // Bản dùng chung phải giữ nguyên: nó còn là nguồn schema của hai client kia.
    expect(ACTIVE_PROMPT_VERSION.systemInstruction).not.toContain("reflectiveQuestion");
  });

  it("disables thinking, which is what keeps a reading inside the timeout", async () => {
    fetchMock.mockResolvedValue(reply());

    await run();

    expect(lastRequestBody().thinking.type).toBe("disabled");
  });

  it("subtracts reasoning tokens from output, because DeepSeek counts them inside it", async () => {
    fetchMock.mockResolvedValue(
      reply({
        usage: {
          prompt_tokens: 1233,
          completion_tokens: 2208,
          completion_tokens_details: { reasoning_tokens: 500 },
        },
      }),
    );

    const { usage } = await run();

    // Hai cột trong database mang nghĩa của Gemini: cộng lại mới ra tổng.
    expect(usage.outputTokens).toBe(1708);
    expect(usage.thinkingTokens).toBe(500);
    expect(usage.inputTokens).toBe(1233);
    expect(usage.latencyMs).toBeTypeOf("number");
  });

  it("reports no thinking tokens when the response carries no breakdown", async () => {
    fetchMock.mockResolvedValue(reply());

    const { result, usage } = await run();

    expect(result.summary).toBe("Tóm tắt.");
    expect(usage.outputTokens).toBe(2208);
    expect(usage.thinkingTokens).toBe(0);
  });

  it("throws on a truncated reading instead of letting the JSON parse fail obscurely", async () => {
    fetchMock.mockResolvedValue(
      reply({
        choices: [{ finish_reason: "length", message: { content: '{"summary":' } }],
      }),
    );

    await expect(run()).rejects.toThrow("max_tokens");
  });

  it("throws when the content filter fires, naming it for Sentry", async () => {
    fetchMock.mockResolvedValue(
      reply({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] }),
    );

    await expect(run()).rejects.toThrow("content_filter");
  });

  it("treats the documented empty-content response as a failed turn, not an empty reading", async () => {
    fetchMock.mockResolvedValue(
      reply({ choices: [{ finish_reason: "stop", message: { content: "" } }] }),
    );

    await expect(run()).rejects.toThrow("không trả về nội dung");
  });

  it("names the HTTP status when the API rejects the request", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Authentication Fails"}}',
      json: async () => ({}),
    });

    await expect(run()).rejects.toThrow("HTTP 401");
  });
});
