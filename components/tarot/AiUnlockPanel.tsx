"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { unlockAiInterpretationAction } from "@/app/actions/ai";
import { COST_PER_INTERPRETATION, type DisplayInterpretation } from "@/lib/ai/interpretation";

interface AiUnlockPanelProps {
  readingId: string;
  initialData?: DisplayInterpretation | null;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">{children}</p>
  );
}

export function AiUnlockPanel({ readingId, initialData }: AiUnlockPanelProps) {
  const [data, setData] = useState<DisplayInterpretation | null>(initialData ?? null);
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
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-sage-tint/40 p-5">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-foreground">Diễn giải chuyên sâu</h4>
          {data.summary ? (
            <p className="text-base font-medium leading-relaxed text-foreground">
              {data.summary}
            </p>
          ) : null}
          {data.themes && data.themes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
                >
                  {theme}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-sm leading-relaxed text-foreground">{data.overview}</p>
        </div>

        <div className="flex flex-col gap-3">
          {data.perCard.map((entry) => (
            <div key={entry.position}>
              <SectionLabel>{entry.position}</SectionLabel>
              {entry.keyMessage ? (
                <p className="text-sm font-medium text-foreground">{entry.keyMessage}</p>
              ) : null}
              <p className="text-sm leading-relaxed text-foreground">{entry.text}</p>
            </div>
          ))}
        </div>

        <div>
          <SectionLabel>Mối liên hệ</SectionLabel>
          <p className="text-sm leading-relaxed text-foreground">{data.connections}</p>
        </div>

        {data.actionSuggestions.length > 0 ? (
          <div>
            <SectionLabel>Gợi ý hành động</SectionLabel>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
              {data.actionSuggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <SectionLabel>Câu hỏi tự phản tỉnh</SectionLabel>
          <p className="text-sm italic leading-relaxed text-foreground">
            {data.reflectiveQuestion}
          </p>
        </div>

        {data.closingNote ? (
          <p className="border-t border-border pt-4 text-sm italic leading-relaxed text-accent">
            {data.closingNote}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-5">
      <Button variant="secondary" disabled={isPending} onClick={handleUnlock}>
        {isPending
          ? "Đang tạo diễn giải..."
          : `Mở khóa diễn giải chuyên sâu (${COST_PER_INTERPRETATION} credit)`}
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
