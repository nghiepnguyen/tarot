import { beforeEach, expect, it, vi } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { toDisplayInterpretation } from "../ai/interpretation";
import type { AiInterpretation } from "@prisma/client";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), count: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { reading: { findMany: mocks.find, count: mocks.count } } }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("Redirect login"); } }));
vi.mock("@/components/ui/Header", () => ({ Header: () => null }));
vi.mock("@/components/ui/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/tarot/HistoryList", () => ({ HistoryList: () => null }));
import HistoryPage from "@/app/history/page";
import { HistoryList } from "@/components/tarot/HistoryList";
function listProps(node: ReactNode): { readings: Array<{ id: string; aiInterpretation: unknown }> } | undefined {
  if (Array.isArray(node)) { for (const child of node) { const result = listProps(child); if (result) return result; } }
  if (!isValidElement<{ children?: ReactNode; readings: Array<{ id: string; aiInterpretation: unknown }> }>(node)) return;
  return node.type === HistoryList ? node.props : listProps(node.props.children);
}
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "owner" } }); mocks.count.mockResolvedValue(2); });
it("passes both persisted v7 and legacy data through the existing adapter without revalidation or mutation", async () => {
  const base = { id: "saved", model: "gemini-3.8-flash", overview: "Overview", perCard: [{ position: "Old position", text: "Legacy text" }], connections: "Links", reflectiveQuestion: "Question", actionSuggestions: "Legacy action", summary: null, themes: null, closingNote: null, actionSuggestionsList: null };
  const rows = [
    { id: "new", question: "New", cards: [], createdAt: new Date(), aiInterpretation: { ...base, promptVersion: "v7-2026-10-06", actionSuggestionsList: ["New action"], review: { accuracy: 4, clarity: 5, actionability: 3, comment: "Review" } } },
    { id: "old", question: "Old", cards: [], createdAt: new Date(), aiInterpretation: { ...base, promptVersion: "v0-legacy", review: null } },
  ];
  mocks.find.mockResolvedValue(rows); const before = JSON.stringify(rows);
  const props = listProps(await HistoryPage({ searchParams: Promise.resolve({}) }));
  expect(props?.readings.map(row => row.aiInterpretation)).toEqual(rows.map(row => toDisplayInterpretation(row.aiInterpretation as unknown as AiInterpretation, row.aiInterpretation.review)));
  expect(JSON.stringify(rows)).toBe(before);
  expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "owner" }, include: { aiInterpretation: { include: { review: true } } } }));
});
it("redirects guests before reading history", async () => {
  mocks.auth.mockResolvedValue(null);
  await expect(HistoryPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("Redirect login"); expect(mocks.find).not.toHaveBeenCalled();
});
