"use client";

import Link from "next/link";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
}

export function QuestionForm({ question, onChange, onSubmit, disabled }: QuestionFormProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Textarea
        value={question}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Nhập một câu hỏi về tình cảm, công việc, tài chính hoặc định hướng cá nhân..."
        rows={3}
        maxLength={MAX_LENGTH}
        aria-label="Câu hỏi của bạn"
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{question.length}/{MAX_LENGTH} ký tự</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOPIC_SUGGESTIONS.map((topic) => (
          <button
            key={topic.label}
            type="button"
            onClick={() => onChange(topic.question)}
            className="rounded-full border border-border px-4 py-2 text-xs text-muted transition-colors duration-300 hover:border-accent hover:bg-sage-tint hover:text-accent"
          >
            {topic.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={disabled || question.trim().length === 0}
        className="self-center"
      >
        Bốc 3 lá bài
      </Button>

      <p className="self-center text-center text-xs text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Đăng nhập
        </Link>{" "}
        để dùng tính năng diễn giải chuyên sâu
      </p>
    </div>
  );
}
