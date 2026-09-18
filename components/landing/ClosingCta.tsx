import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Disclaimer } from "@/components/tarot/Disclaimer";

export function ClosingCta() {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h2 className="max-w-[20ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
        Câu hỏi của bạn là gì?
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonClasses("primary", "whitespace-nowrap")}>
          Bốc 3 lá bài
        </Link>
        <Link href="/signup" className={buttonClasses("secondary", "whitespace-nowrap")}>
          Tạo tài khoản
        </Link>
      </div>

      <div className="max-w-[62ch]">
        <Disclaimer />
      </div>
    </div>
  );
}
