import type { z } from "zod";
import type { InterpretationQuality } from "../quality";
import type {
  InterpretationCardInput,
  InterpretationResult,
} from "@/lib/ai/interpretation";

/**
 * Một bản prompt đã phát hành, gắn liền với model sinh ra nó.
 *
 * Prompt ở đây là *code*, không phải dữ liệu biên tập: nó cột chặt vào
 * `responseSchema` gửi cho Gemini và vào `resultSchema` parse lại kết quả (ví
 * dụ `perCard` phải đúng 3 phần tử), và nó chứa cả ràng buộc an toàn — không
 * lời khuyên y tế, pháp lý, tài chính. Một ô textarea trên trang quản trị bỏ
 * qua được cả hai thứ đó, nên không có đường sửa prompt từ giao diện. Đổi
 * prompt nghĩa là thêm một version mới ở đây rồi deploy.
 *
 * Version đã phát hành thì **đóng băng**: không sửa nữa, chỉ thêm bản mới.
 * `AiInterpretation.promptVersion` trỏ ngược về `id` này, nên sửa nội dung một
 * version cũ làm mọi row đã sinh bằng nó nói dối.
 *
 * `resultSchema` cùng kiểu `InterpretationResult` cho mọi version có chủ đích:
 * các cột của `AiInterpretation` là cố định, nên một version muốn đổi *hình
 * dạng* đầu ra phải đi kèm migration, không chỉ đổi prompt.
 */
export interface PromptVersion {
  /** Id lưu vào database. Đặt theo dạng `v<n>-<ngày phát hành>`. */
  id: string;
  /** Model đi cùng prompt này. Giá của nó phải có trong `lib/ai/pricing.ts`. */
  model: string;
  systemInstruction: string;
  /** Schema gửi kèm request, ép Gemini trả JSON đúng hình. */
  responseSchema: object;
  /** V4 dùng JSON Schema; các bản cũ giữ nguyên Schema của SDK. */
  schemaFormat?: "json";
  validateResult?: (result: InterpretationResult, cards: InterpretationCardInput[]) => InterpretationQuality;
  /** Schema parse lại phía mình — không tin Gemini giữ đúng hợp đồng. */
  resultSchema: z.ZodType<InterpretationResult>;
  buildPrompt(question: string, cards: InterpretationCardInput[]): string;
  /** Phát hành ngày nào, đổi gì so với bản trước, vì sao. Hiện trên `/admin/prompts`. */
  releasedAt: string;
  notes: string;
}
