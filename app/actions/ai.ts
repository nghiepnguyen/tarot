"use server";

import { revalidatePath } from "next/cache";
import type { AiInterpretation } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getCardById } from "@/lib/tarot/cards";
import { parseReadingInput } from "@/lib/validation/reading";
import { UnlockDeadline, withTimeout } from "@/lib/ai/unlock-deadline";
import { recordUnlockEvent } from "@/lib/ai/unlock-observability";
import { recoverOwnedUnlock } from "@/lib/ai/unlock-recovery";
import { reserveUnlock, finalizeUnlock, refundUnlock, readUnlockState, type UnlockState } from "@/lib/ai/unlock-credit";
import {
  COST_PER_INTERPRETATION,
  DEMO_TOPUP_AMOUNT,
  toDisplayInterpretation,
  type DisplayInterpretation,
  type InterpretationCardInput,
} from "@/lib/ai/interpretation";
import { ACTIVE_PROMPT_VERSION } from "@/lib/ai/prompts";
import { isPricedModel } from "@/lib/ai/pricing";
import { getMissingApiKeyEnvs, resolveAiModelForUnlock } from "@/lib/ai/settings";
import { MissingApiKeyError } from "@/lib/ai/generate";
import { generateMeasuredInterpretation } from "@/lib/ai/metrics";
import { needsReadingSupport } from "@/lib/ai/reading-support";
import { reportHandledError, reportHandledIssue } from "@/lib/monitoring/report";
import type { AiModel } from "@/lib/ai/models";

export type UnlockResult =
  | { ok: true; data: DisplayInterpretation }
  | { ok: false; support: true }
  | { ok: false; error: string; code?: string; retryable?: boolean };

const UNCONFIRMED_CREDIT: UnlockResult = {
  ok: false, code: "recovery_pending", retryable: false,
  error: "Trạng thái credit chưa được xác nhận. Vui lòng kiểm tra lịch sử hoặc liên hệ hỗ trợ trước khi mở khóa lại.",
};
function reportUnlockStage(stage: string, userId: string, readingId: string, model?: string, identity?: { operationId: string; attemptToken: string }) {
  try { reportHandledError(new Error("AI unlock stage failed"), { area: "ai-unlock", userId, extra: { stage, readingId, model, promptVersion: ACTIVE_PROMPT_VERSION.id, operationId: identity?.operationId, attemptToken: identity?.attemptToken } }); }
  catch { /* Telemetry has no financial authority. */ }
}
function displaySaved(row: AiInterpretation, userId: string, readingId: string, review?: Parameters<typeof toDisplayInterpretation>[1]): UnlockResult {
  try { return { ok: true, data: toDisplayInterpretation(row, review) }; }
  catch {
    reportUnlockStage("display_saved", userId, readingId);
    return { ok: false, code: "completed_unavailable", retryable: false, error: "Diễn giải đã được lưu nhưng chưa hiển thị được. Vui lòng tải lại lịch sử, không mở khóa lại." };
  }
}
function stateResult(state: UnlockState, userId: string, readingId: string): UnlockResult {
  if (state.status === "completed") return displaySaved(state.row, userId, readingId);
  const errors: Record<string, string> = {
    available: "Lần trải bài này chưa mở khóa.",
    processing: "Diễn giải đang được xử lý. Vui lòng kiểm tra lại trạng thái, không mở khóa thêm.",
    reconciliation_required: "Trạng thái cần được đối soát. Vui lòng liên hệ hỗ trợ, không mở khóa lại.",
    completed_unavailable: "Diễn giải đã được lưu trước đây nhưng hiện không còn hiển thị được. Không mở khóa lại.",
    refunded: "Không thể tạo diễn giải chuyên sâu lần này. Credit đã được hoàn; bạn có thể thử lại.",
    insufficient_credits: `Không đủ credit. Cần ${COST_PER_INTERPRETATION} credit để mở khóa diễn giải này.`,
    denied: "Không tìm thấy lần trải bài này.",
  };
  const error = errors[state.status];
  return error ? { ok: false, code: state.status, error, retryable: ["available", "refunded", "insufficient_credits"].includes(state.status) } : UNCONFIRMED_CREDIT;
}

