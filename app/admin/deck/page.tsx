import Image from "next/image";
import { requireAdmin } from "@/lib/auth/admin";
import { TAROT_CARDS, type TarotCategory } from "@/lib/tarot/cards";
import { PageHeader } from "@/components/admin/Panel";

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bộ bài"
        description={
          <>
            {TAROT_CARDS.length} lá, đọc từ <code className="font-mono text-xs">lib/tarot/cards.ts</code>. Sửa nội dung
            bằng cách sửa file đó rồi deploy — không có đường nào sửa từ đây.
          </>
        }
        meta={ORDER.map((category) => (
          <a key={category} href={`#${category}`} className="text-accent hover:underline">
            {CATEGORY_LABEL[category]} ({TAROT_CARDS.filter((card) => card.category === category).length})
          </a>
        ))}
      />

      {ORDER.map((category) => {
        const cards = TAROT_CARDS.filter((card) => card.category === category);
        return (
          <section key={category} id={category} className="flex scroll-mt-6 flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              {CATEGORY_LABEL[category]} <span className="text-muted">({cards.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="flex gap-3 rounded-lg border border-border bg-surface p-3"
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
