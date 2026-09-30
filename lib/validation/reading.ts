import { z } from "zod";
import { TAROT_CARDS } from "../tarot/cards";
import { SPREAD_POSITIONS } from "../tarot/draw";

const ids = new Set(TAROT_CARDS.map(card => card.id));
const schema = z.object({
  question: z.string().trim().min(1).max(300),
  cards: z.array(z.object({
    cardId: z.string().refine(id => ids.has(id)),
    orientation: z.enum(["upright", "reversed"]), position: z.string(),
  })).length(3),
}).refine(input => new Set(input.cards.map(card => card.cardId)).size === 3)
  .refine(input => input.cards.every((card, i) => card.position === SPREAD_POSITIONS[i]));

export function parseReadingInput(question: unknown, cards: unknown): z.infer<typeof schema> | null {
  const parsed = schema.safeParse({ question, cards });
  return parsed.success ? parsed.data : null;
}
