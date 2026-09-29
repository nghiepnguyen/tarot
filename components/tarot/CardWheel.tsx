"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  animate,
  LayoutGroup,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import type { AnimationPlaybackControls, MotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardFace } from "@/components/tarot/CardBack";
import { useBreakout } from "@/components/tarot/useBreakout";
import { SPREAD_POSITIONS } from "@/lib/tarot/draw";
import { trackEvent } from "@/lib/analytics/gtag";
import {
  cardAngle,
  carryOffset,
  centerPosition,
  computeWheelLayout,
  DRAG_THRESHOLD_PX,
  mod,
  offsetToCenter,
  randomStartOffset,
  renderedPositions,
  ringShifts,
  stepDeg,
  WHEEL_TOP_PAD,
  wheelDeltaPx,
  wrapSigned,
} from "@/lib/tarot/wheel";
import type { WheelLayout } from "@/lib/tarot/wheel";

const PICK_COUNT = SPREAD_POSITIONS.length;
const DEAL_DURATION = 0.6;
const FLY_DURATION = 0.45;
// Wheel and trackpad events arrive in bursts with no "end" event, so the
// ring snaps once they have gone quiet for this long.
const WHEEL_SNAP_DELAY_MS = 140;
// How far a flick carries the ring: the inertia target is roughly
// velocity × power slots past the release point.
const INERTIA_POWER = 0.3;
const INERTIA_TIME_CONSTANT = 320;
const SLOT_SIZE = { compact: 60, wide: 84 };

type RotateMethod = "wheel" | "drag" | "keyboard" | "button";

/** Screen-space box a card is leaving from, so its new home can fly in from there. */
interface Flight {
  x: number;
  y: number;
  width: number;
  rotate: number;
}

interface CardWheelProps {
  size: number;
  selectedSlots?: number[];
  onSelectSlot?: (index: number) => void;
}

