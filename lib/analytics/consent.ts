import { CONSENT_STORAGE_KEY, updateConsent } from "@/lib/analytics/gtag";

export type ConsentValue = "granted" | "denied";

export interface ConsentState {
  /** null = người dùng chưa chọn gì. */
  value: ConsentValue | null;
  isBannerOpen: boolean;
}

// Snapshot phải giữ nguyên tham chiếu giữa các lần đọc, nếu không
// useSyncExternalStore sẽ render vô hạn.
let snapshot: ConsentState = { value: null, isBannerOpen: false };
let hydrated = false;
const listeners = new Set<() => void>();

const SERVER_SNAPSHOT: ConsentState = { value: null, isBannerOpen: false };

function readStored(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    // localStorage bị chặn (private mode, chặn cookie): coi như chưa chọn.
    return null;
  }
}

function setSnapshot(next: ConsentState) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConsentSnapshot(): ConsentState {
  if (!hydrated) {
    hydrated = true;
    const stored = readStored();
    snapshot = { value: stored, isBannerOpen: stored === null };
  }
  return snapshot;
}

export function getServerConsentSnapshot(): ConsentState {
  // Server không đọc được lựa chọn của người dùng nên luôn render như chưa có
  // banner; client sẽ đồng bộ lại ngay sau khi hydrate.
  return SERVER_SNAPSHOT;
}

export function setConsent(value: ConsentValue) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Không lưu được thì lựa chọn chỉ có hiệu lực trong phiên này.
  }
  updateConsent(value);
  if (value === "denied") deleteGaCookies();
  setSnapshot({ value, isBannerOpen: false });
}

export function openConsentSettings() {
  setSnapshot({ ...getConsentSnapshot(), isBannerOpen: true });
}

export function closeConsentSettings() {
  const current = getConsentSnapshot();
  // Chưa chọn gì thì không cho đóng suông — đóng lại sẽ thành mặc định im lặng.
  if (current.value === null) return;
  setSnapshot({ ...current, isBannerOpen: false });
}

/**
 * `consent update` sang denied chỉ chặn gtag ghi cookie từ lúc đó trở đi; cookie
 * đã đặt trong lúc còn được đồng ý thì vẫn nằm lại, nên phải tự xoá.
 */
function deleteGaCookies() {
  if (typeof window === "undefined") return;

  const gaCookies = document.cookie
    .split(";")
    .map((entry) => entry.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name) && name.startsWith("_ga"));

  for (const name of gaCookies) {
    for (const domain of [location.hostname, `.${location.hostname}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}
