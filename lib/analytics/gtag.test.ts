import { beforeEach, describe, expect, it, vi } from "vitest";

// Các module dưới đây giữ state ở phạm vi module (hàng đợi, cờ isReady), nên
// mỗi test phải import lại bản mới.
async function freshModule(stored: string | null) {
  vi.resetModules();

  const store = new Map<string, string>();
  if (stored !== null) store.set("tarot:analyticsConsent", stored);

  const dataLayer: unknown[] = [];
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

  const gtag = await import("./gtag");
  return { gtag, store, dataLayer };
}

/** Các lệnh đã gửi cho gtag, bỏ qua lệnh `js` và `config` lúc khởi tạo. */
function sentEvents(win: { dataLayer?: unknown[] }) {
  return (win.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((args) => args[0] === "event");
}

describe("trackEvent consent gating", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("không gửi gì khi người dùng chưa chọn", async () => {
    const { gtag } = await freshModule(null);
    gtag.trackEvent("draw_start", { question_length: 12 });

    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it("xả hàng đợi theo đúng thứ tự sau khi được đồng ý", async () => {
    const { gtag } = await freshModule(null);
    gtag.trackEvent("draw_start");
    gtag.trackEvent("reading_reveal");

    // Người dùng bấm "Đồng ý": lựa chọn được lưu rồi gtag mới khởi tạo.
    localStorage.setItem("tarot:analyticsConsent", "granted");
    gtag.initGtag();

    expect(sentEvents(window).map((args) => args[1])).toEqual([
      "draw_start",
      "reading_reveal",
    ]);
  });

  it("bỏ event khi người dùng đã từ chối", async () => {
    const { gtag } = await freshModule("denied");
    gtag.trackEvent("draw_start");
    gtag.initGtag();

    expect(sentEvents(window)).toHaveLength(0);
  });

  it("gửi thẳng khi đã đồng ý và gtag sẵn sàng", async () => {
    const { gtag } = await freshModule("granted");
    gtag.initGtag();
    gtag.trackEvent("ai_unlock_success", { reading_id: "abc" });

    expect(sentEvents(window)).toEqual([
      ["event", "ai_unlock_success", { reading_id: "abc" }],
    ]);
  });

  it("giới hạn hàng đợi để không phình vô hạn khi banner bị bỏ lửng", async () => {
    const { gtag } = await freshModule(null);
    for (let i = 0; i < 30; i += 1) gtag.trackEvent(`event_${i}`);

    localStorage.setItem("tarot:analyticsConsent", "granted");
    gtag.initGtag();

    const names = sentEvents(window).map((args) => args[1]);
    expect(names).toHaveLength(20);
    // Giữ lại 20 event gần nhất.
    expect(names[0]).toBe("event_10");
    expect(names.at(-1)).toBe("event_29");
  });

  it("clearQueuedEvents vứt bỏ những gì đã xếp hàng", async () => {
    const { gtag } = await freshModule(null);
    gtag.trackEvent("draw_start");
    gtag.clearQueuedEvents();

    localStorage.setItem("tarot:analyticsConsent", "granted");
    gtag.initGtag();

    expect(sentEvents(window)).toHaveLength(0);
  });
});
