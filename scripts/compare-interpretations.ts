/**
 * Chạy đúng một trải bài qua nhiều model, ghi kết quả ra file để đọc cạnh nhau.
 *
 * Câu hỏi đang cần trả lời là model nào đọc *truyền cảm* hơn, mà cái đó không
 * có trong token hay latency — phải đọc bằng mắt. Đổi model trên `/admin` rồi
 * mở khoá thử thì mỗi lần chỉ được một bản, tốn credit thật, và hai bản rơi
 * vào hai trải bài khác nhau nên không so được gì.
 *
 *   pnpm compare-interpretations "Câu hỏi của bạn"
 *   pnpm compare-interpretations "Câu hỏi" --models=deepseek-flash
 *
 * Ba lá bài rút ngẫu nhiên, nhưng *cùng một bộ ba* cho mọi model — khác bài thì
 * không còn là so sánh. Kết quả ghi vào `.model-compare/` (đã gitignore).
 *
 * Gọi thẳng `lib/ai/`, nên đây là đúng đường code production chạy, kể cả trần
 * thời gian. Import được là nhờ `--conditions=react-server` trong script của
 * package.json: `lib/ai/*.ts` khai `server-only`, mà gói đó ném lỗi ở mọi
 * điều kiện khác.
 *
 * `--env-file-if-exists=.env.local` cũng nằm trong script đó, và cũng là thứ
 * bắt buộc: `.env.local` là quy ước của Next, không phải của Node, nên chạy
 * thẳng bằng tsx thì không có gì nạp nó. Thiếu cờ này thì mọi model đều báo
 * thiếu API key dù key nằm sẵn trong file — lỗi đọc ra y hệt như chưa cấu hình.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateInterpretation } from "@/lib/ai/generate";
import type { InterpretationResult, InterpretationCardInput } from "@/lib/ai/interpretation";
import { AI_MODELS, getAiModel, type AiModel } from "@/lib/ai/models";
import { estimateAiCostVnd } from "@/lib/ai/pricing";
import { ACTIVE_PROMPT_VERSION } from "@/lib/ai/prompts";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";

const OUT_DIR = ".model-compare";

function pickCards(): InterpretationCardInput[] {
  const pool = [...TAROT_CARDS];
  return SPREAD_POSITIONS.map((position) => {
    const [card] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    return {
      position,
      card,
      orientation: Math.random() < 0.3 ? ("reversed" as const) : ("upright" as const),
    };
  });
}

function toMarkdown(
  model: AiModel,
  question: string,
  cards: InterpretationCardInput[],
  result: InterpretationResult,
): string {
  const header = cards
    .map((c) => `- **${c.position}**: ${c.card.name} (${c.orientation === "reversed" ? "ngược" : "xuôi"})`)
    .join("\n");

  return `# ${model.label}

**Model:** \`${model.id}\` · **Prompt:** \`${ACTIVE_PROMPT_VERSION.id}\`

**Câu hỏi:** ${question}

${header}

## summary

${result.summary}

## overview

${result.overview}

## themes

${result.themes.map((t) => `- ${t}`).join("\n")}

${result.perCard
  .map((c) => `## ${c.position}\n\n> ${c.keyMessage}\n\n${c.text}`)
  .join("\n\n")}

## connections

${result.connections}

## actionSuggestions

${result.actionSuggestions.map((a) => `- ${a}`).join("\n")}

## reflectiveQuestion

${result.reflectiveQuestion}

## closingNote

${result.closingNote}
`;
}

async function main() {
  const args = process.argv.slice(2);
  const modelsArg = args.find((arg) => arg.startsWith("--models="));
  const question =
    args.find((arg) => !arg.startsWith("--")) ?? "Tôi có nên nhận lời mời công việc mới không?";

  const models = modelsArg
    ? modelsArg
        .slice("--models=".length)
        .split(",")
        .map((id) => {
          const model = getAiModel(id.trim());
          if (!model) throw new Error(`Model "${id.trim()}" không có trong lib/ai/models.ts.`);
          return model;
        })
    : [...AI_MODELS];

  const cards = pickCards();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  console.log(`Câu hỏi: ${question}`);
  for (const card of cards) {
    console.log(`  ${card.position}: ${card.card.name} (${card.orientation})`);
  }
  console.log("");

  await mkdir(OUT_DIR, { recursive: true });

  // Tuần tự chứ không song song: hai lượt chạy cùng lúc thì số giây đo được
  // lẫn cả thời gian chờ mạng của lượt kia.
  for (const model of models) {
    try {
      const { result, usage } = await generateInterpretation(
        question,
        cards,
        ACTIVE_PROMPT_VERSION,
        model,
      );

      const costVnd = estimateAiCostVnd(
        {
          inputTokens: usage.inputTokens ?? null,
          outputTokens: usage.outputTokens ?? null,
          thinkingTokens: usage.thinkingTokens ?? null,
        },
        model.id,
      );
      const seconds = ((usage.latencyMs ?? 0) / 1000).toFixed(1);
      const file = path.join(OUT_DIR, `${stamp}--${model.id}.md`);
      await writeFile(file, toMarkdown(model, question, cards, result), "utf8");

      console.log(
        `${model.label}: ${seconds}s · in ${usage.inputTokens ?? "?"} · out ${usage.outputTokens ?? "?"} · think ${usage.thinkingTokens ?? "?"} · ~${costVnd.toLocaleString("vi-VN")}đ`,
      );
      console.log(`  ${file}`);
    } catch (error) {
      console.log(`${model.label}: HỎNG — ${(error as Error).message}`);
    }
  }
}

void main();
