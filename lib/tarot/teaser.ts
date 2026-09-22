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

/**
 * Mỗi dòng nêu một quan sát có thật rồi bỏ ngỏ đúng câu mà bản chuyên sâu trả
 * lời. Bỏ ngỏ chứ không hứa hão: câu để mở phải là câu ba lá này thật sự có
 * dữ kiện để nói, không phải một lời trêu suông.
 */
const SUIT_LABELS: Record<
  Exclude<TarotCategory, "major-arcana">,
  { name: string; hook: string }
> = {
  cups: {
    name: "Cốc",
    hook: "chuyện này đang được quyết bằng cảm xúc nhiều hơn bằng lý lẽ. Cảm xúc của ai mới là phần cần đọc kỹ.",
  },
  wands: {
    name: "Gậy",
    hook: "thứ còn thiếu ở đây không phải một câu trả lời mà là một bước đi. Bước nào trước thì ba lá có thứ tự của nó.",
  },
  swords: {
    name: "Kiếm",
    hook: "phần lớn chuyện này đang diễn ra trong đầu bạn trước khi diễn ra ngoài đời. Bao nhiêu trong đó là thật thì cần một giọng khác đọc lại mới rõ.",
  },
  pentacles: {
    name: "Tiền",
    hook: "trục chính là công việc và chuyện vật chất — nhưng trải bài còn hỏi bạn đang trả giá bằng gì cho nó.",
  },
};

function arcanaLine(cards: DrawnCard[]): string {
  const majorIndexes = cards
    .map((drawn, i) => (drawn.card.category === "major-arcana" ? i : -1))
    .filter((i) => i >= 0);

  if (majorIndexes.length === 3) {
    return "Cả ba lá đều là Ẩn Chính — trải bài đang nói về một chương, không phải chuyện của một tuần. Chương đó đang mở ra hay đang khép lại thì ba lá còn giữ lại.";
  }
  if (majorIndexes.length === 2) {
    return "Hai trong ba lá thuộc Ẩn Chính: phần nặng nhất của câu chuyện nằm ở tầng bước ngoặt. Lá còn lại là thứ quyết định bước ngoặt đó ngả về hướng nào.";
  }
  if (majorIndexes.length === 1) {
    return `Một lá Ẩn Chính rơi đúng vào ${SPREAD_POSITIONS[majorIndexes[0]]} — đó là chỗ trải bài nhấn mạnh nhất. Nó đứng đó để mở đường hay để giữ bạn lại, hai lá kia trả lời.`;
  }
  return "Cả ba lá đều là Ẩn Phụ. Câu trả lời không nằm ở một biến cố lớn mà ở những việc thường ngày — chỗ bạn còn xoay được, nếu biết xoay chỗ nào.";
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
    return `${count === 3 ? "Cả ba" : "Hai"} lá cùng thuộc bộ ${label.name}: ${label.hook}`;
  }
  return null;
}

function orientationLine(cards: DrawnCard[]): string {
  const reversed = cards.filter((drawn) => drawn.orientation === "reversed");

  if (reversed.length === 3) {
    return "Cả ba lá đều ngược. Không phải điềm xấu — nhưng mọi thứ đang quay vào trong, và chỗ nào bị giữ lại thì phải đọc cả ba mới thấy.";
  }
  if (reversed.length === 0) {
    return "Cả ba lá đều xuôi. Mạch bài chảy thuận, nên phần khó không nằm ở bài — nó nằm ở chỗ bạn có bước hay không.";
  }

  const positions = cards
    .map((drawn, i) => (drawn.orientation === "reversed" ? SPREAD_POSITIONS[i] : null))
    .filter((position) => position !== null);
  // Không trỏ sang "hai lá kia" ở đây: dòng Ẩn Chính phía trên đã dùng đúng
  // cách đó rồi, ba dòng đứng cạnh nhau mà cùng một thủ pháp thì nghe như
  // công thức. Dòng này bỏ ngỏ bằng chính câu hỏi mà thế ngược đặt ra.
  return positions.length === 1
    ? `${positions[0]} đang ngược: có một chỗ đang bị giữ lại. Giữ lại điều gì, và giữ đến bao giờ, là phần trải bài chưa nói hết.`
    : `${positions.join(" và ")} đều ngược: hai chỗ bị giữ lại cùng lúc. Chỗ nào là nguyên nhân, chỗ nào chỉ là hệ quả, đó mới là câu hỏi.`;
}

export function buildReadingTeaser(cards: DrawnCard[]): string[] {
  if (cards.length !== SPREAD_POSITIONS.length) return [];

  const suit = suitLine(cards);
  return [arcanaLine(cards), ...(suit ? [suit] : []), orientationLine(cards)];
}
