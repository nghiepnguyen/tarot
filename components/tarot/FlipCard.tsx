"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { DrawnCard } from "@/lib/tarot/draw";

interface FlipCardProps {
  position: string;
  drawn: DrawnCard;
  delay: number;
}

export function FlipCard({ position, drawn, delay }: FlipCardProps) {
  const { card, orientation } = drawn;
  const isReversed = orientation === "reversed";
  const prefersReducedMotion = useReducedMotion();
  const entryDelay = prefersReducedMotion ? 0 : delay;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: entryDelay, ease: "easeOut" }}
      className="flex flex-col items-center gap-3 text-center"
    >
      <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted">
        {position}
      </span>

      <motion.div
        initial={{ rotateY: prefersReducedMotion ? 0 : 180 }}
        animate={{ rotateY: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.7,
          delay: prefersReducedMotion ? 0 : delay + 0.15,
          ease: "easeOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-36 aspect-[24/41] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_24px_-16px_rgba(51,41,31,0.35)]"
      >
        <Image
          src={card.image}
          alt={`${card.name}, ${isReversed ? "ngược" : "xuôi"}`}
          fill
          sizes="144px"
          className="object-contain"
          style={{ transform: isReversed ? "rotate(180deg)" : undefined }}
        />
      </motion.div>

      <div className="max-w-[11rem]">
        <p className="text-sm font-medium text-foreground">
          {card.name}
          <span className="ml-1 text-xs font-normal text-muted">
            ({isReversed ? "ngược" : "xuôi"})
          </span>
        </p>
        <p className="mt-1 text-xs text-muted">{card.keywords.join(" · ")}</p>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          {isReversed ? card.reversedMeaning : card.basicMeaning}
        </p>
      </div>
    </motion.div>
  );
}
