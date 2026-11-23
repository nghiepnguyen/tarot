export type UnlockEvent = { event: "reserved" | "generated" | "persisted" | "refunded" | "recovery_pending" | "reconciliation_required" | "processing" | "completed_unavailable" | "stale"; stage?: string; operationId?: string; attemptToken?: string; userId?: string; readingId?: string; model?: string; promptVersion?: string };
/** Best-effort diagnostic events, never a financial counter or commit authority. */
export function recordUnlockEvent(event: UnlockEvent): void {
  const safe = (value?: string) => value && /^[a-zA-Z0-9_.:-]{1,128}$/.test(value) ? value : undefined;
  const payload = {
    event: event.event, stage: safe(event.stage),
    operationId: safe(event.operationId), attemptToken: safe(event.attemptToken),
    userId: safe(event.userId), readingId: safe(event.readingId),
    model: safe(event.model), promptVersion: safe(event.promptVersion),
  };
  try { console.info("ai-unlock-lifecycle", JSON.stringify(payload)); } catch { /* Logging cannot change settlement. */ }
}
