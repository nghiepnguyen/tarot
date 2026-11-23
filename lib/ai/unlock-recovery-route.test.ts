import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ recover: vi.fn(), report: vi.fn() }));
vi.mock("./unlock-recovery", () => ({ recoverStaleUnlocks: mocks.recover }));
vi.mock("../db/prisma", () => ({ prisma: {} }));
vi.mock("../monitoring/report", () => ({ reportHandledError: mocks.report }));
import { GET } from "@/app/api/cron/recover-unlocks/route";
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("CRON_SECRET", "test-only-secret"); mocks.recover.mockResolvedValue({ scanned: 1, refunded: 1, reconciled: 0, skipped: 0, failed: 0, deferred: 0 }); });
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "Bearer incorrect"])("rejects unauthorized recovery without DB work", async authorization => {
  const response = await GET(new Request("https://example.test/api/cron/recover-unlocks", { headers: authorization ? { authorization } : {} }));
  expect(response.status).toBe(401); expect(mocks.recover).not.toHaveBeenCalled();
});
it("fails closed when CRON_SECRET is missing", async () => {
  vi.stubEnv("CRON_SECRET", ""); expect((await GET(new Request("https://example.test"))).status).toBe(503); expect(mocks.recover).not.toHaveBeenCalled();
});
it("recovers separately from PayOS and never caches the response", async () => {
  const response = await GET(new Request("https://example.test", { headers: { authorization: "Bearer test-only-secret" } }));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.json()).toMatchObject({ ok: true, refunded: 1 }); expect(mocks.recover).toHaveBeenCalledOnce();
});
it("reports a redacted failure without leaking secrets or DB payloads", async () => {
  mocks.recover.mockRejectedValueOnce(new Error("PRIVATE database payload")); mocks.report.mockImplementationOnce(() => { throw new Error("Reporter failed"); });
  const response = await GET(new Request("https://example.test", { headers: { authorization: "Bearer test-only-secret" } }));
  expect(response.status).toBe(503); const body = JSON.stringify(await response.json()); expect(body).not.toContain("PRIVATE"); expect(body).not.toContain("test-only-secret");
});
it("returns retryable HTTP failure for a partially failed batch", async () => {
  mocks.recover.mockResolvedValueOnce({ scanned: 2, refunded: 1, failed: 1, deferred: 0 });
  expect((await GET(new Request("https://example.test", { headers: { authorization: "Bearer test-only-secret" } }))).status).toBe(503);
});
