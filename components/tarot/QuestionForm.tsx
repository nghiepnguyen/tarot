"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WalletCards } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/gtag";

const MAX_LENGTH = 300;

const TOPIC_SUGGESTIONS = [
  { label: "Tình yêu", question: "Mối quan hệ hiện tại của tôi sẽ phát triển như thế nào?" },
  { label: "Công việc", question: "Tôi nên tập trung vào điều gì trong công việc lúc này?" },
  { label: "Tài chính", question: "Tôi nên nhìn nhận thế nào về tình hình tài chính hiện tại?" },
  { label: "Phát triển bản thân", question: "Điều gì đang cản trở sự phát triển của tôi lúc này?" },
];

interface QuestionFormProps {
  question: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** Canh nút bốc bài theo lề trái từ lg, khi form nằm ở cột trái. */
  alignStart?: boolean;
}

export function QuestionForm({
  question,
  onChange,
  onSubmit,
  disabled,
  alignStart = false,
}: QuestionFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const canSubmit = !disabled && question.trim().length > 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <Textarea
        value={question}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Nhập câu hỏi mở, tập trung vào bản thân và hướng đến hành động thay vì hỏi kết quả cố định hoặc phán xét người khác."
        rows={4}
        maxLength={MAX_LENGTH}
        aria-label="Câu hỏi của bạn"
      />
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{question.length}/{MAX_LENGTH} ký tự</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOPIC_SUGGESTIONS.map((topic) => (
          <button
            key={topic.label}
            type="button"
            onClick={() => {
              trackEvent("question_suggestion_click", { topic: topic.label });
              onChange(topic.question);
            }}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-sm text-muted transition-colors duration-300 hover:border-accent hover:bg-sage-tint hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* A one-shot pop the moment the question makes the draw possible:
          the button is the only way forward from here, and it sat inert
          long enough that people stopped looking at it. */}
      <motion.div
        className={`mt-2 flex w-full justify-center ${alignStart ? "lg:justify-start" : ""}`}
        animate={canSubmit && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full px-8 py-4 text-base sm:w-auto"
        >
          <WalletCards className="h-5 w-5 shrink-0" aria-hidden="true" />
          Bốc 3 lá bài
        </Button>
      </motion.div>

    </div>
  );
}
