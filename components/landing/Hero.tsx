import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Ba lá xòe quạt là ảnh bài thật trong `public/cards`, không phải hình dựng
 * bằng div: lá giữa là phần tử LCP của trang nên được `preload`, hai lá bên
 * chỉ trang trí và để lazy.
 */
const FAN = [
  {
    src: "/cards/major-arcana/the-moon.jpeg",
    alt: "Lá bài The Moon trong bộ Ẩn chính",
    className:
      "left-0 top-6 -rotate-12 sm:top-8",
    preload: false,
  },
  {
    src: "/cards/major-arcana/the-star.jpeg",
    alt: "Lá bài The Star trong bộ Ẩn chính",
    className: "left-1/2 top-0 z-10 -translate-x-1/2",
    preload: true,
  },
  {
    src: "/cards/major-arcana/the-sun.jpeg",
    alt: "Lá bài The Sun trong bộ Ẩn chính",
    className: "right-0 top-6 rotate-12 sm:top-8",
    preload: false,
  },
];

export function Hero() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-4xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
          Xem bài tarot online, ba lá cho một câu hỏi
        </h1>

        <p className="max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">
          Nhập câu hỏi, bốc ba lá và đọc luận giải ngay trên trang. Miễn phí,
          không cần tài khoản.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className={buttonClasses("primary", "whitespace-nowrap")}>
            Bốc 3 lá bài
          </Link>
          <Link
            href="#cach-hoat-dong"
            className={buttonClasses("secondary", "whitespace-nowrap")}
          >
            Cách hoạt động
          </Link>
        </div>
      </div>

      <div className="relative mx-auto aspect-[5/4] w-full max-w-md">
        {FAN.map((card) => (
          <div
            key={card.src}
            className={`absolute w-[42%] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_18px_40px_-24px_rgba(51,41,31,0.55)] ${card.className}`}
          >
            <Image
              src={card.src}
              alt={card.alt}
              width={480}
              height={820}
              preload={card.preload}
              sizes="(min-width: 1024px) 200px, (min-width: 640px) 180px, 40vw"
              className="h-auto w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
