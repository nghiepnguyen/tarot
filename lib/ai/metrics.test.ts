import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROMPT_V4 } from "./prompts/v4";
import { getAiModel, DEFAULT_AI_MODEL_ID } from "./models";
import { InterpretationValidationError } from "./quality";

const mocks = vi.hoisted(() => ({ generate: vi.fn(), create: vi.fn(), report: vi.fn() }));
vi.mock("./generate", () => ({ generateInterpretation: mocks.generate }));
vi.mock("../db/prisma", () => ({ prisma: { aiGenerationMetric: { create: mocks.create } } }));
vi.mock("../monitoring/report", () => ({ reportHandledError: mocks.report }));
import { generateMeasuredInterpretation } from "./metrics";
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({}); });

describe("generation metrics", () => {
  it("records counts for a successful attempt without persisting prompt or output", async () => {
    const generated = { result: { private: "PRIVATE TEXT" }, usage: { inputTokens: 20, outputTokens: 30, latencyMs: 40 }, quality: { warnings: [{ field: "overview", code: "over_length", count: 120 }], overLengthFields: 1, underLengthFields: 0, duplicateItems: 0, repeatedSentences: 0 } };
    mocks.generate.mockResolvedValue(generated);
    expect(await generateMeasuredInterpretation("PRIVATE QUESTION", [], PROMPT_V4, getAiModel(DEFAULT_AI_MODEL_ID)!)).toBe(generated);
    const data = mocks.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ outcome: "success", warningCount: 1, overLengthFields: 1, promptVersion: PROMPT_V4.id });
    expect(JSON.stringify(data)).not.toContain("PRIVATE");
  });
  it("records failed schema attempts and preserves the original error for credit refund", async () => {
    const error = new InterpretationValidationError("invalid_schema");
    mocks.generate.mockRejectedValue(error);
    await expect(generateMeasuredInterpretation("PRIVATE", [], PROMPT_V4, getAiModel(DEFAULT_AI_MODEL_ID)!)).rejects.toBe(error);
    expect(mocks.create.mock.calls[0][0].data.outcome).toBe("invalid_schema");
  });
  it("does not lose a paid reading when metric persistence fails", async () => {
    mocks.generate.mockResolvedValue({ result: {}, usage: {} });
    mocks.create.mockRejectedValue(new Error("database unavailable"));
    await expect(generateMeasuredInterpretation("PRIVATE", [], PROMPT_V4, getAiModel(DEFAULT_AI_MODEL_ID)!)).resolves.toMatchObject({ result: {} });
    expect(mocks.report).toHaveBeenCalled();
  });
});
