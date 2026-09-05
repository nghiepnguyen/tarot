import { TAROT_CARDS, type TarotCard } from "./cards";

export type Orientation = "upright" | "reversed";

export interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
}

export const SPREAD_POSITIONS = ["Bối cảnh", "Hiện tại", "Hướng đi"] as const;

export const DECK_SPREAD_SIZE = TAROT_CARDS.length;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawSpreadPool(size: number = DECK_SPREAD_SIZE): DrawnCard[] {
  return shuffle(TAROT_CARDS)
    .slice(0, size)
    .map((card) => ({
      card,
      orientation: Math.random() < 0.5 ? "upright" : "reversed",
    }));
}