export async function getUnlockStatusAction(readingId: string): Promise<UnlockResult> {
  const deadline = new UnlockDeadline();
  try { return await withTimeout(deadline.remainingMs(), () => unlockStatusWithinDeadline(readingId, deadline)); }
  catch { recordUnlockEvent({ event: "recovery_pending", readingId, stage: "action_unconfirmed" }); return UNCONFIRMED_CREDIT; }
}
async function unlockStatusWithinDeadline(readingId: string, deadline: UnlockDeadline): Promise<UnlockResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để xem trạng thái." };
  try {
    const reading = await prisma.reading.findFirst({ where: { id: readingId, userId: session.user.id }, select: { question: true } });
    if (reading && needsReadingSupport(reading.question)) return { ok: false, support: true };
    const outcome = await recoverOwnedUnlock(prisma, session.user.id, readingId, deadline);
    return stateResult(outcome.state, session.user.id, readingId);
  }
  catch { reportUnlockStage("status", session.user.id, readingId); return UNCONFIRMED_CREDIT; }
}

export async function unlockAiInterpretationAction(readingId: string): Promise<UnlockResult> {
  const deadline = new UnlockDeadline();
  try { return await withTimeout(deadline.remainingMs(), () => unlockWithinDeadline(readingId, deadline)); }
  catch { recordUnlockEvent({ event: "recovery_pending", readingId, stage: "action_unconfirmed" }); return UNCONFIRMED_CREDIT; }
}
async function unlockWithinDeadline(readingId: string, deadline: UnlockDeadline): Promise<UnlockResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để mở khóa diễn giải chuyên sâu." };
  if (!deadline.remainingMs()) return UNCONFIRMED_CREDIT;
  const userId = session.user.id;
  const reading = await prisma.reading.findFirst({ where: { id: readingId, userId }, include: { aiInterpretation: { include: { review: true } } } });
  if (!reading) return { ok: false, error: "Không tìm thấy lần trải bài này." };
  if (needsReadingSupport(reading.question)) return { ok: false, support: true };
  if (reading.aiInterpretation) return displaySaved(reading.aiInterpretation, userId, reading.id, reading.aiInterpretation.review);
  try {
    const outcome = await recoverOwnedUnlock(prisma, userId, reading.id, deadline);
    if (outcome.recovered || !["available", "refunded"].includes(outcome.state.status)) return stateResult(outcome.state, userId, reading.id);
  } catch { reportUnlockStage("preflight_status", userId, reading.id); return UNCONFIRMED_CREDIT; }
  if (!(await checkRateLimit(`ai-unlock:${userId}`, 20, 60 * 60 * 1000))) return { ok: false, code: "rate_limited", retryable: true, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  const input = parseReadingInput(reading.question, reading.cards);
  if (!input) return { ok: false, error: "Dữ liệu lần trải bài không hợp lệ, chưa trừ credit." };
  const cardInputs: InterpretationCardInput[] = input.cards.map(card => ({ position: card.position, card: getCardById(card.cardId)!, orientation: card.orientation }));
  let model: AiModel;
  try {
    model = await resolveAiModelForUnlock();
    const missing = getMissingApiKeyEnvs([model]);
    if (missing.length) throw new MissingApiKeyError(missing[0]);
  } catch (error) {
    reportUnlockStage("preflight", userId, reading.id);
    return { ok: false, code: "preflight_failed", retryable: true, error: error instanceof MissingApiKeyError ? error.message : "Không thể chuẩn bị diễn giải lúc này, chưa trừ credit." };
  }
  const version = ACTIVE_PROMPT_VERSION;
  let token: string;
  let operationId: string;
  if (!deadline.providerMs()) return { ok: false, code: "deadline_exceeded", retryable: true, error: "Không còn đủ thời gian để bắt đầu diễn giải, chưa trừ credit." };
  try {
    const reservation = await reserveUnlock(prisma, userId, reading.id, { model: model.id, promptVersion: version.id }, deadline);
    if (reservation.status !== "reserved") return stateResult(reservation, userId, reading.id);
    token = reservation.token;
    operationId = reservation.operationId;
  } catch { reportUnlockStage("reserve_unconfirmed", userId, reading.id, model.id); recordUnlockEvent({ event: "recovery_pending", readingId: reading.id, userId, model: model.id, promptVersion: version.id, stage: "reserve_unconfirmed" }); return UNCONFIRMED_CREDIT; }

  const identity = { operationId, attemptToken: token };
  const context = { ...identity, userId, readingId: reading.id, model: model.id, promptVersion: version.id };
  recordUnlockEvent({ ...context, event: "reserved", stage: "reserve" });
  const finish = (state: UnlockState, confirmedForAttempt = true): UnlockResult => {
    const event = state.status === "completed" ? "persisted" : ["refunded", "reconciliation_required", "processing", "completed_unavailable", "stale"].includes(state.status) ? state.status as "refunded" | "reconciliation_required" | "processing" | "completed_unavailable" | "stale" : "recovery_pending";
    recordUnlockEvent({ ...context, event: confirmedForAttempt ? event : "recovery_pending", stage: confirmedForAttempt ? "settlement" : "settlement_unconfirmed" });
    if (state.status === "completed") {
      try {
        if (!isPricedModel(model.id)) reportHandledIssue("Model AI chưa có trong bảng giá", { area: "ai-unlock", extra: { model: model.id, promptVersion: version.id } });
      } catch { reportUnlockStage("pricing_report", userId, reading.id, model.id, identity); }
      try { revalidatePath("/history"); } catch { reportUnlockStage("history_cache", userId, reading.id, model.id, identity); }
    }
    return stateResult(state, userId, reading.id);
  };
  const settleFailure = async (failure: "generation_failed" | "save_failed" | "expired"): Promise<UnlockResult> => {
    reportUnlockStage(failure, userId, reading.id, model.id, identity);
    try { return finish(await refundUnlock(prisma, userId, reading.id, token, failure, deadline)); }
    catch {
      reportUnlockStage("settlement_unconfirmed", userId, reading.id, model.id, identity);
      try { return finish(await readUnlockState(prisma, userId, reading.id, deadline), false); }
      catch { recordUnlockEvent({ ...context, event: "recovery_pending", stage: "settlement_unconfirmed" }); return UNCONFIRMED_CREDIT; }
    }
  };
  let generated;
  const providerMs = deadline.providerMs();
  if (!providerMs) return settleFailure("generation_failed");
  try { generated = await generateMeasuredInterpretation(input.question, cardInputs, version, model, { timeoutMs: providerMs }); }
  catch { return settleFailure("generation_failed"); }
  recordUnlockEvent({ ...context, event: "generated", stage: "provider" });
  try {
    const state = await finalizeUnlock(prisma, userId, reading.id, token, generated, deadline);
    if (state.status === "expired" || state.status === "reading_missing") return settleFailure(state.status === "expired" ? "expired" : "save_failed");
    return finish(state);
  } catch { return settleFailure("save_failed"); }
}

export interface CreditStatus {
  credits: number;
  hasPurchased: boolean;
}

export async function getCreditStatusAction(): Promise<CreditStatus | null> {
  const session = await auth();
  if (!session?.user) return null;

  const [user, purchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
    prisma.creditTransaction.findFirst({
      where: { userId: session.user.id, type: "PURCHASE" },
      select: { id: true },
    }),
  ]);
  if (!user) return null;

  return { credits: user.credits, hasPurchased: purchase !== null };
}

export async function topUpCreditsAction() {
  if (process.env.NODE_ENV === "production") return;

  const session = await auth();
  if (!session?.user) return;

  if (!(await checkRateLimit(`topup:${session.user.id}`, 10, 60 * 60 * 1000))) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credits: { increment: DEMO_TOPUP_AMOUNT } },
  });

  revalidatePath("/credits");
}
