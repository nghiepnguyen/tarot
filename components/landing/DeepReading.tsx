import Image from "next/image";

const PARTS = [
  {
    title: "Tổng quan",
    body: "Đọc ba lá như một câu chuyện liền mạch thay vì ba mẩu rời.",
  },
  {
    title: "Từng lá",
    body: "Ý nghĩa của mỗi lá đặt đúng vào vị trí nó rơi vào trong trải bài.",
  },
  {
    title: "Mối liên hệ",
    body: "Chỗ ba lá củng cố nhau và chỗ chúng kéo về hai hướng khác nhau.",
  },
  {
    title: "Gợi ý hành động",
    body: "Vài việc cụ thể đủ nhỏ để bắt đầu trong tuần này.",
  },
  {
    title: "Câu hỏi tự phản tỉnh",
    body: "Những câu để bạn tự trả lời, phần mà không bản đọc nào làm thay được.",
  },
];

export function DeepReading() {
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[1fr_0.75fr] lg:gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="max-w-[24ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
            Khi luận giải cơ bản là chưa đủ
          </h2>
          <p className="max-w-[58ch] text-base leading-relaxed text-muted">
            Bản diễn giải chuyên sâu do AI viết riêng cho câu hỏi và đúng ba lá
            bạn vừa bốc. Mỗi bản mất khoảng nửa phút để soạn và gồm năm phần.
          </p>
        </div>

        <ul className="flex flex-col gap-5">
          {PARTS.map((part) => (
            <li key={part.title} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <span className="w-44 shrink-0 text-sm font-medium tracking-tight text-foreground">
                {part.title}
              </span>
              <span className="max-w-[52ch] text-sm leading-relaxed text-muted">
                {part.body}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto w-full max-w-[18rem] overflow-hidden rounded-2xl border border-border bg-sage-tint p-8">
        <Image
          src="/cards/major-arcana/the-high-priestess.jpeg"
          alt="Lá bài The High Priestess trong bộ Ẩn chính"
          width={480}
          height={820}
          sizes="(min-width: 1024px) 220px, 200px"
          className="h-auto w-full rounded-xl border border-border"
        />
      </div>
    </div>
  );
}
