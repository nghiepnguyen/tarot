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

// Hàng đợi cho những event xảy ra trước khi gtag sẵn sàng: lúc người dùng chưa
// trả lời banner, hoặc lúc script chưa tải xong. Không có gì rời khỏi trình
// duyệt cho tới khi người dùng đồng ý; nếu họ từ chối thì hàng đợi bị xoá.
const MAX_QUEUED_EVENTS = 20;
let queue: QueuedEvent[] = [];
let isReady = false;

function readConsent(): "granted" | "denied" | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

function send(name: string, params: GtagParams) {
  window.gtag?.("event", name, params);
}

/**
 * Khởi tạo gtag sau khi người dùng đồng ý. Định nghĩa `window.gtag` ở đây thay
 * vì trong thẻ script inline để thứ tự luôn xác định: dataLayer là một hàng đợi,
 * nên gọi trước khi gtag.js tải xong vẫn an toàn.
 */
export function initGtag() {
  if (typeof window === "undefined" || isReady) return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // gtag.js đọc `arguments` chứ không đọc mảng thường, nên phải là function
    // declaration chứ không dùng arrow function.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

  isReady = true;
  const pending = queue;
  queue = [];
  for (const [name, params] of pending) send(name, params);
}

export function clearQueuedEvents() {
  queue = [];
}

export function trackEvent(name: string, params: GtagParams = {}) {
  if (typeof window === "undefined") return;

  const consent = readConsent();
  if (consent === "denied") return;

  if (consent === "granted" && isReady) {
    send(name, params);
    return;
  }

  // Chưa chọn, hoặc đã đồng ý nhưng script chưa tải xong: giữ lại để bắn sau.
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
