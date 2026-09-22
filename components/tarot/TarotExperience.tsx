"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArcDeck } from "@/components/tarot/ArcDeck";
import { ShuffleDeck } from "@/components/tarot/ShuffleDeck";
import { QuestionForm } from "@/components/tarot/QuestionForm";
import { ReadingView } from "@/components/tarot/ReadingView";
import { Button } from "@/components/ui/Button";
import { BottomBar } from "@/components/ui/BottomBar";
import { useToast } from "@/components/ui/Toast";
import { drawSpreadPool, DECK_SPREAD_SIZE, SPREAD_POSITIONS } from "@/lib/tarot/draw";
import type { DrawnCard } from "@/lib/tarot/draw";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { trackEvent } from "@/lib/analytics/gtag";
import { saveReadingAction } from "@/app/actions/readings";
import type { StoredCard } from "@/app/actions/readings";

type Status = "question" | "shuffling" | "picking" | "revealed";

const PENDING_READING_KEY = "tarot:pendingReading";

interface PendingReading {
  question: string;
  cards: StoredCard[];
}

function savePendingReading(pending: PendingReading) {
  try {
    sessionStorage.setItem(PENDING_READING_KEY, JSON.stringify(pending));
  } catch {
    // Storage unavailable (private mode, disabled) — the login gate still
    // works, the user just has to redraw after logging in.
  }
}

function loadPendingReading(): PendingReading | null {
  try {
    const raw = sessionStorage.getItem(PENDING_READING_KEY);
    return raw ? (JSON.parse(raw) as PendingReading) : null;
  } catch {
    return null;
  }
}

function clearPendingReading() {
  try {
    sessionStorage.removeItem(PENDING_READING_KEY);
  } catch {
    // ignore
  }
}

function toDrawnCards(cards: StoredCard[]): DrawnCard[] {
  return cards
    .map((stored) => {
      const card = TAROT_CARDS.find((c) => c.id === stored.cardId);
      return card ? { card, orientation: stored.orientation } : null;
    })
    .filter((drawn): drawn is DrawnCard => drawn !== null);
}

function readRestorableReading(): PendingReading | null {
  const pending = loadPendingReading();
  if (!pending) return null;
  if (toDrawnCards(pending.cards).length !== 3) {
    clearPendingReading();
    return null;
  }
  return pending;
}

