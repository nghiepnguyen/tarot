"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/gtag";
import { submitInterpretationReviewAction } from "@/app/actions/reviews";
import {
  MAX_STARS,
  REVIEW_CRITERIA,
  type InterpretationReviewInput,
  type ReviewCriterionKey,
} from "@/lib/ai/interpretation";

interface InterpretationReviewBoxProps {
  interpretationId: string;
  /** Bút danh đang ký dưới bài — nhắc lại ở đây để người chấm biết mình chấm ai. */
  reader?: string | null;
  /** Điểm đã chấm lần trước, nếu có. Hộp mở sẵn với những sao đã chọn. */
  initialReview?: InterpretationReviewInput | null;
}

type Scores = Record<ReviewCriterionKey, number>;

const EMPTY_SCORES: Scores = { accuracy: 0, clarity: 0, actionability: 0 };

function toScores(review: InterpretationReviewInput | null | undefined): Scores {
  if (!review) return EMPTY_SCORES;
  return {
    accuracy: review.accuracy,
    clarity: review.clarity,
    actionability: review.actionability,
  };
}

/**
 * Một hàng sao cho một tiêu chí.
 *
 * `radiogroup` chứ không phải một dãy nút rời: bàn phím đi vào nhóm một lần
 * rồi chọn bằng mũi tên, và trình đọc màn hình đọc ra "3 trong 5" thay vì năm
 * nút không liên quan gì đến nhau. Nhãn của mỗi sao mang cả tên tiêu chí, vì
 * "3 sao" một mình thì không nói được đang chấm cái gì.
 */
function StarRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {Array.from({ length: MAX_STARS }, (_, index) => index + 1).map((score) => {
        const filled = score <= value;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === value}
            aria-label={`${label}: ${score}/${MAX_STARS} sao`}
            disabled={disabled}
            onClick={() => onChange(score)}
            className="cursor-pointer rounded-full p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Star
              className={`h-6 w-6 ${filled ? "fill-accent text-accent" : "text-border"}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hộp chấm điểm dưới chân mỗi bản diễn giải.
 *
 * Ba tiêu chí là ba câu hỏi khác nhau về cùng một bài đọc, nên chúng chấm rời:
 * một bài đọc rõ ràng mà chẳng gợi được hành động nào là một kết quả có thật,
 * và một điểm tổng duy nhất sẽ giấu mất điều đó.
 *
 * Gửi rồi vẫn sửa được. Người ta bấm vội lúc vừa đọc xong rồi nghĩ lại — khoá
 * hộp sau lần bấm đầu chỉ tạo ra những con số không ai tin.
 */
export function InterpretationReviewBox({
  interpretationId,
  reader,
  initialReview,
}: InterpretationReviewBoxProps) {
  const [scores, setScores] = useState<Scores>(() => toScores(initialReview));
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [saved, setSaved] = useState(Boolean(initialReview));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const complete = REVIEW_CRITERIA.every((criterion) => scores[criterion.key] > 0);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitInterpretationReviewAction({
        interpretationId,
        ...scores,
        comment,
      });
      if (result.ok) {
        setSaved(true);
        trackEvent("interpretation_review_submit", {
          interpretation_id: interpretationId,
          reader: reader ?? "unknown",
          ...scores,
          has_comment: comment.trim().length > 0,
        });
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 text-base">
      <div className="flex flex-col gap-1">
        <h5 className="text-[0.95em] font-semibold text-foreground">
          Bài đọc này thế nào?
        </h5>
        <p className="text-[0.8em] leading-relaxed text-muted">
          {reader
            ? `Chấm giúp ${reader} ba tiêu chí dưới đây. Nhận xét của bạn quyết định người viết nào ở lại.`
            : "Chấm giúp ba tiêu chí dưới đây. Nhận xét của bạn quyết định người viết nào ở lại."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {REVIEW_CRITERIA.map((criterion) => (
          <div
            key={criterion.key}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.85em] font-medium text-foreground">
                {criterion.label} <span className="text-muted">({criterion.english})</span>
              </span>
              <span className="text-[0.75em] leading-relaxed text-muted">{criterion.hint}</span>
            </div>
            <StarRow
              label={criterion.label}
              value={scores[criterion.key]}
              disabled={isPending}
              onChange={(next) => {
                setScores((current) => ({ ...current, [criterion.key]: next }));
                setSaved(false);
              }}
            />
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8em] text-muted">Nhận xét thêm (không bắt buộc)</span>
        <textarea
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setSaved(false);
          }}
          disabled={isPending}
          rows={3}
          maxLength={2000}
          placeholder="Chỗ nào đúng, chỗ nào trật?"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-[0.85em] leading-relaxed text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleSubmit}
          disabled={!complete || isPending}
          className="text-[0.85em]"
        >
          {isPending ? "Đang gửi…" : saved ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </Button>
        {!complete ? (
          <span className="text-[0.75em] text-muted">Chấm đủ ba tiêu chí rồi gửi nhé.</span>
        ) : null}
        {saved && !isPending ? (
          <span className="text-[0.75em] text-accent">Đã ghi nhận. Cảm ơn bạn.</span>
        ) : null}
        {error ? <span className="text-[0.75em] text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}
