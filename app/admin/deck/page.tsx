import Image from "next/image";
import { requireAdmin } from "@/lib/auth/admin";
import { TAROT_CARDS, type TarotCategory } from "@/lib/tarot/cards";

const CATEGORY_LABEL: Record<TarotCategory, string> = {
  "major-arcana": "Ẩn Chính",
  cups: "Cốc",
  pentacles: "Tiền",
  swords: "Kiếm",
  wands: "Gậy",
};

const ORDER: TarotCategory[] = ["major-arcana", "cups", "pentacles", "swords", "wands"];

/**
 * Chỉ đọc, có chủ đích. Bộ bài nằm static trong `lib/tarot/cards.ts`: sửa nội
 * dung vẫn đi qua code review và deploy, không qua form. Trang này để tra cứu
 * lúc trả lời khách, không phải để biên tập.
 */
export default async function AdminDeckPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bộ bài</h1>
        <p className="text-sm text-muted">
          {TAROT_CARDS.length} lá, đọc từ <code className="font-mono text-xs">lib/tarot/cards.ts</code>. Sửa nội dung
          bằng cách sửa file đó rồi deploy — không có đường nào sửa từ đây.
        </p>
      </div>

      {ORDER.map((category) => {
        const cards = TAROT_CARDS.filter((card) => card.category === category);
        return (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {CATEGORY_LABEL[category]} <span className="text-muted">({cards.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
                >
                  <Image
                    src={card.image}
                    alt=""
                    width={64}
                    height={110}
                    className="h-auto w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{card.name}</h3>
                    <p className="text-xs text-muted">{card.keywords.join(" · ")}</p>
                    <p className="text-xs text-foreground">{card.basicMeaning}</p>
                    <p className="text-xs text-muted">Ngược: {card.reversedMeaning}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
