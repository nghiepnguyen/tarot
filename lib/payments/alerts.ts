import "server-only";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email/resend";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/seo/site";

/**
 * Cảnh báo vận hành cho các tình huống thanh toán không tự giải quyết được.
 *
 * Chống lặp bằng chính bảng `RateLimit`: webhook PayOS gửi lại nhiều lần, và
 * cron quét lại mỗi ngày, nên nếu không chặn thì cùng một sự cố sẽ đẻ ra hàng
 * loạt email giống hệt nhau — đúng cách nhanh nhất để biến cảnh báo thành thứ
 * bị bỏ qua. Bảng đó nằm ở Postgres nên khoá chống lặp sống sót qua deploy.
 */

/** Cùng một đơn chỉ cảnh báo một lần mỗi ngày. */
const MISMATCH_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Tổng hợp đơn kẹt: nửa ngày một lần là đủ, cron vốn chạy mỗi ngày. */
const STUCK_WINDOW_MS = 12 * 60 * 60 * 1000;

export interface AmountMismatchAlert {
  orderId: string;
  providerOrderId: string;
  expectedVnd: number;
  paidVnd: number;
}

/**
 * Số tiền nhận được không khớp giá gói đã chốt lúc tạo đơn. Credit không được
 * cộng, đơn nằm nguyên `PENDING`, và không có đường tự động nào gỡ được —
 * phải có người nhìn vào.
 */
export async function alertAmountMismatch(alert: AmountMismatchAlert): Promise<void> {
  if (!(await checkRateLimit(`alert:mismatch:${alert.orderId}`, 1, MISMATCH_WINDOW_MS))) {
    return;
  }

  await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Tarot] Số tiền thanh toán lệch — đơn ${alert.orderId}`,
    text: [
      "Một giao dịch PayOS báo số tiền khác với giá gói đã chốt lúc tạo đơn.",
      "Credit CHƯA được cộng và đơn vẫn ở trạng thái PENDING.",
      "",
      `Đơn          : ${alert.orderId}`,
      `orderCode    : ${alert.providerOrderId}`,
      `Chờ nhận     : ${alert.expectedVnd.toLocaleString("vi-VN")}đ`,
      `Thực nhận    : ${alert.paidVnd.toLocaleString("vi-VN")}đ`,
      `Lệch         : ${(alert.paidVnd - alert.expectedVnd).toLocaleString("vi-VN")}đ`,
      "",
      "Việc cần làm:",
      "1. Đối chiếu giao dịch trên dashboard PayOS.",
      "2. Khách trả đúng mà hệ thống hiểu sai thì cộng credit tay và ghi sổ.",
      "3. Khách trả thiếu thì hoàn tiền trên PayOS rồi đóng đơn.",
      "",
      `Trang hồ sơ khách: ${SITE_URL}/profile`,
    ].join("\n"),
  });
}

/**
 * Còn đơn `PENDING` sau khi đã đối soát với PayOS. Nghĩa là PayOS cũng chưa
 * chốt, hoặc không gọi được sang PayOS — dù sao cũng là tiền có thể đang treo.
 */
export async function alertStuckOrders(count: number): Promise<void> {
  if (count <= 0) return;
  if (!(await checkRateLimit("alert:stuck-orders", 1, STUCK_WINDOW_MS))) return;

  await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Tarot] ${count} đơn vẫn treo sau khi đối soát`,
    text: [
      `Lượt quét vừa rồi còn ${count} đơn ở trạng thái PENDING sau khi đã hỏi PayOS.`,
      "",
      "Thường là một trong hai:",
      "- PayOS cũng đang báo PENDING/PROCESSING và đơn chưa hết hạn. Lượt quét sau sẽ tự đóng.",
      "- Không gọi được sang PayOS. Kiểm tra PAYOS_* trên Vercel và trang trạng thái của PayOS.",
      "",
      "Đơn quá hạn sẽ tự chuyển EXPIRED, nên con số này kéo dài nhiều ngày mới là bất thường.",
      "",
      `Cron: ${SITE_URL}/api/cron/reconcile-orders`,
    ].join("\n"),
  });
}
