import type { PromptVersion } from "./prompts/types";
import type { InterpretationCardInput } from "./interpretation";
import { InterpretationValidationError } from "./quality";

export function parseGeneratedInterpretation(text: string, version: PromptVersion, cards: InterpretationCardInput[]) {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new InterpretationValidationError("invalid_json"); }
  const parsed = version.resultSchema.safeParse(raw);
  if (!parsed.success) throw new InterpretationValidationError("invalid_schema");
  return { result: parsed.data, quality: version.validateResult?.(parsed.data, cards) };
}
