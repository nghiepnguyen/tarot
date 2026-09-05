"use client";

import { useState } from "react";
import { ArcDeck } from "@/components/tarot/ArcDeck";
import { QuestionForm } from "@/components/tarot/QuestionForm";
import { ReadingView } from "@/components/tarot/ReadingView";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { drawSpreadPool, DECK_SPREAD_SIZE } from "@/lib/tarot/draw";
import type { DrawnCard } from "@/lib/tarot/draw";

type Status = "question" | "picking" | "revealed";

export function TarotExperience() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("question");
  const [pool, setPool] = useState<DrawnCard[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const { showToast } = useToast();

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
    setStatus("revealed");
  };

  const handleReset = () => {
    setQuestion("");
    setPool([]);
    setSelectedSlots([]);
    setStatus("question");
  };

  if (status === "revealed") {
    const cards = selectedSlots.map((i) => pool[i]);
    return <ReadingView question={question} cards={cards} onReset={handleReset} />;
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
