/**
 * Bảng giá token theo model.
 *
 * Trước đây giá là hai hằng số nằm trong `lib/admin/metrics.ts`, gắn cứng vào
 * `gemini-3-flash-preview`. Nghĩa là đổi model xong thì mọi con số tiền trên
 * dashboard sai âm thầm, không có gì kêu lên. Giờ giá tra theo đúng chuỗi
 * `AiInterpretation.model` đã lưu cùng row, nên một kỳ có hai model vẫn cộng
 * ra đúng tiền.
 *
 * Đây là số cứng chép tay từ bảng giá của nhà cung cấp, không phải số đo:
 * thêm model mới thì phải thêm giá của nó vào đây. Cách tính và bối cảnh ở mục
 * 9 của `AI Tarot Interpretation Prompts.md`.
 */

export interface ModelPricing {
  usdPerInputToken: number;
  usdPerOutputToken: number;
  /** Ghi cho người đọc lại biết con số ở trên lấy từ đâu. */
  note: string;
}

export const VND_PER_USD = 25_876;

const MODEL_PRICING: Record<string, ModelPricing> = {
  "gemini-3-flash-preview": {
    usdPerInputToken: 0.5 / 1_000_000,
    usdPerOutputToken: 3.0 / 1_000_000,
    note: "Tier Standard: $0,50 / 1M input, $3,00 / 1M output.",
  },
};

/**
 * Giá dùng khi gặp model không có trong bảng.
 *
 * Lấy đúng giá của model đang chạy: đoán cao hay đoán thấp đều sai, nhưng đoán
 * bằng model hiện tại thì sai ở mức biết trước. Chỗ nào hiển thị con số tính
 * bằng giá này phải nói rõ là ước lượng — xem `/admin/prompts`.
 */
const FALLBACK_PRICING: ModelPricing = MODEL_PRICING["gemini-3-flash-preview"];

export function getModelPricing(model: string): ModelPricing | null {
  return MODEL_PRICING[model] ?? null;
}

export function isPricedModel(model: string): boolean {
  return getModelPricing(model) !== null;
}

export interface TokenSums {
  inputTokens: number | null;
  outputTokens: number | null;
  thinkingTokens: number | null;
}

/**
 * Chi phí (VND) của một cụm token, tính theo giá của `model`.
 *
 * Ba cột token nullable theo thiết kế (row cũ, và những lượt Gemini không trả
 * `usageMetadata`), nên `_sum` có thể là `null` trên cả ba.
 *
 * Thinking token tính theo giá output: cùng giá, nhưng lưu tách vì phần
 * thinking phình nhanh hơn phần chữ mỗi khi prompt siết thêm ràng buộc.
 */
export function estimateAiCostVnd(sums: TokenSums, model: string): number {
  const pricing = getModelPricing(model) ?? FALLBACK_PRICING;
  const input = sums.inputTokens ?? 0;
  const output = (sums.outputTokens ?? 0) + (sums.thinkingTokens ?? 0);
  const usd = input * pricing.usdPerInputToken + output * pricing.usdPerOutputToken;
  return Math.round(usd * VND_PER_USD);
}

/** Cộng chi phí của nhiều nhóm model — mỗi nhóm tính bằng giá của chính nó. */
export function sumAiCostVnd(groups: readonly (TokenSums & { model: string })[]): number {
  return groups.reduce((total, group) => total + estimateAiCostVnd(group, group.model), 0);
}
