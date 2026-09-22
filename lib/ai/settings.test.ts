import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_MODELS, PROVIDER_API_KEY_ENV } from "./models";
import { getMissingApiKeyEnvs, pickRandomAiModel } from "./settings";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getMissingApiKeyEnvs", () => {
  const gemini = AI_MODELS.find((model) => model.provider === "gemini")!;
  const deepseek = AI_MODELS.find((model) => model.provider === "deepseek")!;

  it("says nothing is missing when every key is set", () => {
    for (const envVar of Object.values(PROVIDER_API_KEY_ENV)) {
      vi.stubEnv(envVar, "test-key");
    }

    expect(getMissingApiKeyEnvs(AI_MODELS)).toEqual([]);
  });

  it("names the env var of the provider whose key is missing", () => {
    vi.stubEnv(PROVIDER_API_KEY_ENV.gemini, "test-key");
    vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "");

    expect(getMissingApiKeyEnvs([deepseek])).toEqual([PROVIDER_API_KEY_ENV.deepseek]);
    expect(getMissingApiKeyEnvs([gemini])).toEqual([]);
  });

  it("reports the missing key of the random mode as a whole", () => {
    // Đây là trường hợp trang quản trị thật sự cần: một key thiếu, một key có,
    // nên một nửa số lượt hỏng và nhìn từ bảng số đo thì như model chập chờn.
    vi.stubEnv(PROVIDER_API_KEY_ENV.gemini, "test-key");
    vi.stubEnv(PROVIDER_API_KEY_ENV.deepseek, "");

    expect(getMissingApiKeyEnvs(AI_MODELS)).toEqual([PROVIDER_API_KEY_ENV.deepseek]);
  });

  it("never lists one env var twice", () => {
    vi.stubEnv(PROVIDER_API_KEY_ENV.gemini, "");

    expect(getMissingApiKeyEnvs([gemini, gemini])).toEqual([PROVIDER_API_KEY_ENV.gemini]);
  });
});

describe("pickRandomAiModel", () => {
  it("only ever returns a model from the allowlist", () => {
    const allowed = new Set(AI_MODELS.map((model) => model.id));
    for (let i = 0; i < 200; i += 1) {
      expect(allowed.has(pickRandomAiModel().id)).toBe(true);
    }
  });

  it("can reach every model, including the last one", () => {
    // `Math.random()` trả [0, 1), nên biên trên là chỗ dễ hụt mất một model:
    // một phép làm tròn sai ở đây thì model cuối danh sách không bao giờ được
    // bốc, và không có gì kêu lên — chỉ có một cột số liệu mãi mãi trống.
    const first = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickRandomAiModel().id).toBe(AI_MODELS[0].id);
    first.mockRestore();

    const last = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(pickRandomAiModel().id).toBe(AI_MODELS[AI_MODELS.length - 1].id);
    last.mockRestore();
  });

  it("spreads draws across the models rather than favouring one", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 600; i += 1) {
      const id = pickRandomAiModel().id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    // Xác suất đều là điều kiện để so điểm: hai cỡ mẫu lệch nhau thì hai con
    // số trung bình không so được. Ngưỡng lỏng để test không đỏ vì xui.
    for (const model of AI_MODELS) {
      expect(counts.get(model.id) ?? 0, model.id).toBeGreaterThan(600 / AI_MODELS.length / 2);
    }
  });
});
