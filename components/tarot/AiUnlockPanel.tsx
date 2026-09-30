"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Link2, ListChecks, LockKeyhole, MessageCircleQuestion, Quote, Sparkles } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterpretationLoader } from "@/components/tarot/InterpretationLoader";
import { InterpretationReviewBox } from "@/components/tarot/InterpretationReviewBox";
import { CardNameText } from "@/components/tarot/CardNameText";
import { trackEvent } from "@/lib/analytics/gtag";
import { getCreditStatusAction, unlockAiInterpretationAction, type CreditStatus } from "@/app/actions/ai";
import { buildReadingTeaser, quoteQuestion } from "@/lib/tarot/teaser";
import { SPREAD_POSITIONS, type DrawnCard } from "@/lib/tarot/draw";
import { SAVE_READING_LIMIT_PER_HOUR } from "@/lib/tarot/limits";
import type { SaveFailureReason } from "@/components/tarot/TarotExperience";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS, type DisplayInterpretation } from "@/lib/ai/interpretation";

interface AiUnlockPanelProps {
  readingId: string;
  initialData?: DisplayInterpretation | null;
  /** Ba lá vừa lật, dùng dựng mấy dòng gợi mở ở trạng thái chưa mở khóa. */
  cards?: DrawnCard[];
  /** Câu hỏi của trải bài, để mấy dòng gợi mở nói thẳng về nó. */
  question?: string;
}

// Cỡ chữ gốc của cả phần diễn giải; mọi dòng bên trong đo bằng `em` theo nó,
// nên chỉnh toàn bộ tỉ lệ chỉ phải sửa đúng hằng số này. 20px cho thân bài
// 17.5px — to hơn thang mặc định của trang (14px) vì đây là đoạn đọc lâu
// nhất trong sản phẩm, nhưng không lấn át phần còn lại của màn hình.
const INTERPRETATION_BASE_TEXT = "text-xl";
// Câu chủ đề, dòng duy nhất được phép to nhất trong thẻ.
const LEAD = "text-[1.3em]";
// Tiêu đề hộp và tên vị trí lá bài — bậc cao nhất trong số các tiêu đề.
//
// Trước đây cả ba bậc tiêu đề đều dùng chung một nhãn 14px viết hoa: tên hộp,
// tên mục và tên vị trí trông y hệt nhau, nên mắt không có mốc nào để bám khi
// lướt qua một thẻ dài hơn một nghìn từ. Giờ tách bằng cỡ chữ thật:
// 26 / 23 / 20 / 17.5px trên thang gốc 20px.
const HEADING = "text-[1.15em] font-semibold tracking-tight";
// Tiêu đề mục phụ, nằm dưới HEADING một bậc.
const SECTION = "text-[1em] font-semibold";
// Câu chốt của mỗi lá: giữa tên vị trí và văn xuôi.
const KEY_MESSAGE = "text-[0.95em] font-medium";
// Toàn bộ văn xuôi.
const BODY = "text-[0.875em]";
// Chip chủ đề: vẫn nhỏ, viết hoa, giãn chữ. Đây là nhãn thật, không phải tiêu
// đề — giữ nhỏ để nó không tranh chỗ với các bậc ở trên.
const CHIP = "text-[0.7em] font-medium uppercase tracking-[0.12em]";

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Link2;
  children: string;
}) {
  // Cỡ chữ đặt ở thẻ bọc để icon đo theo chính tiêu đề của nó: trước đây icon
  // đo theo cỡ gốc của thẻ nên to 28px cạnh dòng chữ 14px, và cái đập vào mắt
  // trước là icon chứ không phải tên mục.
  return (
    <div className={`flex items-center gap-2.5 ${SECTION} text-foreground`}>
      <Icon className="h-[1.15em] w-[1.15em] shrink-0 text-accent" aria-hidden="true" />
      <h5>{children}</h5>
    </div>
  );
}

