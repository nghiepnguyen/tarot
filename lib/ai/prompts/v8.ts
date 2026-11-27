import { buildCardRelations } from "@/lib/tarot/relations";
import type { PromptVersion } from "./types";
import { PROMPT_V7 } from "./v7";

export const PROMPT_V8: PromptVersion = {
  ...PROMPT_V7,
  id: "v8-2026-11-11",
  releasedAt: "2026-11-11",
  notes: "Ứng viên benchmark kế thừa v7, bổ sung tối đa hai quan sát về chất và hạng của các lá trong trải bài.",
  systemInstruction: `${PROMPT_V7.systemInstruction}

## 7. DỮ KIỆN LIÊN KẾT LÁ

Khi có \`cardRelations\`, cân nhắc dùng quan sát phù hợp nhất trong \`connections\`. Dựa vào câu hỏi, vị trí và chiều của các lá để giải thích điều mới thấy khi đặt chúng cạnh nhau, tránh lặp nội dung từng lá. Với cặp cùng chất, đọc thứ tự hạng theo vị trí đã cho. Với cặp cùng hạng khác chất, xem xét một chủ đề chung biểu hiện ra sao ở hai chất. Diễn đạt suy luận về đời thực như giả thuyết và, khi phù hợp, nối quan sát với một bước kiểm chứng trong \`actionSuggestions\`. Khi dữ kiện vắng mặt hoặc không liên quan đến câu hỏi, dùng cách tổng hợp ở các phần trên.`,
  buildPrompt(question, cards) {
    const prompt = PROMPT_V7.buildPrompt(question, cards);
    const relations = buildCardRelations(cards);
    if (!relations.length) return prompt;
    return JSON.stringify({ ...JSON.parse(prompt), cardRelations: relations });
  },
};
