import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { generateReflectionAction } from "@/app/actions/reflection";
import { SPREAD_POSITIONS } from "../tarot/draw";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), limit: vi.fn(), generate: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: mocks.limit }));
vi.mock("./gemini", () => ({ getClient: () => ({ models: { generateContent: mocks.generate } }) }));

const cards = ["five-of-cups", "eight-of-swords", "queen-of-swords"].map((cardId, index) => ({
  cardId, position: SPREAD_POSITIONS[index], orientation: "upright",
}));
const question = "Nội dung riêng tư cần kiểm chứng?";
const result = {
  intro: "Nhìn lại ba lá nếu muốn.",
  questions: ["Bạn chú ý lá nào?", "Five of Cups gợi câu hỏi gì?", "Bạn muốn thử điều gì?"],
  cardRefs: ["five-of-cups"],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TAROT_REFLECTION_ENABLED", "1");
  vi.stubEnv("NODE_ENV", "development");
  mocks.auth.mockResolvedValue({ user: { id: "reader" } });
  mocks.limit.mockResolvedValue(true);
  mocks.generate.mockResolvedValue({ text: JSON.stringify(result), usageMetadata: { promptTokenCount: 400, candidatesTokenCount: 100 } });
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it.each(["disabled", "production", "invalid", "support", "rate_limited"] as const)(
  "avoids calling the model for %s",
  async status => {
    let input = question;
    if (status === "disabled") vi.stubEnv("TAROT_REFLECTION_ENABLED", "");
    if (status === "production") vi.stubEnv("NODE_ENV", "production");
    if (status === "invalid") input = "";
    if (status === "support") {
      input = "Tôi đang định tự làm hại mình.";
      mocks.auth.mockResolvedValue(null);
    }
    if (status === "rate_limited") mocks.limit.mockResolvedValue(false);

    expect(await generateReflectionAction(input, cards)).toEqual({ status: status === "production" ? "disabled" : status });
    expect(mocks.generate).not.toHaveBeenCalled();
    if (status !== "rate_limited") expect(mocks.limit).not.toHaveBeenCalled();
  },
);

it("lets guests generate within a shared rate limit", async () => {
  mocks.auth.mockResolvedValue(null);
  mocks.limit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

  expect(await generateReflectionAction(question, cards)).toEqual({ status: "success", reflection: result });
  expect(await generateReflectionAction(question, cards)).toEqual({ status: "rate_limited" });
  expect(mocks.limit).toHaveBeenCalledWith("dynamic-reflection-guests", 5, 3_600_000);
  expect(mocks.generate).toHaveBeenCalledOnce();
});

it("validates output and logs only usage metadata", async () => {
  expect(await generateReflectionAction(question, cards)).toEqual({ status: "success", reflection: result });
  expect(mocks.limit).toHaveBeenCalledWith("dynamic-reflection:reader", 5, 3_600_000);
  expect(mocks.generate).toHaveBeenCalledOnce();
  const call = mocks.generate.mock.calls[0][0];
  expect(call.config.abortSignal).toBeInstanceOf(AbortSignal);
  expect(call.config.httpOptions.retryOptions.attempts).toBe(1);
  expect(JSON.parse(call.contents).question).toBe(question);
  expect(console.info).toHaveBeenCalledWith("dynamic-reflection", expect.objectContaining({
    outcome: "success", inputTokens: 400, outputTokens: 100, costVnd: expect.any(Number), latencyMs: expect.any(Number),
  }));
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(question);
});

it.each(["invalid_output", "provider_error", "timeout"] as const)("returns fallback on %s", async outcome => {
  if (outcome === "invalid_output") mocks.generate.mockResolvedValue({ text: "private raw model content" });
  if (outcome === "provider_error") mocks.generate.mockRejectedValue(new Error("private raw provider message"));
  if (outcome === "timeout") mocks.generate.mockRejectedValue(new DOMException("private timeout context", "TimeoutError"));
  expect(await generateReflectionAction(question, cards)).toEqual({ status: "fallback" });
  expect(console.info).toHaveBeenCalledWith("dynamic-reflection", expect.objectContaining({ outcome }));
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("private");
});
