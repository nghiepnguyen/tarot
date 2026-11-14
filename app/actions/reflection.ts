"use server";

import { ThinkingLevel } from "@google/genai";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  buildReflectionInput,
  parseReflectionOutput,
  REFLECTION_METRIC_VERSION,
  REFLECTION_RESPONSE_SCHEMA,
  REFLECTION_SYSTEM_INSTRUCTION,
} from "@/lib/ai/dynamic-reflection";
import { isReflectionEnabled } from "@/lib/ai/reflection-setting";
import { getClient } from "@/lib/ai/gemini";
import { DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";
import { recordAiGenerationMetric } from "@/lib/ai/metrics";
import { needsReadingSupport } from "@/lib/ai/reading-support";

type ReflectionResult =
  | { status: "success"; reflection: NonNullable<ReturnType<typeof parseReflectionOutput>> }
  | { status: "disabled" | "invalid" | "support" | "rate_limited" | "fallback" };

export async function generateReflectionAction(question: unknown, cards: unknown): Promise<ReflectionResult> {
  if (!(await isReflectionEnabled())) {
    return { status: "disabled" };
  }

  const input = buildReflectionInput(question, cards);
  if (!input) return { status: "invalid" };
  if (needsReadingSupport(input.question)) return { status: "support" };

  try {
    const session = await auth();
    const rateLimitKey = session?.user?.id
      ? `dynamic-reflection:${session.user.id}`
      : "dynamic-reflection-guests";
    if (!(await checkRateLimit(rateLimitKey, 5, 3_600_000))) {
      return { status: "rate_limited" };
    }
  } catch {
    return { status: "fallback" };
  }

  const model = DEFAULT_AI_MODEL_ID;
  const startedAt = Date.now();
  const signal = AbortSignal.timeout(8_000);

  try {
    const response = await getClient().models.generateContent({
      model,
      contents: JSON.stringify(input),
      config: {
        systemInstruction: REFLECTION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: REFLECTION_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: signal,
        httpOptions: { retryOptions: { attempts: 1 } },
      },
    });
    const reflection = parseReflectionOutput(response.text ?? "", input);
    const usage = {
      inputTokens: response.usageMetadata?.promptTokenCount ?? null,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
      thinkingTokens: response.usageMetadata?.thoughtsTokenCount ?? null,
    };
    await recordAiGenerationMetric({
      promptVersion: REFLECTION_METRIC_VERSION,
      model,
      outcome: reflection ? "success" : "invalid_output",
      latencyMs: Date.now() - startedAt,
      ...usage,
    });
    return reflection ? { status: "success", reflection } : { status: "fallback" };
  } catch (error) {
    await recordAiGenerationMetric({
      promptVersion: REFLECTION_METRIC_VERSION,
      model,
      outcome: signal.aborted || (error instanceof Error && error.name === "TimeoutError") ? "timeout" : "provider_error",
      latencyMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
      thinkingTokens: null,
    });
    return { status: "fallback" };
  }
}
