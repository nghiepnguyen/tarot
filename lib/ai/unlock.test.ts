import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";
import { InterpretationValidationError } from "./quality";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), reading: vi.fn(), rate: vi.fn(), resolve: vi.fn(), missing: vi.fn(), generate: vi.fn(), reserve: vi.fn(), finalize: vi.fn(), refund: vi.fn(), state: vi.fn(), recover: vi.fn(), display: vi.fn(), report: vi.fn(), issue: vi.fn(), revalidate: vi.fn(), event: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { reading: { findFirst: mocks.reading } } }));
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("./unlock-observability", () => ({ recordUnlockEvent: mocks.event }));
vi.mock("./settings", () => ({ resolveAiModelForUnlock: mocks.resolve, getMissingApiKeyEnvs: mocks.missing }));
vi.mock("./metrics", () => ({ generateMeasuredInterpretation: mocks.generate }));
vi.mock("./unlock-recovery", () => ({ recoverOwnedUnlock: mocks.recover }));
vi.mock("./unlock-credit", () => ({ reserveUnlock: mocks.reserve, finalizeUnlock: mocks.finalize, refundUnlock: mocks.refund, readUnlockState: mocks.state }));
vi.mock("./interpretation", async importOriginal => ({ ...await importOriginal<typeof import("./interpretation")>(), toDisplayInterpretation: mocks.display }));
vi.mock("../monitoring/report", () => ({ reportHandledError: mocks.report, reportHandledIssue: mocks.issue }));
import { unlockAiInterpretationAction, getUnlockStatusAction } from "@/app/actions/ai";
const result = { summary: "Tóm tắt", overview: "Tổng quan", themes: ["Một"], perCard: SPREAD_POSITIONS.map(position => ({ position, keyMessage: "Ý", text: "Nội dung" })), connections: "Liên hệ", actionSuggestions: ["Bước một"], reflectiveQuestion: "Điều gì?", closingNote: "Lời kết" };
const saved = { id: "saved", readingId: "reading", ...result, actionSuggestions: "Bước một", actionSuggestionsList: result.actionSuggestions, model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06" };
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "user" } });
  mocks.reading.mockResolvedValue({ id: "reading", question: "Câu hỏi?", cards: SPREAD_POSITIONS.map((position, i) => ({ cardId: TAROT_CARDS[i].id, position, orientation: "upright" })), aiInterpretation: null });
  mocks.rate.mockResolvedValue(true); mocks.resolve.mockResolvedValue({ id: "gemini-3.8-flash", provider: "gemini" }); mocks.missing.mockReturnValue([]);
  mocks.recover.mockImplementation(async (...args) => ({ state: await mocks.state(...args), recovered: false }));
  mocks.state.mockResolvedValue({ status: "available" }); mocks.reserve.mockResolvedValue({ status: "reserved", token: "server-token", operationId: "operation" });
  mocks.generate.mockResolvedValue({ result, usage: { inputTokens: 100 } }); mocks.finalize.mockResolvedValue({ status: "completed", row: saved }); mocks.refund.mockResolvedValue({ status: "refunded" });
  mocks.display.mockImplementation((await vi.importActual<typeof import("./interpretation")>("./interpretation")).toDisplayInterpretation);
});

