import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { reportHandledError } from "../monitoring/report";
import { generateInterpretation } from "./generate";
import { InterpretationValidationError } from "./quality";
import { withTimeout } from "./unlock-deadline";
import type { GenerationOptions, InterpretationCardInput } from "./interpretation";
import type { PromptVersion } from "./prompts/types";
import type { AiModel } from "./models";

export async function recordAiGenerationMetric(data: Prisma.AiGenerationMetricCreateInput) {
  try { await withTimeout(250, () => prisma.aiGenerationMetric.create({ data })); }
  catch {
    try { reportHandledError(new Error("AI generation metric persistence failed"), { area: "ai-quality-metrics", extra: { model: data.model, promptVersion: data.promptVersion } }); } catch { /* Telemetry cannot fail generation or settlement. */ }
  }
}

/** Generation success only, not result persistence or financial settlement. CLI benchmarks do not write these metrics. */
export async function generateMeasuredInterpretation(question: string, cards: InterpretationCardInput[], version: PromptVersion, model: AiModel, options: GenerationOptions = {}) {
  const start = Date.now();
  try {
    const generated = await generateInterpretation(question, cards, version, model, options);
    const quality = generated.quality;
    await recordAiGenerationMetric({
      promptVersion: version.id, model: model.id, outcome: "success",
      latencyMs: generated.usage.latencyMs ?? Date.now() - start,
      inputTokens: generated.usage.inputTokens, outputTokens: generated.usage.outputTokens, thinkingTokens: generated.usage.thinkingTokens,
      warningCount: quality?.warnings.length ?? 0,
      overLengthFields: quality?.overLengthFields ?? 0, underLengthFields: quality?.underLengthFields ?? 0,
      duplicateItems: quality?.duplicateItems ?? 0, repeatedSentences: quality?.repeatedSentences ?? 0,
    });
    return generated;
  } catch (error) {
    await recordAiGenerationMetric({ promptVersion: version.id, model: model.id, outcome: error instanceof InterpretationValidationError ? error.code : "provider_error", latencyMs: Date.now() - start });
    throw error;
  }
}
