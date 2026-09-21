import "server-only";
import { generateInterpretation as generateWithDeepSeek } from "@/lib/ai/deepseek";
import { generateInterpretation as generateWithGemini } from "@/lib/ai/gemini";
import type {
  GeneratedInterpretation,
  InterpretationCardInput,
} from "@/lib/ai/interpretation";
import type { AiModel } from "@/lib/ai/models";
import type { PromptVersion } from "@/lib/ai/prompts";

export { MissingApiKeyError } from "@/lib/ai/errors";

/**
 * Một cửa duy nhất để sinh luận giải, bất kể nhà cung cấp nào đứng sau.
 *
 * Mọi client trả về cùng `GeneratedInterpretation` và parse kết quả bằng cùng
 * `version.resultSchema`, nên phần còn lại của ứng dụng — trừ trang quản trị —
 * không cần biết lượt này chạy bằng nhà cung cấp nào. `switch` trên `provider`
 * thay vì đoán theo tên model: thêm nhà cung cấp mới mà quên nối dây thì
 * TypeScript báo ngay tại đây.
 */
export async function generateInterpretation(
  question: string,
  cards: InterpretationCardInput[],
  version: PromptVersion,
  model: AiModel,
): Promise<GeneratedInterpretation> {
  switch (model.provider) {
    case "gemini":
      return generateWithGemini(question, cards, version, model.id);
    case "deepseek":
      return generateWithDeepSeek(question, cards, version, model.id);
  }
}
