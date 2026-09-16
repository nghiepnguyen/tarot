import type { ReactNode } from "react";
import { LeafSprig } from "@/components/ui/Botanical";

// The back face is drawn in three places — the preview fan, the pickable
// grid and the shuffle — and they have to stay pixel-identical, otherwise
// the card visibly changes skin as the flow moves between them.
export function CardFace({ children }: { children?: ReactNode }) {
  return (
    <div className="relative m-1.5 flex h-[calc(100%-0.75rem)] items-start justify-center overflow-hidden rounded-md border border-accent-foreground/20 pt-1">
      <LeafSprig className="absolute inset-0 m-auto h-2/3 w-2/3 text-accent-foreground/25" />
      {children}
    </div>
  );
}

// The face plus its own shell, for the places that aren't putting the
// face inside an interactive element of their own.
export function CardBack() {
  return (
    <div className="h-full w-full rounded-lg border border-accent bg-accent">
      <CardFace />
    </div>
  );
}
