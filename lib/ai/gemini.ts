import "server-only";
import { GoogleGenAI } from "@google/genai";
import type {
  GeneratedInterpretation,
  InterpretationCardInput,
} from "@/lib/ai/interpretation";
import type { PromptVersion } from "@/lib/ai/prompts";

export class MissingApiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY chưa được cấu hình.");
    this.name = "MissingApiKeyError";
  }
}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Sinh một bản luận giải bằng đúng `version` được truyền vào.
 *
 * Nhận version thay vì đọc hằng số toàn cục: model, system instruction, schema
 * và cách dựng prompt phải đi cùng nhau thành một bộ, và bên gọi phải ghi
 * `version.id` xuống database cùng kết quả — không thì về sau không tách được
 * số đo của bản prompt này khỏi bản khác.
 */
export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
  version: PromptVersion,
): Promise<GeneratedInterpretation> {
  const ai = getClient();

  const startedAt = Date.now();
  const response = await ai.models.generateContent({
    model: version.model,
    contents: version.buildPrompt(question, cards),
    config: {
      systemInstruction: version.systemInstruction,
      responseMimeType: "application/json",
      responseSchema: version.responseSchema,
    },
  });
  const latencyMs = Date.now() - startedAt;

  const text = response.text;
  if (!text) throw new Error("Gemini không trả về nội dung.");

  const usage = response.usageMetadata;

  return {
    result: version.resultSchema.parse(JSON.parse(text)),
    usage: {
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
      thinkingTokens: usage?.thoughtsTokenCount,
      latencyMs,
    },
  };
}
