import { Prisma, type PrismaClient, type UnlockOperation } from "@prisma/client";
export type AuditReceipt = { id: string; userId: string; relatedReadingId: string | null; type: string; amount: number; balanceAfter: number; idempotencyKey: string | null };
export type AuditEvidence = { readingId: string; operation: UnlockOperation | null; reading: { userId: string; result: { id: string; model: string; promptVersion: string | null } | null } | null; receipts: AuditReceipt[]; now: Date; truncated?: boolean };
/** Evidence-only classification. This function never computes a user's total credit balance. */
export function inspectUnlockEvidence({ readingId, operation: op, reading, receipts, now, truncated = false }: AuditEvidence) {
  const issues = new Set<string>();
  const groups = new Map<string, AuditReceipt[]>();
  const local = receipts.filter(row => row.relatedReadingId === readingId);
  for (const row of receipts) {
    if (!Number.isSafeInteger(row.balanceAfter) || row.balanceAfter < 0) issues.add("invalid_balance_after");
    if (!row.idempotencyKey) { issues.add("legacy_unkeyed_receipts"); continue; }
    const match = /^ai-unlock\/([^/]+)\/(spend|refund)$/.exec(row.idempotencyKey);
    if (!match) { issues.add("unknown_receipt_key"); continue; }
    if (row.relatedReadingId !== readingId || (op && row.userId !== op.userId)
      || row.type !== (match[2] === "spend" ? "UNLOCK_SPEND" : "REFUND")) issues.add("receipt_identity_mismatch");
    const group = groups.get(match[1]) ?? []; group.push(row); groups.set(match[1], group);
  }
  for (const [token, group] of groups) {
    if (token === op?.attemptToken) continue;
    const spends = group.filter(row => row.type === "UNLOCK_SPEND"), refunds = group.filter(row => row.type === "REFUND");
    if (spends.length !== 1 || refunds.length !== 1 || spends[0].amount >= 0 || refunds[0].amount !== -spends[0].amount || refunds[0].userId !== spends[0].userId) issues.add("unsettled_prior_attempt");
  }
  let state = "legacy_ambiguous";
  if (!op) issues.add("missing_operation");
  else {
    if (reading && reading.userId !== op.userId) issues.add("ownership_mismatch");
    const current = groups.get(op.attemptToken) ?? [];
    const spends = current.filter(row => row.idempotencyKey?.endsWith("/spend")), refunds = current.filter(row => row.idempotencyKey?.endsWith("/refund"));
    if (op.cost <= 0 || spends.length !== 1 || spends[0]?.amount !== -op.cost || spends[0]?.type !== "UNLOCK_SPEND") issues.add("missing_current_spend");
    if (refunds.some(row => row.amount !== op.cost || row.type !== "REFUND") || refunds.length > 1) issues.add("invalid_current_refund");
    const result = reading?.result;
    if (op.status === "SUCCEEDED") {
      state = result ? "persisted" : "completed_unavailable";
      if (!op.interpretationId || (result && (result.id !== op.interpretationId || result.model !== op.model || result.promptVersion !== op.promptVersion))) issues.add("result_identity_mismatch");
      if (refunds.length) issues.add("unexpected_refund");
    } else if (op.status === "REFUNDED") {
      state = "refunded";
      if (refunds.length !== 1) issues.add("missing_current_refund");
      if (result) issues.add("unexpected_result");
    } else {
      state = op.status === "RECONCILE_REQUIRED" ? "reconciliation_required" : op.status === "REFUND_PENDING" ? "refund_pending" : op.expiresAt <= now ? "expired_pending" : "processing";
      if (op.status === "RECONCILE_REQUIRED") issues.add("quarantined");
      if (refunds.length) issues.add("unexpected_refund");
      if (result) issues.add("unexpected_result");
    }
  }
  if (truncated) issues.add("evidence_truncated");
  const spendSum = local.filter(row => row.type === "UNLOCK_SPEND").reduce((sum, row) => sum + row.amount, 0);
  const refundSum = local.filter(row => row.type === "REFUND").reduce((sum, row) => sum + row.amount, 0);
  return {
    readingId, operationId: op?.id ?? null, attemptToken: op?.attemptToken ?? null,
    userId: op?.userId ?? reading?.userId ?? null, model: op?.model ?? reading?.result?.model ?? null,
    promptVersion: op?.promptVersion ?? reading?.result?.promptVersion ?? null,
    operationStatus: op?.status ?? null,
    state: truncated ? "incomplete" : op && issues.size && op.status !== "RECONCILE_REQUIRED" ? "ambiguous" : state,
    evidenceComplete: !truncated, sumsPartial: truncated, failureCode: op?.failureCode ?? null, expiresAt: op?.expiresAt.toISOString() ?? null,
    spendSum, refundSum, net: spendSum + refundSum,
    balanceAfter: local.map(row => ({ ledgerId: row.id, value: row.balanceAfter })),
    issues: [...issues],
  };
}

