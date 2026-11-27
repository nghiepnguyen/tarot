import { afterEach, describe, expect, it, vi } from "vitest";
import { UnlockDeadline, withTimeout } from "./unlock-deadline";
afterEach(() => vi.useRealTimers());
describe("unlock deadlines", () => {
  it("caps provider time and reserves settlement time from the same monotonic budget", () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    const deadline = new UnlockDeadline();
    expect(deadline.providerMs()).toBe(45_000);
    vi.advanceTimersByTime(20_000);
    expect(deadline.providerMs()).toBe(25_000);
    vi.advanceTimersByTime(25_000);
    expect(deadline.providerMs()).toBe(0);
  });
  it("aborts and rejects an operation that ignores cancellation without retrying it", async () => {
    vi.useFakeTimers(); let signal!: AbortSignal;
    const call = vi.fn((s: AbortSignal) => { signal = s; return new Promise<never>(() => {}); });
    const promise = withTimeout(100, call);
    const check = expect(promise).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(100); await check;
    expect(signal.aborted).toBe(true); expect(call).toHaveBeenCalledOnce();
  });
  it("does not begin work with an exhausted budget", async () => {
    const call = vi.fn(async () => "late");
    await expect(withTimeout(0, call)).rejects.toMatchObject({ name: "TimeoutError" });
    expect(call).not.toHaveBeenCalled();
  });
  it("clears timers and returns completed work", async () => {
    vi.useFakeTimers();
    expect(await withTimeout(100, async () => "done")).toBe("done");
    expect(vi.getTimerCount()).toBe(0);
  });
});
