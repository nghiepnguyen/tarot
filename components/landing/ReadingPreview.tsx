import Image from "next/image";

/**
 * Bản thu nhỏ của thẻ diễn giải chuyên sâu (`AiUnlockPanel`): cùng thứ tự,
 * cùng cách xếp ảnh lá bên cạnh tên vị trí. Chữ thật chỉ đặt ở chỗ người đọc
 * cần nhận ra (câu hỏi, tóm tắt, tên vị trí và lá, một thông điệp chính); phần
 * còn lại là thanh xám, nên ảnh không giả làm một bản đọc thật.
 */
const ROWS = [
  {
    position: "Bối cảnh",
    card: "Eight of Pentacles",
    image: "/cards/pentacles/eight-of-pentacles.jpg",
    keyMessage: null,
    bars: ["92%", "70%"],
  },
  {
    position: "Hiện tại",
    card: "Two of Swords",
    image: "/cards/swords/two-of-swords.jpg",
    keyMessage: "Bạn đang trì hoãn một lựa chọn vì chờ thêm dữ kiện.",
    bars: ["96%", "84%", "58%"],
  },
  {
    position: "Hướng đi",
    card: "The Star",
    image: "/cards/major-arcana/the-star.jpeg",
    keyMessage: null,
    bars: ["88%", "64%"],
  },
];

function Bar({ width }: { width: string }) {
  return <span className="block h-2 rounded-full bg-border" style={{ width }} />;
}

export function ReadingPreview() {
  return (
    // Mờ dần ở chân thay vì đóng khung trọn: bản đọc thật còn dài hơn nữa.
    <div
      role="img"
      aria-label="Minh họa một bản diễn giải chuyên sâu: câu hỏi về công việc, tóm tắt và ba lá theo vị trí"
      className="pointer-events-none max-h-[38rem] overflow-hidden select-none [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
    >
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-24px_rgba(51,41,31,0.45)] sm:p-6">
        <p className="text-xs text-muted">
          Câu hỏi:{" "}
          <span className="text-foreground">
            “Tôi nên tập trung vào điều gì trong công việc lúc này?”
          </span>
        </p>

        <div className="flex flex-col gap-3">
          <p className="text-base font-medium leading-snug text-foreground">
            Công việc đang cần bạn chọn ít việc hơn, không phải làm nhiều hơn.
          </p>
          <div className="flex flex-col gap-2">
            <Bar width="100%" />
            <Bar width="76%" />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {ROWS.map((row) => (
            <div key={row.position} className="flex gap-4 py-4">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <Image
                  src={row.image}
                  alt=""
                  width={240}
                  height={410}
                  sizes="56px"
                  className="h-auto w-14 rounded-md border border-border"
                />
                <span className="w-14 text-center text-[0.6rem] font-bold italic leading-tight text-foreground">
                  {row.card}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {row.position}
                </span>
                {row.keyMessage ? (
                  <span className="text-sm leading-snug text-foreground">{row.keyMessage}</span>
                ) : null}
                <div className="flex flex-col gap-2 pt-0.5">
                  {row.bars.map((width) => (
                    <Bar key={width} width={width} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
