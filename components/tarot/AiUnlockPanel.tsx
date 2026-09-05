"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { unlockAiInterpretationAction } from "@/app/actions/ai";
import { COST_PER_INTERPRETATION, type InterpretationResult } from "@/lib/ai/interpretation";

interface AiUnlockPanelProps {
  readingId: string;
  initialData?: InterpretationResult | null;
}

export function AiUnlockPanel({ readingId, initialData }: AiUnlockPanelProps) {
  const [data, setData] = useState<InterpretationResult | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = () => {
    setError(null);
    startTransition(async () => {
      const result = await unlockAiInterpretationAction(readingId);
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    });
  };

  if (data) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-sage-tint/40 p-5">
        <div>
          <h4 className="text-sm font-medium text-foreground">Diễn giải AI</h4>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{data.overview}</p>
        </div>

        <div className="flex flex-col gap-3">
          {data.perCard.map((entry) => (
            <div key={entry.position}>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                {entry.position}
              </p>
              <p className="text-sm leading-relaxed text-foreground">{entry.text}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            Mối liên hệ
          </p>
          <p className="text-sm leading-relaxed text-foreground">{data.connections}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            Gợi ý hành động
          </p>
          <p className="text-sm leading-relaxed text-foreground">{data.actionSuggestions}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            Câu hỏi tự phản tỉnh
          </p>
          <p className="text-sm italic leading-relaxed text-foreground">
            {data.reflectiveQuestion}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-5">
      <Button variant="secondary" disabled={isPending} onClick={handleUnlock}>
        {isPending
          ? "Đang tạo diễn giải..."
          : `Mở khóa diễn giải AI (${COST_PER_INTERPRETATION} credit)`}
      </Button>
      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={handleUnlock}
            className="text-xs text-accent hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : null}
    </div>
  );
}
