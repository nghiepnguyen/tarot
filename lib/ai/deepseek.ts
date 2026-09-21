import "server-only";
import { MissingApiKeyError } from "@/lib/ai/errors";
import {
  GENERATION_TIMEOUT_MS,
  type GeneratedInterpretation,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";
import { PROVIDER_API_KEY_ENV } from "@/lib/ai/models";
import type { PromptVersion } from "@/lib/ai/prompts";

/**
 * DeepSeek nói giao thức của OpenAI, nên gọi thẳng bằng `fetch`.
 *
 * Gemini đi qua SDK chính chủ vì giao thức của Google là của riêng Google.
 * DeepSeek thì không có SDK JavaScript chính chủ — tài liệu bảo dùng client
 * OpenAI trỏ sang `base_url` này. Kéo nguyên gói `openai` về chỉ để gửi đúng
 * một POST là đổi một phụ thuộc lấy vài dòng code, nên thôi.
 */
const API_URL = "https://api.deepseek.com/chat/completions";

function getApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new MissingApiKeyError(PROVIDER_API_KEY_ENV.deepseek);
  return apiKey;
}

/**
 * Trần output cho một lượt sinh.
 *
 * Bản đọc dài nhất theo mốc số từ của prompt v1 khoảng 1.300 từ tiếng Việt,
 * tức vài nghìn token — 16.000 là chỗ thở, không phải con số kỳ vọng. Trần thật
 * của lượt sinh là `maxDuration = 60` của server action: chạm `max_tokens` thì
 * JSON đứt giữa chừng, parse hỏng, và người dùng được hoàn credit.
 */
const MAX_TOKENS = 16_000;

/**
 * DeepSeek chỉ có `json_object`, không có structured outputs.
 *
 * Gemini nhận `responseSchema` như một tham số và tự ép đầu ra vào đúng hình.
 * DeepSeek thì chỉ hứa "trả về JSON hợp lệ" — hình dạng phải tự nói trong
 * prompt, và chế độ này còn *đòi* chữ "json" xuất hiện trong lời nhắc.
 *
 * Nên schema đi kèm ở đây, ngay lúc gửi, chứ không thêm vào `PromptVersion`:
 * bản prompt đã phát hành thì đóng băng, và Gemini vẫn phải đọc đúng nguồn
 * schema đó. `resultSchema` ở cuối hàm mới là thứ thật sự canh
 * hợp đồng — với DeepSeek nó là lưới duy nhất, không phải lớp kiểm tra thứ hai.
 */
function buildSystemInstruction(version: PromptVersion): string {
  return `${version.systemInstruction}

Trả về đúng một object JSON hợp lệ, không kèm markdown hay lời dẫn, theo JSON schema sau:

${JSON.stringify(version.responseSchema, null, 2)}`;
}

interface ChatCompletion {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number } | null;
  };
}

/**
 * Sinh một bản luận giải bằng DeepSeek, theo đúng `version` và `model` truyền vào.
 *
 * Cùng chữ ký với `lib/ai/gemini.ts`, vì `lib/ai/generate.ts` gọi mọi client
 * như nhau và phần còn lại của ứng dụng không cần biết lượt này chạy bằng ai.
 */
export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
  version: PromptVersion,
  model: string,
): Promise<GeneratedInterpretation> {
  const apiKey = getApiKey();

  const startedAt = Date.now();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: buildSystemInstruction(version) },
        { role: "user", content: version.buildPrompt(question, cards) },
      ],
      response_format: { type: "json_object" },
      // Tắt thinking có chủ đích. Bật thì mặc định `max_tokens` nhảy lên 64K và
      // một lượt đọc dài dễ vượt 45 giây của `GENERATION_TIMEOUT_MS` — mà quá
      // hạn là người dùng mất bài đọc, không chỉ mất thời gian.
      thinking: { type: "disabled" },
    }),
    // Không có vòng thử lại, có chủ đích: thử lại hai lần là ba lượt 45 giây,
    // vượt `maxDuration` đúng theo cách timeout sinh ra để tránh.
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Cắt body lại: lỗi này đi thẳng vào Sentry, và một trang HTML lỗi từ proxy
    // nào đó không đáng chiếm cả sự kiện.
    const body = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`DeepSeek trả về HTTP ${response.status}: ${body || "không có nội dung"}.`);
  }

  const completion = (await response.json()) as ChatCompletion;

  // Đo sau khi đọc xong body, không phải ngay sau `await fetch`. DeepSeek gửi
  // header 200 gần như tức thì rồi mới nhỏ giọt phần chữ, nên đo ở chỗ kia ra
  // 0,4 giây cho một bài đọc bốn nghìn token — số đó không đo gì cả, mà lại
  // nằm cạnh số thật của Gemini trong `AiInterpretation.latencyMs`.
  const latencyMs = Date.now() - startedAt;

  const choice = completion.choices?.[0];

  if (choice?.finish_reason === "length") {
    // JSON đã đứt giữa chừng. Ném ở đây để người dùng được hoàn credit kèm một
    // dòng Sentry đọc ra nguyên nhân, thay vì một lỗi parse không nói gì.
    throw new Error("DeepSeek chạm trần max_tokens, luận giải bị cắt giữa chừng.");
  }
  if (choice?.finish_reason === "content_filter") {
    throw new Error("DeepSeek từ chối sinh luận giải (content_filter).");
  }

  // Tài liệu DeepSeek nói thẳng là chế độ JSON thỉnh thoảng trả content rỗng.
  // Đó là một lượt hỏng, không phải một bài đọc trống.
  const text = choice?.message?.content;
  if (!text) throw new Error("DeepSeek không trả về nội dung.");

  // `completion_tokens` theo quy ước OpenAI đã gồm cả phần reasoning, khác
  // Gemini. Hai cột trong database mang nghĩa của Gemini
  // (tách rời, cộng lại mới ra tổng), nên phải trừ ra — không thì
  // `lib/ai/pricing.ts` tính phần thinking hai lần.
  const thinkingTokens = completion.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens;

  return {
    result: version.resultSchema.parse(JSON.parse(text)),
    usage: {
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completionTokens === undefined ? undefined : completionTokens - thinkingTokens,
      thinkingTokens,
      latencyMs,
    },
  };
}