export function TarotExperience({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("question");
  const [pool, setPool] = useState<DrawnCard[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { showToast } = useToast();

  // sessionStorage is a browser-only external store: it must not be read
  // during the initial render (server-rendered HTML always starts at
  // "question", and reading it there would make the client's first paint
  // diverge from that markup and crash hydration). Read it here, after
  // mount, and sync React state from it instead.
  useEffect(() => {
    const pending = readRestorableReading();
    if (!pending) return;

    const cards = toDrawnCards(pending.cards);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing initial state from an external, browser-only store (sessionStorage) that is unavailable during SSR; cannot run during render without breaking hydration.
    setQuestion(pending.question);
    setPool(cards);
    setSelectedSlots([0, 1, 2]);
    setStatus("revealed");

    startTransition(async () => {
      try {
        const saved = await saveReadingAction(pending.question, pending.cards);
        if (saved) {
          setReadingId(saved.id);
          clearPendingReading();
          trackEvent("reading_restored", { reading_id: saved.id });
        }
      } catch {
        // Still anonymous or a transient failure — keep the pending reading
        // so the next mount (e.g. after a successful login) can retry.
      }
    });
  }, []);

  const handleStartDraw = () => {
    if (question.trim().length === 0) {
      showToast("Vui lòng nhập câu hỏi trước khi bốc bài.", "error");
      trackEvent("draw_blocked", { reason: "empty_question" });
      return;
    }
    trackEvent("draw_start", {
      question_length: question.trim().length,
      is_logged_in: isLoggedIn,
    });
    setPool(drawSpreadPool());
    setSelectedSlots([]);
    // The cards are already drawn at this point — the shuffle is a beat of
    // theatre over a decision that's been made, not a step that can change
    // it, so anyone who doesn't want the motion loses nothing by skipping.
    setStatus(prefersReducedMotion ? "picking" : "shuffling");
  };

  const handleShuffleDone = useCallback(() => setStatus("picking"), []);

  const handleShuffleSkip = useCallback(() => {
    trackEvent("shuffle_skip");
    setStatus("picking");
  }, []);

  const handleSelectSlot = (index: number) => {
    // Tính trạng thái mới ngoài updater: updater có thể chạy hai lần ở
    // StrictMode, bắn event bên trong sẽ đếm trùng.
    const isPicked = selectedSlots.includes(index);
    if (!isPicked && selectedSlots.length >= 3) return;
    const next = isPicked
      ? selectedSlots.filter((i) => i !== index)
      : [...selectedSlots, index];

    trackEvent(isPicked ? "card_deselect" : "card_select", {
      picked_count: next.length,
    });
    setSelectedSlots(next);
  };

  const handleReveal = () => {
    if (selectedSlots.length !== 3) return;
    const cards = selectedSlots.map((i) => pool[i]);
    trackEvent("reading_reveal", {
      is_logged_in: isLoggedIn,
      cards: cards.map((drawn) => drawn.card.id).join(","),
      reversed_count: cards.filter((drawn) => drawn.orientation === "reversed").length,
    });
    const storedCards = cards.map((drawn, i) => ({
      cardId: drawn.card.id,
      orientation: drawn.orientation,
      position: SPREAD_POSITIONS[i],
    }));

    startTransition(async () => {
      try {
        const saved = await saveReadingAction(question, storedCards);
        if (saved) {
          setReadingId(saved.id);
          clearPendingReading();
        } else {
          // Anonymous users or a transient save failure shouldn't block the
          // reading the user is about to see on screen. Keep the question
          // and cards around so they can be restored after login/signup.
          setReadingId(null);
          savePendingReading({ question, cards: storedCards });
        }
      } catch {
        setReadingId(null);
        savePendingReading({ question, cards: storedCards });
      }
      setStatus("revealed");
    });
  };

  const handleReset = () => {
    trackEvent("reading_reset", { from_status: status });
    setQuestion("");
    setPool([]);
    setSelectedSlots([]);
    setReadingId(null);
    setStatus("question");
    clearPendingReading();
  };

  if (status === "revealed") {
    const cards = selectedSlots.map((i) => pool[i]);
    return (
      <ReadingView
        question={question}
        cards={cards}
        readingId={readingId}
        onReset={handleReset}
      />
    );
  }

  if (status === "shuffling") {
    return (
      <ShuffleDeck
        question={question}
        onDone={handleShuffleDone}
        onSkip={handleShuffleSkip}
      />
    );
  }

  if (status === "picking") {
    const remaining = 3 - selectedSlots.length;
    const isReady = remaining === 0;

    return (
      // The deck is taller than a phone viewport, so actions placed after it
      // in flow sit below the fold exactly when the user needs them. They
      // live in a bar pinned to the viewport instead; the padding here
      // reserves the room it would otherwise cover at the end of the page.
      <div className="flex w-full flex-col items-center gap-8 pb-32">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Chọn ba lá bài
          </h1>
          <p className="max-w-md text-sm text-muted">
            Câu hỏi: <span className="text-foreground">“{question}”</span>
          </p>
        </div>

        <ArcDeck
          size={DECK_SPREAD_SIZE}
          interactive
          enlarged
          selectedSlots={selectedSlots}
          onSelectSlot={handleSelectSlot}
        />

        <BottomBar>
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8">
            {/* Trạng thái đọc lên cho screen reader khi số lá đổi: lá bài chỉ
                báo trạng thái bằng vị trí và số thứ tự trên mặt lá. */}
            <p aria-live="polite" className="text-center text-sm text-muted">
              {isReady ? (
                <span className="text-foreground">Đã chọn đủ 3 lá — mở bài để xem luận giải.</span>
              ) : (
                <>Đã chọn {selectedSlots.length}/3 — chọn thêm {remaining} lá.</>
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                className="flex-1 whitespace-nowrap px-4 sm:flex-none sm:px-6"
                onClick={handleReset}
              >
                Chọn câu hỏi khác
              </Button>
              {/* Nút luôn hiện dù chưa đủ lá: ẩn rồi mới hiện làm người dùng
                  không biết bước kế tiếp là gì, và bar nhảy chiều cao. */}
              <Button
                className="flex-1 whitespace-nowrap px-4 sm:flex-none sm:px-6"
                onClick={handleReveal}
                disabled={!isReady}
              >
                Mở lá bài
              </Button>
            </div>
          </div>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Bốc ba lá bài, soi rõ một câu hỏi
        </h1>
        <p className="max-w-md text-sm text-muted">
          Nhập câu hỏi của bạn, chọn ba lá và nhận diễn giải cơ bản ngay trên
          trang, một khoảnh khắc chậm lại để quan sát hoàn cảnh hiện tại.
        </p>
      </div>

      <div className="w-full max-w-md">
        <QuestionForm
          question={question}
          onChange={setQuestion}
          onSubmit={handleStartDraw}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <ArcDeck size={16} />
    </div>
  );
}
