import type { ReactNode } from "react";

// Sixteen rays around the medallion, every other one longer, so the sun
// reads as engraved rather than a flat ring of ticks.
const RAYS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const inner = 29;
  const outer = i % 2 === 0 ? 40 : 35;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    x1: round(50 + inner * Math.sin(angle)),
    y1: round(50 - inner * Math.cos(angle)),
    x2: round(50 + outer * Math.sin(angle)),
    y2: round(50 - outer * Math.cos(angle)),
  };
});

function Medallion() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      className="absolute inset-0 m-auto w-[84%] text-accent-foreground/70"
    >
      {/* Solid disc so the lattice stops at the medallion's edge. */}
      <circle cx="50" cy="50" r="46" strokeWidth="1.4" className="fill-accent" />
      <circle cx="50" cy="50" r="42.5" strokeWidth="0.9" strokeDasharray="0.1 3.2" />
      {RAYS.map((r, i) => (
        <line key={i} {...r} strokeWidth={i % 2 === 0 ? 1.3 : 0.9} />
      ))}
      <circle cx="50" cy="50" r="25" strokeWidth="1.1" />
      <path
        d="M56 35.2A16 16 0 1 0 56 64.8A15 15 0 0 1 56 35.2Z"
        strokeWidth="0.9"
        className="fill-earth"
      />
      <path d="M62 44.5l.9 4.6 4.6.9-4.6.9-.9 4.6-.9-4.6-4.6-.9 4.6-.9z" fill="currentColor" stroke="none" />
      <circle cx="68" cy="38" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="67" cy="62" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A quarter-arc and a bead, drawn once for the top-left and rotated into
// the other three corners.
function Corner({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden="true"
      className={`absolute h-3.5 w-3.5 text-accent-foreground/55 ${className}`}
    >
      <path d="M2 12V6a4 4 0 0 1 4-4h6" />
      <path d="M5 9.5V7.5a2.5 2.5 0 0 1 2.5-2.5h2" strokeWidth="0.7" />
      <circle cx="12.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Line — diamond — line, above and below the medallion.
function Flourish({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={`absolute inset-x-0 mx-auto w-1/2 text-accent-foreground/50 ${className}`}
    >
      <path d="M2 4h13M25 4h13" />
      <path d="M20 1l3 3-3 3-3-3z" fill="currentColor" />
      <circle cx="10" cy="4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="30" cy="4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The back face is drawn in three places — the preview fan, the pickable
// grid and the shuffle — and they have to stay pixel-identical, otherwise
// the card visibly changes skin as the flow moves between them.
export function CardFace({ children }: { children?: ReactNode }) {
  return (
    <div className="card-lattice relative m-1.5 flex h-[calc(100%-0.75rem)] items-start justify-center overflow-hidden rounded-md border border-accent-foreground/30 pt-1">
      {/* Second hairline just inside the first: a double rule, like a
          printed deck's frame. */}
      <div aria-hidden className="absolute inset-[3px] rounded-[3px] border border-accent-foreground/15" />
      <Corner className="left-1 top-1" />
      <Corner className="right-1 top-1 rotate-90" />
      <Corner className="bottom-1 right-1 rotate-180" />
      <Corner className="bottom-1 left-1 -rotate-90" />
      <Flourish className="top-[11%]" />
      <Flourish className="bottom-[11%]" />
      <Medallion />
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}

// The face plus its own shell, for the places that aren't putting the
// face inside an interactive element of their own.
export function CardBack() {
  return (
    <div className="h-full w-full rounded-lg border border-accent bg-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
      <CardFace />
    </div>
  );
}
