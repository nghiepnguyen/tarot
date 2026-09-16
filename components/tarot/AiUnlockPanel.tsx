"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Link2, ListChecks, MessageCircleQuestion, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterpretationLoader } from "@/components/tarot/InterpretationLoader";
import { trackEvent } from "@/lib/analytics/gtag";
import { getCreditStatusAction, unlockAiInterpretationAction, type CreditStatus } from "@/app/actions/ai";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS, type DisplayInterpretation } from "@/lib/ai/interpretation";

interface AiUnlockPanelProps {
  readingId: string;
  initialData?: DisplayInterpretation | null;
}

// Cỡ chữ gốc của cả phần diễn giải; mọi dòng bên trong đo bằng `em` theo nó,
// nên chỉnh toàn bộ tỉ lệ chỉ phải sửa đúng hằng số này. 20px cho thân bài
// 17.5px — to hơn thang mặc định của trang (14px) vì đây là đoạn đọc lâu
// nhất trong sản phẩm, nhưng không lấn át phần còn lại của màn hình.
const INTERPRETATION_BASE_TEXT = "text-xl";
// Câu chủ đề, dòng duy nhất được phép to nhất trong thẻ.
const LEAD = "text-[1em]";
// Toàn bộ văn xuôi.
const BODY = "text-[0.875em]";
// Nhãn phân mục: chữ nhỏ, viết hoa, giãn chữ. Tách bậc bằng kiểu chữ thay vì
// bằng cỡ chữ lớn hơn, để mắt luôn phân biệt được đâu là nhãn và đâu là nội
// dung khi lướt nhanh qua một thẻ dài.
const LABEL = "text-[0.7em] font-medium uppercase tracking-[0.12em]";

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Link2;
  children: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-[1.4em] w-[1.4em] shrink-0 text-accent" aria-hidden="true" />
      <h5 className={`${LABEL} text-muted`}>{children}</h5>
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

  const remainingUnlocks = creditStatus ? Math.floor(creditStatus.credits / COST_PER_INTERPRETATION) : null;
  const outOfCredits = creditStatus !== null && creditStatus.credits < COST_PER_INTERPRETATION;
  const isOnFreeTrial = !outOfCredits && creditStatus !== null && !creditStatus.hasPurchased;

  // Impression của panel khoá: mẫu số để tính tỉ lệ chuyển đổi sang unlock.
  useEffect(() => {
    if (data || !creditStatus) return;
    trackEvent("ai_unlock_view", {
      reading_id: readingId,
      is_free_trial: isOnFreeTrial,
      out_of_credits: outOfCredits,
      credits_left: creditStatus.credits,
    });
  }, [data, creditStatus, readingId, isOnFreeTrial, outOfCredits]);

  const handleUnlock = () => {
    setError(null);
    trackEvent("ai_unlock_click", {
      reading_id: readingId,
      is_free_trial: isOnFreeTrial,
      credits_left: creditStatus?.credits,
    });
    startTransition(async () => {
      const result = await unlockAiInterpretationAction(readingId);
      if (result.ok) {
        setData(result.data);
        trackEvent("ai_unlock_success", {
          reading_id: readingId,
          is_free_trial: isOnFreeTrial,
          credits_spent: COST_PER_INTERPRETATION,
        });
      } else {
        setError(result.error);
        trackEvent("ai_unlock_error", { reading_id: readingId, error: result.error });
        getCreditStatusAction().then(setCreditStatus);
      }
    });
  };

  if (data) {
    return (
      // Chữ ở đây lớn hơn phần còn lại của trang, nên padding mặc định của
      // Card làm dòng trên điện thoại ngắn tới mức khó đọc; thu padding ngang
      // lại thay vì giảm cỡ chữ.
      <Card
        className={`flex flex-col gap-7 text-left max-sm:p-6 ${INTERPRETATION_BASE_TEXT}`}
      >
        <div className="flex flex-col gap-4">
          {/* Tên phần chạy như một nhãn nhỏ phía trên, nhường vai trò dòng
              lớn nhất cho câu chủ đề — thứ người dùng thật sự đến để đọc. */}
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Sparkles className="h-[1.4em] w-[1.4em] shrink-0 text-accent" aria-hidden="true" />
            <h4 className={`${LABEL} text-muted`}>Diễn giải chuyên sâu</h4>
          </div>

          {data.summary ? (
            <p className={`${LEAD} font-medium leading-snug text-foreground`}>
              {data.summary}
            </p>
          ) : null}

          <p className={`${BODY} leading-relaxed text-muted`}>{data.overview}</p>

          {data.themes && data.themes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.themes.map((theme) => (
                <span
                  key={theme}
                  // Sage trên nền sage-tint ở light mode chỉ đạt 3.9:1, dưới
                  // ngưỡng 4.5:1 cho chữ nhỏ; chữ nền tối giữ được sắc thái
                  // của chip mà vẫn đọc được.
                  className={`rounded-full bg-sage-tint px-[0.9em] py-[0.35em] ${LABEL} text-foreground`}
                >
                  {theme}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {data.perCard.map((entry) => (
            <div key={entry.position} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0">
              {/* Cùng lý do tương phản như chip: accent trên nền surface chỉ
                  đạt 4.28:1, nên bậc của nhãn do kiểu chữ gánh, không do màu. */}
              <p className={`${LABEL} text-foreground`}>{entry.position}</p>
              {entry.keyMessage ? (
                <p className={`${BODY} font-medium leading-snug text-foreground`}>
                  {entry.keyMessage}
                </p>
              ) : null}
              <p className={`${BODY} leading-relaxed text-muted`}>{entry.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionHeading icon={Link2}>Mối liên hệ</SectionHeading>
          <p className={`${BODY} leading-relaxed text-foreground`}>{data.connections}</p>
        </div>

        {data.actionSuggestions.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <SectionHeading icon={ListChecks}>Gợi ý hành động</SectionHeading>
            <ul className="flex flex-col gap-2">
              {data.actionSuggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  className={`flex items-start gap-2.5 ${BODY} leading-relaxed text-foreground`}
                >
                  <span
                    className="mt-[0.65em] h-[0.35em] w-[0.35em] shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <SectionHeading icon={MessageCircleQuestion}>Câu hỏi tự phản tỉnh</SectionHeading>
          {/* Câu hỏi là thứ người dùng mang đi sau khi đóng trang, nên nó
              được nền riêng thay vì trôi lẫn vào các đoạn văn quanh nó. */}
          <p
            className={`rounded-xl border-l-2 border-accent bg-sage-tint px-[1.1em] py-[0.9em] ${BODY} italic leading-relaxed text-foreground`}
          >
            {data.reflectiveQuestion}
          </p>
        </div>

        {data.closingNote ? (
          <div className="flex items-start gap-2.5 border-t border-border pt-5">
            <Quote className="mt-[0.2em] h-[1.2em] w-[1.2em] shrink-0 text-accent/70" aria-hidden="true" />
            <p className={`${BODY} italic leading-relaxed text-muted`}>{data.closingNote}</p>
          </div>
        ) : null}
      </Card>
    );
  }

  // The generation takes tens of seconds, so the whole panel switches to the
  // loader rather than leaving the CTA sitting there with disabled button text.
  if (isPending) {
    return (
      <Card className="text-center">
        <InterpretationLoader />
      </Card>
    );
  }

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

      {isOnFreeTrial ? (
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
          {`Miễn phí ${remainingUnlocks}/${FREE_TRIAL_UNLOCKS} lượt còn lại`}
        </span>
      ) : null}

      {outOfCredits ? (
        <Link
          href="/credits"
          onClick={() =>
            trackEvent("topup_prompt_click", {
              reading_id: readingId,
              has_purchased: creditStatus?.hasPurchased ?? false,
            })
          }
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent bg-accent px-6 py-3 text-sm font-medium tracking-wide text-accent-foreground transition-colors duration-300 hover:opacity-90"
        >
          {creditStatus?.hasPurchased
            ? "Hết credit — Nạp thêm để tiếp tục"
            : "Bạn đã dùng hết lượt miễn phí — Nạp thêm để tiếp tục"}
        </Link>
      ) : (
        <Button
          variant="primary"
          onClick={handleUnlock}
          className="cursor-pointer shadow-md shadow-accent/25 transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/35"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isOnFreeTrial
            ? "Mở khóa diễn giải chuyên sâu"
            : `Mở khóa diễn giải chuyên sâu (${COST_PER_INTERPRETATION} credit)`}
        </Button>
      )}

      {error && !outOfCredits ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              trackEvent("ai_unlock_retry", { reading_id: readingId });
              handleUnlock();
            }}
            className="text-sm text-accent hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : null}
    </Card>
  );
}
