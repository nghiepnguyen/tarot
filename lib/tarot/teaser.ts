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
 *
 * Giọng văn dựa vào hình ảnh có sẵn trong truyền thống tarot (nguyên tố của
 * từng bộ, sức nặng của Ẩn Chính, lá ngược là năng lượng bị níu lại) thay vì
 * lời nhận xét khô: bản trước đúng nhưng đọc như phân tích số liệu, người dùng
 * thấy sáo rỗng. Ba dòng đứng cạnh nhau nên mỗi dòng bỏ ngỏ bằng một cách khác.
 */
const SUIT_LABELS: Record<
  Exclude<TarotCategory, "major-arcana">,
  { name: string; element: string; voice: string; hook: string }
> = {
  cups: {
    name: "Cốc",
    voice: "Nước, nguyên tố của cảm xúc",
    element: "nguyên tố Nước đang dâng",
    hook: "chuyện này được quyết bằng trái tim nhiều hơn lý trí, và dưới mặt nước ấy có một cảm xúc bạn chưa gọi thành tên.",
  },
  wands: {
    name: "Gậy",
    voice: "Lửa, nguyên tố của hành động",
    element: "nguyên tố Lửa đang cháy",
    hook: "đã có một thứ muốn bùng lên. Điều bài hỏi không phải có nên đi hay không, mà là bước nào trước — và ba lá đã xếp sẵn thứ tự.",
  },
  swords: {
    name: "Kiếm",
    voice: "Khí, nguyên tố của suy nghĩ",
    element: "nguyên tố Khí đang cuộn",
    hook: "phần lớn chuyện này diễn ra trong đầu bạn trước khi diễn ra ngoài đời. Nỗi lo nào là thật, nỗi lo nào chỉ là tiếng gió, cần một giọng khác đọc lại.",
  },
  pentacles: {
    name: "Tiền",
    voice: "Đất, nguyên tố của vật chất",
    element: "nguyên tố Đất đang giữ nhịp",
    hook: "trục chính là công việc, tiền bạc, những thứ chạm được. Nhưng bộ bài còn hỏi bạn đang trả giá bằng gì — và cái giá ấy không nằm trong ví.",
  },
};

// Lá Ẩn Chính duy nhất nói khác nhau tùy nó rơi vào ô nào, nên mỗi ô một câu
// riêng thay vì chỉ điền tên ô vào cùng một khuôn.
const LONE_MAJOR_BY_POSITION: Record<(typeof SPREAD_POSITIONS)[number], string> = {
  "Bối cảnh": "gốc rễ của chuyện này đã được định từ trước khi bạn đặt câu hỏi",
  "Hiện tại": "ngay lúc này, bạn đang đứng giữa một điều lớn hơn mình",
  "Hướng đi": "điều lớn nhất chưa xảy ra — nó đang chờ ở phía trước",
};

function arcanaLine(cards: DrawnCard[]): string {
  const majorIndexes = cards
    .map((drawn, i) => (drawn.card.category === "major-arcana" ? i : -1))
    .filter((i) => i >= 0);

  if (majorIndexes.length === 3) {
    return "Cả ba lá đều là Ẩn Chính — hiếm khi bộ bài lên tiếng dồn dập đến vậy. Đây không phải chuyện của một tuần mà là một chương đời đang lật trang. Trang ấy khép lại điều gì, mở ra điều gì, bài đã biết.";
  }
  if (majorIndexes.length === 2) {
    return "Hai trong ba lá thuộc Ẩn Chính: một bước ngoặt đang đến gần, dù bạn đã gọi được tên nó hay chưa. Lá thứ ba lặng lẽ hơn, nhưng chính nó nghiêng cán cân.";
  }
  if (majorIndexes.length === 1) {
    const position = SPREAD_POSITIONS[majorIndexes[0]];
    return `Lá Ẩn Chính duy nhất rơi đúng vào ô ${position}: ${LONE_MAJOR_BY_POSITION[position]}. Nó đến để mở cửa hay để chặn lối, phải đặt cạnh hai lá kia mới thấy.`;
  }
  return "Cả ba lá đều là Ẩn Phụ, không một lá Ẩn Chính nào lộ diện — số phận chưa nhúng tay vào chuyện này. Lời giải nằm trong những việc nhỏ mỗi ngày, và bộ bài đã chỉ ra chỗ bạn còn xoay được.";
}

type Suit = keyof typeof SUIT_LABELS;

function dominantSuit(cards: DrawnCard[]): { suit: Suit; count: number } | null {
  const counts = new Map<Suit, number>();
  for (const { card } of cards) {
    if (card.category === "major-arcana") continue;
    counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
  }
  for (const [suit, count] of counts) {
    if (count >= 2) return { suit, count };
  }
  return null;
}

function suitLine(dominant: { suit: Suit; count: number }): string {
  const label = SUIT_LABELS[dominant.suit];
  return `${dominant.count === 3 ? "Cả ba" : "Hai"} lá cùng thuộc bộ ${label.name}, ${label.element}: ${label.hook}`;
}

