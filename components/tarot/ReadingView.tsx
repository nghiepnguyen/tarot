import { useRef, useState } from "react";
import { generateReflectionAction } from "@/app/actions/reflection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { FlipCard } from "@/components/tarot/FlipCard";
import { AiUnlockPanel, LoginToUnlockPanel, ReadingSupportCard, UnsavedReadingPanel } from "@/components/tarot/AiUnlockPanel";
import { SPREAD_POSITIONS, type DrawnCard } from "@/lib/tarot/draw";
import type { SaveState } from "@/components/tarot/TarotExperience";
import { needsReadingSupport } from "@/lib/ai/reading-support";

interface ReadingViewProps {
  question: string;
  cards: DrawnCard[];
  readingId: string | null;
  isLoggedIn: boolean;
  canGenerateReflection: boolean;
  saveState: SaveState;
  onRetrySave: () => void;
  onReset: () => void;
}

export function ReadingView({
  question,
  cards,
  readingId,
  isLoggedIn,
  canGenerateReflection,
  saveState,
  onRetrySave,
  onReset,
}: ReadingViewProps) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateReflectionAction>>>();
  const [loading, setLoading] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [note, setNote] = useState("");
  const request = useRef<"pending" | "ignored" | null>(null);
  const interpretation = useRef<HTMLDivElement>(null);
  const showSupport = needsReadingSupport(question) || result?.status === "support";

  async function generateReflection() {
    if (request.current || skipped || result || showSupport || !canGenerateReflection) return;
    request.current = "pending";
    setLoading(true);
    try {
      const response = await generateReflectionAction(question, cards.map(({ card, orientation }, index) => ({
        cardId: card.id,
        orientation,
        position: SPREAD_POSITIONS[index],
      })));
      if (request.current === "pending") setResult(response);
    } catch {
      if (request.current === "pending") setResult({ status: "fallback" });
    } finally {
      if (request.current === "pending") setLoading(false);
      request.current = null;
    }
  }

  function continueReading() {
    request.current = "ignored";
    setSkipped(true);
    interpretation.current?.focus();
  }

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

      {canGenerateReflection && !showSupport && !skipped && (
        <section aria-label="Phản tư ngắn" className="w-full max-w-xl">
          <Card className="space-y-3 text-left">
            <h2 className="text-lg font-semibold">Phản tư ngắn</h2>
            {!result && (
              <Button type="button" onClick={generateReflection} disabled={loading}>
                {loading ? "Đang tạo câu hỏi…" : "Tạo câu hỏi phản tư"}
              </Button>
            )}
            {result?.status === "success" ? (
              <div role="status" className="space-y-3 text-sm">
                <p>{result.reflection.intro}</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {result.reflection.questions.map((prompt, index) => <li key={index}>{prompt}</li>)}
                </ol>
              </div>
            ) : result && (
              <p role="status" className="text-sm text-muted">Chưa tạo được câu hỏi phản tư. Bạn có thể tiếp tục xem bài.</p>
            )}
            <label className="block space-y-2 text-sm">
              <span>Ghi chú phản tư (tùy chọn)</span>
              <Textarea rows={2} maxLength={300} value={note} onChange={event => setNote(event.target.value)} onBlur={() => setNote(note.trim())} />
            </label>
            <Button type="button" variant="secondary" onClick={continueReading}>Tiếp tục xem bài</Button>
          </Card>
        </section>
      )}

      <div id="reading-interpretation" ref={interpretation} tabIndex={-1} className="w-full max-w-xl">
        {showSupport ? (
          <ReadingSupportCard />
        ) : readingId ? (
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

      <Button variant="secondary" onClick={() => { request.current = "ignored"; onReset(); }}>
        Trải bài mới
      </Button>
    </div>
  );
}
