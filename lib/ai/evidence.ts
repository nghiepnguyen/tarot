import { getCardById } from "@/lib/tarot/cards";
import { buildCardRelations } from "@/lib/tarot/relations";
import { parseReadingInput } from "@/lib/validation/reading";
import type { InterpretationCardInput } from "./interpretation";

export function buildInterpretationEvidence(question: string, cards: InterpretationCardInput[]) {
  const reading = parseReadingInput(question, Array.isArray(cards) ? cards.map(input => ({
    cardId: input?.card?.id,
    position: input?.position,
    orientation: input?.orientation,
  })) : cards);
  if (!reading) throw new Error("Invalid interpretation evidence input.");

  const canonicalCards = reading.cards.map(({ cardId, position, orientation }) => ({
    card: getCardById(cardId)!, position, orientation,
  }));
  const cardEvidence = canonicalCards.map(({ card, position, orientation }, index) => ({
    id: `C${index + 1}`,
    cardId: card.id,
    name: card.name,
    category: card.category,
    keywords: card.keywords,
    position,
    orientation,
    meaning: orientation === "reversed" ? card.reversedMeaning : card.basicMeaning,
  }));

  return {
    facts: [{ id: "F1", source: "user_question", text: reading.question }],
    cards: cardEvidence,
    relations: buildCardRelations(canonicalCards).map((relation, index) => ({
      id: `R${index + 1}`,
      ...relation,
      supportRefs: relation.cards.map(ref => cardEvidence.find(card => card.cardId === ref.cardId)!.id),
    })),
  };
}