/** Repeatable-read snapshot, read-only at PostgreSQL level. No recovery/status helpers are called. */
export async function collectUnlockAudit(db: PrismaClient, options: { after?: string; readingId?: string; limit?: number } = {}) {
  const { after = "", readingId = "", limit = 50 } = options;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || [after, readingId].some(value => value && !/^[a-zA-Z0-9_-]{1,128}$/.test(value))) throw new Error("Invalid audit page");
  return db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$queryRaw`SELECT set_config('statement_timeout', '5000', true)`;
    const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
    const candidates = await tx.$queryRaw<{ readingId: string }[]>`
      SELECT "readingId" FROM (
        SELECT "readingId" FROM "UnlockOperation"
        UNION SELECT "readingId" FROM "AiInterpretation"
        UNION SELECT "relatedReadingId" AS "readingId" FROM "CreditTransaction"
          WHERE type IN ('UNLOCK_SPEND', 'REFUND') AND "relatedReadingId" IS NOT NULL
      ) evidence WHERE "readingId" > ${after} AND (${readingId} = '' OR "readingId" = ${readingId}) ORDER BY "readingId" LIMIT ${limit + 1}`;
    const ids = candidates.slice(0, limit).map(row => row.readingId);
    const ops = await tx.unlockOperation.findMany({ where: { readingId: { in: ids } } });
    const readings = await tx.reading.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true, aiInterpretation: { select: { id: true, model: true, promptVersion: true } } } });
    const keys = ops.flatMap(op => [`ai-unlock/${op.attemptToken}/spend`, `ai-unlock/${op.attemptToken}/refund`]);
    const receipts = await tx.creditTransaction.findMany({ where: { OR: [{ relatedReadingId: { in: ids }, type: { in: ["UNLOCK_SPEND", "REFUND"] } }, { idempotencyKey: { in: keys } }] },
      select: { id: true, userId: true, relatedReadingId: true, type: true, amount: true, balanceAfter: true, idempotencyKey: true }, orderBy: { id: "asc" }, take: 5001 });
    const truncated = receipts.length > 5000;
    const rows = ids.map(id => {
      const op = ops.find(row => row.readingId === id) ?? null;
      const reading = readings.find(row => row.id === id);
      const evidence = receipts.slice(0, 5000).filter(row => row.relatedReadingId === id || (op && keys.includes(row.idempotencyKey ?? "") && row.idempotencyKey?.startsWith(`ai-unlock/${op.attemptToken}/`)));
      const row = inspectUnlockEvidence({ readingId: id, operation: op, reading: reading ? { userId: reading.userId, result: reading.aiInterpretation } : null, receipts: evidence, now: clock.now, truncated });
      return row;
    });
    return {
      mode: "read_only_dry_run", snapshotAt: clock.now.toISOString(), evidenceTruncated: truncated,
      nextCursor: candidates.length > limit ? ids[ids.length - 1] : null,
      scope: "Page of unlock evidence; balanceAfter samples only, not total account balance or a complete ledger continuity proof.",
      counts: { readings: rows.length, flagged: rows.filter(row => row.issues.length).length, pending: rows.filter(row => ["processing", "expired_pending", "refund_pending"].includes(row.state)).length }, rows,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 1000, timeout: 10_000 });
}

/** Explicit opt-in test target; never accepts an application DATABASE_URL fallback. */
export function validateUnlockAuditTarget(url: string): void {
  const target = new URL(url);
  if (!["postgresql:", "postgres:"].includes(target.protocol) || target.search || target.hash || !["localhost", "127.0.0.1"].includes(target.hostname) || target.pathname !== "/tarot_credit_task3" || target.username !== "credit_test") throw new Error("Only isolated test database allowed");
}
