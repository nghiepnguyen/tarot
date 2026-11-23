import { afterEach, beforeEach, expect, it, vi } from "vitest";
import worker from "../../ops/unlock-recovery-worker/worker";
const env = { RECOVERY_URL: "https://tarot.example.com/api/cron/recover-unlocks", RECOVERY_SECRET: "synthetic-recovery-key-at-least-32-characters" };
const request = vi.fn();
const event = { noRetry: vi.fn() };
beforeEach(() => { request.mockReset(); event.noRetry.mockReset(); vi.stubGlobal("fetch", request); request.mockResolvedValue(Response.json({ ok: true })); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it("invokes only recovery with a dedicated header, no redirects and one request", async () => {
  await worker.scheduled(event, env);
  expect(request).toHaveBeenCalledOnce();
  expect(event.noRetry).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledWith(env.RECOVERY_URL, expect.objectContaining({ method: "GET", headers: { Authorization: `Bearer ${env.RECOVERY_SECRET}` }, redirect: "error", signal: expect.any(AbortSignal) }));
  expect("fetch" in worker).toBe(false);
});
it.each(["http://tarot.example.com/api/cron/recover-unlocks", "https://tarot.example.com/api/cron/reconcile-orders", "https://user:pass@tarot.example.com/api/cron/recover-unlocks", `${env.RECOVERY_URL}?token=hidden`, "https://REPLACE_WITH_RELEASE_HOST.invalid/api/cron/recover-unlocks"])("rejects invalid target before sending a key: %s", async RECOVERY_URL => {
  await expect(worker.scheduled(event, { ...env, RECOVERY_URL })).rejects.toThrow("Unlock recovery scheduler failed");
  expect(request).not.toHaveBeenCalled();
});
it("does not send an empty or malformed secret", async () => {
  await expect(worker.scheduled(event, { ...env, RECOVERY_SECRET: "" })).rejects.toThrow();
  await expect(worker.scheduled(event, { ...env, RECOVERY_SECRET: "x".repeat(32)+"\n" })).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});
it.each([401, 503, 302])("fails without retry or raw payload disclosure for HTTP %s", async status => {
  request.mockResolvedValue(new Response("PRIVATE payload", { status }));
  await expect(worker.scheduled(event, env)).rejects.toThrow(/^Unlock recovery scheduler failed$/);
  expect(request).toHaveBeenCalledOnce();
  expect(event.noRetry).toHaveBeenCalledOnce();
});
it("does not accept a success HTTP response with an unsuccessful body", async () => {
  request.mockResolvedValue(Response.json({ ok: false }));
  await expect(worker.scheduled(event, env)).rejects.toThrow(/^Unlock recovery scheduler failed$/);
});
it("bounds waiting and aborts a hanging fetch without another attempt", async () => {
  vi.useFakeTimers(); request.mockImplementation(() => new Promise(() => {}));
  const result = worker.scheduled(event, env).then(() => null, error => error);
  await vi.advanceTimersByTimeAsync(55_000); expect(await result).toMatchObject({ message: "Unlock recovery scheduler failed" });
  expect(request).toHaveBeenCalledOnce();
  expect(event.noRetry).toHaveBeenCalledOnce(); expect(request.mock.calls[0][1].signal.aborted).toBe(true);
});
