import Image from "next/image";

/**
 * Ba vị trí đúng bằng `SPREAD_POSITIONS` trong `lib/tarot/draw.ts`. Ảnh minh
 * họa chọn cố định để trang giới thiệu render tĩnh được, khác với trải bài
 * thật vốn bốc ngẫu nhiên.
 */
const POSITIONS = [
  {
    name: "Bối cảnh",
    body:
      "Chuyện đã dẫn bạn tới đây: hoàn cảnh, thói quen và những gì còn tồn đọng từ trước.",
    image: "/cards/major-arcana/the-hermit.jpeg",
    alt: "Lá bài The Hermit minh họa vị trí Bối cảnh",
    cell: "md:col-span-2",
    surface: "bg-surface",
  },
  {
    name: "Hiện tại",
    body:
      "Điều đang thật sự chi phối lúc này, thường là phần bạn nhìn thấy mờ nhất khi đứng quá gần nó.",
    image: "/cards/major-arcana/wheel-of-fortune.jpeg",
    alt: "Lá bài Wheel of Fortune minh họa vị trí Hiện tại",
    cell: "md:col-span-3",
    surface: "bg-sage-tint",
  },
];

const OUTCOME = {
  name: "Hướng đi",
  body:
    "Không phải một lời phán về tương lai, mà là hướng mà bối cảnh và hiện tại đang mở ra, kèm điều đáng cân nhắc trước khi bạn quyết định.",
  image: "/cards/major-arcana/the-world.jpeg",
  alt: "Lá bài The World minh họa vị trí Hướng đi",
};

export function SpreadPositions() {
  return (
    <div className="flex flex-col gap-12">
      <h2 className="max-w-[24ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
        Ba lá, ba vị trí, một mạch đọc
      </h2>

      <div className="grid gap-4 md:grid-cols-5">
        {POSITIONS.map((position) => (
          <article
            key={position.name}
            className={`flex flex-col gap-5 rounded-2xl border border-border p-6 sm:p-8 ${position.cell} ${position.surface}`}
          >
            <Image
              src={position.image}
              alt={position.alt}
              width={480}
              height={820}
              sizes="(min-width: 768px) 140px, 120px"
              className="h-auto w-28 rounded-xl border border-border sm:w-32"
            />
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                {position.name}
              </h3>
              <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
                {position.body}
              </p>
            </div>
          </article>
        ))}

        <article className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8 md:col-span-5">
          <Image
            src={OUTCOME.image}
            alt={OUTCOME.alt}
            width={480}
            height={820}
            sizes="(min-width: 640px) 140px, 120px"
            className="h-auto w-28 shrink-0 rounded-xl border border-border sm:w-32"
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium tracking-tight text-foreground">
              {OUTCOME.name}
            </h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted">
              {OUTCOME.body}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
