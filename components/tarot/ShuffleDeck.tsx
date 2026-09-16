"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CardBack } from "@/components/tarot/CardBack";
import { Button } from "@/components/ui/Button";

// Enough cards to read as a deck, few enough that nine simultaneous
// transforms stay cheap on a mid-range phone.
const STACK = 9;
const CARD_WIDTH = 84;
const CARD_HEIGHT = 132;
// Vertical sliver between stacked cards, so the pile has visible depth
// while it sits still.
const STACK_OFFSET = 2;
const SPLIT_X = 86;
const CUT_LIFT = 34;

export const SHUFFLE_DURATION = 2.88;
// Cards riffle with a small per-card stagger, so the last one lands a
// beat after the rest; wait for that before handing over the spread.
const TOTAL_MS = (SHUFFLE_DURATION + 0.12) * 1000;

// The deck splits in two and riffles back together twice, then the top
// half is cut off and dropped back on the bottom — all on transform and
// opacity only, so the whole sequence stays on the compositor. The
// second riffle is what fills the runtime: stretching a single pass
// over the same seconds would just make one shuffle look sluggish.
function cardKeyframes(index: number) {
  const isTopHalf = index >= Math.ceil(STACK / 2);
  const side = isTopHalf ? 1 : -1;
  const cut = isTopHalf ? 1 : 0;

  const riffle = {
    x: [side * SPLIT_X, side * SPLIT_X, side * 18, 0],
    y: [-10, -10, -4, 0],
    rotate: [side * 7, side * 7, side * 2, 0],
  };

  return {
    x: [0, ...riffle.x, ...riffle.x, cut * 30, cut * 6, 0],
    y: [0, ...riffle.y, ...riffle.y, -cut * CUT_LIFT, -cut * 12, 0],
    rotate: [0, ...riffle.rotate, ...riffle.rotate, cut * 4, cut * 1, 0],
  };
}

// Two riffles (4 beats each) then the cut, spaced so every beat keeps
// the tempo the single-pass version had.
const KEYFRAME_TIMES = [
  0,
  0.09, 0.18, 0.27, 0.35,
  0.44, 0.53, 0.62, 0.7,
  0.8, 0.9, 1,
];

interface ShuffleDeckProps {
  question: string;
  onDone: () => void;
  onSkip: () => void;
}

export function ShuffleDeck({ question, onDone, onSkip }: ShuffleDeckProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, prefersReducedMotion ? 0 : TOTAL_MS);
    return () => clearTimeout(timer);
  }, [onDone, prefersReducedMotion]);

  const stackHeight = CARD_HEIGHT + (STACK - 1) * STACK_OFFSET;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Đang xáo bài
        </h1>
        <p className="max-w-md text-sm text-muted">
          Câu hỏi: <span className="text-foreground">“{question}”</span>
        </p>
      </div>

      {/* The heading above is decorative repetition for a screen reader;
          this is the one line that announces the wait and its end. */}
      <p className="sr-only" aria-live="polite">
        Đang xáo bộ bài, sắp trải ra để bạn chọn.
      </p>

      <div
        aria-hidden
        className="relative"
        style={{ width: CARD_WIDTH + SPLIT_X * 2, height: stackHeight + 24 }}
      >
        {Array.from({ length: STACK }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              marginLeft: -CARD_WIDTH / 2,
              top: 12 + i * STACK_OFFSET,
              zIndex: i,
            }}
            animate={prefersReducedMotion ? undefined : cardKeyframes(i)}
            transition={{
              duration: SHUFFLE_DURATION,
              times: KEYFRAME_TIMES,
              ease: "easeInOut",
              // Alternating cards arrive a beat apart, which is what makes
              // the return read as an interleave instead of a slam.
              delay: (i % 2) * 0.04,
            }}
          >
            <CardBack />
          </motion.div>
        ))}
      </div>

      {/* Bar drains left-to-right so the wait has a visible end, on
          scaleX rather than width to keep it off the layout path. */}
      <div aria-hidden className="h-0.5 w-40 overflow-hidden rounded-full bg-accent/25">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : TOTAL_MS / 1000, ease: "linear" }}
        />
      </div>

      <Button variant="ghost" onClick={onSkip}>
        Bỏ qua, trải bài luôn
      </Button>
    </div>
  );
}
