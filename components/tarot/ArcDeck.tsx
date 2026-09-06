"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Breaking out of Section's centered max-width column with a CSS
  // `left: 50%; transform: translateX(-50%)` trick doesn't work here:
  // that `left` percentage resolves against Section's own content box,
  // not the viewport, so it only partially cancels out — the deck
  // overshoots off-screen on the left and falls short on the right by
  // the same amount. Measuring the wrapper's actual position and using
  // an explicit negative margin + pixel width sidesteps that entirely,
  // and also sidesteps 100vw counting the scrollbar's width on desktop.
  // The parent flex column also uses `items-center`, which re-centers
  // an over-width child's margin box on top of any margin we set — the
  // wrapper needs `self-start` so our own offset is the only one applied.
  const [breakout, setBreakout] = useState<{ marginLeft: number; width: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const parent = wrapRef.current?.parentElement;
      if (!parent) return;
      const left = parent.getBoundingClientRect().left;
      setBreakout({ marginLeft: -left, width: document.documentElement.clientWidth });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // The arc is routinely wider than its container (78 cards, especially),
  // so it can't be centered with `margin: auto` — that degrades to 0
  // (flush start) once the child no longer fits. Instead it stays in
  // normal flow (reachable end-to-end by scrolling, even though the
  // "hidden" preview variant has no visible scrollbar) and centers by
  // setting the initial scroll offset instead of the box's own position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [size, enlarged, breakout]);

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
    <div
      ref={wrapRef}
      className="w-full self-start py-4"
      style={breakout ? { marginLeft: breakout.marginLeft, width: breakout.width } : undefined}
    >
      <div
        ref={scrollRef}
        className={`overflow-y-visible ${interactive ? "overflow-x-auto" : "overflow-x-hidden"}`}
      >
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

            // Fan the cards out from the deck's center rather than just
            // fading them in place: a staggered scale + rotate entrance
            // reads as the deck actually being spread, not a static swap.
            // The stagger is spread across a fixed total window regardless
            // of card count, so a 78-card deck doesn't take forever to
            // finish fanning out.
            const entranceDelay = prefersReducedMotion
              ? 0
              : (i / Math.max(size - 1, 1)) * 0.4;

            return (
              <motion.div
                key={i}
                className="absolute top-0"
                style={{
                  left: round(containerWidth / 2 + x - cardWidth / 2),
                  top: round(y + 12),
                  width: cardWidth,
                  height: cardHeight,
                  zIndex: isSelected ? 1000 + order : i,
                }}
                initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: round(angleDeg) }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: entranceDelay,
                  ease: "easeOut",
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
