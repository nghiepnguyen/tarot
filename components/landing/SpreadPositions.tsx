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
  },
  {
    name: "Hiện tại",
    body:
      "Điều đang thật sự chi phối lúc này, thường là phần bạn nhìn thấy mờ nhất khi đứng quá gần nó.",
    image: "/cards/major-arcana/wheel-of-fortune.jpeg",
    alt: "Lá bài Wheel of Fortune minh họa vị trí Hiện tại",
  },
  {
    name: "Hướng đi",
    body:
      "Không phải một lời phán về tương lai, mà là hướng mà bối cảnh và hiện tại đang mở ra, kèm điều đáng cân nhắc trước khi bạn quyết định.",
    image: "/cards/major-arcana/the-world.jpeg",
    alt: "Lá bài The World minh họa vị trí Hướng đi",
  },
];

export function SpreadPositions() {
  return (
    <div className="flex flex-col gap-12">
      <h2 className="max-w-[24ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
        Ba lá, ba vị trí, một mạch đọc
      </h2>

      {/* Ba vị trí ngang hàng nên ba ô bằng nhau, đánh số theo thứ tự đọc.
          Dưới md ảnh đứng cạnh chữ để mỗi ô không cao bằng cả màn hình. */}
      <ol className="grid gap-4 md:grid-cols-3">
        {POSITIONS.map((position, index) => (
          <li
            key={position.name}
            className="flex gap-5 rounded-2xl border border-border bg-surface p-5 md:flex-col md:p-6"
          >
            <Image
              src={position.image}
              alt={position.alt}
              width={480}
              height={820}
              sizes="(min-width: 768px) 128px, 80px"
              className="h-auto w-20 shrink-0 self-start rounded-xl border border-border md:w-32"
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium tracking-[0.18em] text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                {position.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{position.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
