import { beforeEach, expect, it, vi } from "vitest";
import { TAROT_CARDS } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rate: vi.fn(), create: vi.fn(), find: vi.fn(), cache: vi.fn(), report: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { reading: { create: mocks.create, findUnique: mocks.find } } }));
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.cache }));
vi.mock("@/lib/monitoring/report", () => ({ reportHandledError: mocks.report }));
import { saveReadingAction } from "@/app/actions/readings";
const id = "e0e8bd42-8d19-48ea-bddc-668f31292ac1";
const cards = SPREAD_POSITIONS.map((position, i) => ({ cardId: TAROT_CARDS[i].id, position, orientation: "upright" as const }));
const row = { id, userId: "user", question: "Câu hỏi?", cards };
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "user" } }); mocks.rate.mockResolvedValue(true); mocks.find.mockResolvedValue(null); mocks.create.mockResolvedValue(row); });
it("does not turn a committed save into failure when cache/reporting throws", async () => {
  mocks.cache.mockImplementation(() => { throw new Error("Cache failure"); }); mocks.report.mockImplementation(() => { throw new Error("Reporter"); });
  expect(await saveReadingAction(row.question, cards, id)).toEqual({ ok: true, id });
});
it("replays the same save operation before rate limit without creating another reading", async () => {
  mocks.find.mockResolvedValue(row); mocks.rate.mockResolvedValue(false);
  expect(await saveReadingAction(row.question, cards, id)).toEqual({ ok: true, id });
  expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.rate).not.toHaveBeenCalled();
});
it.each([{ ...row, userId: "other" }, { ...row, question: "Another question" }, { ...row, cards: [...cards].reverse() }])("rejects a reused ID with another owner/payload", async existing => {
  mocks.find.mockResolvedValue(existing);
  expect(await saveReadingAction(row.question, cards, id)).toEqual({ ok: false, reason: "invalid" }); expect(mocks.create).not.toHaveBeenCalled();
});
it("uses the operation ID for a new reading", async () => {
  expect(await saveReadingAction(row.question, cards, id)).toEqual({ ok: true, id });
  expect(mocks.create).toHaveBeenCalledWith({ data: row });
});
it("resolves a concurrent duplicate from the owned committed row", async () => {
  mocks.create.mockRejectedValueOnce(new Error("Commit acknowledgement lost")); mocks.find.mockResolvedValueOnce(null).mockResolvedValueOnce(row);
  expect(await saveReadingAction(row.question, cards, id)).toEqual({ ok: true, id });
});
it("preserves an unknown write failure when no committed row is confirmed", async () => {
  mocks.create.mockRejectedValueOnce(new Error("DB unavailable"));
  await expect(saveReadingAction(row.question, cards, id)).rejects.toThrow("DB unavailable");
});
it("rejects invalid save IDs before touching persistence", async () => {
  expect(await saveReadingAction(row.question, cards, "invalid")).toEqual({ ok: false, reason: "invalid" }); expect(mocks.find).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
});
