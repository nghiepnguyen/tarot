/** Offline only: prepare anonymous packets; keep the key outside the review directory. */
import { randomInt, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { InterpretationResultSchema, type InterpretationResult } from "../lib/ai/interpretation";

type ReviewPair = {
  caseId: string; model: string; baseline: string; candidate: string; question: string;
  cards: { name: string; position: string; orientation: "upright" | "reversed" }[];
  reviewExpectation?: unknown;
  results: { version: string; ok: boolean; result?: InterpretationResult; error?: string }[];
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildReviewPackets(pairs: ReviewPair[]) {
  const groups = new Map<string, ReviewPair[]>();
  for (const pair of pairs) {
    if (pair.baseline === pair.candidate || pair.results.length !== 2
      || [pair.baseline, pair.candidate].some(version => pair.results.filter(row => row.version === version).length !== 1)
      || pair.results.some(row => row.ok ? !row.result : !row.error)) {
      throw new Error("Invalid benchmark review pair");
    }
    const group = JSON.stringify([pair.model, pair.baseline, pair.candidate]);
    groups.set(group, [...(groups.get(group) ?? []), pair]);
  }
  const review = [];
  const key = [];
  for (const group of groups.values()) {
    const baselineCount = Math.floor(group.length / 2) + (group.length % 2 ? randomInt(2) : 0);
    const baselineFirst = shuffle(group.map((_, index) => index < baselineCount));
    for (const [index, pair] of group.entries()) {
      const pairId = randomUUID();
      const versions = baselineFirst[index] ? [pair.baseline, pair.candidate] : [pair.candidate, pair.baseline];
      key.push({ pairId, caseId: pair.caseId, model: pair.model, baseline: pair.baseline, candidate: pair.candidate, A: versions[0], B: versions[1] });
      review.push({
        pairId, question: pair.question, cards: pair.cards, reviewExpectation: pair.reviewExpectation,
        candidates: versions.map((version, candidateIndex) => {
          const row = pair.results.find(result => result.version === version)!;
          return {
            label: candidateIndex === 0 ? "A" as const : "B" as const,
            output: row.ok ? row.result! : null, error: row.ok ? null : row.error!,
            scores: { grounding: null, specificity: null, connections: null, voice: null, actionability: null },
            flags: { unsupported_claim: null, forced_relation: null, third_party_mindreading: null, safety_error: null, card_error: null },
            evidence: [],
          };
        }), preference: null, notes: "",
      });
    }
  }
  return { review: shuffle(review), key };
}

const runSchema = z.object({ baseline: z.string(), candidate: z.string(), model: z.string() });
const inputSchema = z.array(z.object({
  id: z.string(), question: z.string(), reviewExpectation: z.unknown().optional(),
  cards: z.array(z.object({ card: z.object({ name: z.string() }), position: z.string(), orientation: z.enum(["upright", "reversed"]) })).length(3),
}));
const resultsSchema = z.array(z.object({
  caseId: z.string(), model: z.string(), version: z.string(), ok: z.boolean(), result: InterpretationResultSchema.optional(),
  error: z.enum(["timeout", "provider_error", "invalid_json", "invalid_schema", "position_mismatch"]).optional(),
}));

export async function main(args: string[]) {
  const output = args.find(arg => arg.startsWith("--output="))?.slice(9);
  const keyPath = args.find(arg => arg.startsWith("--key="))?.slice(6);
  const runs = args.filter(arg => !arg.startsWith("--"));
  if (!output || !keyPath || !runs.length) throw new Error("Use --output=<review-directory> --key=<separate-key-file> <run-directories...>");
  const relative = path.relative(path.resolve(output), path.resolve(keyPath));
  if (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) throw new Error("Keep the version key outside the review directory.");
  const pairs: ReviewPair[] = [];
  for (const dir of runs) {
    try {
      const metadata = runSchema.parse(JSON.parse(await readFile(path.join(dir, "run.json"), "utf8")));
      const inputs = inputSchema.parse(JSON.parse(await readFile(path.join(dir, "input.json"), "utf8")));
      const rows = resultsSchema.parse(JSON.parse(await readFile(path.join(dir, "results.json"), "utf8")));
      if (rows.some(row => row.model !== metadata.model || !inputs.some(input => input.id === row.caseId))) throw new Error("Mismatched run");
      for (const fixture of inputs) {
        const results = rows.filter(row => row.caseId === fixture.id);
        if (!results.length) continue;
        pairs.push({
          caseId: fixture.id, ...metadata, question: fixture.question, reviewExpectation: fixture.reviewExpectation,
          cards: fixture.cards.map(({ card, position, orientation }) => ({ name: card.name, position, orientation })),
          results,
        });
      }
    } catch { throw new Error("Invalid benchmark run artifacts."); }
  }
  if (!pairs.length) throw new Error("No attempted benchmark pairs to review.");
  const { review, key } = buildReviewPackets(pairs);
  await mkdir(output);
  await writeFile(keyPath, JSON.stringify(key, null, 2), { flag: "wx", mode: 0o600 });
  await writeFile(path.join(output, "review.json"), JSON.stringify(review, null, 2));
  const markdown = [
    "# Phiếu chấm mù Tarot", "",
    "Chấm độc lập trước khi xem khóa phiên bản hoặc điểm reviewer khác. Mỗi tiêu chí 0 = lỗi/thiếu, 1 = đạt một phần, 2 = đạt rõ. Không suy phiên bản từ văn phong.", "",
    "Trong review.json, điền năm scores (grounding, specificity, connections, voice, actionability); điền từng flag true/false. Khi có lỗi, thêm evidence gồm field, excerpt, supportRefs và lý do. preference chọn A/B/tie; lỗi semantic/safety/card không thể thắng bằng tổng điểm văn phong. Có thể ghi nhận xét theo mã pair ngay trong file Markdown này.", "",
    ...review.flatMap(pair => [
      `## Cặp ${pair.pairId}`, "", `Câu hỏi: ${pair.question}`, "",
      ...pair.cards.map(card => `- ${card.position}: ${card.name} (${card.orientation})`), "",
      `Kỳ vọng chấm: ${JSON.stringify(pair.reviewExpectation)}`, "",
      ...pair.candidates.flatMap(candidate => [
        `### Bản ${candidate.label}`, "", "```json", JSON.stringify(candidate.output ?? { error: candidate.error }, null, 2), "```", "",
        "Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __", "",
        "Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __", "",
        "Dẫn chứng/lý do: __", "",
      ]),
      "Ưu tiên (A/B/tie): __. Nhận xét: __", "",
    ]),
  ].join("\n");
  await writeFile(path.join(output, "review.md"), markdown);
  return { output, pairs: review.length };
}

if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2)).then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error(error instanceof Error ? error.message : "Review preparation failed");
    process.exitCode = 1;
  });
}
