import type { SaveReadingResult, StoredCard } from "@/app/actions/readings";
declare global { interface Window { saveFixture: { fail: boolean; calls: string[]; hold?: boolean; release?: () => void } } }
export async function saveReadingAction(_question: string, _cards: StoredCard[], requestId: string): Promise<SaveReadingResult> {
  window.saveFixture.calls.push(requestId);
  if (window.saveFixture.hold) await new Promise<void>(resolve => { window.saveFixture.release = resolve; });
  if (window.saveFixture.fail) throw new Error("Synthetic save response loss");
  return { ok: true, id: requestId };
}
