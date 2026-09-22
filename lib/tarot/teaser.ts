import type { TarotCategory } from "./cards";
import { SPREAD_POSITIONS, type DrawnCard } from "./draw";

/**
 * Vài nhận xét ngắn về trải bài, dựng thẳng từ dữ liệu ba lá — không gọi model.
 *
 * Chỗ này nằm *trước* nút mở khóa, tức là trước khi người dùng trả credit, nên
 * nó không được tốn một đồng nào. Mọi câu dưới đây suy ra từ thuộc tính có sẵn
 * của lá bài (Ẩn Chính hay Ẩn Phụ, bộ nào, xuôi hay ngược), nên cùng một trải
 * bài luôn cho cùng một kết quả.
 *
 * Nó cố tình KHÔNG nhắc lại ý nghĩa từng lá: `FlipCard` đã in sẵn `basicMeaning`
 * ngay phía trên, tóm tắt lại lần nữa chỉ làm trang dài ra mà không thêm gì.
 * Thứ duy nhất nó nói là hình dạng của cả ba lá đặt cạnh nhau — đúng phần mà
 * bản diễn giải chuyên sâu khai triển và màn hình này chưa có.
 */

const SUIT_LABELS: Record<
  Exclude<TarotCategory, "major-arcana">,
  { name: string; theme: string }
> = {
  cups: { name: "Cốc", theme: "cảm xúc và các mối quan hệ" },
  wands: { name: "Gậy", theme: "hành động và nhiệt huyết" },
  swords: { name: "Kiếm", theme: "suy nghĩ và những quyết định trong đầu" },
  pentacles: { name: "Tiền", theme: "công việc và chuyện vật chất" },
};

function arcanaLine(cards: DrawnCard[]): string {
  const majorIndexes = cards
    .map((drawn, i) => (drawn.card.category === "major-arcana" ? i : -1))
    .filter((i) => i >= 0);

  if (majorIndexes.length === 3) {
    return "Cả ba lá đều là Ẩn Chính — trải bài đang nói về một chương lớn của bạn, không phải chuyện của một tuần.";
  }
  if (majorIndexes.length === 2) {
    return "Hai trong ba lá thuộc Ẩn Chính: phần lớn câu chuyện nằm ở tầng bước ngoặt chứ không ở chi tiết thường ngày.";
  }
  if (majorIndexes.length === 1) {
    return `Một lá Ẩn Chính rơi đúng vào ${SPREAD_POSITIONS[majorIndexes[0]]} — đó là chỗ trải bài nhấn mạnh nhất.`;
  }
  return "Cả ba lá đều là Ẩn Phụ — câu trả lời nằm ở những việc cụ thể hằng ngày, chỗ bạn còn xoay chuyển được.";
}

function suitLine(cards: DrawnCard[]): string | null {
  const counts = new Map<string, number>();
  for (const { card } of cards) {
    if (card.category === "major-arcana") continue;
    counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
  }

  for (const [category, count] of counts) {
    if (count < 2) continue;
    const label = SUIT_LABELS[category as keyof typeof SUIT_LABELS];
    return `${count === 3 ? "Cả ba" : "Hai"} lá cùng thuộc bộ ${label.name}, nên ${label.theme} là trục chính của trải bài này.`;
  }
  return null;
}

function orientationLine(cards: DrawnCard[]): string {
  const reversed = cards.filter((drawn) => drawn.orientation === "reversed");

  if (reversed.length === 3) {
    return "Cả ba lá đều ngược. Đó không phải điềm xấu, nhưng là dấu hiệu năng lượng đang hướng vào trong hoặc bị giữ lại ở đâu đó.";
  }
  if (reversed.length === 0) {
    return "Cả ba lá đều xuôi — mạch bài chảy thuận, phần khó nằm ở chỗ bạn có bước hay không.";
  }

  const positions = cards
    .map((drawn, i) => (drawn.orientation === "reversed" ? SPREAD_POSITIONS[i] : null))
    .filter((position) => position !== null);
  return `${positions.join(" và ")} ${positions.length === 1 ? "đang" : "đều"} ngược: có một chỗ đang bị trì lại hoặc cần nhìn từ bên trong.`;
}

export function buildReadingTeaser(cards: DrawnCard[]): string[] {
  if (cards.length !== SPREAD_POSITIONS.length) return [];

  const suit = suitLine(cards);
  return [arcanaLine(cards), ...(suit ? [suit] : []), orientationLine(cards)];
}
