import type { InterpretationResult } from "./interpretation";

export type ValidationCode = "invalid_json" | "invalid_schema" | "position_mismatch";
/** Không chứa input, output hoặc Zod issue có thể mang dữ liệu riêng tư. */
export class InterpretationValidationError extends Error {
  constructor(public readonly code: ValidationCode) {
    super(`AI output validation: ${code}`);
    this.name = "InterpretationValidationError";
  }
}

export interface QualityWarning {
  code: "under_length" | "over_length" | "duplicate_item" | "repeated_sentence" | "sentence_count";
  field: string;
  count: number;
}
export interface InterpretationQuality {
  warnings: QualityWarning[];
  overLengthFields: number;
  underLengthFields: number;
  duplicateItems: number;
  repeatedSentences: number;
}

/** Quy ước theo prompt: đếm đơn vị tách bởi khoảng trắng, không phải từ vựng tiếng Việt. */
export const countWords = (text: string): number => text.trim().split(/\s+/u).filter(Boolean).length;
const normalize = (text: string) => text.normalize("NFC").toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/gu, " ").trim();
const sentences = (text: string) => text.split(/[.!?…]+(?:\s|$)/u).map(t => t.trim()).filter(Boolean);

export function assertPositions(result: InterpretationResult, positions: readonly string[]): void {
  if (result.perCard.length !== positions.length || result.perCard.some((card, i) => card.position !== positions[i])) {
    throw new InterpretationValidationError("position_mismatch");
  }
}

/** Cảnh báo biên tập không làm mất bản đọc, không tự gọi model lần hai. */
export function assessInterpretationQuality(result: InterpretationResult): InterpretationQuality {
  const report: InterpretationQuality = { warnings: [], overLengthFields: 0, underLengthFields: 0, duplicateItems: 0, repeatedSentences: 0 };
  const fields: Array<[string, string, number, number]> = [
    ["summary", result.summary, 40, 60], ["overview", result.overview, 90, 115],
    ...result.perCard.flatMap((card, i): Array<[string, string, number, number]> => [
      [`perCard.${i}.keyMessage`, card.keyMessage, 12, 20], [`perCard.${i}.text`, card.text, 50, 65],
    ]),
    ["connections", result.connections, 140, 180],
    ...result.actionSuggestions.map((text, i): [string, string, number, number] => [`actionSuggestions.${i}`, text, 35, 55]),
    ["closingNote", result.closingNote, 60, 90],
  ];
  for (const [field, text, min, max] of fields) {
    const count = countWords(text);
    if (count > max) { report.overLengthFields++; report.warnings.push({ code: "over_length", field, count }); }
    if (count < min) { report.underLengthFields++; report.warnings.push({ code: "under_length", field, count }); }
  }
  for (const [field, items] of [["themes", result.themes], ["actionSuggestions", result.actionSuggestions]] as const) {
    const seen = new Set<string>();
    for (const item of items) {
      const key = normalize(item);
      if (seen.has(key)) { report.duplicateItems++; report.warnings.push({ code: "duplicate_item", field, count: 1 }); }
      seen.add(key);
    }
  }
  const seenSentences = new Map<string, string>();
  for (const [field, text] of fields) {
    for (const sentence of sentences(text)) {
      if (countWords(sentence) < 8) continue;
      const key = normalize(sentence);
      if (seenSentences.has(key) && seenSentences.get(key) !== field) {
        report.repeatedSentences++; report.warnings.push({ code: "repeated_sentence", field, count: 1 });
      }
      seenSentences.set(key, field);
    }
  }
  const sentenceFields: Array<[string, string, number, number]> = [
    ["summary", result.summary, 2, 3], ["reflectiveQuestion", result.reflectiveQuestion, 1, 1],
    ["closingNote", result.closingNote, 3, 4],
    ...result.actionSuggestions.map((text, i): [string, string, number, number] => [`actionSuggestions.${i}`, text, 2, 3]),
  ];
  for (const [field, text, min, max] of sentenceFields) {
    const count = sentences(text).length;
    if (count < min || count > max) report.warnings.push({ code: "sentence_count", field, count });
  }
  return report;
}
