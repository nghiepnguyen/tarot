/**
 * Những model được phép sinh luận giải, và nhà cung cấp đứng sau mỗi model.
 *
 * Trước đây chỉ có đúng một model, nằm trong `PromptVersion.model`, và
 * `lib/ai/gemini.ts` là đường duy nhất gọi ra ngoài. Giờ có hai nhà cung cấp,
 * nên phải có một chỗ nói rõ chuỗi model nào đi với SDK nào — không thì việc
 * chọn client biến thành đoán chữ (`startsWith("claude-")`) rải rác khắp nơi.
 *
 * Đây là danh sách cho phép, không phải danh mục: giao diện quản trị chỉ chọn
 * được model có trong đây, và mọi model trong đây phải có giá trong
 * `lib/ai/pricing.ts` — chọn nhầm một model không có giá thì mọi con số tiền
 * trên `/admin` lặng lẽ thành ước lượng.
 */

export type AiProvider = "gemini" | "claude";

export interface AiModel {
  id: string;
  provider: AiProvider;
  /** Tên hiện trên giao diện quản trị. */
  label: string;
  /** Một câu cho người chọn biết đổi sang model này nghĩa là gì. */
  note: string;
}

export const AI_MODELS: readonly AiModel[] = [
  {
    id: "gemini-3-flash-preview",
    provider: "gemini",
    label: "Gemini 3 Flash (preview)",
    note: "Model gốc của bản prompt v1. Có thinking token, nên phần suy nghĩ thường đắt hơn phần chữ.",
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "claude",
    label: "Claude Haiku 4.5",
    note: "Rẻ hơn và ổn định về hình JSON nhờ structured outputs. Không bật thinking, nên chi phí gần như chỉ là phần chữ.",
  },
];

export function getAiModel(id: string): AiModel | null {
  return AI_MODELS.find((model) => model.id === id) ?? null;
}

/** Biến môi trường chứa API key của từng nhà cung cấp. */
export const PROVIDER_API_KEY_ENV: Record<AiProvider, string> = {
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
};
