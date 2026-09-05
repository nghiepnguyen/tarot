import { describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("resets after the window elapses", () => {
    const key = `test:${Math.random()}`;
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    expect(checkRateLimit(key, 1, 1000)).toBe(true);
    expect(checkRateLimit(key, 1, 1000)).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(now + 1001);
    expect(checkRateLimit(key, 1, 1000)).toBe(true);

    vi.restoreAllMocks();
  });

  it("tracks independent keys separately", () => {
    const keyA = `test:${Math.random()}`;
    const keyB = `test:${Math.random()}`;
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false);
  });
});
