import { Button } from "@/components/ui/Button";
import { FlipCard } from "@/components/tarot/FlipCard";
import { SPREAD_POSITIONS, type DrawnCard } from "@/lib/tarot/draw";

interface ReadingViewProps {
  question: string;
  cards: DrawnCard[];
  onReset: () => void;
}

export function ReadingView({ question, cards, onReset }: ReadingViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <p className="max-w-xl text-center text-sm text-muted">
        Câu hỏi của bạn: <span className="text-foreground">“{question}”</span>
      </p>

      <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-3">
        {cards.map((drawn, i) => (
          <FlipCard
            key={drawn.card.id}
            position={SPREAD_POSITIONS[i]}
            drawn={drawn}
            delay={i * 0.25}
          />
        ))}
      </div>

      <Button variant="secondary" onClick={onReset}>
        Trải bài mới
      </Button>
    </div>
  );
}
