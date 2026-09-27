"use client";

import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/gtag";
import { FREE_TRIAL_UNLOCKS } from "@/lib/ai/interpretation";

const GUEST_BENEFITS = [
  "Luận giải từng lá theo câu hỏi của bạn",
  "Gợi ý hành động cụ thể cho giai đoạn này",
  "Lưu lại lịch sử để xem lại các trải bài",
];

// Một dòng chữ nhạt "đăng nhập để..." thì người ta lướt qua. Thứ khiến họ
// dừng lại là món quà: nói thẳng con số lượt miễn phí, kể ba điều nhận được,
// và viền sáng chạy chậm quanh thẻ để mắt tìm tới nó.
export function GuestGiftCard() {
  const track = (cta: string) =>
    trackEvent("login_prompt_click", { placement: "question_form", cta });

  return (
    <div className="gift-glow relative overflow-hidden rounded-[1.75rem] p-px">
      <div className="relative flex flex-col items-center gap-4 rounded-[calc(1.75rem-1px)] bg-surface px-5 pt-6 pb-3 text-center sm:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-tint px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          <Gift className="h-3.5 w-3.5" aria-hidden="true" />
          Quà cho tài khoản mới
        </span>

        <h2 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          Nhận miễn phí{" "}
          <span className="text-accent">{FREE_TRIAL_UNLOCKS} lượt diễn giải chuyên sâu</span>
        </h2>

        <ul className="flex flex-col gap-2 text-left text-sm text-muted">
          {GUEST_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-earth" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col items-center gap-1">
          <Link
            href="/login"
            onClick={() => track("login")}
            className={buttonClasses("primary", "w-full whitespace-nowrap shadow-md shadow-accent/25")}
          >
            Đăng nhập nhận quà
          </Link>
          <p className="text-sm text-muted">
            Chưa có tài khoản?{" "}
            <Link
              href="/signup"
              onClick={() => track("signup")}
              className="inline-flex min-h-11 items-center font-medium text-foreground underline decoration-accent underline-offset-4 transition-colors duration-200 hover:text-accent"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
