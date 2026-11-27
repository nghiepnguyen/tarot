import type { PrismaClient } from "@prisma/client";
import { refundUnlock, readUnlockState } from "./unlock-credit";
import { UnlockDeadline, withTimeout } from "./unlock-deadline";
import { recordUnlockEvent } from "./unlock-observability";
import { reportHandledError } from "../monitoring/report";

type Candidate = { id: string; userId: string; readingId: string; attemptToken: string; model: string; promptVersion: string };
export async function recoverOwnedUnlock(db: PrismaClient, userId: string, readingId: string, deadline = new UnlockDeadline()) {
  const rows = await withTimeout(deadline.remainingMs(), () => db.$queryRaw<Candidate[]>`
    SELECT id, "userId", "readingId", "attemptToken", model, "promptVersion" FROM "UnlockOperation"
    WHERE "userId" = ${userId} AND "readingId" = ${readingId}
      AND (status = 'REFUND_PENDING' OR (status = 'PROCESSING' AND "expiresAt" <= clock_timestamp())) LIMIT 1`);
  const row = rows[0];
  if (!row) return { state: await readUnlockState(db, userId, readingId, deadline), recovered: false };
  const state = await refundUnlock(db, userId, readingId, row.attemptToken, "expired", deadline);
  const reread = state.status === "stale";
  const confirmed = reread ? await readUnlockState(db, userId, readingId, deadline) : state;
  recordUnlockEvent({ operationId: row.id, userId: row.userId, readingId: row.readingId,
    attemptToken: reread ? undefined : row.attemptToken, model: reread ? undefined : row.model, promptVersion: reread ? undefined : row.promptVersion,
    event: confirmed.status === "refunded" ? "refunded" : confirmed.status === "completed" ? "persisted" : confirmed.status === "reconciliation_required" ? "reconciliation_required" : confirmed.status === "completed_unavailable" ? "completed_unavailable" : confirmed.status === "processing" ? "processing" : "recovery_pending", stage: "owned_recovery" });
  return { state: confirmed, recovered: true };
}

/** Move a failed eligible candidate behind untouched work without changing its financial state. */
async function rotateFailedCandidate(db: PrismaClient, row: Candidate, deadline: UnlockDeadline) {
  const budget = Math.min(1500, deadline.remainingMs());
  if (budget <= 100) throw new DOMException("Recovery rotation deadline exceeded", "TimeoutError");
  const maxWait = Math.min(300, Math.floor(budget / 4));
  const timeout = Math.min(1000, budget - maxWait);
  await withTimeout(budget, () => db.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('statement_timeout', ${String(timeout)}, true), set_config('lock_timeout', ${String(Math.min(500, timeout))}, true)`;
    await tx.$executeRaw`UPDATE "UnlockOperation" SET "updatedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE id = ${row.id} AND "attemptToken" = ${row.attemptToken}
      AND (status = 'REFUND_PENDING' OR (status = 'PROCESSING' AND "expiresAt" <= clock_timestamp()))`;
  }, { maxWait, timeout }));
}

/** Candidate scans are hints only; refundUnlock rechecks token, expiry, receipts and result under lock. */
export async function recoverStaleUnlocks(db: PrismaClient, deadline = new UnlockDeadline(45_000)) {
  const rows = await withTimeout(deadline.remainingMs(), () => db.$queryRaw<Candidate[]>`
    SELECT id, "userId", "readingId", "attemptToken", model, "promptVersion" FROM "UnlockOperation"
    WHERE status = 'REFUND_PENDING' OR (status = 'PROCESSING' AND "expiresAt" <= clock_timestamp())
    ORDER BY "updatedAt", "expiresAt", id LIMIT 25`);
  const result = { scanned: rows.length, refunded: 0, reconciled: 0, skipped: 0, failed: 0, deferred: 0 };
  for (const [index, row] of rows.entries()) {
    if (deadline.remainingMs() < 5000) { result.deferred = rows.length - index; break; }
    try {
      const state = await refundUnlock(db, row.userId, row.readingId, row.attemptToken, "expired", deadline);
      recordUnlockEvent({ operationId: row.id, ...row, event: state.status === "refunded" ? "refunded" : state.status === "completed" ? "persisted" : state.status === "reconciliation_required" ? "reconciliation_required" : state.status === "stale" ? "stale" : state.status === "completed_unavailable" ? "completed_unavailable" : state.status === "processing" ? "processing" : "recovery_pending", stage: "batch_recovery" });
      if (state.status === "refunded") result.refunded++;
      else if (state.status === "reconciliation_required") result.reconciled++;
      else result.skipped++;
    } catch {
      result.failed++;
      try { await rotateFailedCandidate(db, row, deadline); }
      catch {
        try { reportHandledError(new Error("Unlock recovery rotation failed"), { area: "ai-unlock-recovery", userId: row.userId, extra: { operationId: row.id, attemptToken: row.attemptToken, readingId: row.readingId, stage: "rotation_failed" } }); } catch { /* Escalation remains best effort. */ }
      }
      recordUnlockEvent({ operationId: row.id, ...row, event: "recovery_pending", stage: "batch_failure" });
      try { reportHandledError(new Error("Unlock recovery failed"), { area: "ai-unlock-recovery", userId: row.userId, extra: { operationId: row.id, attemptToken: row.attemptToken, readingId: row.readingId, model: row.model, promptVersion: row.promptVersion, stage: "refund_unconfirmed" } }); } catch { /* Reporting cannot prevent later settlements. */ }
    }
  }
  return result;
}
