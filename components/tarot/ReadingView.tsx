import { Button } from "@/components/ui/Button";
import { FlipCard } from "@/components/tarot/FlipCard";
import { AiUnlockPanel, LoginToUnlockPanel, UnsavedReadingPanel } from "@/components/tarot/AiUnlockPanel";
import { SPREAD_POSITIONS, type DrawnCard } from "@/lib/tarot/draw";
import type { SaveState } from "@/components/tarot/TarotExperience";

interface ReadingViewProps {
  question: string;
  cards: DrawnCard[];
  readingId: string | null;
  isLoggedIn: boolean;
  saveState: SaveState;
  onRetrySave: () => void;
  onReset: () => void;
}

export function ReadingView({
  question,
  cards,
  readingId,
  isLoggedIn,
  saveState,
  onRetrySave,
  onReset,
}: ReadingViewProps) {
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
          <AiUnlockPanel readingId={readingId} cards={cards} question={question} />
        ) : isLoggedIn &&
          !(saveState.status === "failed" && saveState.reason === "unauthenticated") ? (
          // Phiên hết hạn giữa chừng thì server trả `unauthenticated` dù trang
          // vẫn tưởng đã đăng nhập — lúc đó mời đăng nhập mới là đúng.
          <UnsavedReadingPanel
            cards={cards}
            question={question}
            isSaving={saveState.status === "saving"}
            failureReason={saveState.status === "failed" ? saveState.reason : null}
            onRetry={onRetrySave}
          />
        ) : (
          <LoginToUnlockPanel cards={cards} question={question} />
        )}
      </div>

      <Button variant="secondary" onClick={onReset}>
        Trải bài mới
      </Button>
    </div>
  );
}
