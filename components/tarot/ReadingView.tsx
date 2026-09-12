import { Button } from "@/components/ui/Button";
import { FlipCard } from "@/components/tarot/FlipCard";
import { AiUnlockPanel } from "@/components/tarot/AiUnlockPanel";
import { SPREAD_POSITIONS, type DrawnCard } from "@/lib/tarot/draw";
import { LoginPromptLink } from "@/components/analytics/LoginPromptLink";

interface ReadingViewProps {
  question: string;
  cards: DrawnCard[];
  readingId: string | null;
  onReset: () => void;
}

export function ReadingView({ question, cards, readingId, onReset }: ReadingViewProps) {
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

      <div className="w-full max-w-xl">
        {readingId ? (
          <AiUnlockPanel readingId={readingId} />
        ) : (
          <p className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-muted">
            <LoginPromptLink placement="reading_view" />{" "}
            để lưu lịch sử và mở khóa diễn giải chuyên sâu cho lần trải bài này.
          </p>
        )}
      </div>

      <Button variant="secondary" onClick={onReset}>
        Trải bài mới
      </Button>
    </div>
  );
}
