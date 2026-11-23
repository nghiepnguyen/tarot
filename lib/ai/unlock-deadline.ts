import { GENERATION_TIMEOUT_MS } from "./interpretation";

export const UNLOCK_ACTION_TIMEOUT_MS = 55_000;
export const UNLOCK_SETTLEMENT_RESERVE_MS = 10_000;
export class UnlockDeadline {
  private readonly end: number;
  constructor(milliseconds = UNLOCK_ACTION_TIMEOUT_MS) {
    if (!Number.isFinite(milliseconds)) throw new RangeError("Invalid unlock deadline");
    this.end = performance.now() + milliseconds;
  }
  remainingMs(): number { return Math.max(0, Math.floor(this.end - performance.now())); }
  providerMs(): number { return Math.max(0, Math.min(GENERATION_TIMEOUT_MS, this.remainingMs() - UNLOCK_SETTLEMENT_RESERVE_MS)); }
}

/** Bound waiting even when an SDK ignores abort; late work cannot resume the awaiting caller. */
export async function withTimeout<T>(milliseconds: number, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const timeoutError = new DOMException("Unlock deadline exceeded", "TimeoutError");
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw timeoutError;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(timeoutError); reject(timeoutError); }, Math.floor(milliseconds));
  });
  try { return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), timeout]); }
  finally { clearTimeout(timer); }
}
