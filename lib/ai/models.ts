/**
 * Những model được phép sinh luận giải, và nhà cung cấp đứng sau mỗi model.
 *
 * Trước đây chỉ có đúng một model, nằm trong `PromptVersion.model`, và
 * `lib/ai/gemini.ts` là đường duy nhất gọi ra ngoài. Giờ có nhiều nhà cung cấp,
 * nên phải có một chỗ nói rõ chuỗi model nào đi với SDK nào — không thì việc
 * chọn client biến thành đoán chữ (`startsWith("gemini-")`) rải rác khắp nơi.
 *
 * Đây là danh sách cho phép, không phải danh mục: giao diện quản trị chỉ chọn
 * được model có trong đây, và mọi model trong đây phải có giá trong
 * `lib/ai/pricing.ts` — chọn nhầm một model không có giá thì mọi con số tiền
 * trên `/admin` lặng lẽ thành ước lượng.
 */

export type AiProvider = "gemini" | "deepseek";

/** Model mặc định của ứng dụng; tách khỏi metadata của các prompt đã đóng băng. */
export const DEFAULT_AI_MODEL_ID = "gemini-3.8-flash";

export interface AiModel {
  id: string;
  provider: AiProvider;
  /** Tên hiện trên giao diện quản trị. */
  label: string;
  /**
   * Bút danh ký dưới mỗi bản diễn giải, hiện cho người đọc thay cho tên model.
   *
   * Không phải để cho vui: chế độ chọn model ngẫu nhiên chỉ có nghĩa khi người
   * chấm điểm không biết mình đang chấm nhà cung cấp nào. "Gemini 3 Flash" nói
   * quá nhiều, "Minh Trí" thì không nói gì — và nó *phải* cố định theo model,
   * không đổi theo lượt, thì `/admin/prompts` mới cộng điểm theo model được.
   */
  persona: string;
  /** Một câu cho người chọn biết đổi sang model này nghĩa là gì. */
  note: string;
}

export const AI_MODELS: readonly AiModel[] = [
  {
    id: DEFAULT_AI_MODEL_ID,
    provider: "gemini",
    label: "Gemini 3.8 Flash",
    persona: "Minh Trí",
    note: "Model Gemini mặc định. Có thinking token, tính cùng giá với output token.",
  },
  {
    id: "deepseek-flash",
    provider: "deepseek",
    label: "DeepSeek V4.1-Flash",
    persona: "Duy Thâm",
    note: "Không có thinking token. Hình JSON chỉ do prompt giữ chứ không có structured outputs, và nó viết dài hơn mốc số từ của prompt.",
  },
];

export function getAiModel(id: string): AiModel | null {
  return AI_MODELS.find((model) => model.id === id) ?? null;
}

/**
 * Bút danh của model đã sinh ra một bản diễn giải, tra từ chuỗi model đã lưu.
 *
 * Trả `null` cho model không còn trong danh sách — những row sinh bằng
 * `claude-haiku-4-5-20251001` chẳng hạn. Giao diện bỏ hẳn dòng "Tarot Reader"
 * trong trường hợp đó, chứ không bịa một cái tên cho một model đã gỡ.
 */
export function getModelPersona(modelId: string): string | null {
  return getAiModel(modelId)?.persona ?? null;
}

/**
 * Giá trị đặc biệt của cài đặt `ai.model`: mỗi lượt mở khóa bốc một model.
 *
 * Nằm trong cùng một ô chọn với các model thật, không phải một công tắc riêng,
 * vì đây là *một* câu hỏi: lượt tiếp theo chạy bằng gì. Hai chỗ lưu trạng thái
 * thì sẽ có lúc chúng nói ngược nhau, và không ai đọc ra được `/admin` đang
 * hứa gì.
 *
 * Để ở đây chứ không ở `lib/ai/settings.ts` vì lớp kiểm dữ liệu
 * (`lib/validation/admin.ts`) cũng cần nó, mà `settings.ts` khai `server-only`.
 */
export const RANDOM_AI_MODEL_VALUE = "random";

export const RANDOM_AI_MODEL_LABEL = "Ngẫu nhiên";

/** Biến môi trường chứa API key của từng nhà cung cấp. */
export const PROVIDER_API_KEY_ENV: Record<AiProvider, string> = {
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};
