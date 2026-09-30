import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MissingApiKeyError } from "@/lib/ai/errors";
import {
  GENERATION_TIMEOUT_MS,
  type GeneratedInterpretation,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";
import { PROVIDER_API_KEY_ENV } from "@/lib/ai/models";
import type { PromptVersion } from "@/lib/ai/prompts";
import { parseGeneratedInterpretation } from "./parse-output";

export { MissingApiKeyError };

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingApiKeyError(PROVIDER_API_KEY_ENV.gemini);
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Sinh một bản luận giải bằng đúng `version` được truyền vào.
 *
 * Nhận version thay vì đọc hằng số toàn cục: system instruction, schema và
 * cách dựng prompt phải đi cùng nhau thành một bộ, và bên gọi phải ghi
 * `version.id` xuống database cùng kết quả — không thì về sau không tách được
 * số đo của bản prompt này khỏi bản khác.
 *
 * `model` truyền rời vì từ lúc có trang chọn model mặc định, một bản prompt
 * chạy được trên nhiều model; `version.model` chỉ là mặc định lúc chưa ai chọn.
 */
export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
  version: PromptVersion,
  model: string,
): Promise<GeneratedInterpretation> {
  const ai = getClient();

  const startedAt = Date.now();
  const response = await ai.models.generateContent({
    model,
    contents: version.buildPrompt(question, cards),
    config: {
      systemInstruction: version.systemInstruction,
      responseMimeType: "application/json",
      ...(version.schemaFormat === "json"
        ? { responseJsonSchema: version.responseSchema }
        : { responseSchema: version.responseSchema }),
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      httpOptions: { retryOptions: { attempts: 1 } },
    },
  });
  const latencyMs = Date.now() - startedAt;

  const text = response.text;
  if (!text) throw new Error("Gemini không trả về nội dung.");

  const usage = response.usageMetadata;

  return {
    ...parseGeneratedInterpretation(text, version, cards),
    usage: {
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
      thinkingTokens: usage?.thoughtsTokenCount,
      latencyMs,
    },
  };
}
