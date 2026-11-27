import type { InterpretationCardInput } from "@/lib/ai/interpretation";

const NUMBERED_RANKS = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export function buildCardRelations(cards: InterpretationCardInput[]) {
  const references = cards.map(({ card, position, orientation }) => ({
    cardId: card.id,
    category: card.category,
    position,
    orientation,
  }));
  const ranks = references.map(({ cardId, category }) =>
    NUMBERED_RANKS.findIndex(rank => cardId === `${rank}-of-${category}`) + 1,
  );
  const sameSuitSpread = references.length === 3
    && references[0].category !== "major-arcana"
    && references.every(card => card.category === references[0].category)
    ? [{ kind: "same_suit_spread", cards: references }]
    : [];

  const progressions = [];
  const equalRanks = [];
  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      if (!ranks[i] || !ranks[j]) continue;
      const pair = [references[i], references[j]];
      if (references[i].category === references[j].category && ranks[i] !== ranks[j]) {
        progressions.push({ kind: "same_suit_progression", cards: pair, ranks: [ranks[i], ranks[j]] });
      } else if (references[i].category !== references[j].category && ranks[i] === ranks[j]) {
        equalRanks.push({ kind: "same_rank", cards: pair, rank: ranks[i] });
      }
    }
  }
  return [...sameSuitSpread, ...progressions, ...equalRanks].slice(0, 2);
}

