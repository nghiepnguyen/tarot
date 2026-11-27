import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { recoverStaleUnlocks, recoverOwnedUnlock } from "./unlock-recovery";
import { UnlockDeadline } from "./unlock-deadline";
const mocks = vi.hoisted(() => ({ refund: vi.fn(), state: vi.fn(), report: vi.fn(), event: vi.fn() }));
vi.mock("./unlock-observability", () => ({ recordUnlockEvent: mocks.event }));
vi.mock("./unlock-credit", () => ({ refundUnlock: mocks.refund, readUnlockState: mocks.state }));
vi.mock("../monitoring/report", () => ({ reportHandledError: mocks.report }));
beforeEach(() => { vi.resetAllMocks(); mocks.refund.mockResolvedValue({ status: "refunded" }); mocks.state.mockResolvedValue({ status: "processing" }); });
afterEach(() => vi.useRealTimers());
const row = { id: "operation", userId: "user", readingId: "reading", attemptToken: "token" };
const database = (rows = [row]) => { const query = vi.fn().mockResolvedValue(rows); return { query, db: { $queryRaw: query } as unknown as PrismaClient }; };
describe("bounded unlock recovery", () => {
  it("uses the guarded refund primitive and returns counts without private content", async () => {
    const { db, query } = database();
    expect(await recoverStaleUnlocks(db)).toMatchObject({ scanned: 1, refunded: 1, failed: 0, deferred: 0 });
    expect(String(query.mock.calls[0][0])).toContain("clock_timestamp");
    expect(mocks.refund).toHaveBeenCalledWith(db, "user", "reading", "token", "expired", expect.any(UnlockDeadline));
  });
  it("continues past one failure and does not let reporting abort the batch", async () => {
    const { db } = database([row, { ...row, id: "two", readingId: "two" }]);
    mocks.refund.mockRejectedValueOnce(new Error("PRIVATE database payload")); mocks.report.mockImplementation(() => { throw new Error("Reporter failed"); });
    const result = await recoverStaleUnlocks(db);
    expect(result).toMatchObject({ scanned: 2, refunded: 1, failed: 1 }); expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
  it("does not count quarantine or stale token as a refund", async () => {
    const { db } = database([row, { ...row, id: "two" }]);
    mocks.refund.mockResolvedValueOnce({ status: "reconciliation_required" }).mockResolvedValueOnce({ status: "stale" });
    expect(await recoverStaleUnlocks(db)).toMatchObject({ refunded: 0, reconciled: 1, skipped: 1 });
  });
  it("does not start another settlement when its time budget is exhausted", async () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    const { db } = database([row, { ...row, id: "two" }]);
    mocks.refund.mockImplementationOnce(async () => { vi.advanceTimersByTime(6000); return { status: "refunded" }; });
    expect(await recoverStaleUnlocks(db, new UnlockDeadline(10_000))).toMatchObject({ refunded: 1, deferred: 1 });
    expect(mocks.refund).toHaveBeenCalledOnce();
  });
  it("settles only the authenticated user's selected token and does not generate a new attempt", async () => {
    const { db, query } = database();
    expect(await recoverOwnedUnlock(db, "user", "reading", new UnlockDeadline())).toEqual({ state: { status: "refunded" }, recovered: true });
    expect(query.mock.calls[0].slice(1)).toContain("user"); expect(query.mock.calls[0].slice(1)).toContain("reading");
  });
  it("reads the authoritative state when no owned operation is eligible", async () => {
    const { db } = database([]);
    expect(await recoverOwnedUnlock(db, "user", "reading", new UnlockDeadline())).toEqual({ state: { status: "processing" }, recovered: false });
    expect(mocks.refund).not.toHaveBeenCalled();
  });
});

it("logs the authoritative reread rather than calling a stale token a pending refund", async () => {
  const { db } = database();
  mocks.refund.mockResolvedValueOnce({ status: "stale" });
  mocks.state.mockResolvedValueOnce({ status: "completed", row: { id: "saved" } });
  expect((await recoverOwnedUnlock(db, "user", "reading")).state.status).toBe("completed");
  expect(mocks.event).toHaveBeenCalledWith(expect.objectContaining({ event: "persisted", stage: "owned_recovery", attemptToken: undefined }));
});
it("does not call a skipped stale token a pending refund", async () => {
  const { db } = database(); mocks.refund.mockResolvedValueOnce({ status: "stale" });
  await recoverStaleUnlocks(db);
  expect(mocks.event).toHaveBeenCalledWith(expect.objectContaining({ event: "stale" }));
});
