// Pure geometry for the circular pick wheel. Kept free of React and the DOM
// so it runs under vitest's node environment.
//
// Positions are measured in "slots" rather than degrees: slot k of an
// n-card ring sits at k * 360 / n. The wheel's rotation is a single
// unbounded slot offset, so snapping is just rounding, and a card's place
// relative to the top of the arc is (k - offset) wrapped into the ring.

export const CARD_RATIO = 1.57;
export const COMPACT_BREAKPOINT = 640;
// Past this many pixels a press is a drag, not a tap on a card.
export const DRAG_THRESHOLD_PX = 6;
// Cards rendered past each edge of the visible arc, so cards that slide in
// during a drag or a re-spread already exist before they come into view.
export const RENDER_BUFFER = 2;
// Room above the top card for its hover lift.
export const WHEEL_TOP_PAD = 16;

const CARD_WIDTH = { compact: 64, wide: 92 };
// Arc length between neighbours at the top of the wheel, as a fraction of
// card width: the cards overlap like a fanned deck but keep enough of
// each face showing to be tapped.
const CARD_SPACING = { compact: 0.52, wide: 0.56 };
// How far the window extends below the top card: the rest of the ring
// drops out of sight past the bottom edge, which is what makes it read as
// a wheel rising from below the screen.
const WINDOW_EXTRA = { compact: 64, wide: 96 };
// A card counts as visible while at least this share of it is inside the
// window.
const MIN_VISIBLE_SHARE = 0.35;

export interface WheelLayout {
  compact: boolean;
  cardWidth: number;
  cardHeight: number;
  /** Distance from the wheel's centre to the bottom edge of each card. */
  radius: number;
  /** Height of the clipped window the arc shows through. */
  windowHeight: number;
  /** Slots from the top of the arc to the last visible card, per side. */
  halfVisible: number;
  /** Slots rendered per side: the visible ones plus the buffer. */
  halfRendered: number;
  /** Pixels a finger travels to move the ring by one slot. */
  slotPx: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

/** Wraps a slot distance into [-n/2, n/2) so the ring has no seam. */
export function wrapSigned(slots: number, n: number) {
  return mod(slots + n / 2, n) - n / 2;
}

export function stepDeg(n: number) {
  return 360 / n;
}

export function computeWheelLayout(viewportWidth: number, deckSize: number): WheelLayout {
  const compact = viewportWidth < COMPACT_BREAKPOINT;
  const cardWidth = compact ? CARD_WIDTH.compact : CARD_WIDTH.wide;
  const cardHeight = Math.round(cardWidth * CARD_RATIO);
  const spacing = cardWidth * (compact ? CARD_SPACING.compact : CARD_SPACING.wide);
  // Circumference = one spacing per card, measured at the cards' middle.
  const midRadius = (spacing * deckSize) / (2 * Math.PI);
  const radius = midRadius - cardHeight / 2;
  const windowHeight = cardHeight + (compact ? WINDOW_EXTRA.compact : WINDOW_EXTRA.wide);

  // A card rotated by θ about the wheel's centre has its top edge dropped
  // by (R + h)(1 − cos θ). It stays visible while enough of its height is
  // still inside the window, and while its centre is on screen.
  const outer = radius + cardHeight;
  const maxDrop = windowHeight - WHEEL_TOP_PAD - cardHeight * MIN_VISIBLE_SHARE;
  const byHeight = Math.acos(Math.max(-1, Math.min(1, 1 - maxDrop / outer)));
  const byWidth = Math.asin(Math.min(1, viewportWidth / 2 / midRadius));
  const maxAngle = Math.min(byHeight, byWidth);

  const stepRad = (2 * Math.PI) / deckSize;
  const halfVisible = Math.max(1, Math.floor(maxAngle / stepRad));
  // Never render more than the ring holds, or a card would show twice.
  const halfRendered = Math.min(halfVisible + RENDER_BUFFER, Math.floor((deckSize - 1) / 2));

  return {
    compact,
    cardWidth,
    cardHeight,
    radius: round2(radius),
    windowHeight,
    halfVisible,
    halfRendered,
    slotPx: round2(midRadius * stepRad),
  };
}

/** Rotation in degrees of the card at ring position k, given the offset. */
export function cardAngle(k: number, offset: number, n: number) {
  return round2(wrapSigned(k - offset, n) * stepDeg(n));
}

/**
 * Ring positions to render for the current offset, sorted ascending.
 * Sorting by position rather than by distance from the top keeps the DOM
 * order stable while the ring turns: React only ever inserts or drops a
 * node at the edges, never moves one, so a focused card keeps its focus.
 */
export function renderedPositions(offset: number, n: number, halfRendered: number) {
  if (n === 0) return [];
  const center = Math.round(offset);
  const half = Math.min(halfRendered, Math.floor((n - 1) / 2));
  const positions = new Set<number>();
  for (let j = -half; j <= half; j += 1) positions.add(mod(center + j, n));
  return [...positions].sort((a, b) => a - b);
}

export function snapOffset(offset: number) {
  return Math.round(offset);
}

/** A whole-slot start offset, so every draw opens on a different card. */
export function randomStartOffset(n: number, random: () => number = Math.random) {
  return Math.min(Math.floor(random() * n), n - 1);
}

/** The nearest offset (going the short way round) that puts k on top. */
export function offsetToCenter(k: number, offset: number, n: number) {
  return offset + wrapSigned(k - offset, n);
}

/** Ring position currently on top of the arc. */
export function centerPosition(offset: number, n: number) {
  return mod(Math.round(offset), n);
}

const LINE_PX = 16;

/** Wheel event delta in pixels, along whichever axis moved more. */
export function wheelDeltaPx(event: {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
}, pageHeight = 800) {
  const scale = event.deltaMode === 1 ? LINE_PX : event.deltaMode === 2 ? pageHeight : 1;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  return delta * scale;
}

/**
 * Where the ring's offset should land after its set of cards changes, so
 * the card on top stays on top. Returns the new offset, normalised into
 * the new ring. `prev` and `next` are the original deck indexes of the
 * cards on the ring, in ring order, before and after.
 *
 * When the card on top is the one leaving, the card after it takes its
 * place, so the gap closes from the far side instead of the whole ring
 * lurching by one.
 */
export function carryOffset(offset: number, prev: number[], next: number[]) {
  if (prev.length === 0 || next.length === 0) return 0;
  const frac = offset - Math.round(offset);
  const centerId = prev[centerPosition(offset, prev.length)];
  let newCenter = next.indexOf(centerId);
  if (newCenter === -1) {
    newCenter = next.findIndex((id) => id > centerId);
    if (newCenter === -1) newCenter = 0;
  }
  return newCenter + frac;
}

/**
 * How far, in slots, each card that stays on the ring moved when the ring
 * changed from `prev` to `next`. Cards animate out of this shift back to
 * zero, which is what makes the ring visibly close over a picked card.
 */
export function ringShifts(
  prev: number[],
  prevOffset: number,
  next: number[],
  nextOffset: number,
) {
  const shifts = new Map<number, number>();
  const prevIndex = new Map(prev.map((id, i) => [id, i]));
  next.forEach((id, k) => {
    const before = prevIndex.get(id);
    if (before === undefined) return;
    const oldRel = wrapSigned(before - prevOffset, prev.length);
    const newRel = wrapSigned(k - nextOffset, next.length);
    const shift = oldRel - newRel;
    if (Math.abs(shift) > 1e-6) shifts.set(id, shift);
  });
  return shifts;
}