export function AiUnlockPanel({ readingId, initialData, cards, question }: AiUnlockPanelProps) {
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

  // Ba lá vào đúng ô diễn giải của nó. `perCard[i].position` là tên vị trí do
  // model giữ lại, còn `cards` về theo thứ tự bốc, khớp `SPREAD_POSITIONS` theo
  // chỉ số — nên tra theo tên trước, hụt thì lùi về chỉ số. Thiếu `cards` (một
  // vài đường gọi cũ không truyền) thì phần chữ vẫn chạy y như trước, chỉ không
  // có ảnh.
  const cardByPosition = new Map<string, DrawnCard>();
  cards?.forEach((drawn, i) => {
    const position = SPREAD_POSITIONS[i];
    if (position) cardByPosition.set(position, drawn);
  });
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
          <div
            className={`flex items-center gap-2.5 border-b border-border pb-4 ${HEADING} text-foreground`}
          >
            <Sparkles className="h-[1.15em] w-[1.15em] shrink-0 text-accent" aria-hidden="true" />
            <h4>Diễn giải chuyên sâu</h4>
          </div>

          {/* Bút danh của model đã viết bài này. Người đọc chấm điểm ở cuối
              thẻ, nên tên người viết phải nằm ở đầu — chấm xong mới biết mình
              vừa chấm ai thì con số không còn nghĩa. Bài sinh bằng model đã gỡ
              khỏi danh sách không có bút danh, và dòng này biến mất hẳn. */}
          {data.reader ? (
            <p className="text-[0.75em] tracking-wide text-muted">
              Tarot Reader: <span className="font-medium text-foreground">{data.reader}</span>
            </p>
          ) : null}

          {data.summary ? (
            <p className={`${LEAD} font-medium leading-snug text-foreground`}>
              <CardNameText text={data.summary} />
            </p>
          ) : null}

          <p className={`${BODY} leading-relaxed text-muted`}>
            <CardNameText text={data.overview} />
          </p>

          {data.themes && data.themes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.themes.map((theme) => (
                <span
                  key={theme}
                  // Sage trên nền sage-tint ở light mode chỉ đạt 3.9:1, dưới
                  // ngưỡng 4.5:1 cho chữ nhỏ; chữ nền tối giữ được sắc thái
                  // của chip mà vẫn đọc được.
                  className={`rounded-full bg-sage-tint px-[0.9em] py-[0.35em] ${CHIP} text-foreground`}
                >
                  <CardNameText text={theme} />
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {data.perCard.map((entry, index) => {
            const drawn = cardByPosition.get(entry.position) ?? cards?.[index];
            const isReversed = drawn?.orientation === "reversed";
            return (
              <div
                key={entry.position}
                // Ảnh lá cạnh chữ để mỗi phần có mỏ neo thị giác riêng, không
                // còn là một khối chữ liền. Trên điện thoại ảnh vẫn đứng cạnh
                // chữ (không xuống dòng) — nó đã nhỏ, xuống hàng chỉ tổ tốn
                // chiều cao.
                className="flex gap-4 py-6 first:pt-0 last:pb-0 sm:gap-5"
              >
                {drawn ? (
                  <figure className="flex shrink-0 flex-col items-center gap-1.5">
                    <div
                      className="relative w-16 overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_24px_-16px_rgba(51,41,31,0.35)] sm:w-20"
                      style={{ aspectRatio: "24 / 41" }}
                    >
                      <Image
                        src={drawn.card.image}
                        alt={`${drawn.card.name}, ${isReversed ? "ngược" : "xuôi"}`}
                        fill
                        sizes="80px"
                        className="object-contain"
                        // Lá ngược lật đúng chiều nó nằm trên bàn, khớp với
                        // FlipCard ở phần trên trang.
                        style={{ transform: isReversed ? "rotate(180deg)" : undefined }}
                      />
                    </div>
                    {/* Tên lá là tiếng Anh giữa văn bản tiếng Việt, nên in
                        nghiêng cho tách khỏi phần chữ quanh nó. */}
                    <figcaption className="w-16 text-center text-[0.6em] leading-tight text-muted sm:w-20">
                      <span className="font-bold italic text-foreground">{drawn.card.name}</span>
                      <span className="mt-0.5 block">({isReversed ? "ngược" : "xuôi"})</span>
                    </figcaption>
                  </figure>
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  {/* Tên vị trí là mốc điều hướng của cả phần này — người đọc
                      tìm "Hướng đi" trước khi đọc chữ. Bậc của nó do cỡ chữ và
                      độ đậm gánh, không do màu: accent trên nền surface chỉ đạt
                      4.28:1, dưới ngưỡng 4.5:1. */}
                  <h5 className={`${HEADING} text-foreground`}>
                    <CardNameText text={entry.position} />
                  </h5>
                  {entry.keyMessage ? (
                    <p className={`${KEY_MESSAGE} leading-snug text-foreground`}>
                      <CardNameText text={entry.keyMessage} />
                    </p>
                  ) : null}
                  <p className={`${BODY} leading-relaxed text-muted`}>
                    <CardNameText text={entry.text} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionHeading icon={Link2}>Mối liên hệ</SectionHeading>
          <p className={`${BODY} leading-relaxed text-foreground`}>
            <CardNameText text={data.connections} />
          </p>
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
                  <CardNameText text={suggestion} />
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
            <CardNameText text={data.reflectiveQuestion} />
          </p>
        </div>

        {data.closingNote ? (
          <div className="flex items-start gap-2.5 border-t border-border pt-5">
            <Quote className="mt-[0.2em] h-[1.2em] w-[1.2em] shrink-0 text-accent/70" aria-hidden="true" />
            <p className={`${BODY} italic leading-relaxed text-muted`}>
              <CardNameText text={data.closingNote} />
            </p>
          </div>
        ) : null}

        <InterpretationReviewBox
          interpretationId={data.id}
          reader={data.reader}
          initialReview={data.review}
        />
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
    <LockedDeepReading cards={cards} question={question}>
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
    </LockedDeepReading>
  );
}

// Vỏ chung của thẻ diễn giải lúc chưa mở: tiêu đề, lời giới thiệu và mấy dòng
// gợi mở. Phần hành động (mở khóa, nạp credit, đăng nhập) do chỗ gọi truyền vào.
function LockedDeepReading({
  cards,
  question,
  children,
}: {
  cards?: DrawnCard[];
  question?: string;
  children: ReactNode;
}) {
  const teaser = cards ? buildReadingTeaser(cards, question) : [];
  const quoted = question?.trim() ? quoteQuestion(question) : null;
  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-tint">
        <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-base font-medium text-foreground">Diễn giải chuyên sâu</h4>
        <p className="max-w-xs text-sm text-muted">
          {quoted ? (
            <>
              Từng lá đã hiện nghĩa. Còn điều ba lá thì thầm với nhau về{" "}
              <span className="text-foreground">“{quoted}”</span> vẫn đang khép lại.
            </>
          ) : (
            "Từng lá đã hiện nghĩa. Còn điều ba lá thì thầm với nhau — về đúng câu hỏi của bạn — vẫn đang khép lại."
          )}
        </p>
      </div>

      {/* Mấy dòng này dựng từ chính ba lá vừa lật, không gọi model — người dùng
          chưa trả credit thì chưa được tốn tiền. Chúng nói về hình dạng của cả
          trải bài, phần duy nhất màn hình này chưa có: ý nghĩa từng lá đã in
          ngay phía trên rồi. */}
      {teaser.length > 0 ? (
        <ul className="flex w-full flex-col gap-2 rounded-xl border border-border bg-sage-tint/40 p-4 text-left">
          {teaser.map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {children}
    </Card>
  );
}

// Khách chưa đăng nhập thấy đúng thẻ người đã đăng nhập thấy — cùng tiêu đề,
// cùng mấy dòng gợi mở dựng từ ba lá vừa lật — chỉ khác nút cuối dẫn tới
// đăng nhập. Trước đây chỗ này chỉ là một dòng chữ nhắc đăng nhập, không cho
// thấy người dùng sắp nhận được gì.
export function LoginToUnlockPanel({ cards, question }: { cards: DrawnCard[]; question?: string }) {
  return (
    <LockedDeepReading cards={cards} question={question}>
      <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
        {`Tài khoản mới được miễn phí ${FREE_TRIAL_UNLOCKS} lượt`}
      </span>

      <Link
        href="/login"
        onClick={() => trackEvent("login_prompt_click", { placement: "reading_view" })}
        className={buttonClasses("primary", "shadow-md shadow-accent/25")}
      >
        <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
        Đăng nhập để mở khóa diễn giải chuyên sâu
      </Link>
    </LockedDeepReading>
  );
}

const SAVE_FAILURE_MESSAGES: Record<SaveFailureReason, string> = {
  network: "Chưa lưu được trải bài này do lỗi kết nối. Bạn thử lại nhé.",
  rate_limited: `Bạn đã lưu hơn ${SAVE_READING_LIMIT_PER_HOUR} trải bài trong một giờ qua. Đợi một lúc rồi thử lại nhé.`,
  invalid: "Trải bài này không lưu được. Bạn bấm “Trải bài mới” để bốc lại nhé.",
  // ReadingView chuyển sang lời mời đăng nhập trước khi tới đây; giữ cho đủ kiểu.
  unauthenticated: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé.",
};

// Người đã đăng nhập mà bài chưa lưu được thì chưa có readingId để mở khóa.
// Cho họ thấy đúng lý do — mời họ đăng nhập lần nữa chỉ khiến họ tưởng mình
// bị đăng xuất.
export function UnsavedReadingPanel({
  cards,
  question,
  isSaving,
  failureReason,
  onRetry,
}: {
  cards: DrawnCard[];
  question?: string;
  isSaving: boolean;
  failureReason: SaveFailureReason | null;
  onRetry: () => void;
}) {
  return (
    <LockedDeepReading cards={cards} question={question}>
      {failureReason && !isSaving ? (
        <p className="max-w-xs text-sm text-red-600">{SAVE_FAILURE_MESSAGES[failureReason]}</p>
      ) : null}
      {/* Bài hỏng thì bấm lại cũng không bao giờ lưu được — nút "Trải bài
          mới" ngay bên dưới là lối ra duy nhất. */}
      {failureReason === "invalid" ? null : (
        <Button variant="primary" onClick={onRetry} disabled={isSaving}>
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isSaving ? "Đang lưu trải bài…" : "Thử lại"}
        </Button>
      )}
    </LockedDeepReading>
  );
}
