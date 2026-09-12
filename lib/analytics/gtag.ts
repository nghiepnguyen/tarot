export const GA_MEASUREMENT_ID = "G-YR3ZHD8JBV";

/** Khai báo ở đây (chứ không ở consent.ts) để import chỉ chạy một chiều. */
export const CONSENT_STORAGE_KEY = "tarot:analyticsConsent";

type GtagParams = Record<string, string | number | boolean | undefined | object>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type QueuedEvent = [name: string, params: GtagParams];

// Hàng đợi cho khoảng thời gian ngắn giữa lúc component mount và lúc initGtag
// chạy. Không liên quan tới đồng ý: Consent Mode lo phần đó ở phía gtag.
const MAX_QUEUED_EVENTS = 20;
let queue: QueuedEvent[] = [];
let isReady = false;

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // gtag.js đọc `arguments` chứ không đọc mảng thường, nên phải là function
    // declaration chứ không dùng arrow function.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

function readConsent(): "granted" | "denied" | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Consent Mode v2. `consent default` phải nằm trong dataLayer trước `config`,
 * nếu không gtag.js sẽ coi như được phép ghi cookie trong lúc chờ. Ở trạng thái
 * denied, gtag vẫn gửi ping ẩn danh: không cookie, không định danh người dùng.
 *
 * Sản phẩm không chạy quảng cáo nên `ad_*` luôn denied, không bao giờ update.
 */
export function initGtag() {
  if (typeof window === "undefined" || isReady) return;

  const gtag = ensureGtag();

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  // Người đã đồng ý từ phiên trước: nâng quyền ngay, trước khi bắn gì.
  if (readConsent() === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  }

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

  isReady = true;
  const pending = queue;
  queue = [];
  for (const [name, params] of pending) gtag("event", name, params);
}

/** Gọi khi người dùng bấm Đồng ý hoặc Từ chối ở banner. */
export function updateConsent(value: "granted" | "denied") {
  if (typeof window === "undefined" || !isReady) return;
  window.gtag?.("consent", "update", { analytics_storage: value });
}

export function trackEvent(name: string, params: GtagParams = {}) {
  if (typeof window === "undefined") return;

  if (isReady) {
    window.gtag?.("event", name, params);
    return;
  }

  if (queue.length >= MAX_QUEUED_EVENTS) queue.shift();
  queue.push([name, params]);
}

export function trackPageView(url: string) {
  if (typeof window === "undefined") return;
  trackEvent("page_view", {
    page_path: url,
    page_location: window.location.origin + url,
    page_title: document.title,
  });
}
