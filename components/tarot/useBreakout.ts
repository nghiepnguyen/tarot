"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

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
export function useBreakout(ref: RefObject<HTMLDivElement | null>) {
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
