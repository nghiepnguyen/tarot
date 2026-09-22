import "server-only";
import { sendEmail } from "@/lib/email/resend";
import { MAX_STARS, REVIEW_CRITERIA } from "@/lib/ai/interpretation";

/**
 * Hòm thư nhận đánh giá.
 *
 * Hằng số trong code chứ không phải biến môi trường: đây không phải cấu hình
 * theo môi trường mà là một địa chỉ người thật, và để trong env thì preview
 * hay local thiếu biến sẽ lặng lẽ nuốt thư. Đổi người nhận là một lần sửa code
 * đi qua review — đúng mức nghiêm trọng của việc đổi chỗ nhận ý kiến khách.
 */
export const REVIEW_RECIPIENT = "thanhnghiep.top@gmail.com";

export interface ReviewEmailInput {
  /** Bút danh người đọc nhìn thấy. */
  reader: string | null;
  /** Model thật đứng sau bút danh đó. Chỉ có trong thư, không ra giao diện. */
  model: string;
  promptVersion: string | null;
  question: string;
  readingId: string;
  accuracy: number;
  clarity: number;
  actionability: number;
  comment: string | null;
  /** Lần chấm đầu hay lần sửa. Tiêu đề thư nói rõ, xem `buildReviewEmail`. */
  isUpdate: boolean;
}

function stars(score: number): string {
  return `${"★".repeat(score)}${"☆".repeat(MAX_STARS - score)} ${score}/${MAX_STARS}`;
}

/**
 * Soạn thư báo một lượt chấm điểm.
 *
 * Thư mang *cả* bút danh lẫn tên model thật. Người đọc chỉ thấy "Minh Trí", và
 * đó là điều làm con số có giá trị; nhưng thư này đọc để quyết định giữ model
 * nào, nên ở đây phải gọi đúng tên. Kèm luôn câu hỏi và id bài đọc: một điểm 2
 * sao không nói được gì nếu không tra lại được bài nào bị chấm.
 */
export function buildReviewEmail(input: ReviewEmailInput): { subject: string; text: string } {
  const total = input.accuracy + input.clarity + input.actionability;
  const criteria = REVIEW_CRITERIA.map(
    (criterion) => `${criterion.label} (${criterion.english}): ${stars(input[criterion.key])}`,
  ).join("\n");

  const subject = `${input.isUpdate ? "[Sửa] " : ""}Đánh giá diễn giải — ${
    input.reader ?? input.model
  } — ${total}/${REVIEW_CRITERIA.length * MAX_STARS}`;

  const text = [
    criteria,
    "",
    `Nhận xét: ${input.comment ?? "(không có)"}`,
    "",
    `Tarot Reader: ${input.reader ?? "(model đã gỡ)"}`,
    `Model: ${input.model}`,
    `Prompt: ${input.promptVersion ?? "(chưa ghi)"}`,
    `Câu hỏi: ${input.question}`,
    `Reading: ${input.readingId}`,
  ].join("\n");

  return { subject, text };
}

/**
 * Gửi thư báo đánh giá. Không bao giờ ném lỗi.
 *
 * `sendEmail` đã nuốt mọi lỗi và trả `false`, và chỗ gọi cũng không được phép
 * quan tâm: điểm đã nằm trong database trước khi thư được gửi. Resend chết mà
 * làm hỏng lượt chấm của khách thì thuốc độc hơn bệnh.
 */
export async function sendReviewEmail(input: ReviewEmailInput): Promise<boolean> {
  const { subject, text } = buildReviewEmail(input);
  return sendEmail({ to: REVIEW_RECIPIENT, subject, text });
}
