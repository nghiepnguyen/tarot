import { expect, it } from "vitest";
import { needsReadingSupport } from "./reading-support";

it.each([
  "Toi dang dinh tu tu ngay hom nay.",
  "Tôi không muốn sống nữa.",
  "Bạn tôi nhắn: “Tôi muốn tự làm hại mình.”",
  "Tôi đang đọc tiểu thuyết. Bạn tôi vừa nhắn: “Tôi muốn tự làm hại mình.”",
  "Tôi không muốn tự hại, nhưng bây giờ tôi đang định tự làm hại mình.",
])("recognizes explicit signals and real disclosures (%s)", (question) => {
  expect(needsReadingSupport(question)).toBe(true);
});

it.each([
  "Cơ hội này đang biến mất. Tôi nên làm gì?",
  "Tôi muốn biến mất khỏi mạng xã hội một tuần.",
  "Tôi không hề muốn tự làm hại mình.",
  "Tôi chưa bao giờ nghĩ đến tự tử.",
])("keeps ordinary readings available (%s)", (question) => {
  expect(needsReadingSupport(question)).toBe(false);
});
