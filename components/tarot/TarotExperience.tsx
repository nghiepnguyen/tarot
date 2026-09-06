"use client";

import { startTransition, useEffect, useState } from "react";
import { ArcDeck } from "@/components/tarot/ArcDeck";
import { QuestionForm } from "@/components/tarot/QuestionForm";
import { ReadingView } from "@/components/tarot/ReadingView";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { drawSpreadPool, DECK_SPREAD_SIZE, SPREAD_POSITIONS } from "@/lib/tarot/draw";
import type { DrawnCard } from "@/lib/tarot/draw";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import { saveReadingAction } from "@/app/actions/readings";
import type { StoredCard } from "@/app/actions/readings";

type Status = "question" | "picking" | "revealed";

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

export function TarotExperience() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("question");
  const [pool, setPool] = useState<DrawnCard[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
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
      return;
    }
    setPool(drawSpreadPool());
    setSelectedSlots([]);
    setStatus("picking");
  };

  const handleSelectSlot = (index: number) => {
    setSelectedSlots((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= 3) return prev;
      return [...prev, index];
    });
  };

  const handleReveal = () => {
    if (selectedSlots.length !== 3) return;
    const cards = selectedSlots.map((i) => pool[i]);
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

  if (status === "picking") {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Chọn ba lá bài
          </h1>
          <p className="max-w-md text-sm text-muted">
            Câu hỏi: <span className="text-foreground">“{question}”</span>
          </p>
          <p className="text-xs text-muted">Đã chọn {selectedSlots.length}/3</p>
        </div>

        <ArcDeck
          size={DECK_SPREAD_SIZE}
          interactive
          enlarged
          selectedSlots={selectedSlots}
          onSelectSlot={handleSelectSlot}
        />

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleReset}>
            Chọn câu hỏi khác
          </Button>
          {selectedSlots.length === 3 ? (
            <Button onClick={handleReveal}>Mở lá bài</Button>
          ) : null}
        </div>
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
        />
      </div>

      <ArcDeck size={16} />
    </div>
  );
}
