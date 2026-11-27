import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BENCHMARK_CASES } from "../benchmark-cases";
import { buildInterpretationEvidence } from "../evidence";
import { generateInterpretation } from "../generate";
import { getAiModel } from "../models";
import { parseGeneratedInterpretation } from "../parse-output";
import { PROMPT_V7 } from "./v7";
import { PROMPT_V9 } from "./v9";

const mocks = vi.hoisted(() => ({ gemini: vi.fn(), fetch: vi.fn() }));
vi.mock("@google/genai", () => ({
  ThinkingLevel: { LOW: "LOW" },
  GoogleGenAI: class { models = { generateContent: mocks.gemini }; },
}));

const fixture = BENCHMARK_CASES.find(c => c.id === "relation-weak-1")!;
const validResult = {
  summary: "Chuẩn bị mục tiêu cho buổi trao đổi.",
  overview: "Câu hỏi của bạn là cách chuẩn bị buổi góp ý.",
  themes: ["Mục tiêu", "Đối thoại", "Kiểm chứng"],
  perCard: [
    { position: "Bối cảnh", keyMessage: "Xác định điều muốn làm rõ.", text: "Bạn muốn buổi góp ý giúp làm rõ điều gì?" },
    { position: "Hiện tại", keyMessage: "Chọn ví dụ nếu có.", text: "Nếu có ví dụ cụ thể, bạn muốn trao đổi điều gì từ đó?" },
    { position: "Hướng đi", keyMessage: "Cùng chọn bước tiếp theo.", text: "Hai bên có thể thống nhất một tiêu chí như thế nào?" },
  ],
  connections: "Từ mục tiêu tới quan sát rồi bước kiểm chứng, bạn có thể chuẩn bị một khung trao đổi mở.",
  actionSuggestions: ["Ghi mục tiêu bạn muốn trao đổi.", "Nếu có ví dụ cụ thể, chọn một ví dụ.", "Hỏi góc nhìn của đồng nghiệp."],
  reflectiveQuestion: "Bạn muốn làm rõ điều gì trước?",
  closingNote: "Bạn có thể điều chỉnh bước tiếp theo theo phản hồi thực tế.",
};

function respond(text: string) {
  mocks.gemini.mockResolvedValue({ text, usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, thoughtsTokenCount: 0 } });
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ finish_reason: "stop", message: { content: text } }], usage: { prompt_tokens: 100, completion_tokens: 200 } }),
  });
}

beforeEach(() => {
  mocks.gemini.mockReset();
  mocks.fetch.mockReset();
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("PROMPT_V9", () => {
  it.each(BENCHMARK_CASES)("serializes validated evidence for $id without adding context or hidden hypotheses", ({ question, cards }) => {
    const input = JSON.parse(PROMPT_V9.buildPrompt(question, cards));
    expect(input).toEqual(buildInterpretationEvidence(question, cards));
    expect(Object.keys(input)).toEqual(["facts", "cards", "relations"]);
    expect(input.facts).toEqual([{ id: "F1", source: "user_question", text: question.trim() }]);
  });

  it("keeps the existing v7 schema and validator while using its own instructions", () => {
    expect(PROMPT_V9.resultSchema).toBe(PROMPT_V7.resultSchema);
    expect(PROMPT_V9.responseSchema).toBe(PROMPT_V7.responseSchema);
    expect(PROMPT_V9.validateResult).toBe(PROMPT_V7.validateResult);
    expect(PROMPT_V9.systemInstruction).not.toBe(PROMPT_V7.systemInstruction);
    expect(PROMPT_V9.resultSchema.safeParse(validResult).success).toBe(true);
    expect(PROMPT_V9.resultSchema.safeParse({ ...validResult, evidence: { supportRefs: ["F1"] } }).success).toBe(false);
  });

  it("retains the explicit medication, death and professional safety boundaries", () => {
    for (const boundary of ["Không khuyên thay đổi thuốc hay điều trị", "cái chết", "y tế", "pháp lý", "tài chính", "tự hại"]) {
      expect(PROMPT_V9.systemInstruction).toContain(boundary);
    }
  });

  it.each([
    ["invalid_json", "PRIVATE_INVALID_OUTPUT"],
    ["invalid_schema", JSON.stringify({ ...validResult, perCard: validResult.perCard.slice(0, 2) })],
    ["position_mismatch", JSON.stringify({ ...validResult, perCard: [...validResult.perCard].reverse() })],
  ])("rejects %s through the existing parser", (code, text) => {
    expect(() => parseGeneratedInterpretation(text, PROMPT_V9, fixture.cards)).toThrow(`AI output validation: ${code}`);
  });
});

describe.each(["gemini-3.8-flash", "deepseek-flash"])("v9 via %s (external calls mocked)", modelId => {
  const model = getAiModel(modelId)!;
  const run = (question = fixture.question) => generateInterpretation(question, fixture.cards, PROMPT_V9, model);

  it("returns the existing output contract with editorial warnings after exactly one provider call", async () => {
    respond(JSON.stringify(validResult));
    const generated = await run();
    expect(generated.result).toEqual(validResult);
    expect(generated.quality!.warnings.length).toBeGreaterThan(0);
    expect(generated.usage.inputTokens).toBe(100);
    expect(mocks.gemini.mock.calls.length + mocks.fetch.mock.calls.length).toBe(1);
    const contents = model.provider === "gemini"
      ? mocks.gemini.mock.calls[0][0].contents
      : JSON.parse(mocks.fetch.mock.calls[0][1].body).messages[1].content;
    expect(JSON.parse(contents).facts).toEqual([{ id: "F1", source: "user_question", text: fixture.question }]);
    if (model.provider === "gemini") {
      expect(mocks.gemini.mock.calls[0][0].config.responseJsonSchema).toBe(PROMPT_V7.responseSchema);
    }
  });

  it("rejects invalid input before any provider request", async () => {
    await expect(run("PRIVATE_QUESTION".repeat(30))).rejects.toThrow(/^Invalid interpretation evidence input\.$/);
    expect(mocks.gemini).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid_json", "PRIVATE_INVALID_OUTPUT"],
    ["invalid_schema", JSON.stringify({ ...validResult, themes: [] })],
    ["position_mismatch", JSON.stringify({ ...validResult, perCard: [...validResult.perCard].reverse() })],
  ])("does not retry a %s response or expose its raw output", async (code, text) => {
    respond(text);
    await expect(run()).rejects.toThrow(`AI output validation: ${code}`);
    expect(mocks.gemini.mock.calls.length + mocks.fetch.mock.calls.length).toBe(1);
  });

  it("propagates a timeout without a second provider request", async () => {
    mocks.gemini.mockRejectedValue(new DOMException("Provider timed out", "TimeoutError"));
    mocks.fetch.mockRejectedValue(new DOMException("Provider timed out", "TimeoutError"));
    await expect(run()).rejects.toMatchObject({ name: "TimeoutError" });
    expect(mocks.gemini.mock.calls.length + mocks.fetch.mock.calls.length).toBe(1);
  });
});
