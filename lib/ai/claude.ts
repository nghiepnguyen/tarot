import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { MissingApiKeyError } from "@/lib/ai/errors";
import type {
  GeneratedInterpretation,
  InterpretationCardInput,
} from "@/lib/ai/interpretation";
import { PROVIDER_API_KEY_ENV } from "@/lib/ai/models";
import type { PromptVersion } from "@/lib/ai/prompts";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError(PROVIDER_API_KEY_ENV.claude);
  client ??= new Anthropic({ apiKey });
  return client;
}

/**
 * Trần output cho một lượt sinh.
 *
 * Bản đọc dài nhất theo mốc số từ của prompt v1 khoảng 1.300 từ tiếng Việt,
 * tức vài nghìn token — 16.000 là chỗ thở, không phải con số kỳ vọng. Trần
 * thật của lượt sinh là `maxDuration = 60` của server action, không phải số
 * này: chạm `max_tokens` thì JSON đứt giữa chừng, parse hỏng, và người dùng
 * được hoàn credit.
 */
const MAX_TOKENS = 16_000;

/**
 * Structured outputs của Anthropic đòi mọi object đóng kín.
 *
 * `INTERPRETATION_RESPONSE_SCHEMA` viết cho Gemini, mà Gemini lại từ chối khóa
 * lạ trong `responseSchema`, nên không thể thêm `additionalProperties` thẳng
 * vào bản dùng chung. Thêm ở đây, ngay lúc gửi đi, để hai nhà cung cấp vẫn đọc
 * đúng một nguồn schema — bản prompt đã đóng băng thì không được sửa.
 */
function closeObjects(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(closeObjects);
  if (schema === null || typeof schema !== "object") return schema;

  const source = schema as Record<string, unknown>;
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    mapped[key] = closeObjects(value);
  }
  if (source.type === "object") mapped.additionalProperties = false;
  return mapped;
}

/**
 * Sinh một bản luận giải bằng Claude, theo đúng `version` và `model` truyền vào.
 *
 * Nhận `model` rời khỏi `version` vì từ lúc có trang chọn model mặc định, một
 * bản prompt chạy được trên nhiều model; `version.model` chỉ còn là mặc định
 * lúc chưa ai chọn gì. Bên gọi phải ghi cả hai xuống database — `/admin/prompts`
 * gom số đo theo cặp (prompt, model), không theo riêng cái nào.
 */
export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
  version: PromptVersion,
  model: string,
): Promise<GeneratedInterpretation> {
  const anthropic = getClient();

  const startedAt = Date.now();
  const response = await anthropic.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: version.systemInstruction,
    messages: [{ role: "user", content: version.buildPrompt(question, cards) }],
    output_config: {
      format: {
        type: "json_schema",
        schema: closeObjects(version.responseSchema) as Record<string, unknown>,
      },
    },
  });

  const latencyMs = Date.now() - startedAt;

  if (response.stop_reason === "refusal") {
    throw new Error(
      `Claude từ chối sinh luận giải (${response.stop_details?.category ?? "không rõ lý do"}).`,
    );
  }
  if (response.stop_reason === "max_tokens") {
    // JSON đã đứt giữa chừng. Ném ở đây để người dùng được hoàn credit kèm một
    // dòng Sentry đọc ra nguyên nhân, thay vì một lỗi parse không nói gì.
    throw new Error("Claude chạm trần max_tokens, luận giải bị cắt giữa chừng.");
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text) throw new Error("Claude không trả về nội dung.");

  // `usage.output_tokens` của Anthropic đã bao gồm phần thinking, còn
  // `candidatesTokenCount` của Gemini thì không. Hai cột trong database mang
  // nghĩa của Gemini (tách rời, cộng lại mới ra tổng), nên phải trừ ra ở đây —
  // không thì `lib/ai/pricing.ts` tính phần thinking hai lần.
  const thinkingTokens = response.usage.output_tokens_details?.thinking_tokens ?? 0;

  return {
    result: version.resultSchema.parse(JSON.parse(text)),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens - thinkingTokens,
      thinkingTokens,
      latencyMs,
    },
  };
}
