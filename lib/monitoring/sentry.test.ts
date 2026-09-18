import { afterEach, describe, expect, it, vi } from "vitest";

// Module đọc env một lần lúc import, nên mỗi test phải nạp lại bản mới.
async function freshModule(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  return import("./sentry");
}

describe("cấu hình Sentry dùng chung", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("tắt gửi event khi chưa có DSN", async () => {
    const { sentryEnabled, sharedSentryOptions } = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: undefined,
    });

    expect(sentryEnabled).toBe(false);
    expect(sharedSentryOptions.enabled).toBe(false);
  });

  it("bật khi có DSN", async () => {
    const { sentryEnabled } = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
    });

    expect(sentryEnabled).toBe(true);
  });

  it("chỉ lấy mẫu 10% trace ở production", async () => {
    const prod = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
      NEXT_PUBLIC_VERCEL_ENV: "production",
    });
    expect(prod.sharedSentryOptions.tracesSampleRate).toBe(0.1);

    const preview = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
      NEXT_PUBLIC_VERCEL_ENV: "preview",
    });
    expect(preview.sharedSentryOptions.tracesSampleRate).toBe(1);
    expect(preview.sharedSentryOptions.environment).toBe("preview");
  });

  it("không bao giờ gửi PII mặc định", async () => {
    const { sharedSentryOptions } = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
    });

    expect(sharedSentryOptions.sendDefaultPii).toBe(false);
  });
});
