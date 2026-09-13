import "server-only";
import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_MODEL,
  INTERPRETATION_RESPONSE_SCHEMA,
  InterpretationResultSchema,
  SYSTEM_INSTRUCTION,
  buildInterpretationPrompt,
  type GeneratedInterpretation,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";

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

export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
): Promise<GeneratedInterpretation> {
  const ai = getClient();

  const startedAt = Date.now();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildInterpretationPrompt(question, cards),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: INTERPRETATION_RESPONSE_SCHEMA,
    },
  });
  const latencyMs = Date.now() - startedAt;

  const text = response.text;
  if (!text) throw new Error("Gemini không trả về nội dung.");

  const usage = response.usageMetadata;

  return {
    result: InterpretationResultSchema.parse(JSON.parse(text)),
    usage: {
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
      thinkingTokens: usage?.thoughtsTokenCount,
      latencyMs,
    },
  };
}
