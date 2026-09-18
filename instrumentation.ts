import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Bắt lỗi server component, route handler và server action. Next chỉ gọi hook
// này sau khi đã bắt lỗi, nên không cần try/catch rải khắp nơi.
export const onRequestError = Sentry.captureRequestError;
