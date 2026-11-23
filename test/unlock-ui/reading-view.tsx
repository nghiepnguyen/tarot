import type { SaveState } from "@/components/tarot/TarotExperience";
export function ReadingView({ readingId, saveState, onRetrySave, onReset }: { readingId: string | null; saveState: SaveState; onRetrySave: () => void; onReset: () => void }) {
  return <div><p>{readingId ? `Saved: ${readingId}` : saveState.status}</p><button onClick={onRetrySave}>Retry save</button><button onClick={onReset}>Reset reading</button></div>;
}
