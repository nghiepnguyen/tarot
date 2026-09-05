"use client";

import { useEffect, useRef } from "react";
import { LeafSprig } from "@/components/ui/Botanical";

interface ArcDeckProps {
  size: number;
  interactive?: boolean;
  selectedSlots?: number[];
  onSelectSlot?: (index: number) => void;
  enlarged?: boolean;
}

export function ArcDeck({
  size,
  interactive = false,
  selectedSlots = [],
  onSelectSlot,
  enlarged = false,
}: ArcDeckProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // With many cards the arc is wider than the viewport, so start the
  // scroll centred on the curve's vertex — otherwise the default view
  // lands at the far edge, where the fan is steeply tilted, and reads
  // as a diagonal ramp instead of the intended arc.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [size, enlarged]);

  const cardWidth = enlarged ? 84 : 68;
  const cardHeight = enlarged ? 132 : 106;
  // Target arc height (sagitta), not a fixed spread angle: with a large
  // deck (78 cards) a spread angle tuned for a small preview deck (16
  // cards) blows up the radius and makes the arc absurdly tall. Deriving
  // the angle from a fixed target height keeps the shape sane at any
  // card count instead of only the one size it happened to be tuned for.
  const targetSagitta = enlarged ? 190 : 115;

  // Keep overlap local to immediate neighbors: chord between adjacent
  // card centers must stay proportional to card width regardless of
  // card count, otherwise a distant card's rotated bounding box can
  // swing over and intercept clicks meant for a non-adjacent card.
  // The chord also sets the width of each card's exposed (unoccluded)
  // strip in this fan, so keep it wide enough to comfortably tap.
  const minChord = cardWidth * 0.55;

  // Small-angle approximation of sagitta = radius * (1 - cos(halfSpread))
  // solved for spreadRad, given radius ≈ minChord * (size - 1) / spreadRad.
  const spreadRad =
    size > 1 ? Math.min((8 * targetSagitta) / (minChord * (size - 1)), Math.PI * 0.9) : 0;
  const spreadDeg = (spreadRad * 180) / Math.PI;
  const stepRad = size > 1 ? spreadRad / (size - 1) : 0;
  const radius = stepRad > 0 ? minChord / (2 * Math.sin(stepRad / 2)) : 0;

  const halfSpreadRad = (spreadDeg / 2 * Math.PI) / 180;
  const maxX = radius * Math.sin(halfSpreadRad);
  const maxY = radius * (1 - Math.cos(halfSpreadRad));
  const containerWidth = 2 * maxX + cardWidth + 24;
  const containerHeight = maxY + cardHeight + 24;

  const slots = Array.from({ length: size });

  // Round before handing values to inline styles: sin/cos can differ by
  // a ULP between the server's and the browser's math libraries, and
  // React's hydration check compares the serialized style strings
  // exactly, so an unrounded float here causes a hydration mismatch.
  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <div ref={scrollRef} className="w-full overflow-x-auto overflow-y-visible px-6 py-4">
      <div
        className="relative mx-auto"
        style={{ width: round(containerWidth), height: round(containerHeight) }}
      >
        {slots.map((_, i) => {
          const angleDeg = size > 1 ? (i / (size - 1) - 0.5) * spreadDeg : 0;
          const angleRad = (angleDeg * Math.PI) / 180;
          const x = radius * Math.sin(angleRad);
          const y = radius * (1 - Math.cos(angleRad));
          const order = selectedSlots.indexOf(i);
          const isSelected = order !== -1;

          return (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: round(containerWidth / 2 + x - cardWidth / 2),
                top: round(y + 12),
                width: cardWidth,
                height: cardHeight,
                transform: `rotate(${round(angleDeg)}deg)`,
                zIndex: isSelected ? 1000 + order : i,
              }}
            >
              <button
                type="button"
                disabled={!interactive || (!isSelected && selectedSlots.length >= 3)}
                onClick={() => onSelectSlot?.(i)}
                aria-label={
                  isSelected ? `Lá đã chọn, vị trí ${order + 1}` : `Chọn lá thứ ${i + 1}`
                }
                aria-pressed={isSelected}
                className={`h-full w-full rounded-lg border bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default ${
                  interactive ? "cursor-pointer hover:-translate-y-2" : ""
                } ${isSelected ? "-translate-y-4 border-foreground" : "border-accent"}`}
              >
                <div className="relative m-1.5 flex h-[calc(100%-0.75rem)] items-start justify-center overflow-hidden rounded-md border border-accent-foreground/20 pt-1">
                  <LeafSprig className="absolute inset-0 m-auto h-2/3 w-2/3 text-accent-foreground/25" />
                  {isSelected ? (
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-accent-foreground text-[11px] font-semibold text-accent">
                      {order + 1}
                    </span>
                  ) : null}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
