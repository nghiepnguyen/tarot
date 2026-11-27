import { expect, it } from "vitest";
import { type AuditReceipt, inspectUnlockEvidence, validateUnlockAuditTarget } from "./unlock-audit";
import type { UnlockOperation } from "@prisma/client";
const now = new Date("2026-11-23T00:00:00Z");
const op = { id: "op", userId: "user", readingId: "reading", attemptToken: "token", cost: 10, status: "PROCESSING", expiresAt: new Date(now.getTime() - 1000), model: "gemini", promptVersion: "v7", interpretationId: null, failureCode: null, createdAt: now, updatedAt: now } satisfies UnlockOperation;
const spend = { id: "s", userId: "user", relatedReadingId: "reading", type: "UNLOCK_SPEND", amount: -10, balanceAfter: 90, idempotencyKey: "ai-unlock/token/spend" };
const refund = { ...spend, id: "r", type: "REFUND", amount: 10, balanceAfter: 120, idempotencyKey: "ai-unlock/token/refund" };
const inspect = (operation: UnlockOperation | null, receipts: AuditReceipt[] = [spend], result: { id: string; model: string; promptVersion: string } | null = null) => inspectUnlockEvidence({ readingId: "reading", operation, reading: { userId: "user", result }, receipts, now });
it("identifies expired pending without claiming a completed refund", () => {
  expect(inspect(op)).toMatchObject({ state: "expired_pending", spendSum: -10, refundSum: 0, net: -10, issues: [], balanceAfter: [{ ledgerId: "s", value: 90 }] });
});
it("accepts an acknowledged success but flags success with a refund", () => {
  const succeeded = { ...op, status: "SUCCEEDED" as const, interpretationId: "saved" };
  expect(inspect(succeeded, [spend], { id: "saved", model: "gemini", promptVersion: "v7" }).issues).toEqual([]);
  expect(inspect(succeeded, [spend, refund], { id: "saved", model: "gemini", promptVersion: "v7" }).issues).toContain("unexpected_refund");
});
it("does not infer total balance or require refund balanceAfter to equal spend balanceAfter plus cost", () => {
  expect(inspect({ ...op, status: "REFUNDED" }, [spend, refund])).toMatchObject({ state: "refunded", net: 0, issues: [] });
});
it("flags legacy evidence as ambiguous even if amounts appear to cancel", () => {
  expect(inspect(null, [{ ...spend, idempotencyKey: null }, { ...refund, idempotencyKey: null }]).issues).toContain("legacy_unkeyed_receipts");
});
it("flags a forged receipt, missing spend and ownership changes", () => {
  expect(inspect(op, [{ ...spend, userId: "other" }]).issues).toContain("receipt_identity_mismatch");
  expect(inspect(op, []).issues).toContain("missing_current_spend");
  expect(inspectUnlockEvidence({ readingId: "reading", operation: op, reading: { userId: "other", result: null }, receipts: [spend], now }).issues).toContain("ownership_mismatch");
});
it("keeps prior refunded attempts separate from the current attempt", () => {
  const old = [{ ...spend, id: "old-s", idempotencyKey: "ai-unlock/old/spend" }, { ...refund, id: "old-r", idempotencyKey: "ai-unlock/old/refund" }];
  expect(inspect(op, [...old, spend])).toMatchObject({ issues: [], net: -10 });
  expect(inspect(op, [old[0], spend]).issues).toContain("unsettled_prior_attempt");
});
it("quarantine is always manual and negative balanceAfter is flagged", () => {
  expect(inspect({ ...op, status: "RECONCILE_REQUIRED" }, [{ ...spend, balanceAfter: -1 }]).issues).toEqual(expect.arrayContaining(["quarantined", "invalid_balance_after"]));
});
it("does not call contradictory terminal evidence a confirmed financial state", () => {
  expect(inspect({ ...op, status: "REFUNDED" }, [spend])).toMatchObject({ state: "ambiguous", operationStatus: "REFUNDED" });
  expect(inspect({ ...op, status: "SUCCEEDED", interpretationId: "expected" }, [spend], { id: "other", model: "gemini", promptVersion: "v7" })).toMatchObject({ state: "ambiguous", operationStatus: "SUCCEEDED" });
});
it("does not claim complete sums or verified settlement from truncated evidence", () => {
  expect(inspectUnlockEvidence({ readingId: "reading", operation: { ...op, status: "REFUNDED" }, reading: { userId: "user", result: null }, receipts: [spend, refund], now, truncated: true })).toMatchObject({ state: "incomplete", sumsPartial: true, evidenceComplete: false });
});

it.each(["?host=/private/socket", "?schema=other", "?options=overrides", "#fragment"])("rejects connection override %s before opening a database client", suffix => {
  expect(() => validateUnlockAuditTarget(`postgresql://credit_test:synthetic@127.0.0.1:5432/tarot_credit_task3${suffix}`)).toThrow();
});
it("rejects other hosts, roles, databases and protocols", () => {
  for (const url of ["postgresql://credit_test:synthetic@example.test/tarot_credit_task3", "postgresql://app@localhost/tarot_credit_task3", "postgresql://credit_test@localhost/production", "https://credit_test@localhost/tarot_credit_task3"]) expect(() => validateUnlockAuditTarget(url)).toThrow();
});
