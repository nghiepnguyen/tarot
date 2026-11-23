import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { reserveUnlock, finalizeUnlock, refundUnlock, readUnlockState } from "./unlock-credit";
import * as settlements from "./unlock-credit";
import { collectUnlockAudit } from "./unlock-audit";
import { recoverOwnedUnlock, recoverStaleUnlocks } from "./unlock-recovery";
import { UnlockDeadline } from "./unlock-deadline";
import { TAROT_CARDS } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";

const runtime = vi.hoisted(() => ({ db: undefined as PrismaClient | undefined, userId: "", provider: vi.fn(), revalidate: vi.fn() }));
vi.mock("./unlock-observability", () => ({ recordUnlockEvent: vi.fn() }));
vi.mock("../db/prisma", () => ({ get prisma() { return runtime.db; } }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: runtime.userId } }) }));
vi.mock("next/cache", () => ({ revalidatePath: runtime.revalidate }));
vi.mock("../auth/rate-limit", () => ({ checkRateLimit: async () => true }));
vi.mock("./settings", () => ({ resolveAiModelForUnlock: async () => ({ id: "gemini-3.8-flash", provider: "gemini" }), getMissingApiKeyEnvs: () => [] }));
vi.mock("./metrics", () => ({ generateMeasuredInterpretation: runtime.provider }));
vi.mock("../monitoring/report", () => ({ reportHandledError: vi.fn(), reportHandledIssue: vi.fn() }));

