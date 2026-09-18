import * as Sentry from "@sentry/nextjs";

interface ReportContext {
  /** Nhóm lỗi trong Sentry, ví dụ "ai-unlock", "payos-reconcile". */
  area: string;
  /** Chỉ id và số. Không đưa câu hỏi, email hay nội dung thư vào đây. */
  extra?: Record<string, string | number | null | undefined>;
  userId?: string;
}

/**
 * Báo về Sentry một lỗi mà app đã tự xử lý xong.
 *
 * `onRequestError` trong instrumentation.ts chỉ thấy lỗi ném ra tới Next. Mọi
 * chỗ bắt lỗi rồi trả về thông báo thân thiện — hoàn credit khi AI hỏng, đối
 * soát PayOS trượt, Resend chết — đều biến mất khỏi Sentry nếu không gọi hàm
 * này. Đó đúng là những lỗi cần biết nhất: người dùng không báo, log runtime
 * thì không ai đọc.
 *
 * Tag `handled` để lọc riêng khỏi lỗi làm sập request.
 */
export function reportHandledError(error: unknown, context: ReportContext): void {
  Sentry.captureException(error, {
    tags: { handled: "true", area: context.area },
    extra: context.extra,
    user: context.userId ? { id: context.userId } : undefined,
  });
}

/**
 * Như trên nhưng cho tình huống không có exception nào — dữ liệu sai chứ không
 * có gì ném ra.
 */
export function reportHandledIssue(message: string, context: ReportContext): void {
  Sentry.captureMessage(message, {
    level: "error",
    tags: { handled: "true", area: context.area },
    extra: context.extra,
    user: context.userId ? { id: context.userId } : undefined,
  });
}
