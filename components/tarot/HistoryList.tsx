"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteAllReadingsAction, deleteReadingAction } from "@/app/actions/readings";
import { AiUnlockPanel } from "@/components/tarot/AiUnlockPanel";
import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { StoredCard } from "@/app/actions/readings";
import type { DisplayInterpretation } from "@/lib/ai/interpretation";

interface HistoryReading {
  id: string;
  question: string;
  cards: StoredCard[];
  createdAt: string;
  aiInterpretation: DisplayInterpretation | null;
}

interface HistoryListProps {
  readings: HistoryReading[];
}

function cardLookup(cardId: string) {
  return TAROT_CARDS.find((c) => c.id === cardId);
}

export function HistoryList({ readings }: HistoryListProps) {
  const [isPending, startTransition] = useTransition();

  if (readings.length === 0) {
    return (
      <p className="text-sm text-muted">
        Bạn chưa có lần trải bài nào được lưu. Trải bài khi đã đăng nhập để
        xem lại tại đây.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("Xóa toàn bộ lịch sử trải bài?")) return;
            startTransition(() => {
              void deleteAllReadingsAction();
            });
          }}
        >
          Xóa toàn bộ lịch sử
        </Button>
      </div>

      {readings.map((reading) => (
        <Card key={reading.id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-foreground">“{reading.question}”</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(reading.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(() => {
                  void deleteReadingAction(reading.id);
                });
              }}
              className="text-xs text-muted transition-colors duration-300 hover:text-red-600"
            >
              Xóa
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {reading.cards.map((stored, i) => {
              const card = cardLookup(stored.cardId);
              if (!card) return null;
              const isReversed = stored.orientation === "reversed";
              return (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                    {stored.position}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {card.name}{" "}
                    <span className="text-xs font-normal text-muted">
                      ({isReversed ? "ngược" : "xuôi"})
                    </span>
                  </p>
                  <p className="text-xs leading-relaxed text-muted">
                    {isReversed ? card.reversedMeaning : card.basicMeaning}
                  </p>
                </div>
              );
            })}
          </div>

          <AiUnlockPanel readingId={reading.id} initialData={reading.aiInterpretation} />
        </Card>
      ))}
    </div>
  );
}
