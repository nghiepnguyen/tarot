import { randomUUID } from "node:crypto";
import { Prisma, type AiInterpretation, type PrismaClient, type UnlockOperation } from "@prisma/client";
import { UnlockDeadline, withTimeout, UNLOCK_SETTLEMENT_RESERVE_MS } from "./unlock-deadline";
import { COST_PER_INTERPRETATION, type GeneratedInterpretation } from "./interpretation";

type ReadingWithResult = Prisma.ReadingGetPayload<{ include: { aiInterpretation: true } }>;
export type UnlockState =
  | { status: "completed"; row: AiInterpretation }
  | { status: "available" | "processing" | "recovery_pending" | "reconciliation_required" | "completed_unavailable" | "refunded" | "denied" | "stale" | "expired" | "reading_missing" | "insufficient_credits" };
export type UnlockReservation = UnlockState | { status: "reserved"; token: string; operationId: string };
export type UnlockFailure = "generation_failed" | "save_failed" | "expired";
class InsufficientCredits extends Error {}
class ExpiredAttempt extends Error {}

async function transaction<T>(db: PrismaClient, fn: (tx: Prisma.TransactionClient) => Promise<T>, deadline = new UnlockDeadline()): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const remaining = deadline.remainingMs();
    if (remaining <= 100) throw new DOMException("Unlock deadline exceeded", "TimeoutError");
    const maxWait = Math.min(1000, Math.floor(remaining / 4));
    const timeout = Math.min(3000, remaining - maxWait);
    try { return await withTimeout(remaining, () => db.$transaction(async tx => {
      if (!deadline.remainingMs()) throw new DOMException("Unlock deadline exceeded", "TimeoutError");
      await tx.$queryRaw`SELECT set_config('statement_timeout', ${String(timeout)}, true), set_config('lock_timeout', ${String(Math.min(timeout, 1000))}, true)`;
      return fn(tx);
    }, { isolationLevel: "Serializable", maxWait, timeout })); }
    catch (error) {
      // Only confirmed transaction rollbacks are retried; never retry provider work or unknown commits.
      if (attempt < 2 && error instanceof Prisma.PrismaClientKnownRequestError
        && (["P2034", "P2002"].includes(error.code) || (error.code === "P2010" && ["40001", "40P01"].includes(String(error.meta?.code))))) continue;
      throw error;
    }
  }
}
async function lock(tx: Prisma.TransactionClient, userId: string, readingId: string): Promise<UnlockOperation | null> {
  const rows = await tx.$queryRaw<UnlockOperation[]>`SELECT * FROM "UnlockOperation" WHERE "userId" = ${userId} AND "readingId" = ${readingId} FOR UPDATE`;
  return rows[0] ?? null;
}
const readReading = (tx: Prisma.TransactionClient, readingId: string) => tx.reading.findUnique({ where: { id: readingId }, include: { aiInterpretation: true } });
const key = (token: string, kind: "spend" | "refund") => `ai-unlock/${token}/${kind}`;
async function quarantine(tx: Prisma.TransactionClient, op: UnlockOperation, failureCode: string): Promise<UnlockState> {
  await tx.unlockOperation.update({ where: { id: op.id }, data: { status: "RECONCILE_REQUIRED", failureCode } });
  return { status: "reconciliation_required" };
}

/** Every settlement path checks receipts/result under the operation lock, including expired attempts. */
async function inspect(tx: Prisma.TransactionClient, op: UnlockOperation, reading: ReadingWithResult | null): Promise<UnlockState | null> {
  if (op.status === "RECONCILE_REQUIRED") return { status: "reconciliation_required" };
  if (reading && reading.userId !== op.userId) return quarantine(tx, op, "ownership_mismatch");
  const spend = await tx.creditTransaction.findUnique({ where: { idempotencyKey: key(op.attemptToken, "spend") } });
  const refund = await tx.creditTransaction.findUnique({ where: { idempotencyKey: key(op.attemptToken, "refund") } });
  const valid = (row: typeof spend, amount: number, type: string) => row && row.userId === op.userId && row.relatedReadingId === op.readingId && row.type === type && row.amount === amount;
  if (op.cost <= 0 || !valid(spend, -op.cost, "UNLOCK_SPEND") || (refund && !valid(refund, op.cost, "REFUND"))) return quarantine(tx, op, "receipt_mismatch");
  const result = reading?.aiInterpretation;
  if (op.status === "SUCCEEDED") {
    if (refund || !op.interpretationId || (result && result.id !== op.interpretationId)) return quarantine(tx, op, "success_mismatch");
    return result ? { status: "completed", row: result } : { status: "completed_unavailable" };
  }
  if (op.status === "REFUNDED") return refund && !result ? { status: "refunded" } : quarantine(tx, op, "refund_mismatch");
  if (refund || result) return quarantine(tx, op, "unexpected_settlement");
  return null;
}

export async function readUnlockState(db: PrismaClient, userId: string, readingId: string, deadline = new UnlockDeadline()): Promise<UnlockState> {
  return transaction<UnlockState>(db, async tx => {
    const op = await lock(tx, userId, readingId);
    const reading = await readReading(tx, readingId);
    if (op) {
      const terminal = await inspect(tx, op, reading);
      return terminal ?? { status: op.status === "REFUND_PENDING" ? "recovery_pending" : "processing" };
    }
    if (!reading || reading.userId !== userId) return { status: "denied" };
    return reading.aiInterpretation ? { status: "completed", row: reading.aiInterpretation } : { status: "available" };
  }, deadline);
}

