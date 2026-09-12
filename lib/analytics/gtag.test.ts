import { beforeEach, describe, expect, it, vi } from "vitest";

// Module giữ state ở phạm vi module (hàng đợi, cờ isReady), nên mỗi test phải
// import lại bản mới.
async function freshModule(stored: string | null) {
  vi.resetModules();

  const store = new Map<string, string>();
  if (stored !== null) store.set("tarot:analyticsConsent", stored);

  vi.stubGlobal("window", {
    dataLayer: undefined,
    gtag: undefined,
    location: { origin: "https://tarot.test", hostname: "tarot.test" },
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  });
  vi.stubGlobal("document", { title: "Tarot", cookie: "" });

  return import("./gtag");
}

/** dataLayer chứa các object `arguments`; đổi về mảng cho dễ assert. */
function calls() {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

const eventsOnly = () => calls().filter((args) => args[0] === "event");
const consentOnly = () => calls().filter((args) => args[0] === "consent");

describe("Consent Mode v2", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("đặt mặc định denied trước khi config", async () => {
    const gtag = await freshModule(null);
    gtag.initGtag();

    const order = calls().map((args) => `${args[0]}:${args[1]}`);
    expect(order[0]).toBe("consent:default");
    expect(order.indexOf("config:G-YR3ZHD8JBV")).toBeGreaterThan(0);

    expect(consentOnly()[0][2]).toMatchObject({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  it("nâng quyền ngay cho người đã đồng ý từ phiên trước", async () => {
    const gtag = await freshModule("granted");
    gtag.initGtag();

    const consent = consentOnly();
    expect(consent[0][1]).toBe("default");
    expect(consent[1][1]).toBe("update");
    expect(consent[1][2]).toEqual({ analytics_storage: "granted" });
    // Phải xong trước config, nếu không hit đầu tiên đã mất quyền ghi cookie.
    const configIndex = calls().findIndex((args) => args[0] === "config");
    const updateIndex = calls().findIndex((args) => args[1] === "update");
    expect(updateIndex).toBeLessThan(configIndex);
  });

  it("không nâng quyền cho người chưa chọn", async () => {
    const gtag = await freshModule(null);
    gtag.initGtag();

    expect(consentOnly().map((args) => args[1])).toEqual(["default"]);
  });

  it("updateConsent gửi trạng thái mới cho gtag", async () => {
    const gtag = await freshModule(null);
    gtag.initGtag();
    gtag.updateConsent("granted");

    expect(consentOnly().at(-1)).toEqual([
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
  });

  it("updateConsent không làm gì khi gtag chưa khởi tạo", async () => {
    const gtag = await freshModule(null);
    gtag.updateConsent("granted");

    expect(window.dataLayer).toBeUndefined();
  });
});

describe("hàng đợi event", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("xả theo đúng thứ tự sau khi khởi tạo", async () => {
    const gtag = await freshModule(null);
    gtag.trackEvent("draw_start");
    gtag.trackEvent("reading_reveal");
    gtag.initGtag();

    expect(eventsOnly().map((args) => args[1])).toEqual([
      "draw_start",
      "reading_reveal",
    ]);
  });

  it("gửi thẳng khi đã khởi tạo", async () => {
    const gtag = await freshModule(null);
    gtag.initGtag();
    gtag.trackEvent("ai_unlock_success", { reading_id: "abc" });

    expect(eventsOnly()).toEqual([
      ["event", "ai_unlock_success", { reading_id: "abc" }],
    ]);
  });

  it("vẫn gửi event khi người dùng từ chối — Consent Mode lo phần lưu trữ", async () => {
    const gtag = await freshModule("denied");
    gtag.initGtag();
    gtag.trackEvent("draw_start");

    expect(eventsOnly().map((args) => args[1])).toEqual(["draw_start"]);
  });

  it("giới hạn hàng đợi để không phình vô hạn", async () => {
    const gtag = await freshModule(null);
    for (let i = 0; i < 30; i += 1) gtag.trackEvent(`event_${i}`);
    gtag.initGtag();

    const names = eventsOnly().map((args) => args[1]);
    expect(names).toHaveLength(20);
    expect(names[0]).toBe("event_10");
    expect(names.at(-1)).toBe("event_29");
  });
});
