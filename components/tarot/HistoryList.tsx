"use client";

import { useTransition } from "react";
import { ChevronDown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/gtag";
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

// Trạng thái diễn giải nằm ngay trên hàng tóm tắt: nếu chỉ hiện bên trong
// phần mở rộng thì phải bung từng lần trải bài mới biết lần nào đã mở.
// Nhãn chữ đi kèm icon, không dựa vào riêng màu để phân biệt.
function InterpretationBadge({ isUnlocked }: { isUnlocked: boolean }) {
  const Icon = isUnlocked ? Sparkles : Lock;
  return (
    <span
      className={`inline-flex w-fit shrink-0 self-start items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${
        isUnlocked
          ? "border-accent bg-sage-tint text-foreground"
          : "border-border bg-transparent text-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {isUnlocked ? "Đã mở diễn giải chuyên sâu" : "Chưa mở diễn giải chuyên sâu"}
    </span>
  );
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
            if (!window.confirm("Xóa toàn bộ lịch sử trải bài?")) {
              trackEvent("history_delete_all_cancelled");
              return;
            }
            trackEvent("history_delete_all", { reading_count: readings.length });
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

        // Dựng lại ba lá cho panel gợi mở. Một lá không tra được (id cũ đã đổi)
        // thì bỏ luôn cả trải bài: `buildReadingTeaser` cần đủ ba lá đúng thứ
        // tự vị trí, thiếu một lá thì nó trả mảng rỗng và panel chỉ mất mấy
        // dòng gợi mở, không hỏng.
        const drawnCards = reading.cards.flatMap((stored) => {
          const card = cardLookup(stored.cardId);
          return card ? [{ card, orientation: stored.orientation }] : [];
        });

        return (
          <details
            key={reading.id}
            className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]"
          >
            <summary
              onClick={(event) => {
                // <details> chưa đổi trạng thái lúc click trên summary; open hiện
                // tại vẫn là trạng thái cũ nên phải đảo lại.
                const isOpening = !event.currentTarget.parentElement?.hasAttribute("open");
                if (isOpening) trackEvent("history_reading_expand", { reading_id: reading.id });
              }}
              className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-sm text-foreground">“{reading.question}”</p>
                <p className="truncate text-sm text-muted">
                  {new Date(reading.createdAt).toLocaleString("vi-VN")}
                  {cardNames.length > 0 ? ` · ${cardNames.join(", ")}` : null}
                </p>
                <InterpretationBadge isUnlocked={reading.aiInterpretation !== null} />
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
                    trackEvent("history_delete_one", { reading_id: reading.id });
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
                        {/* Tên lá tiếng Anh, in nghiêng như các nơi khác. */}
                        <span className="italic">{card.name}</span>{" "}
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

              <AiUnlockPanel
                readingId={reading.id}
                initialData={reading.aiInterpretation}
                cards={drawnCards}
                question={reading.question}
              />
            </div>
          </details>
        );
      })}
    </div>
  );
}
