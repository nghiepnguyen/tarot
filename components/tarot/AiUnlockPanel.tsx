"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Link2, ListChecks, MessageCircleQuestion, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCreditStatusAction, unlockAiInterpretationAction, type CreditStatus } from "@/app/actions/ai";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS, type DisplayInterpretation } from "@/lib/ai/interpretation";

interface AiUnlockPanelProps {
  readingId: string;
  initialData?: DisplayInterpretation | null;
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Link2;
  children: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <h5 className="text-sm font-medium text-foreground">{children}</h5>
    </div>
  );
}

export function AiUnlockPanel({ readingId, initialData }: AiUnlockPanelProps) {
  const [data, setData] = useState<DisplayInterpretation | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    getCreditStatusAction().then((status) => {
      if (!cancelled) setCreditStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const handleUnlock = () => {
    setError(null);
    startTransition(async () => {
      const result = await unlockAiInterpretationAction(readingId);
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
        getCreditStatusAction().then(setCreditStatus);
      }
    });
  };

  if (data) {
    return (
      <Card className="flex flex-col gap-6 text-left">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-tint">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            </div>
            <h4 className="text-base font-medium text-foreground">Diễn giải chuyên sâu</h4>
          </div>

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

          <p className="text-sm leading-relaxed text-muted">{data.overview}</p>
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {data.perCard.map((entry) => (
            <div key={entry.position} className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
              <p className="text-xs font-medium text-accent">{entry.position}</p>
              {entry.keyMessage ? (
                <p className="text-sm font-medium text-foreground">{entry.keyMessage}</p>
              ) : null}
              <p className="text-sm leading-relaxed text-muted">{entry.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeading icon={Link2}>Mối liên hệ</SectionHeading>
          <p className="text-sm leading-relaxed text-foreground">{data.connections}</p>
        </div>

        {data.actionSuggestions.length > 0 ? (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={ListChecks}>Gợi ý hành động</SectionHeading>
            <ul className="flex flex-col gap-1.5">
              {data.actionSuggestions.map((suggestion) => (
                <li key={suggestion} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <SectionHeading icon={MessageCircleQuestion}>Câu hỏi tự phản tỉnh</SectionHeading>
          <p className="border-l-2 border-accent/40 pl-3 text-sm italic leading-relaxed text-foreground">
            {data.reflectiveQuestion}
          </p>
        </div>

        {data.closingNote ? (
          <div className="flex items-start gap-2 border-t border-border pt-5">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm italic leading-relaxed text-accent">{data.closingNote}</p>
          </div>
        ) : null}
      </Card>
    );
  }

  const remainingUnlocks = creditStatus ? Math.floor(creditStatus.credits / COST_PER_INTERPRETATION) : null;
  const outOfCredits = creditStatus !== null && creditStatus.credits < COST_PER_INTERPRETATION;

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-tint">
        <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-foreground">Diễn giải chuyên sâu</h4>
        <p className="max-w-xs text-sm text-muted">
          Ứng dụng phân tích chi tiết từng lá bài và mối liên hệ giữa chúng.
        </p>
      </div>

      {!outOfCredits && creditStatus && !creditStatus.hasPurchased ? (
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          {`Miễn phí ${remainingUnlocks}/${FREE_TRIAL_UNLOCKS} lượt còn lại`}
        </span>
      ) : null}

      {outOfCredits ? (
        <Link
          href="/profile"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent bg-accent px-6 py-3 text-sm font-medium tracking-wide text-accent-foreground transition-colors duration-300 hover:opacity-90"
        >
          {creditStatus?.hasPurchased
            ? "Hết credit — Nạp thêm để tiếp tục"
            : "Bạn đã dùng hết lượt miễn phí — Nạp thêm để tiếp tục"}
        </Link>
      ) : (
        <Button
          variant="primary"
          disabled={isPending}
          onClick={handleUnlock}
          className="cursor-pointer shadow-md shadow-accent/25 transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/35 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isPending ? (
            "Đang tạo diễn giải..."
          ) : (
            <>
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              {`Mở khóa diễn giải chuyên sâu (${COST_PER_INTERPRETATION} credit)`}
            </>
          )}
        </Button>
      )}

      {error && !outOfCredits ? (
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
    </Card>
  );
}
