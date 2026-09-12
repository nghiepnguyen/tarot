"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="flex w-full flex-col gap-4">
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

      {readings.map((reading) => {
        const cardNames = reading.cards
          .map((stored) => cardLookup(stored.cardId)?.name)
          .filter((name): name is string => Boolean(name));

        return (
          <details
            key={reading.id}
            className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-sm text-foreground">“{reading.question}”</p>
                <p className="truncate text-sm text-muted">
                  {new Date(reading.createdAt).toLocaleString("vi-VN")}
                  {cardNames.length > 0 ? ` · ${cardNames.join(", ")}` : null}
                </p>
              </div>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="flex flex-col gap-4 border-t border-border p-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(() => {
                      void deleteReadingAction(reading.id);
                    });
                  }}
                  className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted transition-colors duration-300 hover:text-red-600"
                >
                  Xóa lần trải bài này
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {reading.cards.map((stored, i) => {
                  const card = cardLookup(stored.cardId);
                  if (!card) return null;
                  const isReversed = stored.orientation === "reversed";
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-sm font-medium uppercase tracking-[0.15em] text-muted">
                        {stored.position}
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {card.name}{" "}
                        <span className="text-sm font-normal text-muted">
                          ({isReversed ? "ngược" : "xuôi"})
                        </span>
                      </p>
                      <p className="text-sm leading-relaxed text-muted">
                        {isReversed ? card.reversedMeaning : card.basicMeaning}
                      </p>
                    </div>
                  );
                })}
              </div>

              <AiUnlockPanel readingId={reading.id} initialData={reading.aiInterpretation} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
