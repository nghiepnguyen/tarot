export function ArcDeck({ onSelectSlot }: { onSelectSlot?: (index: number) => void }) {
  return <div>{[0, 1, 2].map(i => <button key={i} onClick={() => onSelectSlot?.(i)}>Pick {i}</button>)}</div>;
}