function centerOf(el: Element) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// The 78-card deck laid out as a closed ring whose centre sits below the
// bottom of the screen, so only the top of the arc shows — the same shape
// as a deck fanned across a table. Turning the ring brings every card
// past the top without paging.
export function CardWheel({ size, selectedSlots = [], onSelectSlot }: CardWheelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const breakout = useBreakout(wrapRef);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const layout = useMemo(
    () => (breakout ? computeWheelLayout(breakout.width, size) : null),
    [breakout, size],
  );

  // The ring holds every card not yet picked, in deck order, so a card
  // that comes back slots in exactly where it left.
  const ring = useMemo(
    () => Array.from({ length: size }, (_, i) => i).filter((i) => !selectedSlots.includes(i)),
    [size, selectedSlots],
  );
  const n = ring.length;
  const isFull = selectedSlots.length >= PICK_COUNT;

  // Rotation lives in a motion value, not state, so turning the ring never
  // re-renders React — only which cards are mounted does, and that only
  // changes once per slot.
  const offset = useMotionValue(0);
  const spread = useMotionValue(prefersReducedMotion ? 1 : 0);
  const [centerSlot, setCenterSlot] = useState(0);
  const [dealt, setDealt] = useState(false);
  // Reduced motion skips the deal entirely, so nothing waits on it.
  const dealing = !prefersReducedMotion && !dealt;
  const [hasRotated, setHasRotated] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [ringVersion, setRingVersion] = useState(0);

  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const shiftsRef = useRef<Map<number, number>>(new Map());
  const flightsRef = useRef<Map<number, Flight>>(new Map());
  const pendingFocusRef = useRef<number | null>(null);
  const trackedRotateRef = useRef(false);
  // A drag that ends over a card must not also pick it.
  const suppressClickRef = useRef(false);

  useMotionValueEvent(offset, "change", (latest) => {
    const rounded = Math.round(latest);
    setCenterSlot((prev) => (prev === rounded ? prev : rounded));
  });

  const stopRing = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const noteRotate = useCallback((method: RotateMethod) => {
    setHasRotated(true);
    if (trackedRotateRef.current) return;
    trackedRotateRef.current = true;
    trackEvent("deck_rotate", { method });
  }, []);

  const turnTo = useCallback(
    (target: number) => {
      stopRing();
      if (prefersReducedMotion) {
        offset.set(target);
        return;
      }
      animationRef.current = animate(offset, target, {
        type: "spring",
        stiffness: 260,
        damping: 32,
        restDelta: 0.001,
      });
    },
    [offset, prefersReducedMotion, stopRing],
  );

  // Deal once the viewport is measured: open on a random card, then fan
  // the ring out from the top of the arc.
  const hasDealtRef = useRef(false);
  useEffect(() => {
    if (!layout || hasDealtRef.current) return;
    hasDealtRef.current = true;
    offset.set(randomStartOffset(n));
    if (prefersReducedMotion) {
      spread.set(1);
      return;
    }
    const controls = animate(spread, 1, { duration: DEAL_DURATION, ease: "easeOut" });
    controls.then(() => setDealt(true));
    // Only the first measurement deals; later resizes just re-lay out.
  }, [layout, n, offset, prefersReducedMotion, spread]);

  // Every pick and return goes through here before the parent's state
  // changes, so the ring's offset and each card's slide are settled in the
  // same tick as the new set of cards: the card on top stays on top and the
  // rest close over the gap instead of jumping.
  const changeRing = useCallback(
    (next: number[]) => {
      stopRing();
      const current = offset.get();
      const nextOffset = carryOffset(current, ring, next);
      shiftsRef.current = prefersReducedMotion
        ? new Map()
        : ringShifts(ring, current, next, nextOffset);
      offset.set(nextOffset);
      setRingVersion((v) => v + 1);
      return nextOffset;
    },
    [offset, prefersReducedMotion, ring, stopRing],
  );

  const pickCard = (id: number, el: HTMLElement) => {
    if (dealing || isFull) return;
    const k = ring.indexOf(id);
    const box = el.getBoundingClientRect();
    flightsRef.current.set(id, {
      ...centerOf(el),
      width: box.width,
      rotate: cardAngle(k, offset.get(), n),
    });
    const next = ring.filter((i) => i !== id);
    const nextOffset = changeRing(next);
    if (focusedId === id) setFocusedId(null);
    // Picking from the keyboard leaves focus on the card that slid onto
    // the top, instead of dropping it to the page with the removed button.
    if (document.activeElement === el && next.length > 0) {
      pendingFocusRef.current = next[centerPosition(nextOffset, next.length)];
    }
    onSelectSlot?.(id);
  };

  // Cards are memoised so turning the ring only renders the ones entering
  // or leaving the window; they call back through a ref, so the handlers
  // they hold never change identity while still seeing the latest state.
  const pickCardRef = useRef(pickCard);
  useLayoutEffect(() => {
    pickCardRef.current = pickCard;
  });
  const onCardPick = useCallback((id: number, el: HTMLElement) => {
    if (suppressClickRef.current) return;
    pickCardRef.current(id, el);
  }, []);

  const returnCard = (id: number, el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    flightsRef.current.set(id, { ...centerOf(el), width: box.width, rotate: 0 });
    changeRing([...ring, id].sort((a, b) => a - b));
    onSelectSlot?.(id);
  };

  // Wheel events have to be cancelled so the page doesn't scroll under
  // the ring, and React's onWheel is passive, so it can't.
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !layout) return;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (event: WheelEvent) => {
      if (dealing) return;
      event.preventDefault();
      stopRing();
      offset.set(offset.get() + wheelDeltaPx(event, window.innerHeight) / layout.slotPx);
      noteRotate("wheel");
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => turnTo(Math.round(offset.get())), WHEEL_SNAP_DELAY_MS);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      clearTimeout(snapTimer);
      el.removeEventListener("wheel", onWheel);
    };
  }, [dealing, layout, noteRotate, offset, stopRing, turnTo]);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: number;
    dragging: boolean;
    samples: { t: number; x: number }[];
  } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dealing || !layout) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopRing();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset.get(),
      dragging: false,
      samples: [{ t: event.timeStamp, x: event.clientX }],
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !layout) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.dragging) {
      if (Math.abs(dx) > DRAG_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        drag.dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        noteRotate("drag");
      } else if (Math.abs(dy) > DRAG_THRESHOLD_PX) {
        // A vertical swipe is the page scrolling, not the ring turning.
        dragRef.current = null;
        return;
      } else {
        return;
      }
    }
    // Card under the finger follows the finger.
    offset.set(drag.startOffset - dx / layout.slotPx);
    drag.samples.push({ t: event.timeStamp, x: event.clientX });
    if (drag.samples.length > 6) drag.samples.shift();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !layout) return;
    dragRef.current = null;
    if (!drag.dragging) return;
    suppressClickRef.current = true;
    // Clear on the next task, after the click this pointerup produces.
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);

    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const dt = (last.t - first.t) / 1000;
    const pxPerSecond = dt > 0 ? (last.x - first.x) / dt : 0;
    const slotsPerSecond = -pxPerSecond / layout.slotPx;

    if (prefersReducedMotion || event.type === "pointercancel") {
      turnTo(Math.round(offset.get()));
      return;
    }
    stopRing();
    animationRef.current = animate(offset, offset.get(), {
      type: "inertia",
      velocity: slotsPerSecond,
      power: INERTIA_POWER,
      timeConstant: INERTIA_TIME_CONSTANT,
      restDelta: 0.001,
      modifyTarget: (target) => Math.round(target),
    });
  };

  const center = centerPosition(centerSlot, Math.max(n, 1));
  const positions = useMemo(() => {
    if (!layout || n === 0) return [];
    const set = new Set(renderedPositions(centerSlot, n, layout.halfRendered));
    // A card holding keyboard focus stays mounted even if the ring turned
    // away from it, or focus would drop back to the page.
    if (focusedId !== null) {
      const k = ring.indexOf(focusedId);
      if (k !== -1) set.add(k);
    }
    return [...set].sort((a, b) => a - b);
  }, [centerSlot, focusedId, layout, n, ring]);

  const tabId =
    focusedId !== null && ring.includes(focusedId) ? focusedId : n > 0 ? ring[center] : null;

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (dealing || n === 0 || tabId === null) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const k = ring.indexOf(tabId);
    const nextK = mod(k + (event.key === "ArrowRight" ? 1 : -1), n);
    const nextId = ring[nextK];
    pendingFocusRef.current = nextId;
    setFocusedId(nextId);
    turnTo(offsetToCenter(nextK, offset.get(), n));
    noteRotate("keyboard");
  };

  useEffect(() => {
    const id = pendingFocusRef.current;
    if (id === null) return;
    const el = windowRef.current?.querySelector<HTMLButtonElement>(`[data-card-id="${id}"]`);
    if (!el) return;
    pendingFocusRef.current = null;
    el.focus({ preventScroll: true });
  });

  const turnBy = (direction: 1 | -1) => {
    if (dealing || !layout) return;
    const step = Math.max(1, layout.halfVisible);
    turnTo(Math.round(offset.get()) + direction * step);
    noteRotate("button");
  };

  return (
    <div ref={wrapRef} className="flex w-full flex-1 flex-col items-center gap-4">
      <LayoutGroup>
        <div className="flex items-start justify-center gap-4 sm:gap-8">
          {SPREAD_POSITIONS.map((name, i) => {
            const id = selectedSlots[i];
            return (
              <SpreadSlot
                key={name}
                name={name}
                id={id}
                compact={layout?.compact ?? true}
                flightsRef={flightsRef}
                reducedMotion={prefersReducedMotion}
                onReturn={returnCard}
              />
            );
          })}
        </div>
      </LayoutGroup>

      <p
        aria-hidden
        className={`text-xs text-muted transition-opacity duration-500 ${
          hasRotated || dealing ? "opacity-0" : "opacity-100"
        }`}
      >
        Vuốt hoặc cuộn để xoay bài
      </p>

      <div
        className="relative mt-auto w-full self-start"
        style={breakout ? { marginLeft: breakout.marginLeft, width: breakout.width } : undefined}
      >
        <div
          ref={windowRef}
          role="group"
          aria-label="Vòng bài, dùng phím mũi tên để xoay"
          className="relative w-full touch-pan-y select-none overflow-hidden"
          style={{ height: layout?.windowHeight ?? 200 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          {layout && breakout
            ? positions.map((k) => {
                const id = ring[k];
                return (
                  <WheelCard
                    key={id}
                    id={id}
                    k={k}
                    n={n}
                    layout={layout}
                    viewportWidth={breakout.width}
                    offset={offset}
                    spread={spread}
                    ringVersion={ringVersion}
                    shiftsRef={shiftsRef}
                    flightsRef={flightsRef}
                    reducedMotion={prefersReducedMotion}
                    disabled={dealing || isFull}
                    dimmed={isFull}
                    tabbable={id === tabId}
                    onPick={onCardPick}
                    onFocus={setFocusedId}
                  />
                );
              })
            : null}
        </div>

        <TurnButton side="left" onClick={() => turnBy(-1)} disabled={dealing} />
        <TurnButton side="right" onClick={() => turnBy(1)} disabled={dealing} />
      </div>
    </div>
  );
}

function TurnButton({
  side,
  onClick,
  disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Xoay bài sang trái" : "Xoay bài sang phải"}
      className={`absolute bottom-3 z-[200] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-opacity hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-0 ${
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      <Icon aria-hidden className="h-5 w-5" />
    </button>
  );
}

interface WheelCardProps {
  id: number;
  k: number;
  n: number;
  layout: WheelLayout;
  viewportWidth: number;
  offset: MotionValue<number>;
  spread: MotionValue<number>;
  ringVersion: number;
  shiftsRef: RefObject<Map<number, number>>;
  flightsRef: RefObject<Map<number, Flight>>;
  reducedMotion: boolean;
  disabled: boolean;
  dimmed: boolean;
  tabbable: boolean;
  onPick: (id: number, el: HTMLElement) => void;
  onFocus: (id: number) => void;
}

const WheelCard = memo(function WheelCard({
  id,
  k,
  n,
  layout,
  viewportWidth,
  offset,
  spread,
  ringVersion,
  shiftsRef,
  flightsRef,
  reducedMotion,
  disabled,
  dimmed,
  tabbable,
  onPick,
  onFocus,
}: WheelCardProps) {
  const { cardWidth, cardHeight, radius } = layout;
  // Slots this card is still sliding by after the ring changed; it eases
  // back to zero, which is what closes the ring over a picked card.
  const shift = useMotionValue(0);
  const slots = () => wrapSigned(k + shift.get() - offset.get(), n);
  const angle = () => Math.round(slots() * stepDeg(n) * spread.get() * 100) / 100;
  const rotate = useMotionValue(angle());
  // Right-hand neighbours overlap left-hand ones, like a fanned deck.
  const zIndex = useMotionValue(100 + Math.round(slots()));
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const update = () => {
      rotate.set(angle());
      zIndex.set(100 + Math.round(slots()));
    };
    update();
    const unsubscribe = [offset, shift, spread].map((value) => value.on("change", update));
    return () => unsubscribe.forEach((fn) => fn());
    // `angle` and `slots` read k and n, which are the dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, n, offset, rotate, shift, spread, zIndex]);

  const appliedVersionRef = useRef(ringVersion);
  useLayoutEffect(() => {
    if (appliedVersionRef.current === ringVersion) return;
    appliedVersionRef.current = ringVersion;
    const delta = shiftsRef.current.get(id);
    if (!delta || reducedMotion) return;
    shift.set(shift.get() + delta);
    animate(shift, 0, { type: "spring", stiffness: 300, damping: 34, restDelta: 0.001 });
  }, [id, reducedMotion, ringVersion, shift, shiftsRef]);

  // A card coming back from a slot flies in from where the slot was. The
  // offset is measured in screen space, so it is turned into the card's
  // own rotated frame before animating the inner layer.
  useLayoutEffect(() => {
    const flight = flightsRef.current.get(id);
    const inner = innerRef.current;
    if (!flight || !inner) return;
    flightsRef.current.delete(id);
    if (reducedMotion) return;
    const here = centerOf(inner);
    const dx = flight.x - here.x;
    const dy = flight.y - here.y;
    const theta = (rotate.get() * Math.PI) / 180;
    animate(
      inner,
      {
        x: [dx * Math.cos(theta) + dy * Math.sin(theta), 0],
        y: [-dx * Math.sin(theta) + dy * Math.cos(theta), 0],
        rotate: [-rotate.get(), 0],
        scale: [flight.width / cardWidth, 1],
      },
      { duration: FLY_DURATION, ease: [0.22, 1, 0.36, 1] },
    );
    // Runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: Math.round(viewportWidth / 2 - cardWidth / 2),
        top: WHEEL_TOP_PAD,
        width: cardWidth,
        height: cardHeight,
        rotate,
        zIndex,
        opacity: spread,
        // Every card turns about the wheel's own centre, below the bottom
        // of the card by the ring's radius.
        transformOrigin: `50% ${cardHeight + radius}px`,
      }}
    >
      <div ref={innerRef} className="h-full w-full">
        <button
          type="button"
          data-card-id={id}
          tabIndex={tabbable ? 0 : -1}
          disabled={disabled}
          onClick={(event) => onPick(id, event.currentTarget)}
          onFocus={() => onFocus(id)}
          aria-label={`Chọn lá thứ ${id + 1}`}
          className={`h-full w-full cursor-pointer rounded-lg border border-accent bg-accent shadow-[0_2px_8px_rgb(0_0_0/0.18)] transition-[transform,opacity] duration-300 ease-out hover:-translate-y-2 motion-reduce:transition-none focus-visible:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:hover:translate-y-0 ${
            dimmed ? "opacity-50" : ""
          }`}
        >
          <CardFace />
        </button>
      </div>
    </motion.div>
  );
});

function SpreadSlot({
  name,
  id,
  compact,
  flightsRef,
  reducedMotion,
  onReturn,
}: {
  name: string;
  id: number | undefined;
  compact: boolean;
  flightsRef: RefObject<Map<number, Flight>>;
  reducedMotion: boolean;
  onReturn: (id: number, el: HTMLElement) => void;
}) {
  const width = compact ? SLOT_SIZE.compact : SLOT_SIZE.wide;
  const height = Math.round(width * 1.57);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height }}>
        <div
          role={id === undefined ? "img" : undefined}
          aria-label={id === undefined ? `${name}: chưa chọn` : undefined}
          className="absolute inset-0 rounded-lg border border-dashed border-accent/70"
        />
        {id !== undefined ? (
          <SlotCard
            key={id}
            id={id}
            name={name}
            flightsRef={flightsRef}
            reducedMotion={reducedMotion}
            onReturn={onReturn}
          />
        ) : null}
      </div>
      <span className="text-xs font-medium text-muted">{name}</span>
    </div>
  );
}

function SlotCard({
  id,
  name,
  flightsRef,
  reducedMotion,
  onReturn,
}: {
  id: number;
  name: string;
  flightsRef: RefObject<Map<number, Flight>>;
  reducedMotion: boolean;
  onReturn: (id: number, el: HTMLElement) => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);

  // Fly in from the card's spot on the ring.
  useLayoutEffect(() => {
    const flight = flightsRef.current.get(id);
    const inner = innerRef.current;
    if (!flight || !inner) return;
    flightsRef.current.delete(id);
    if (reducedMotion) return;
    const here = centerOf(inner);
    animate(
      inner,
      {
        x: [flight.x - here.x, 0],
        y: [flight.y - here.y, 0],
        rotate: [flight.rotate, 0],
        scale: [flight.width / inner.offsetWidth, 1],
      },
      { duration: FLY_DURATION, ease: [0.22, 1, 0.36, 1] },
    );
    // Runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Sharing a layoutId across the three slots lets a card glide to the
    // slot before it when an earlier card is put back.
    <motion.div
      layoutId={`slot-card-${id}`}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      className="absolute inset-0 z-10"
    >
      <div ref={innerRef} className="h-full w-full">
        <button
          type="button"
          onClick={(event) => onReturn(id, event.currentTarget)}
          aria-label={`${name}: đã chọn, bấm để bỏ chọn`}
          className="h-full w-full cursor-pointer rounded-lg border border-foreground bg-accent shadow-[0_4px_14px_rgb(0_0_0/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <CardFace />
        </button>
      </div>
    </motion.div>
  );
}
