export type TarotCategory = "major-arcana" | "cups" | "pentacles" | "swords" | "wands";

export interface TarotCard {
  id: string;
  name: string;
  image: string;
  category: TarotCategory;
  keywords: string[];
  basicMeaning: string;
  reversedMeaning: string;
}

function card(
  category: TarotCategory,
  id: string,
  name: string,
  ext: string,
  keywords: string[],
  basicMeaning: string,
  reversedMeaning: string,
): TarotCard {
  return {
    id,
    name,
    image: `/cards/${category}/${id}.${ext}`,
    category,
    keywords,
    basicMeaning,
    reversedMeaning,
  };
}

const majorArcana: TarotCard[] = [
  card("major-arcana", "the-fool", "The Fool", "jpeg",
    ["khởi đầu", "tự do", "tự phát"],
    "Một khởi đầu mới đầy hào hứng, sẵn sàng bước đi mà chưa cần biết hết mọi câu trả lời.",
    "Bốc đồng, thiếu chuẩn bị hoặc ngần ngại không dám bắt đầu."),
  card("major-arcana", "the-magician", "The Magician", "jpeg",
    ["sáng tạo", "ý chí", "nguồn lực"],
    "Bạn đã có đủ công cụ và năng lực để biến ý tưởng thành hành động cụ thể.",
    "Năng lực chưa được dùng đúng cách, thao túng hoặc thiếu tập trung."),
  card("major-arcana", "the-high-priestess", "The High Priestess", "jpeg",
    ["trực giác", "nội tâm", "bí ẩn"],
    "Lắng nghe trực giác và những điều chưa được nói ra trước khi hành động.",
    "Mất kết nối với trực giác, giữ bí mật gây hiểu lầm hoặc thiếu tự nhận thức."),
  card("major-arcana", "the-empress", "The Empress", "jpeg",
    ["nuôi dưỡng", "sung túc", "sáng tạo"],
    "Giai đoạn nuôi dưỡng, phát triển và kết nối với cảm xúc, thiên nhiên hoặc sự sáng tạo.",
    "Phụ thuộc quá mức, mất cân bằng chăm sóc bản thân và người khác."),
  card("major-arcana", "the-emperor", "The Emperor", "jpeg",
    ["cấu trúc", "kỷ luật", "quyền lực"],
    "Cần một cấu trúc rõ ràng, kỷ luật và trách nhiệm để giữ vững ổn định.",
    "Cứng nhắc, kiểm soát quá mức hoặc thiếu tính linh hoạt."),
  card("major-arcana", "the-hierophant", "The Hierophant", "jpeg",
    ["truyền thống", "quy chuẩn", "học hỏi"],
    "Tôn trọng quy chuẩn, học hỏi từ người có kinh nghiệm hoặc hệ thống đã được kiểm chứng.",
    "Bó buộc bởi giáo điều, cần tìm hướng đi riêng thay vì rập khuôn."),
  card("major-arcana", "the-lovers", "The Lovers", "jpeg",
    ["lựa chọn", "hòa hợp", "giá trị chung"],
    "Một lựa chọn quan trọng liên quan đến giá trị, kết nối và sự hòa hợp.",
    "Mất cân bằng trong mối quan hệ, lựa chọn dựa trên giá trị chưa rõ ràng."),
  card("major-arcana", "the-chariot", "The Chariot", "jpeg",
    ["quyết tâm", "kiểm soát", "tiến lên"],
    "Ý chí mạnh mẽ và sự tập trung giúp bạn tiến về phía trước vượt qua xung đột.",
    "Mất phương hướng, thiếu kiểm soát hoặc tiến quá nhanh mà không cân nhắc."),
  card("major-arcana", "strength", "Strength", "jpeg",
    ["can đảm", "kiên nhẫn", "nội lực"],
    "Sức mạnh nội tâm, sự kiên nhẫn và lòng trắc ẩn giúp vượt qua thử thách.",
    "Nghi ngờ bản thân, mất kiên nhẫn hoặc dùng sức mạnh không đúng cách."),
  card("major-arcana", "the-hermit", "The Hermit", "jpeg",
    ["suy ngẫm", "tìm hiểu nội tâm", "cô độc"],
    "Thời điểm lùi lại, tự vấn và tìm câu trả lời từ bên trong.",
    "Cô lập quá mức hoặc né tránh kết nối cần thiết với người khác."),
  card("major-arcana", "wheel-of-fortune", "Wheel of Fortune", "jpeg",
    ["chu kỳ", "vận động", "thay đổi"],
    "Một vòng xoay của hoàn cảnh đang diễn ra, mang đến thay đổi ngoài dự tính.",
    "Cảm giác mất kiểm soát trước biến động hoặc chu kỳ chưa thuận lợi."),
  card("major-arcana", "justice", "Justice", "jpeg",
    ["công bằng", "sự thật", "hệ quả"],
    "Sự công bằng, rõ ràng và trách nhiệm với hệ quả từ lựa chọn của mình.",
    "Mất cân bằng, thiếu công bằng hoặc trốn tránh trách nhiệm."),
  card("major-arcana", "the-hanged-man", "The Hanged Man", "jpeg",
    ["tạm dừng", "góc nhìn mới", "buông bỏ"],
    "Tạm dừng để nhìn vấn đề từ góc độ khác trước khi quyết định.",
    "Trì hoãn kéo dài hoặc cố bám víu điều cần buông bỏ."),
  card("major-arcana", "death", "Death", "jpeg",
    ["kết thúc", "chuyển giao", "tái sinh"],
    "Một giai đoạn kết thúc để mở đường cho sự chuyển đổi cần thiết.",
    "Kháng cự thay đổi, kéo dài điều đã không còn phù hợp."),
  card("major-arcana", "temperance", "Temperance", "jpeg",
    ["cân bằng", "điều hòa", "kiên nhẫn"],
    "Sự điều hòa, kiên nhẫn và cân bằng giữa các thái cực đối lập.",
    "Mất cân bằng, nóng vội hoặc thiếu điều độ."),
  card("major-arcana", "the-devil", "The Devil", "jpeg",
    ["ràng buộc", "cám dỗ", "thói quen"],
    "Nhận diện những ràng buộc, thói quen hoặc nỗi sợ đang giữ chân bạn.",
    "Bắt đầu nhận ra và tháo gỡ dần những ràng buộc đó."),
  card("major-arcana", "the-tower", "The Tower", "jpeg",
    ["biến động", "sụp đổ", "tỉnh ngộ"],
    "Một biến động bất ngờ phá vỡ cấu trúc cũ để lộ ra sự thật cần đối diện.",
    "Biến động được nhận diện sớm hoặc né tránh đối diện với thay đổi cần thiết."),
  card("major-arcana", "the-star", "The Star", "jpeg",
    ["hy vọng", "chữa lành", "cảm hứng"],
    "Hy vọng, niềm tin và sự chữa lành nhẹ nhàng sau giai đoạn khó khăn.",
    "Mất niềm tin tạm thời hoặc kỳ vọng chưa thực tế."),
  card("major-arcana", "the-moon", "The Moon", "jpeg",
    ["mơ hồ", "tiềm thức", "cảm xúc ẩn"],
    "Cảm xúc và trực giác đang lên tiếng dù mọi thứ chưa thật rõ ràng.",
    "Sự mơ hồ dần được làm sáng tỏ hoặc nỗi sợ đang được phóng đại."),
  card("major-arcana", "the-sun", "The Sun", "jpeg",
    ["niềm vui", "rõ ràng", "sức sống"],
    "Sự rõ ràng, niềm vui và nguồn năng lượng tích cực đang hiện diện.",
    "Niềm vui bị che khuất tạm thời hoặc kỳ vọng thái quá về sự hoàn hảo."),
  card("major-arcana", "judgement", "Judgement", "jpeg",
    ["đánh giá lại", "thức tỉnh", "quyết định"],
    "Một lời gọi thức tỉnh để nhìn lại và đưa ra quyết định quan trọng.",
    "Tự phán xét quá khắt khe hoặc trì hoãn đối diện với sự thật."),
  card("major-arcana", "the-world", "The World", "jpeg",
    ["hoàn thành", "trọn vẹn", "tổng kết"],
    "Một chu kỳ hoàn thành trọn vẹn, sẵn sàng cho chương tiếp theo.",
    "Cảm giác chưa trọn vẹn hoặc còn việc dang dở cần hoàn tất."),
];

