import { TAROT_CARDS } from "@/lib/tarot/cards";

const cardNamePattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${TAROT_CARDS.map(({ name }) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);

/** Format card names in prose without treating generated text as HTML. */
export function CardNameText({ text }: { text: string }) {
  return text.split(cardNamePattern).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="font-bold italic">{part}</span>
    ) : part,
  );
}
