import type { CreditStatus, UnlockResult } from "@/app/actions/ai";
declare global {
  interface Window {
    unlockFixture: { statuses: Array<UnlockResult | "throw">; unlocks: Array<UnlockResult | "throw">; credits: number; statusCalls: number; unlockCalls: number; creditCalls: number; initial?: boolean; afterStatusCredits?: number };
  }
}
export const savedFixture = { id: "saved-row", overview: "Bài đã lưu", perCard: [], connections: "Liên hệ", actionSuggestions: ["Hành động cũ"], reflectiveQuestion: "Câu hỏi?" };
export async function getCreditStatusAction(): Promise<CreditStatus> { window.unlockFixture.creditCalls++; return { credits: window.unlockFixture.credits, hasPurchased: true }; }
async function take(values: Array<UnlockResult | "throw">): Promise<UnlockResult> {
  const result = values.length > 1 ? values.shift()! : values[0];
  if (result === "throw") throw new Error("Synthetic transport failure");
  return result ?? { ok: false, code: "available", retryable: true, error: "Chưa mở khóa" };
}
export async function getUnlockStatusAction(): Promise<UnlockResult> { window.unlockFixture.statusCalls++; if (window.unlockFixture.afterStatusCredits !== undefined) { await new Promise(resolve => setTimeout(resolve, 50)); window.unlockFixture.credits = window.unlockFixture.afterStatusCredits; } return take(window.unlockFixture.statuses); }
export async function unlockAiInterpretationAction(): Promise<UnlockResult> { window.unlockFixture.unlockCalls++; return take(window.unlockFixture.unlocks); }
