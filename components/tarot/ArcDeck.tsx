"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CardBack } from "@/components/tarot/CardBack";
import { CardWheel } from "@/components/tarot/CardWheel";
import { useBreakout } from "@/components/tarot/useBreakout";

interface ArcDeckProps {
  size: number;
  interactive?: boolean;
  selectedSlots?: number[];
  onSelectSlot?: (index: number) => void;
  enlarged?: boolean;
}

export function ArcDeck(props: ArcDeckProps) {
  return props.interactive ? <CardWheel {...props} /> : <CardFan {...props} />;
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
                <CardBack />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
