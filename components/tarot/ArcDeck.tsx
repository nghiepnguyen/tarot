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

export function ArcDeck(props: ArcDeckProps) {
  return props.interactive ? <CardCarousel {...props} /> : <CardFan {...props} />;
}

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
function useBreakout(ref: React.RefObject<HTMLDivElement | null>) {
  const [breakout, setBreakout] = useState<{ marginLeft: number; width: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const left = parent.getBoundingClientRect().left;
      setBreakout({ marginLeft: -left, width: document.documentElement.clientWidth });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return breakout;
}

const CARD_GAP = 4;
const CARD_RATIO = 1.57;
// Cards grow to fill whatever the gaps leave behind, so this only steers
// how many fit per row, not their final size.
const TARGET_CARD_WIDTH = { compact: 72, wide: 100 };
const PAGE_GAP = 8;
const PAGE_PAD = 16;
// Leave a sliver of the next page's first card visible so it reads as
// "more cards this way". Cards are spread across the page's full width
// rather than centered in it, so this sliver lands on a card instead of
// on slack left over by centering.
const PAGE_PEEK = 40;
// A scroller can't keep one axis visible while the other scrolls, so the
// lane clips the lift on a picked card unless it reserves room for it.
const SELECTED_LIFT = 8;
const ROWS = 3;

// Fanning the whole 78-card deck into one arc made the spread ~3600px
// wide on every screen, so picking a card near either end meant dragging
// across ten phone-widths. A paged grid keeps the same deck reachable in
// a handful of swipes, each one snapping to a full page of cards.
function CardCarousel({
  size,
  selectedSlots = [],
  onSelectSlot,
}: ArcDeckProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const breakout = useBreakout(wrapRef);
  const [activePage, setActivePage] = useState(0);

  const laneWidth = breakout?.width ?? null;
  const compact = laneWidth !== null && laneWidth < 640;
  const targetCardWidth = compact ? TARGET_CARD_WIDTH.compact : TARGET_CARD_WIDTH.wide;

  const pageWidth = laneWidth !== null ? laneWidth - PAGE_PEEK : null;
  const rowWidth = pageWidth !== null ? pageWidth - 2 * PAGE_PAD : null;
  const cols =
    rowWidth !== null
      ? Math.max(Math.floor((rowWidth + CARD_GAP) / (targetCardWidth + CARD_GAP)), 1)
      : 4;
  const cardWidth =
    rowWidth !== null
      ? Math.floor((rowWidth - (cols - 1) * CARD_GAP) / cols)
      : targetCardWidth;
  const cardHeight = Math.round(cardWidth * CARD_RATIO);
  const perPage = cols * ROWS;

  const pages: number[][] = [];
  for (let i = 0; i < size; i += perPage) {
    pages.push(Array.from({ length: Math.min(perPage, size - i) }, (_, j) => i + j));
  }

  return (
    <div
      ref={wrapRef}
      className="w-full self-start py-1"
      style={breakout ? { marginLeft: breakout.marginLeft, width: breakout.width } : undefined}
    >
      {/* Trailing pad equal to the peek: without it the scroll maxes out
          with the last page shifted left by the peek width, so it never
          rests flush the way every other page does. */}
      <div
        ref={laneRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        style={{ gap: PAGE_GAP, paddingRight: PAGE_PEEK, paddingTop: SELECTED_LIFT }}
        onScroll={(e) => {
          if (pageWidth === null) return;
          setActivePage(Math.round(e.currentTarget.scrollLeft / (pageWidth + PAGE_GAP)));
        }}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="shrink-0 snap-start"
            style={{
              width: pageWidth ?? "100%",
              paddingLeft: PAGE_PAD,
              paddingRight: PAGE_PAD,
            }}
          >
            <div
              className="grid justify-between"
              style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`, rowGap: CARD_GAP }}
            >
              {page.map((i) => {
                const order = selectedSlots.indexOf(i);
                const isSelected = order !== -1;

                return (
                  <motion.div
                    key={i}
                    style={{ width: cardWidth, height: cardHeight }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      // Stagger only within a page: a delay scaled across all
                      // 78 cards would leave later pages blank for seconds.
                      delay: prefersReducedMotion ? 0 : (i % perPage) * 0.015,
                      ease: "easeOut",
                    }}
                  >
                    <button
                      type="button"
                      disabled={!isSelected && selectedSlots.length >= 3}
                      onClick={() => onSelectSlot?.(i)}
                      aria-label={
                        isSelected ? `Lá đã chọn, vị trí ${order + 1}` : `Chọn lá thứ ${i + 1}`
                      }
                      aria-pressed={isSelected}
                      className={`h-full w-full cursor-pointer rounded-lg border bg-accent transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default ${
                        isSelected ? "-translate-y-2 border-foreground" : "border-accent"
                      }`}
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
        ))}
      </div>

      {pages.length > 1 ? (
        <div className="mt-1 flex items-center justify-center">
          {pages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              aria-label={`Tới trang ${pageIndex + 1}`}
              aria-current={pageIndex === activePage}
              onClick={() => {
                if (pageWidth === null) return;
                laneRef.current?.scrollTo({
                  left: pageIndex * (pageWidth + PAGE_GAP),
                  behavior: prefersReducedMotion ? "auto" : "smooth",
                });
              }}
              // The dot stays small; the button around it carries a finger-sized
              // hit area, so the pager is tappable without looking heavy.
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  pageIndex === activePage ? "bg-foreground" : "bg-accent"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CardFan({ size, enlarged = false }: ArcDeckProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const breakout = useBreakout(wrapRef);

  // The arc can be wider than its container, so it can't be centered with
  // `margin: auto` — that degrades to 0 (flush start) once the child no
  // longer fits. Instead it stays in normal flow and centers by setting
  // the initial scroll offset rather than the box's own position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [size, enlarged, breakout]);

  const cardWidth = enlarged ? 84 : 68;
  const cardHeight = enlarged ? 132 : 106;
  // Target arc height (sagitta), not a fixed spread angle: with a large
  // deck a spread angle tuned for a small preview deck blows up the
  // radius and makes the arc absurdly tall. Deriving the angle from a
  // fixed target height keeps the shape sane at any card count.
  const targetSagitta = enlarged ? 190 : 115;

  // Keep overlap local to immediate neighbors: chord between adjacent
  // card centers must stay proportional to card width regardless of
  // card count, otherwise a distant card's rotated bounding box can
  // swing over and intercept clicks meant for a non-adjacent card.
  const minChord = cardWidth * 0.55;

  // Small-angle approximation of sagitta = radius * (1 - cos(halfSpread))
  // solved for spreadRad, given radius ≈ minChord * (size - 1) / spreadRad.
  const spreadRad =
    size > 1 ? Math.min((8 * targetSagitta) / (minChord * (size - 1)), Math.PI * 0.9) : 0;
  const spreadDeg = (spreadRad * 180) / Math.PI;
  const stepRad = size > 1 ? spreadRad / (size - 1) : 0;
  const radius = stepRad > 0 ? minChord / (2 * Math.sin(stepRad / 2)) : 0;

  const halfSpreadRad = ((spreadDeg / 2) * Math.PI) / 180;
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
      <div ref={scrollRef} className="overflow-x-hidden overflow-y-visible">
        <div
          className="relative mx-auto"
          style={{ width: round(containerWidth), height: round(containerHeight) }}
        >
          {slots.map((_, i) => {
            const angleDeg = size > 1 ? (i / (size - 1) - 0.5) * spreadDeg : 0;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.sin(angleRad);
            const y = radius * (1 - Math.cos(angleRad));

            // Fan the cards out from the deck's center rather than just
            // fading them in place: a staggered scale + rotate entrance
            // reads as the deck actually being spread, not a static swap.
            const entranceDelay = prefersReducedMotion ? 0 : (i / Math.max(size - 1, 1)) * 0.4;

            return (
              <motion.div
                key={i}
                className="absolute top-0"
                style={{
                  left: round(containerWidth / 2 + x - cardWidth / 2),
                  top: round(y + 12),
                  width: cardWidth,
                  height: cardHeight,
                  zIndex: i,
                }}
                initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: round(angleDeg) }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: entranceDelay,
                  ease: "easeOut",
                }}
              >
                <div className="h-full w-full rounded-lg border border-accent bg-accent">
                  <div className="relative m-1.5 flex h-[calc(100%-0.75rem)] items-start justify-center overflow-hidden rounded-md border border-accent-foreground/20 pt-1">
                    <LeafSprig className="absolute inset-0 m-auto h-2/3 w-2/3 text-accent-foreground/25" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
