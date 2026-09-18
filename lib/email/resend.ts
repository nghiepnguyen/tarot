import "server-only";

import { reportHandledError, reportHandledIssue } from "@/lib/monitoring/report";

const RESEND_API = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  /** Mặc định `ALERT_EMAIL_FROM`. Thư gửi cho khách đặt địa chỉ riêng. */
  from?: string;
}

/**
 * Gửi một email qua Resend.
 *
 * **Không bao giờ ném lỗi.** Chỗ gọi tự quyết định hỏng thì làm gì: cảnh báo
 * vận hành chạy xen giữa việc cộng credit cho khách, Resend chết mà kéo đổ cả
 * giao dịch thì thuốc độc hơn bệnh; còn email xác nhận đăng ký đọc giá trị trả
 * về để báo lại cho người dùng. Hỏng thì ghi log và trả `false`.
 *
 * Thiếu `RESEND_API_KEY` cũng trả `false` chứ không nổ: local và preview không
 * cần cấu hình email vẫn phải chạy được.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] Bỏ qua "${input.subject}": chưa cấu hình RESEND_API_KEY.`);
    return false;
  }

  const from = input.from || process.env.ALERT_EMAIL_FROM;
  if (!from) {
    console.warn(`[email] Bỏ qua "${input.subject}": chưa cấu hình ALERT_EMAIL_FROM.`);
    return false;
  }

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[email] Resend trả ${response.status} cho "${input.subject}": ${detail}`);
      // Chỉ gửi subject và mã lỗi: địa chỉ người nhận và nội dung thư không
      // được rời khỏi server.
      reportHandledIssue("Resend từ chối gửi email", {
        area: "email-send",
        extra: { subject: input.subject, status: response.status },
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] Không gửi được "${input.subject}":`, error);
    reportHandledError(error, { area: "email-send", extra: { subject: input.subject } });
    return false;
  }
}
