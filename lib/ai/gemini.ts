import "server-only";
import { GoogleGenAI } from "@google/genai";
import {
  INTERPRETATION_RESPONSE_SCHEMA,
  InterpretationResultSchema,
  SYSTEM_INSTRUCTION,
  buildInterpretationPrompt,
  type InterpretationCardInput,
  type InterpretationResult,
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
): Promise<InterpretationResult> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildInterpretationPrompt(question, cards),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: INTERPRETATION_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini không trả về nội dung.");

  return InterpretationResultSchema.parse(JSON.parse(text));
}
