import { PenLine, Shuffle, ScrollText } from "lucide-react";

// strokeWidth 1.5 khớp với nét của bộ botanical trong `components/ui/Botanical.tsx`,
// để icon chức năng và hình trang trí đứng cạnh nhau không lệch trọng lượng nét.
const ICON_STROKE = 1.5;

const STEPS = [
  {
    title: "Đặt câu hỏi",
    Icon: PenLine,
    body:
      "Viết điều bạn đang phân vân về tình yêu, công việc, tài chính hay chuyện phát triển bản thân. Nếu chưa biết hỏi gì, trang có sẵn gợi ý theo từng chủ đề.",
    offset: "lg:mt-0",
  },
  {
    title: "Bốc ba lá",
    Icon: Shuffle,
    body:
      "Bộ 78 lá được xáo rồi cắt trong khoảng ba giây, sau đó bạn tự chọn ba lá không trùng nhau. Muốn nhanh thì bỏ qua phần xáo bài.",
    offset: "lg:mt-10",
  },
  {
    title: "Đọc luận giải",
    Icon: ScrollText,
    body:
      "Mỗi lá hiện tên, hình, từ khóa và ý nghĩa cơ bản theo vị trí của nó trong trải bài. Câu hỏi được giữ lại bên cạnh để bạn không mất mạch.",
    offset: "lg:mt-20",
  },
];

export function HowItWorks() {
  return (
    <div className="flex flex-col gap-12">
      <h2 className="max-w-[20ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
        Ba phút, từ câu hỏi tới bản luận giải
      </h2>

      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map(({ title, Icon, body, offset }) => (
          <div
            key={title}
            className={`flex flex-col gap-3 border-t border-border pt-6 ${offset}`}
          >
            <Icon
              aria-hidden="true"
              strokeWidth={ICON_STROKE}
              className="h-6 w-6 text-accent"
            />
            <h3 className="text-lg font-medium tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
