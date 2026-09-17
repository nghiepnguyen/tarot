import { type ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/seo/site";

type Tone = "pending" | "warning";

/**
 * Khung chung cho mọi trang đứng ngoài phiên đăng nhập: xác nhận email, quên
 * mật khẩu, đặt lại mật khẩu.
 *
 * Chúng là nhiều trạng thái của cùng một việc "tài khoản chưa vào được", nên
 * phải trông như một chỗ chứ không phải bảy trang rời nhau: cùng huy hiệu
 * trạng thái, cùng thứ tự tiêu đề → giải thích → hành động → lối thoát.
 *
 * `tone` chỉ đổi màu huy hiệu. Màu không phải tín hiệu duy nhất — icon và tiêu
 * đề đã nói rõ trạng thái, nên người không phân biệt được màu không mất gì.
 */
export function AuthCard({
  tone = "pending",
  icon,
  title,
  description,
  children,
  footer,
}: {
  tone?: Tone;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  /** Dòng lối thoát riêng của từng trang, đặt trên dòng hỗ trợ dùng chung. */
  footer?: ReactNode;
}) {
  // `earth` thuộc bảng màu minh hoạ, không phải bảng tương tác — dùng cho một
  // huy hiệu tĩnh thì accent vẫn là màu bấm được duy nhất trên trang.
  const badgeTone =
    tone === "warning" ? "bg-earth/15 text-earth" : "bg-sage-tint text-accent";

  return (
    <Card className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${badgeTone}`}
        >
          {icon}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted">{description}</p>
        </div>
      </div>

      {children}

      <div className="flex flex-col items-center gap-1 border-t border-border pt-5 text-center text-sm text-muted">
        {footer}
        <p>
          Cần hỗ trợ?{" "}
          <a
            href={supportMailto("Xác nhận email")}
            className="underline underline-offset-4 transition-colors duration-200 hover:text-accent"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </Card>
  );
}

/**
 * Ba bước của việc đăng ký, với bước đang đứng được tô đậm. Người dùng vừa bị
 * đẩy ra khỏi form và bảo đi mở hộp thư — cho họ thấy họ đang ở đâu thì việc
 * rời trang bớt giống như bị bỏ rơi giữa chừng.
 */
export function VerificationSteps({ current }: { current: number }) {
  const steps = ["Tạo tài khoản", "Xác nhận email", "Nhận credit dùng thử"];

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : done
                    ? "border-accent bg-sage-tint text-accent"
                    : "border-border bg-background text-muted"
              }`}
            >
              {/* Bước đã xong hiện dấu tick chứ không phải con số: số nhỏ 12px
                  màu accent trên nền sage-tint không đạt 4.5:1, còn icon là
                  đồ hoạ nên ngưỡng là 3:1 và nó vượt qua. */}
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={`text-sm ${active ? "font-medium text-foreground" : "text-muted"}`}
            >
              {label}
              {active ? <span className="sr-only"> — bước hiện tại</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Dòng "đã có lối khác" ở chân thẻ, cùng một kiểu chữ ở mọi trang. */
export function AuthCardLink({ href, prompt, label }: { href: string; prompt: string; label: string }) {
  return (
    <p>
      {prompt}{" "}
      <Link
        href={href}
        className="font-medium text-accent underline underline-offset-4 transition-colors duration-200 hover:text-foreground"
      >
        {label}
      </Link>
    </p>
  );
}
