/**
 * Cấu hình dùng chung cho cả ba runtime của Sentry (browser, Node, Edge).
 *
 * DSN đọc từ `NEXT_PUBLIC_SENTRY_DSN` cho cả server lẫn client: DSN vốn công
 * khai trong bundle trình duyệt nên không có gì để giấu, và một biến thì
 * preview deploy không phải cấu hình hai lần. Thiếu DSN thì `enabled: false`,
 * SDK vẫn khởi tạo nhưng không gửi gì — đủ để chạy local mà không cần tài
 * khoản Sentry.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** `NEXT_PUBLIC_VERCEL_ENV` do Vercel tự đặt; client không đọc được `VERCEL_ENV`. */
const environment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV;

export const sentryEnabled = Boolean(dsn);

export const sharedSentryOptions = {
  dsn,
  enabled: sentryEnabled,
  environment,

  // Lấy mẫu 10% trace ở production: đủ để thấy route nào chậm mà không đốt
  // hết quota của gói free. Ngoài production thì lấy hết cho dễ soi.
  tracesSampleRate: environment === "production" ? 0.1 : 1,

  // Không gửi IP, cookie hay header xác thực. Sản phẩm giữ email và lịch sử
  // thanh toán của người dùng, và chính sách riêng tư không hứa chia sẻ những
  // thứ đó với bên thứ ba.
  sendDefaultPii: false,

  // Log của SDK chỉ bật khi có biến môi trường, tránh làm ồn terminal dev.
  debug: process.env.SENTRY_DEBUG === "1",
} as const;
