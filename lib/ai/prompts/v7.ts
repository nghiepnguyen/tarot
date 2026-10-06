import type { PromptVersion } from "./types";
import { PROMPT_V6 } from "./v6";
import { V7_SYSTEM_INSTRUCTION } from "./v7-system";

export const PROMPT_V7: PromptVersion = {
  ...PROMPT_V6,
  id: "v7-2026-10-06",
  systemInstruction: V7_SYSTEM_INSTRUCTION,
  releasedAt: "2026-10-06",
  notes: "Giữ input (outputRequirements), schema và validator của v6. System instruction viết lại theo giọng người đọc bài đồng hành: xưng hô gần gũi, cấu trúc Mở - Thân - Kết, không gieo sợ hãi với lá thách thức, vẫn giữ evidence-first và các cờ cấu hình. Ra cùng đợt đổi lời giới thiệu 78 lá (basicMeaning/reversedMeaning đi vào input), nên số đo v7 tách khỏi v6.",
};
