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

  /**
   * Khoá `dataCollection` chỉ cần tồn tại là SDK dùng bộ DEFAULTS cho mọi
   * trường không liệt kê, mà DEFAULTS bật hết. Test này soi giá trị sau khi
   * SDK đã phân giải, nên bản nâng cấp nào thêm trường thu thập mới cũng làm
   * nó đỏ thay vì âm thầm bật.
   */
  it("tắt mọi đường thu thập dữ liệu người dùng", async () => {
    const { sharedSentryOptions } = await freshModule({
      NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
    });
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({ ...sharedSentryOptions, enabled: false });
    const resolved = Sentry.getClient()?.getDataCollectionOptions();

    expect(resolved).toBeDefined();
    expect(Object.keys(resolved!).sort()).toEqual([
      "cookies",
      "databaseQueryData",
      "frameContextLines",
      "genAI",
      "graphQL",
      "httpBodies",
      "httpHeaders",
      "stackFrameVariables",
      "urlQueryParams",
      "userInfo",
    ]);

    expect(resolved).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      genAI: { inputs: false, outputs: false },
      graphQL: { document: false, variables: false },
      databaseQueryData: false,
      stackFrameVariables: false,
    });
    expect(resolved!.httpHeaders).toMatchObject({
      request: { deny: expect.arrayContaining(["authorization", "cookie"]) },
      response: { deny: ["set-cookie"] },
    });
    expect(resolved!.urlQueryParams).toMatchObject({
      deny: expect.arrayContaining(["token", "secret"]),
    });
  });
});
