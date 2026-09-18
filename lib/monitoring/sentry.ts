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

  // Khai báo tường minh từng loại dữ liệu thay cho `sendDefaultPii: false`
  // (sẽ bị bỏ ở SDK v11).
  //
  // CẨN THẬN: chỉ cần khoá `dataCollection` tồn tại là SDK chuyển sang bộ
  // DEFAULTS cho **mọi khoá không liệt kê**, mà DEFAULTS thì bật hết. Thêm
  // trường mới vào đây chứ đừng bao giờ xoá bớt; test trong sentry.test.ts
  // sẽ đỏ nếu SDK sinh thêm khoá lạ.
  dataCollection: {
    userInfo: false,
    // Cookie chứa session token của next-auth.
    cookies: false,
    // Giữ lại header hữu ích cho việc gỡ lỗi, chặn đúng những cái mang danh tính.
    httpHeaders: {
      request: { deny: ["authorization", "cookie", "x-api-key", "x-csrf-token"] },
      response: { deny: ["set-cookie"] },
    },
    // Body request chứa form đăng nhập, câu hỏi tarot và payload webhook PayOS.
    httpBodies: [],
    urlQueryParams: { deny: ["token", "code", "secret", "key"] },
    // Prompt và kết quả Gemini dựng từ chính câu hỏi của người dùng.
    genAI: { inputs: false, outputs: false },
    graphQL: { document: false, variables: false },
    databaseQueryData: false,
    // Biến cục bộ trong stack frame là đường rò rỉ ít ai ngờ: câu hỏi của
    // người dùng đang nằm trong một biến ngay tại chỗ ném lỗi.
    stackFrameVariables: false,
  },

  // Log của SDK chỉ bật khi có biến môi trường, tránh làm ồn terminal dev.
  debug: process.env.SENTRY_DEBUG === "1",
};