const url = process.env.UNLOCK_CREDIT_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/tarot_credit_task3" || target.username !== "credit_test") throw new Error("Use only the isolated localhost tarot_credit_task3 test database.");
}
const db = url ? new PrismaClient({ datasources: { db: { url } } }) : undefined;
const peer = url ? new PrismaClient({ datasources: { db: { url } } }) : undefined;
const users: string[] = [];
let connected = false;
const selection = { model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06" };
const generated = { result: { summary: "Tóm tắt", overview: "Tổng quan", themes: ["Một"], perCard: SPREAD_POSITIONS.map(position => ({ position, keyMessage: "Ý", text: "Nội dung" })), connections: "Liên hệ", actionSuggestions: ["Một bước"], reflectiveQuestion: "Điều gì?", closingNote: "Lời kết" }, usage: { inputTokens: 10, outputTokens: 20 } };
async function seed(credits = 20, prefix = "reading") {
  const userId = `credit-test-${randomUUID()}`, readingId = `${prefix}-${randomUUID()}`;
  await db!.user.create({ data: { id: userId, email: `${userId}@credit-task3.test`, credits } }); users.push(userId);
  await db!.reading.create({ data: { id: readingId, userId, question: "Tôi nên cân nhắc điều gì?", cards: SPREAD_POSITIONS.map((position, i) => ({ cardId: TAROT_CARDS[i].id, position, orientation: "upright" })) } });
  return { userId, readingId };
}
async function claim(userId: string, readingId: string) {
  const r = await reserveUnlock(db!, userId, readingId, selection);
  if (r.status !== "reserved") throw new Error(`Expected reservation, got ${r.status}`);
  return r.token;
}
const balance = async (id: string) => (await db!.user.findUniqueOrThrow({ where: { id } })).credits;
const ledger = (id: string) => db!.creditTransaction.findMany({ where: { userId: id }, orderBy: { createdAt: "asc" } });

describe.skipIf(!url)("durable unlock — independent PostgreSQL connections", () => {
  beforeAll(async () => {
    await db!.$connect(); await peer!.$connect(); connected = true; runtime.db = db;
    await db!.$executeRaw`CREATE OR REPLACE FUNCTION task3_credit_test_fault() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF (NEW."relatedReadingId" LIKE 'task3-fail-spend-%' AND NEW."type" = 'UNLOCK_SPEND') OR
         (NEW."relatedReadingId" LIKE 'task3-fail-refund-%' AND NEW."type" = 'REFUND') THEN
        RAISE EXCEPTION 'Synthetic ledger rejection';
      END IF;
      RETURN NEW;
    END; $$`;
    await db!.$executeRaw`CREATE TRIGGER task3_credit_test_fault BEFORE INSERT ON "CreditTransaction" FOR EACH ROW EXECUTE FUNCTION task3_credit_test_fault()`;
  });
  afterEach(async () => { await db!.user.deleteMany({ where: { id: { in: users.splice(0) } } }); });
  afterAll(async () => {
    try {
      if (connected) {
        await db!.$executeRaw`DROP TRIGGER IF EXISTS task3_credit_test_fault ON "CreditTransaction"`;
        await db!.$executeRaw`DROP FUNCTION IF EXISTS task3_credit_test_fault()`;
      }
    } finally { await db?.$disconnect(); await peer?.$disconnect(); }
  });

  it("allows one provider owner and one net charge for simultaneous unlocks", async () => {
    const { userId, readingId } = await seed();
    const results = await Promise.all([reserveUnlock(db!, userId, readingId, selection), reserveUnlock(peer!, userId, readingId, selection)]);
    expect(results.map(r => r.status).sort()).toEqual(["processing", "reserved"]);
    let calls = 0;
    for (const r of results) if (r.status === "reserved") { calls++; await finalizeUnlock(db!, userId, readingId, r.token, generated); }
    expect(calls).toBe(1); expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
    expect(await db!.aiInterpretation.count({ where: { readingId } })).toBe(1);
  });

  it("keeps a second server action outside the provider while the owner is generating", async () => {
    const { userId, readingId } = await seed(); runtime.userId = userId;
    let started!: () => void; let release!: () => void;
    const ready = new Promise<void>(r => { started = r; }), gate = new Promise<void>(r => { release = r; });
    runtime.provider.mockReset().mockImplementation(async () => { started(); await gate; return generated; });
    const { unlockAiInterpretationAction } = await import("@/app/actions/ai");
    const first = unlockAiInterpretationAction(readingId);
    await Promise.race([ready, first.then(() => { throw new Error("First action exited before the provider barrier"); })]);
    try {
      expect(await unlockAiInterpretationAction(readingId)).toMatchObject({ ok: false, code: "processing", retryable: false });
      expect(runtime.provider).toHaveBeenCalledOnce();
    } finally { release(); }
    expect(await first).toMatchObject({ ok: true });
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });

  it("lets only one of two readings spend the last ten credits", async () => {
    const { userId, readingId } = await seed(10);
    const second = await db!.reading.create({ data: { userId, question: "Câu khác?", cards: [] } });
    const result = await Promise.all([reserveUnlock(db!, userId, readingId, selection), reserveUnlock(peer!, userId, second.id, selection)]);
    expect(result.map(r => r.status).sort()).toEqual(["insufficient_credits", "reserved"]);
    expect(await balance(userId)).toBe(0); expect(await ledger(userId)).toHaveLength(1);
    expect(await db!.unlockOperation.count({ where: { userId } })).toBe(1);
  });

  it("reuses a committed result after response loss without new debit", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    const done = await finalizeUnlock(db!, userId, readingId, token, generated);
    const retry = await reserveUnlock(peer!, userId, readingId, selection);
    expect(done.status).toBe("completed"); expect(retry).toEqual(done);
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });

  it("settles two concurrent refunds once", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    const out = await Promise.all([refundUnlock(db!, userId, readingId, token, "generation_failed"), refundUnlock(peer!, userId, readingId, token, "generation_failed")]);
    expect(out.map(r => r.status)).toEqual(["refunded", "refunded"]);
    expect(await balance(userId)).toBe(20); expect((await ledger(userId)).map(r => r.amount)).toEqual([-10, 10]);
  });

  it("settles repeated finalize once and never refunds a success", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    const out = await Promise.all([finalizeUnlock(db!, userId, readingId, token, generated), finalizeUnlock(peer!, userId, readingId, token, generated)]);
    expect(out[0]).toEqual(out[1]); expect(out[0].status).toBe("completed");
    expect((await refundUnlock(db!, userId, readingId, token, "save_failed")).status).toBe("completed");
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });

  it("fences late workers after a refunded attempt is replaced", async () => {
    const { userId, readingId } = await seed(); const old = await claim(userId, readingId);
    await refundUnlock(db!, userId, readingId, old, "generation_failed"); const current = await claim(userId, readingId);
    expect(current).not.toBe(old);
    expect((await finalizeUnlock(peer!, userId, readingId, old, generated)).status).toBe("stale");
    expect((await refundUnlock(peer!, userId, readingId, old, "generation_failed")).status).toBe("stale");
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(3);
    expect((await finalizeUnlock(db!, userId, readingId, current, generated)).status).toBe("completed");
  });

  it("quarantines an unexpected result instead of blindly refunding a unique conflict", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await db!.aiInterpretation.create({ data: { readingId, model: selection.model, overview: "Unexpected writer", perCard: [], connections: "X", actionSuggestions: "X", reflectiveQuestion: "X" } });
    expect((await finalizeUnlock(db!, userId, readingId, token, generated)).status).toBe("reconciliation_required");
    expect((await refundUnlock(peer!, userId, readingId, token, "save_failed")).status).toBe("reconciliation_required");
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });

  it("rolls back operation/debit when spend ledger insert fails", async () => {
    const { userId, readingId } = await seed(20, "task3-fail-spend");
    await expect(reserveUnlock(db!, userId, readingId, selection)).rejects.toThrow();
    expect(await balance(userId)).toBe(20); expect(await ledger(userId)).toHaveLength(0);
    expect(await db!.unlockOperation.count({ where: { userId } })).toBe(0);
  });

  it("rolls back refund amount and state together when its ledger fails", async () => {
    const { userId, readingId } = await seed(20, "task3-fail-refund"); const token = await claim(userId, readingId);
    await expect(refundUnlock(db!, userId, readingId, token, "generation_failed")).rejects.toThrow();
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
    expect((await db!.unlockOperation.findUniqueOrThrow({ where: { readingId } })).status).toBe("PROCESSING");
  });

  it("quarantines missing or malformed receipts without minting a refund", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await db!.creditTransaction.deleteMany({ where: { userId } });
    expect((await refundUnlock(db!, userId, readingId, token, "generation_failed")).status).toBe("reconciliation_required");
    expect(await balance(userId)).toBe(10);
  });

  it("refunds a deleted reading but keeps durable settlement evidence", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await db!.reading.delete({ where: { id: readingId } });
    expect((await finalizeUnlock(db!, userId, readingId, token, generated)).status).toBe("reading_missing");
    expect((await refundUnlock(db!, userId, readingId, token, "save_failed")).status).toBe("refunded");
    expect(await balance(userId)).toBe(20);
    expect((await db!.unlockOperation.findUniqueOrThrow({ where: { readingId } })).status).toBe("REFUNDED");
  });

  it("does not refund or regenerate after history is deleted following success", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await finalizeUnlock(db!, userId, readingId, token, generated); await db!.reading.delete({ where: { id: readingId } });
    expect((await refundUnlock(db!, userId, readingId, token, "save_failed")).status).toBe("completed_unavailable");
    expect((await readUnlockState(db!, userId, readingId)).status).toBe("completed_unavailable");
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });

  it("does not expose or mutate another user's operation", async () => {
    const { userId, readingId } = await seed(); const other = await seed(); const token = await claim(userId, readingId);
    for (const result of [await readUnlockState(db!, other.userId, readingId), await reserveUnlock(peer!, other.userId, readingId, selection), await refundUnlock(peer!, other.userId, readingId, token, "save_failed")]) expect(result).toEqual({ status: "denied" });
    expect(await balance(userId)).toBe(10); expect(await balance(other.userId)).toBe(20);
  });

  it("checks actual expiry after waiting for the operation lock", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await db!.$executeRaw`UPDATE "UnlockOperation" SET "expiresAt" = clock_timestamp() + interval '200 milliseconds' WHERE "readingId" = ${readingId}`;
    let release!: () => void; let locked!: () => void;
    const gate = new Promise<void>(r => { release = r; }), ready = new Promise<void>(r => { locked = r; });
    const holder = db!.$transaction(async tx => { await tx.$queryRaw`SELECT id FROM "UnlockOperation" WHERE "readingId" = ${readingId} FOR UPDATE`; locked(); await gate; });
    await ready;
    const pending = finalizeUnlock(peer!, userId, readingId, token, generated);
    await new Promise(r => setTimeout(r, 350)); release(); await holder;
    expect((await pending).status).toBe("expired");
    expect(await db!.aiInterpretation.count({ where: { readingId } })).toBe(0);
    expect((await refundUnlock(db!, userId, readingId, token, "expired")).status).toBe("refunded");
  });

  it("uses an absolute expiry even with a non-UTC database session", async () => {
    const { userId, readingId } = await seed();
    const zoned = { $transaction: <T,>(fn: (tx: import("@prisma/client").Prisma.TransactionClient) => Promise<T>) => db!.$transaction(async tx => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh'`;
      return fn(tx);
    }, { isolationLevel: "Serializable" }) } as unknown as PrismaClient;
    const r = await reserveUnlock(zoned, userId, readingId, selection);
    if (r.status !== "reserved") throw new Error("Expected reservation");
    expect((await finalizeUnlock(zoned, userId, readingId, r.token, generated)).status).toBe("completed");
  });

  it("settles a controlled REFUND_PENDING failure without waiting for expiry", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    await db!.unlockOperation.update({ where: { readingId }, data: { status: "REFUND_PENDING" } });
    expect((await refundUnlock(db!, userId, readingId, token, "expired")).status).toBe("refunded");
    expect(await balance(userId)).toBe(20);
  });

  it("does not let an expiry recovery refund a still-live token", async () => {
    const { userId, readingId } = await seed(); const token = await claim(userId, readingId);
    expect((await refundUnlock(db!, userId, readingId, token, "expired")).status).toBe("processing");
    expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });
  async function expire(readingId: string) {
    await db!.$executeRaw`UPDATE "UnlockOperation" SET "expiresAt" = clock_timestamp() - interval '1 second' WHERE "readingId" = ${readingId}`;
  }
  it.each(["after debit", "after provider response"])("recovers a process stopped %s, including overlapping recovery workers", async () => {
    const { userId, readingId } = await seed(); await claim(userId, readingId);
    // No finalize/catch executes after the synthetic process stop.
    await expire(readingId);
    await Promise.all([recoverStaleUnlocks(db!), recoverStaleUnlocks(peer!)]);
    expect(await balance(userId)).toBe(20);
    expect((await ledger(userId)).map(r => r.amount)).toEqual([-10, 10]);
    expect((await recoverStaleUnlocks(db!)).scanned).toBe(0);
  });
  it("excludes committed successes and quarantined attempts from recovery", async () => {
    const good = await seed(), quarantined = await seed();
    await finalizeUnlock(db!, good.userId, good.readingId, await claim(good.userId, good.readingId), generated);
    await claim(quarantined.userId, quarantined.readingId);
    await db!.unlockOperation.update({ where: { readingId: quarantined.readingId }, data: { status: "RECONCILE_REQUIRED" } });
    await expire(good.readingId); await expire(quarantined.readingId);
    expect((await recoverStaleUnlocks(db!)).scanned).toBe(0);
    for (const row of [good, quarantined]) { expect(await balance(row.userId)).toBe(10); expect(await ledger(row.userId)).toHaveLength(1); }
  });
  it("retains a failed refund and settles once after database writes recover", async () => {
    const { userId, readingId } = await seed(20, "task3-fail-refund"); await claim(userId, readingId); await expire(readingId);
    expect((await recoverStaleUnlocks(db!)).failed).toBe(1);
    expect(await balance(userId)).toBe(10);
    expect((await db!.unlockOperation.findUniqueOrThrow({ where: { readingId } })).status).toBe("PROCESSING");
    await db!.$executeRaw`ALTER TABLE "CreditTransaction" DISABLE TRIGGER task3_credit_test_fault`;
    try {
      expect((await recoverStaleUnlocks(db!)).refunded).toBe(1);
      expect((await recoverStaleUnlocks(peer!)).scanned).toBe(0);
      expect(await balance(userId)).toBe(20); expect(await ledger(userId)).toHaveLength(2);
    } finally { await db!.$executeRaw`ALTER TABLE "CreditTransaction" ENABLE TRIGGER task3_credit_test_fault`; }
  });
  it("scopes owned recovery and does not debit again during the recovery action", async () => {
    const owned = await seed(), other = await seed(); await claim(owned.userId, owned.readingId); await expire(owned.readingId);
    expect((await recoverOwnedUnlock(db!, other.userId, owned.readingId)).state.status).toBe("denied");
    runtime.userId = owned.userId; runtime.provider.mockReset().mockResolvedValue(generated);
    const { unlockAiInterpretationAction } = await import("@/app/actions/ai");
    expect(await unlockAiInterpretationAction(owned.readingId)).toMatchObject({ ok: false, code: "refunded" });
    expect(runtime.provider).not.toHaveBeenCalled(); expect(await balance(owned.userId)).toBe(20);
    expect(await unlockAiInterpretationAction(owned.readingId)).toMatchObject({ ok: true });
    expect(runtime.provider).toHaveBeenCalledOnce(); expect(await balance(owned.userId)).toBe(10);
  });
  it("shortens the durable lease to the remaining action budget", async () => {
    const { userId, readingId } = await seed();
    expect((await reserveUnlock(db!, userId, readingId, selection, new UnlockDeadline(20_000))).status).toBe("reserved");
    const [row] = await db!.$queryRaw<{ remaining: number }[]>`SELECT EXTRACT(EPOCH FROM ("expiresAt" - clock_timestamp()))::float8 AS remaining FROM "UnlockOperation" WHERE "readingId" = ${readingId}`;
    expect(row.remaining).toBeGreaterThan(15); expect(row.remaining).toBeLessThanOrEqual(20);
  });

  it("recovers after settlement acknowledgement is lost midway through a batch", async () => {
    const first = await seed(), second = await seed();
    for (const row of [first, second]) { await claim(row.userId, row.readingId); await expire(row.readingId); }
    const original = settlements.refundUnlock;
    const spy = vi.spyOn(settlements, "refundUnlock").mockImplementationOnce(async (...args) => {
      await original(...args); throw new Error("Synthetic lost commit acknowledgement");
    });
    try {
      expect(await recoverStaleUnlocks(db!)).toMatchObject({ scanned: 2, refunded: 1, failed: 1 });
      expect((await recoverStaleUnlocks(peer!)).scanned).toBe(0);
      for (const row of [first, second]) { expect(await balance(row.userId)).toBe(20); expect(await ledger(row.userId)).toHaveLength(2); }
    } finally { spy.mockRestore(); }
  });

  it("keeps one saved reading for concurrent retries and permits a distinct new spread", async () => {
    const { userId } = await seed(); runtime.userId = userId;
    const { saveReadingAction } = await import("@/app/actions/readings");
    const requestId = randomUUID();
    const cards = SPREAD_POSITIONS.map((position, i) => ({ cardId: TAROT_CARDS[i].id, position, orientation: "upright" as const }));
    const results = await Promise.all([saveReadingAction("Câu hỏi lưu?", cards, requestId), saveReadingAction("Câu hỏi lưu?", cards, requestId)]);
    expect(results).toEqual([{ ok: true, id: requestId }, { ok: true, id: requestId }]);
    expect(await db!.reading.count({ where: { id: requestId } })).toBe(1);
    const again = randomUUID(); expect(await saveReadingAction("Câu hỏi lưu?", cards, again)).toEqual({ ok: true, id: again });
    expect(await db!.reading.count({ where: { userId, question: "Câu hỏi lưu?" } })).toBe(2);
    const other = await seed(); runtime.userId = other.userId;
    expect(await saveReadingAction("Câu hỏi lưu?", cards, requestId)).toEqual({ ok: false, reason: "invalid" });
  });
  it("recovers persisted content after postcommit cache failure and response loss", async () => {
    const { userId, readingId } = await seed(); runtime.userId = userId;
    runtime.provider.mockReset().mockResolvedValue(generated);
    runtime.revalidate.mockImplementationOnce(() => { throw new Error("Synthetic cache failure"); });
    const { unlockAiInterpretationAction, getUnlockStatusAction } = await import("@/app/actions/ai");
    const first = await unlockAiInterpretationAction(readingId);
    const row = await db!.aiInterpretation.findUniqueOrThrow({ where: { readingId } });
    expect(row).toMatchObject({ model: selection.model, promptVersion: selection.promptVersion, actionSuggestions: generated.result.actionSuggestions.join("\n") });
    expect(first).toMatchObject({ ok: true, data: { id: row.id } });
    expect(await getUnlockStatusAction(readingId)).toEqual(first);
    expect(await unlockAiInterpretationAction(readingId)).toEqual(first);
    expect(runtime.provider).toHaveBeenCalledOnce(); expect(await balance(userId)).toBe(10); expect(await ledger(userId)).toHaveLength(1);
  });
  it("refunds without an orphan result when history is deleted while provider is running", async () => {
    const { userId, readingId } = await seed(); runtime.userId = userId;
    let started!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
    runtime.provider.mockReset().mockImplementation(async () => { started(); await gate; return generated; });
    const { unlockAiInterpretationAction } = await import("@/app/actions/ai");
    const action = unlockAiInterpretationAction(readingId);
    await Promise.race([ready, action.then(() => { throw new Error("Action exited before provider"); })]);
    try { await peer!.reading.delete({ where: { id: readingId } }); } finally { release(); }
    expect(await action).toMatchObject({ ok: false, code: "refunded" });
    expect(await balance(userId)).toBe(20); expect(await ledger(userId)).toHaveLength(2);
    expect(await db!.aiInterpretation.count({ where: { readingId } })).toBe(0);
  });

  it("quarantines ownership changed during generation without giving either account an unearned refund", async () => {
    const owner = await seed(), other = await seed(); runtime.userId = owner.userId;
    let started!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
    runtime.provider.mockReset().mockImplementation(async () => { started(); await gate; return generated; });
    const { unlockAiInterpretationAction } = await import("@/app/actions/ai");
    const action = unlockAiInterpretationAction(owner.readingId);
    await Promise.race([ready, action.then(() => { throw new Error("Action exited before provider"); })]);
    try { await peer!.reading.update({ where: { id: owner.readingId }, data: { userId: other.userId } }); } finally { release(); }
    expect(await action).toMatchObject({ ok: false, code: "reconciliation_required", retryable: false });
    expect(await balance(owner.userId)).toBe(10); expect(await balance(other.userId)).toBe(20);
    expect(await ledger(owner.userId)).toHaveLength(1); expect(await ledger(other.userId)).toHaveLength(0);
    expect(await db!.aiInterpretation.count({ where: { readingId: owner.readingId } })).toBe(0);
    expect(await db!.unlockOperation.findUniqueOrThrow({ where: { readingId: owner.readingId } })).toMatchObject({ userId: owner.userId, status: "RECONCILE_REQUIRED", failureCode: "ownership_mismatch" });
  });

  it("audits expired/terminal/legacy evidence without changing a single financial or history row", async () => {
    const { userId, readingId } = await seed(); await claim(userId, readingId); await expire(readingId);
    const snapshot = async () => JSON.stringify(await Promise.all([
      db!.user.findUnique({ where: { id: userId } }), db!.reading.findUnique({ where: { id: readingId } }),
      db!.unlockOperation.findMany({ where: { userId } }), ledger(userId), db!.aiInterpretation.findMany({ where: { readingId } }),
    ]));
    const before = await snapshot();
    const report = await collectUnlockAudit(db!, { readingId });
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({ state: "expired_pending", spendSum: -10, refundSum: 0, net: -10, issues: [] });
    expect(JSON.stringify(report)).not.toContain("Tôi nên cân nhắc");
    expect(await snapshot()).toBe(before);
    await refundUnlock(db!, userId, readingId, (await db!.unlockOperation.findUniqueOrThrow({ where: { readingId } })).attemptToken, "expired");
    expect((await collectUnlockAudit(db!, { readingId })).rows[0]).toMatchObject({ state: "refunded", net: 0, issues: [] });
    await db!.unlockOperation.delete({ where: { readingId } });
    await db!.creditTransaction.updateMany({ where: { userId }, data: { idempotencyKey: null } });
    expect((await collectUnlockAudit(db!, { readingId })).rows[0].issues).toContain("legacy_unkeyed_receipts");
  });
  it("enforces read-only at PostgreSQL level even if a caller attempts a write in the audit snapshot", async () => {
    const { userId, readingId } = await seed(); await claim(userId, readingId);
    const wrapped = { $transaction: <T,>(fn: (tx: import("@prisma/client").Prisma.TransactionClient) => Promise<T>, options: object) => db!.$transaction(async tx => {
      await fn(tx);
      await tx.user.update({ where: { id: userId }, data: { credits: { increment: 999 } } });
    }, options) } as unknown as PrismaClient;
    await expect(collectUnlockAudit(wrapped, { readingId })).rejects.toThrow(/read.only transaction/i);
    expect(await balance(userId)).toBe(10);
  });
  it("paginates read-only evidence deterministically and never selects private interpretation content", async () => {
    const first = await seed(), second = await seed();
    await finalizeUnlock(db!, first.userId, first.readingId, await claim(first.userId, first.readingId), generated);
    await claim(second.userId, second.readingId);
    const ids = [first.readingId, second.readingId].sort();
    const one = await collectUnlockAudit(db!, { limit: 1 });
    expect(one.rows.map(row => row.readingId)).toEqual([ids[0]]); expect(one.nextCursor).toBe(ids[0]);
    const two = await collectUnlockAudit(db!, { after: one.nextCursor!, limit: 1 });
    expect(two.rows.map(row => row.readingId)).toEqual([ids[1]]); expect(two.nextCursor).toBeNull();
    expect(JSON.stringify([one, two])).not.toContain("Tổng quan");
  });

});