describe("durable unlock orchestration", () => {
  it("only generates after reservation and passes exact identity to settlement", async () => {
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { id: "saved", overview: "Tổng quan" } });
    expect(mocks.reserve).toHaveBeenCalledExactlyOnceWith(expect.anything(), "user", "reading", { model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06" }, expect.anything());
    expect(mocks.generate).toHaveBeenCalledOnce();
    expect(mocks.finalize).toHaveBeenCalledExactlyOnceWith(expect.anything(), "user", "reading", "server-token", { result, usage: { inputTokens: 100 } }, expect.anything());
    expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(mocks.generate.mock.invocationCallOrder[0]);
    expect(mocks.refund).not.toHaveBeenCalled(); expect(mocks.revalidate).toHaveBeenCalledWith("/history");
  });

  it.each(["processing", "recovery_pending", "reconciliation_required", "completed_unavailable"])("does not resolve model or start provider for existing %s", async status => {
    mocks.state.mockResolvedValueOnce({ status });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: status, retryable: false });
    expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });

  it.each(["processing", "insufficient_credits", "reconciliation_required"])("does not generate when reserve returns %s", async status => {
    mocks.reserve.mockResolvedValueOnce({ status });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: status });
    expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("reads an already committed result returned by the reservation race", async () => {
    mocks.reserve.mockResolvedValueOnce({ status: "completed", row: saved });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { id: "saved" } });
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it.each([new Error("PRIVATE provider"), new DOMException("PRIVATE timeout", "TimeoutError"), new InterpretationValidationError("invalid_schema"), new InterpretationValidationError("invalid_json"), new InterpretationValidationError("position_mismatch")])("settles generation failure with the owned token", async error => {
    mocks.generate.mockRejectedValueOnce(error);
    const out = await unlockAiInterpretationAction("reading"); expect(out).toMatchObject({ ok: false, code: "refunded", retryable: true });
    expect(mocks.refund).toHaveBeenCalledExactlyOnceWith(expect.anything(), "user", "reading", "server-token", "generation_failed", expect.anything());
    expect(mocks.finalize).not.toHaveBeenCalled(); expect(mocks.generate).toHaveBeenCalledOnce(); expect(JSON.stringify(out)).not.toContain("PRIVATE");
  });

  it("recovers the authoritative success after a lost finalize response", async () => {
    mocks.finalize.mockRejectedValueOnce(new Error("Commit acknowledgement lost"));
    mocks.refund.mockResolvedValueOnce({ status: "completed", row: saved });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { id: "saved" } });
    expect(mocks.refund).toHaveBeenCalledWith(expect.anything(), "user", "reading", "server-token", "save_failed", expect.anything());
    expect(mocks.generate).toHaveBeenCalledOnce();
  });

  it("never automatically refunds a quarantined result conflict", async () => {
    mocks.finalize.mockResolvedValueOnce({ status: "reconciliation_required" });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: "reconciliation_required", retryable: false });
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("keeps uncertain reservation pending without calling provider or compensating", async () => {
    mocks.reserve.mockRejectedValueOnce(new Error("DB commit unknown"));
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: "recovery_pending", retryable: false });
    expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("confirms refund acknowledgement loss from durable state without repeating refund", async () => {
    mocks.generate.mockRejectedValueOnce(new Error("Provider failed")); mocks.refund.mockRejectedValueOnce(new Error("Unknown refund commit"));
    mocks.state.mockResolvedValueOnce({ status: "available" }).mockResolvedValueOnce({ status: "refunded" });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: "refunded", retryable: true }); expect(mocks.refund).toHaveBeenCalledOnce();
  });

  it("does not claim a refund when DB status remains unknown", async () => {
    mocks.generate.mockRejectedValueOnce(new Error("Provider failed")); mocks.refund.mockRejectedValueOnce(new Error("DB unavailable"));
    mocks.state.mockResolvedValueOnce({ status: "available" }).mockRejectedValueOnce(new Error("DB unavailable"));
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: "recovery_pending", retryable: false });
  });

  it.each(["expired", "reading_missing"])("uses guarded settlement for %s result", async status => {
    mocks.finalize.mockResolvedValueOnce({ status });
    await unlockAiInterpretationAction("reading");
    expect(mocks.refund).toHaveBeenCalledWith(expect.anything(), "user", "reading", "server-token", status === "expired" ? "expired" : "save_failed", expect.anything());
  });

  it.each(["cache", "display", "reporter"])("does not refund committed data after %s failure", async point => {
    if (point === "cache") mocks.revalidate.mockImplementationOnce(() => { throw new Error("Cache"); });
    if (point === "display") mocks.display.mockImplementationOnce(() => { throw new Error("Adapter"); });
    if (point === "reporter") { mocks.resolve.mockResolvedValueOnce({ id: "unpriced", provider: "gemini" }); mocks.issue.mockImplementationOnce(() => { throw new Error("Report"); }); }
    const out = await unlockAiInterpretationAction("reading");
    if (point === "display") expect(out).toMatchObject({ ok: false, code: "completed_unavailable", retryable: false }); else expect(out.ok).toBe(true);
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("reporting cannot prevent guarded compensation", async () => {
    mocks.generate.mockRejectedValueOnce(new Error("PRIVATE provider payload")); mocks.report.mockImplementation(() => { throw new Error("Sentry failed"); });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ code: "refunded" });
    expect(String(mocks.report.mock.calls[0][0])).not.toContain("PRIVATE");
  });
});

