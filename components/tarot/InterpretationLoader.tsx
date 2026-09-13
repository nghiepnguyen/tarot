"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LeafSprig } from "@/components/ui/Botanical";

// The unlock call runs a long-form generation, so the wait is measured in
// tens of seconds rather than a spinner's worth. These lines narrate the
// stages the reading actually goes through, in order, so the wait reads as
// work being done instead of a frozen screen.
const PHASES = [
  "Đang trải ba lá theo câu hỏi của bạn…",
  "Đang đọc biểu tượng trên từng lá…",
  "Đang lần theo mạch nối giữa ba lá…",
  "Đang chắp bút cho bản luận giải…",
  "Đang soi lại từng đoạn một lần cuối…",
];

const PHASE_MS = 6000;
// Past this point the wait is longer than a healthy generation, so say so
// rather than letting the last phase line loop silently forever.
const SLOW_AFTER_MS = 35000;

const CARD_TILTS = [-8, 0, 8];

export function InterpretationLoader() {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setPhase((current) => Math.min(current + 1, PHASES.length - 1));
    }, PHASE_MS);
    const slow = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(slow);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="relative flex h-32 items-end justify-center gap-3">
        {/* Soft glow behind the deck, breathing on the same slow beat. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-28 w-28 rounded-full bg-sage-tint blur-2xl"
          animate={prefersReducedMotion ? undefined : { opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {CARD_TILTS.map((tilt, index) => (
          <motion.div
            key={tilt}
            aria-hidden="true"
            className="relative h-28 w-[4.5rem] rounded-lg border border-accent bg-accent shadow-[0_8px_24px_-16px_rgba(51,41,31,0.45)]"
            style={{ rotate: tilt }}
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -10, 0], rotate: [tilt, tilt * 0.4, tilt] }
            }
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.28,
            }}
          >
            <div className="relative m-1.5 flex h-[calc(100%-0.75rem)] items-center justify-center overflow-hidden rounded-md border border-accent-foreground/20">
              <LeafSprig className="h-2/3 w-2/3 text-accent-foreground/25" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* One live region for the whole status, so a screen reader hears the
          phase change without the decorative deck getting announced. */}
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
        <p className="text-base font-medium text-foreground">Đang tạo diễn giải</p>
        <motion.p
          key={PHASES[phase]}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-xs text-sm leading-relaxed text-muted"
        >
          {PHASES[phase]}
        </motion.p>
        {isSlow ? (
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Lần này lâu hơn thường lệ. Bạn cứ để trang mở, credit chỉ tính khi
            bản đọc hiện ra.
          </p>
        ) : null}
      </div>

      {/* Indeterminate on purpose: we have no real progress signal from the
          model, and a percentage that inches up on a timer would be a
          number we made up. */}
      <div
        aria-hidden="true"
        className="relative h-1 w-40 overflow-hidden rounded-full bg-border"
      >
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-accent"
          animate={prefersReducedMotion ? { x: 0 } : { x: ["-100%", "300%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