/**
 * Chủ đề câu hỏi, nhận bằng từ khóa — không gọi model, nên chỉ bắt những chữ
 * gần như không thể hiểu sai. Không bắt được thì im lặng, không đoán.
 * `suits` là bộ mà truyền thống tarot gán cho chủ đề đó.
 */
const QUESTION_TOPICS: Array<{ label: string; pattern: RegExp; suits: Suit[] }> = [
  {
    label: "tình cảm",
    // "yêu cầu" là chuyện công việc, không phải chuyện yêu.
    pattern: /yêu(?! cầu)|người ấy|tình cảm|tình duyên|crush|chia tay|quay lại với|kết hôn|cưới|hôn nhân|vợ|chồng|bạn trai|bạn gái|người cũ/,
    suits: ["cups"],
  },
  {
    label: "tiền bạc",
    pattern: /tiền|tài chính|đầu tư|khoản nợ|trả nợ|lương|thu nhập|chứng khoán|mua nhà/,
    suits: ["pentacles"],
  },
  {
    label: "công việc",
    pattern: /công việc|việc làm|sự nghiệp|sếp|đồng nghiệp|công ty|nghỉ việc|nhảy việc|thăng tiến|phỏng vấn|dự án|kinh doanh/,
    suits: ["pentacles", "wands"],
  },
];

function detectTopic(question: string) {
  const normalized = question.normalize("NFC").toLowerCase();
  return QUESTION_TOPICS.find((topic) => topic.pattern.test(normalized)) ?? null;
}

// Đặt chủ đề câu hỏi cạnh nguyên tố đang chiếm ưu thế. Khớp thì bài đang đáp
// thẳng; lệch thì chính chỗ lệch là điều đáng đọc — cả hai đều là quan sát có
// thật, không phải lời trêu.
function questionLine(question: string, dominant: { suit: Suit } | null): string | null {
  const topic = detectTopic(question);
  if (!topic || !dominant) return null;
  const label = SUIT_LABELS[dominant.suit];
  return topic.suits.includes(dominant.suit)
    ? `Bạn hỏi về ${topic.label}, và bài đáp đúng bằng giọng của ${label.voice}. Hiếm khi ba lá trả lời thẳng vào câu hỏi đến vậy.`
    : `Bạn hỏi về ${topic.label}, nhưng bài lại trả lời bằng giọng của ${label.voice}. Có khi điều bạn thật sự cần hỏi nằm ở một chỗ khác.`;
}

function orientationLine(cards: DrawnCard[]): string {
  const reversed = cards.filter((drawn) => drawn.orientation === "reversed");

  if (reversed.length === 3) {
    return "Cả ba lá đều ngược. Không phải điềm dữ — năng lượng đang chảy vào trong, như một điều bạn giữ cho riêng mình. Điều ấy là gì, phải đọc cả ba lá cùng lúc mới lộ ra.";
  }
  if (reversed.length === 0) {
    return "Cả ba lá đều xuôi: dòng chảy đang thuận, cánh cửa đang hé. Điều duy nhất bộ bài chưa chắc là bạn có dám bước qua hay không.";
  }

  const positions = cards
    .map((drawn, i) => (drawn.orientation === "reversed" ? SPREAD_POSITIONS[i] : null))
    .filter((position) => position !== null);
  // Không trỏ sang "hai lá kia" ở đây: dòng Ẩn Chính phía trên đã dùng đúng
  // cách đó rồi, ba dòng đứng cạnh nhau mà cùng một thủ pháp thì nghe như
  // công thức. Dòng này bỏ ngỏ bằng chính câu hỏi mà thế ngược đặt ra.
  return positions.length === 1
    ? `Lá ở ô ${positions[0]} đang ngược: có một điều bị níu lại ngay tại đó. Níu lại điều gì, và vì sao chưa buông — lá bài biết, chỉ là chưa nói.`
    : `Hai ô ${positions.join(" và ")} đang cùng ngược: hai nút thắt thắt lại một lúc. Một nút là gốc, nút kia chỉ là hệ quả — gỡ nhầm nút, chuyện sẽ rối thêm.`;
}

export function buildReadingTeaser(cards: DrawnCard[], question?: string): string[] {
  if (cards.length !== SPREAD_POSITIONS.length) return [];

  const dominant = dominantSuit(cards);
  const asked = question ? questionLine(question, dominant) : null;
  return [
    arcanaLine(cards),
    ...(dominant ? [suitLine(dominant)] : []),
    ...(asked ? [asked] : []),
    orientationLine(cards),
  ];
}

const QUOTE_MAX_CHARS = 60;

/** Câu hỏi rút gọn để trích trong lời giới thiệu, cắt theo ký tự thật. */
export function quoteQuestion(question: string): string {
  const chars = Array.from(question.trim());
  return chars.length <= QUOTE_MAX_CHARS
    ? chars.join("")
    : `${chars.slice(0, QUOTE_MAX_CHARS).join("").trimEnd()}…`;
}