describe("ownership, safety and preflight", () => {
  it.each(["Tôi đang định tự làm hại mình ngay hôm nay.", "Tôi thấy không còn đường nào và ước mình biến mất."])("preserves support before any financial lookup: %s", async question => {
    mocks.reading.mockResolvedValueOnce({ id: "reading", question }); expect(await unlockAiInterpretationAction("reading")).toEqual({ ok: false, support: true });
    expect(mocks.state).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("does not return somebody else's reading or financial state", async () => {
    mocks.reading.mockResolvedValueOnce(null); expect(await unlockAiInterpretationAction("foreign")).toMatchObject({ ok: false });
    expect(mocks.reading).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign", userId: "user" } })); expect(mocks.state).not.toHaveBeenCalled();
  });
  it("keeps legacy cached results readable without validation or charge", async () => {
    mocks.reading.mockResolvedValueOnce({ question: "Cũ", aiInterpretation: { ...saved, summary: null, themes: null, perCard: [], actionSuggestionsList: null, actionSuggestions: "Legacy action" } });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { actionSuggestions: ["Legacy action"] } });
    expect(mocks.state).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it.each(["id", "count", "order", "orientation", "question"])("rejects invalid stored %s before reservation", async kind => {
    const reading = await mocks.reading();
    if (kind === "id") reading.cards[0].cardId = "PRIVATE"; if (kind === "count") reading.cards.pop(); if (kind === "order") reading.cards.reverse(); if (kind === "orientation") reading.cards[0].orientation = "SIDEWAYS"; if (kind === "question") reading.question = " ";
    expect((await unlockAiInterpretationAction("reading")).ok).toBe(false); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it.each(["unauthenticated", "rate", "model", "missing_key"])("does not reserve on %s failure", async point => {
    if (point === "unauthenticated") mocks.auth.mockResolvedValueOnce(null); if (point === "rate") mocks.rate.mockResolvedValueOnce(false); if (point === "model") mocks.resolve.mockRejectedValueOnce(new Error("Settings")); if (point === "missing_key") mocks.missing.mockReturnValueOnce(["GEMINI_API_KEY"]);
    expect((await unlockAiInterpretationAction("reading")).ok).toBe(false); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("keeps the support guard ahead of cached data on the status endpoint", async () => {
    mocks.reading.mockResolvedValueOnce({ id: "reading", question: "Tôi đang định tự làm hại mình ngay hôm nay." });
    mocks.state.mockResolvedValueOnce({ status: "completed", row: saved });
    expect(await getUnlockStatusAction("reading")).toEqual({ ok: false, support: true });
    expect(mocks.state).not.toHaveBeenCalled();
  });
  it("returns financial status without starting another model request", async () => {
    mocks.state.mockResolvedValueOnce({ status: "processing" }); expect(await getUnlockStatusAction("reading")).toMatchObject({ code: "processing", retryable: false });
    expect(mocks.state).toHaveBeenCalledWith(expect.anything(), "user", "reading", expect.anything()); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
});

afterEach(() => vi.useRealTimers());
describe("end-to-end unlock budget", () => {
  it("does not wait forever for authentication or start financial work after timeout", async () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    let release!: (value: { user: { id: string } }) => void;
    mocks.auth.mockImplementationOnce(() => new Promise(r => { release = r; }));
    const promise = unlockAiInterpretationAction("reading");
    await vi.advanceTimersByTimeAsync(55_000);
    expect(await promise).toMatchObject({ ok: false, code: "recovery_pending", retryable: false });
    release({ user: { id: "user" } }); await vi.advanceTimersByTimeAsync(0);
    expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("subtracts slow preflight time from the provider allowance", async () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    mocks.resolve.mockImplementationOnce(async () => { await new Promise(r => setTimeout(r, 20_000)); return { id: "gemini-3.8-flash", provider: "gemini" }; });
    const promise = unlockAiInterpretationAction("reading"); await vi.advanceTimersByTimeAsync(20_000);
    expect((await promise).ok).toBe(true);
    expect(mocks.generate.mock.calls[0][4]).toEqual({ timeoutMs: 25_000 });
  });
  it("does not reserve when preflight leaves only settlement time", async () => {
    vi.useFakeTimers({ toFake: ["performance", "setTimeout", "clearTimeout"] });
    mocks.resolve.mockImplementationOnce(async () => { await new Promise(r => setTimeout(r, 46_000)); return { id: "gemini-3.8-flash", provider: "gemini" }; });
    const promise = unlockAiInterpretationAction("reading"); await vi.advanceTimersByTimeAsync(46_000); expect((await promise).ok).toBe(false);
    expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("does not immediately debit again after owned recovery confirms a refund", async () => {
    mocks.recover.mockResolvedValueOnce({ state: { status: "refunded" }, recovered: true });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ code: "refunded", retryable: true });
    expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.resolve).not.toHaveBeenCalled();
  });
});

it("returns persisted fields rather than raw provider data, preserving model/version on the saved row", async () => {
  mocks.finalize.mockResolvedValueOnce({ status: "completed", row: { ...saved, overview: "Persisted overview", actionSuggestions: "Legacy joined", actionSuggestionsList: null } });
  const out = await unlockAiInterpretationAction("reading");
  expect(out).toMatchObject({ ok: true, data: { id: "saved", overview: "Persisted overview", actionSuggestions: ["Legacy joined"] } });
  expect(mocks.display).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06" }), undefined);
});
it("explicitly permits retry only for a confirmed pre-debit model preparation failure", async () => {
  mocks.resolve.mockRejectedValueOnce(new Error("Settings unavailable"));
  expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false, code: "preflight_failed", retryable: true });
  expect(mocks.reserve).not.toHaveBeenCalled();
});

it("distinguishes generated content from confirmed persistence using the same attempt identity", async () => {
  await unlockAiInterpretationAction("reading");
  expect(mocks.event.mock.calls.map(call => call[0].event)).toEqual(["reserved", "generated", "persisted"]);
  for (const [event] of mocks.event.mock.calls) expect(event).toMatchObject({ operationId: "operation", attemptToken: "server-token", readingId: "reading", userId: "user", model: "gemini-3.8-flash", promptVersion: "v7-2026-10-06" });
});
it("never labels generated content as persisted when save fails and refund is confirmed", async () => {
  mocks.finalize.mockRejectedValueOnce(new Error("PRIVATE DB payload"));
  await unlockAiInterpretationAction("reading");
  expect(mocks.event.mock.calls.map(call => call[0].event)).toEqual(["reserved", "generated", "refunded"]);
  expect(JSON.stringify(mocks.event.mock.calls)).not.toContain("PRIVATE");
});
it("does not attribute a reread of a newer attempt to the caller token after unknown settlement", async () => {
  mocks.generate.mockRejectedValueOnce(new Error("Provider")); mocks.refund.mockRejectedValueOnce(new Error("Unknown acknowledgement"));
  mocks.state.mockResolvedValueOnce({ status: "available" }).mockResolvedValueOnce({ status: "completed", row: { ...saved, id: "new-attempt-result" } });
  expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { id: "new-attempt-result" } });
  expect(mocks.event.mock.calls.map(call => call[0].event)).toEqual(["reserved", "recovery_pending"]);
  expect(mocks.event.mock.calls[1][0]).toMatchObject({ attemptToken: "server-token", stage: "settlement_unconfirmed" });
});
