import { beforeEach, describe, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { InterpretationValidationError } from "./quality";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rate: vi.fn(), resolve: vi.fn(), generate: vi.fn(), reading: vi.fn(), spend: vi.fn(), balance: vi.fn(), refund: vi.fn(), ledger: vi.fn(), save: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("@/lib/ai/settings", () => ({ resolveAiModelForUnlock: mocks.resolve }));
vi.mock("@/lib/ai/metrics", () => ({ generateMeasuredInterpretation: mocks.generate }));
vi.mock("@/lib/monitoring/report", () => ({ reportHandledError: vi.fn(), reportHandledIssue: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { reading: { findFirst: mocks.reading }, user: { updateMany: mocks.spend, findUniqueOrThrow: mocks.balance, update: mocks.refund }, creditTransaction: { create: mocks.ledger }, aiInterpretation: { create: mocks.save } } }));
import { unlockAiInterpretationAction } from "@/app/actions/ai";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "user" } });
  mocks.rate.mockResolvedValue(true);
  mocks.resolve.mockResolvedValue({ id: "gemini-3.8-flash", provider: "gemini" });
  mocks.reading.mockResolvedValue({ id: "reading", question: "Câu hỏi?", cards: SPREAD_POSITIONS.map((position, index) => ({ position, cardId: TAROT_CARDS[index].id, orientation: "upright" })), aiInterpretation: null });
  mocks.spend.mockResolvedValue({ count: 1 });
  mocks.balance.mockResolvedValue({ credits: 10 });
  mocks.refund.mockResolvedValue({ credits: 20 });
});
describe("unlock compatibility and refunds", () => {
  it.each(["invalid_json", "invalid_schema", "position_mismatch"] as const)("refunds a %s failure without saving output", async (code) => {
    mocks.generate.mockRejectedValue(new InterpretationValidationError(code));
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: false });
    expect(mocks.refund).toHaveBeenCalledWith({ where: { id: "user" }, data: { credits: { increment: 10 } } });
    expect(mocks.ledger.mock.calls.map(([arg]) => arg.data.type)).toEqual(["UNLOCK_SPEND", "REFUND"]);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("returns a legacy saved interpretation without validating it again or spending credits", async () => {
    mocks.reading.mockResolvedValue({ aiInterpretation: { id: "legacy", model: "gemini-3-flash-preview", summary: null, overview: "Bản cũ", themes: null, perCard: [{ position: "Bối cảnh", text: "Cũ" }], connections: "Liên hệ", actionSuggestions: "Gợi ý cũ", actionSuggestionsList: null, reflectiveQuestion: "Câu hỏi?", closingNote: null } });
    expect(await unlockAiInterpretationAction("reading")).toMatchObject({ ok: true, data: { overview: "Bản cũ", actionSuggestions: ["Gợi ý cũ"] } });
    expect(mocks.spend).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