export async function reserveUnlock(db: PrismaClient, userId: string, readingId: string, selection: { model: string; promptVersion: string }, deadline = new UnlockDeadline()): Promise<UnlockReservation> {
  const token = randomUUID();
  try {
    return await transaction<UnlockReservation>(db, async tx => {
      const reading = await readReading(tx, readingId);
      if (!reading || reading.userId !== userId) return { status: "denied" };
      if (reading.aiInterpretation) return { status: "completed", row: reading.aiInterpretation };
      await tx.unlockOperation.upsert({ where: { readingId }, update: {}, create: {
        readingId, userId, attemptToken: token, status: "PROCESSING", cost: COST_PER_INTERPRETATION,
        ...selection, expiresAt: new Date(0),
      } });
      const op = await lock(tx, userId, readingId);
      if (!op) return { status: "denied" };
      if (op.attemptToken !== token) {
        const terminal = await inspect(tx, op, reading);
        if (terminal?.status !== "refunded") return terminal ?? { status: op.status === "REFUND_PENDING" ? "recovery_pending" : "processing" };
      }
      // The DB expiry cannot outlive the remaining request budget, including preflight time.
      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      const remaining = deadline.remainingMs();
      if (remaining <= UNLOCK_SETTLEMENT_RESERVE_MS) throw new DOMException("Unlock deadline exceeded", "TimeoutError");
      await tx.unlockOperation.update({ where: { id: op.id }, data: {
        attemptToken: token, status: "PROCESSING", cost: COST_PER_INTERPRETATION, ...selection,
        expiresAt: new Date(clock.now.getTime() + remaining), interpretationId: null, failureCode: null,
      } });
      const debit = await tx.user.updateMany({ where: { id: userId, credits: { gte: COST_PER_INTERPRETATION } }, data: { credits: { decrement: COST_PER_INTERPRETATION } } });
      if (!debit.count) throw new InsufficientCredits();
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { credits: true } });
      await tx.creditTransaction.create({ data: { userId, type: "UNLOCK_SPEND", amount: -COST_PER_INTERPRETATION, balanceAfter: user.credits, relatedReadingId: readingId, idempotencyKey: key(token, "spend") } });
      return { status: "reserved", token, operationId: op.id };
    }, deadline);
  } catch (error) {
    if (error instanceof InsufficientCredits) return { status: "insufficient_credits" };
    throw error;
  }
}

export async function finalizeUnlock(db: PrismaClient, userId: string, readingId: string, token: string, generated: GeneratedInterpretation, deadline = new UnlockDeadline()): Promise<UnlockState> {
  try {
    return await transaction<UnlockState>(db, async tx => {
      const op = await lock(tx, userId, readingId);
      if (!op) return { status: "denied" };
      if (op.attemptToken !== token) return { status: "stale" };
      const reading = await readReading(tx, readingId);
      const terminal = await inspect(tx, op, reading);
      if (terminal) return terminal;
      if (op.status !== "PROCESSING") return { status: "recovery_pending" };
      if (!reading) return { status: "reading_missing" };
      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      if (op.expiresAt <= clock.now) return { status: "expired" };
      const { result, usage } = generated;
      const row = await tx.aiInterpretation.create({ data: {
        readingId, summary: result.summary, overview: result.overview,
        themes: result.themes as unknown as Prisma.InputJsonValue, perCard: result.perCard as unknown as Prisma.InputJsonValue,
        connections: result.connections, actionSuggestions: result.actionSuggestions.join("\n"), actionSuggestionsList: result.actionSuggestions as unknown as Prisma.InputJsonValue,
        reflectiveQuestion: result.reflectiveQuestion, closingNote: result.closingNote,
        model: op.model, promptVersion: op.promptVersion, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, thinkingTokens: usage.thinkingTokens, latencyMs: usage.latencyMs,
      } });
      // Evaluate the wall clock in the transition itself, after lock waits and persistence work.
      const changed = await tx.$executeRaw`UPDATE "UnlockOperation" SET status = 'SUCCEEDED', "interpretationId" = ${row.id}, "updatedAt" = clock_timestamp() WHERE id = ${op.id} AND "attemptToken" = ${token} AND status = 'PROCESSING' AND "expiresAt" > clock_timestamp()`;
      if (!changed) throw new ExpiredAttempt();
      return { status: "completed", row };
    }, deadline);
  } catch (error) {
    if (error instanceof ExpiredAttempt) return { status: "expired" };
    throw error;
  }
}

export async function refundUnlock(db: PrismaClient, userId: string, readingId: string, token: string, failure: UnlockFailure, deadline = new UnlockDeadline()): Promise<UnlockState> {
  return transaction<UnlockState>(db, async tx => {
    const op = await lock(tx, userId, readingId);
    if (!op) return { status: "denied" };
    if (op.attemptToken !== token) return { status: "stale" };
    const terminal = await inspect(tx, op, await readReading(tx, readingId));
    if (terminal) return terminal;
    if (failure === "expired" && op.status === "PROCESSING") {
      const changed = await tx.$executeRaw`UPDATE "UnlockOperation" SET status = 'REFUND_PENDING', "updatedAt" = clock_timestamp() WHERE id = ${op.id} AND status IN ('PROCESSING', 'REFUND_PENDING') AND "expiresAt" <= clock_timestamp()`;
      if (!changed) return { status: "processing" };
    }
    const user = await tx.user.update({ where: { id: userId }, data: { credits: { increment: op.cost } } });
    await tx.creditTransaction.create({ data: { userId, type: "REFUND", amount: op.cost, balanceAfter: user.credits, relatedReadingId: readingId, idempotencyKey: key(token, "refund") } });
    await tx.unlockOperation.update({ where: { id: op.id }, data: { status: "REFUNDED", failureCode: failure } });
    return { status: "refunded" };
  }, deadline);
}
