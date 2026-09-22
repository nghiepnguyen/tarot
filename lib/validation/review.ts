import { z } from "zod";
import { MAX_STARS, MIN_STARS } from "@/lib/ai/interpretation";

/**
 * Điểm gửi lên từ hộp chấm điểm.
 *
 * Server action là một POST ai cũng gọi được, nên khoảng 1–5 phải được canh ở
 * đây chứ không ở giao diện: `InterpretationReview` lưu ba cột `Int`, và
 * Postgres không có kiểu "1 đến 5". Không có ràng buộc này thì một request tay
 * ghi được 9.999 sao và mọi số trung bình trên `/admin` thành vô nghĩa.
 */
const Stars = z
  .number()
  .int("Điểm phải là số nguyên.")
  .min(MIN_STARS, `Điểm thấp nhất là ${MIN_STARS} sao.`)
  .max(MAX_STARS, `Điểm cao nhất là ${MAX_STARS} sao.`);

export const InterpretationReviewSchema = z.object({
  interpretationId: z.string().min(1),
  accuracy: Stars,
  clarity: Stars,
  actionability: Stars,
  // Cắt ở 2.000 ký tự: đây là ô nhận xét, không phải chỗ dán cả bài đọc. Chuỗi
  // rỗng sau khi trim thành `null` để database không đầy những dòng trắng.
  comment: z
    .string()
    .trim()
    .max(2_000, "Nhận xét dài quá 2.000 ký tự.")
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

export type InterpretationReviewPayload = z.infer<typeof InterpretationReviewSchema>;