function minorSuit(
  category: Exclude<TarotCategory, "major-arcana">,
  ext: string,
  themes: { basic: string; reversed: string; suitKeyword: string },
): TarotCard[] {
  const ranks: Array<{ id: string; name: string; keywords: string[]; basic: string; reversed: string }> = [
    { id: "ace", name: "Ace", keywords: ["khởi đầu", "tiềm năng thô"], basic: "một khởi đầu mới, tiềm năng thuần khiết", reversed: "cơ hội bị trì hoãn hoặc chưa được tận dụng" },
    { id: "two", name: "Two", keywords: ["lựa chọn", "cân bằng"], basic: "một sự lựa chọn hoặc cân bằng cần thiết lập", reversed: "mất cân bằng hoặc do dự kéo dài" },
    { id: "three", name: "Three", keywords: ["phát triển", "hợp tác"], basic: "sự phát triển bước đầu và kết nối với người khác", reversed: "hợp tác trục trặc hoặc tiến triển chậm lại" },
    { id: "four", name: "Four", keywords: ["ổn định", "tạm nghỉ"], basic: "một khoảng lặng để ổn định hoặc củng cố", reversed: "trì trệ hoặc bỏ lỡ cơ hội vì đứng yên quá lâu" },
    { id: "five", name: "Five", keywords: ["thử thách", "căng thẳng"], basic: "xung đột hoặc thử thách cần được nhìn nhận rõ", reversed: "căng thẳng đang dịu bớt hoặc bài học được rút ra" },
    { id: "six", name: "Six", keywords: ["hài hòa", "chuyển dịch"], basic: "sự hài hòa trở lại và một bước chuyển tích cực", reversed: "mất cân bằng tạm thời trong quá trình chuyển dịch" },
    { id: "seven", name: "Seven", keywords: ["đánh giá", "kiên trì"], basic: "cần đánh giá lại nỗ lực và hướng đi hiện tại", reversed: "nản lòng hoặc thiếu kiên trì trước khó khăn" },
    { id: "eight", name: "Eight", keywords: ["chuyển động", "tập trung"], basic: "sự tập trung và chuyển động nhanh hướng tới mục tiêu", reversed: "phân tán năng lượng hoặc cảm giác bế tắc" },
    { id: "nine", name: "Nine", keywords: ["gần hoàn thành", "nội lực"], basic: "gần đạt được kết quả nhờ nỗ lực bền bỉ", reversed: "lo lắng quá mức hoặc kiệt sức trước đích đến" },
    { id: "ten", name: "Ten", keywords: ["hoàn tất", "kết quả"], basic: "một chu kỳ hoàn tất, kết quả rõ ràng của quá trình", reversed: "gánh nặng kéo dài hoặc kết thúc chưa trọn vẹn" },
    { id: "page", name: "Page", keywords: ["học hỏi", "khởi phát"], basic: "tinh thần học hỏi, tò mò và một tin tức hoặc cơ hội mới", reversed: "thiếu kinh nghiệm hoặc thông tin chưa đầy đủ" },
    { id: "knight", name: "Knight", keywords: ["hành động", "theo đuổi"], basic: "hành động chủ động để theo đuổi mục tiêu hoặc lý tưởng", reversed: "hành động vội vàng hoặc thiếu định hướng" },
    { id: "queen", name: "Queen", keywords: ["thấu hiểu", "trưởng thành"], basic: "sự trưởng thành nội tâm và khả năng thấu hiểu người khác", reversed: "mất kết nối với cảm xúc hoặc nhu cầu của chính mình" },
    { id: "king", name: "King", keywords: ["làm chủ", "trách nhiệm"], basic: "khả năng làm chủ và dẫn dắt với trách nhiệm rõ ràng", reversed: "lạm quyền hoặc thiếu trách nhiệm trong vai trò của mình" },
  ];

  const suitLabel = { cups: "Cups", pentacles: "Pentacles", swords: "Swords", wands: "Wands" }[category];

  return ranks.map((r) =>
    card(
      category,
      `${r.id}-of-${category}`,
      `${r.name} of ${suitLabel}`,
      ext,
      [...r.keywords, themes.suitKeyword],
      `${themes.basic}: ${r.basic}.`,
      `${themes.reversed}: ${r.reversed}.`,
    ),
  );
}

const cups = minorSuit("cups", "jpg", {
  basic: "Trong lĩnh vực cảm xúc và các mối quan hệ",
  reversed: "Về mặt cảm xúc",
  suitKeyword: "cảm xúc",
});

const pentacles = minorSuit("pentacles", "jpg", {
  basic: "Trong lĩnh vực vật chất, công việc và tài chính",
  reversed: "Về mặt vật chất hoặc tài chính",
  suitKeyword: "vật chất",
});

const swords = minorSuit("swords", "jpg", {
  basic: "Trong lĩnh vực tư duy, giao tiếp và quyết định",
  reversed: "Về mặt tư duy hoặc giao tiếp",
  suitKeyword: "tư duy",
});

const wands = minorSuit("wands", "jpg", {
  basic: "Trong lĩnh vực đam mê, hành động và sáng tạo",
  reversed: "Về mặt động lực hoặc hành động",
  suitKeyword: "hành động",
});

export const TAROT_CARDS: TarotCard[] = [
  ...majorArcana,
  ...cups,
  ...pentacles,
  ...swords,
  ...wands,
];

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_CARDS.find((c) => c.id === id);
}
