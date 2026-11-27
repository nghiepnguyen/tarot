import { InterpretationResultSchema, type InterpretationCardInput, type InterpretationResult } from "./interpretation";
import { buildInterpretationEvidence } from "./evidence";
import { needsReadingSupport } from "./reading-support";
import type { ReadingAnchorContext } from "./reading-anchors";

export const CONTROLLED_READING_VERSION = "controlled-reading-offline-2026-11-21";

export const CONTROLLED_CARD_SYMBOLS = {
  transfer: [
    "Hình ảnh ngọn đèn và sự tĩnh lặng gợi việc tự tìm hiểu điều mình coi trọng.",
    "Hình ảnh bịt mắt trước lựa chọn gợi chủ đề cân nhắc và những điều chưa được nhìn rõ.",
    "Ở chiều ngược, chủ đề rèn nghề chuyển sang câu hỏi về sự bền bỉ và công sức có được dùng đúng chỗ hay không.",
  ],
  restart_drawing: [
    "Hình ảnh ánh sáng sau đêm dài gợi hy vọng, sự hồi phục và cảm hứng.",
    "Ở chiều ngược, hình ảnh cân đối nhiều việc chuyển sang chủ đề mất cân bằng hoặc quá sức.",
    "Hình ảnh người khám phá gợi sự tò mò và tinh thần thử điều mới.",
  ],
  housework_schedule: [
    "Hình ảnh khải hoàn gợi sự ghi nhận nỗ lực và thành quả.",
    "Ở chiều ngược, chủ đề ký ức chuyển sang việc bám vào quá khứ hoặc lý tưởng hóa điều đã qua.",
    "Hình ảnh ngọn đèn và sự tĩnh lặng gợi việc tự tìm hiểu điều mình coi trọng.",
  ],
} as const;

const TEMPLATES = {
  transfer: {
    cards: [["the-hermit", "upright"], ["two-of-swords", "upright"], ["eight-of-pentacles", "reversed"]],
    summary: "Trước khi xin chuyển nhóm, bạn có thể xác nhận quy trình, điều kiện và thời điểm phù hợp với đầu mối phụ trách. Nếu đã có nhóm dự định chuyển tới, hãy hỏi thêm về công việc và hỗ trợ học kỹ năng để có thông tin đối chiếu với điều mình mong muốn.",
    overview: "Ba lá có thể được đọc như ba góc tham khảo: điều bạn coi trọng, thông tin cần làm rõ và cách dùng công sức học nghề. Chúng không xác nhận lý do bạn muốn chuyển hoặc dự đoán việc được duyệt. Bạn có thể dùng các câu hỏi dưới đây để chuẩn bị cuộc trao đổi, rồi quyết định theo thông tin thực tế nhận được.",
    themes: ["Tự xác định tiêu chí", "Làm rõ thông tin", "Xem xét công sức học nghề"],
    keyMessages: ["Xác định điều bạn coi trọng trước khi hỏi về nhóm mới.", "Làm rõ tiêu chí và thông tin cần có trước khi lựa chọn.", "Nếu đã có nhóm đích, hỏi cách công sức học kỹ năng được hỗ trợ."],
    applications: [
      "Ở vị trí Bối cảnh, bạn có thể mượn góc nhìn này để viết ra một hoặc hai điều muốn tìm hiểu ở công việc. Đây là lời mời tự xác định tiêu chí, không phải kết luận rằng bạn đã dành thời gian suy ngẫm hoặc đang bất mãn.",
      "Ở vị trí Hiện tại, bạn có thể kiểm tra mình còn muốn biết gì về điều kiện xin chuyển. Lá không cho biết bạn đang trì hoãn hay sợ điều gì; nếu thông tin đã đủ, không cần tự tạo thêm một trở ngại để khớp biểu tượng.",
      "Ở vị trí Hướng đi, bạn có thể hỏi nhóm dự kiến về nhiệm vụ và cách hỗ trợ học kỹ năng, nếu đã có nhóm đích. Không thể từ chiều ngược suy ra bạn thiếu kiên trì hoặc đang làm việc đối phó; điều cần kiểm chứng là cơ hội dùng công sức theo mục tiêu của bạn.",
    ],
    connections: "Có thể đặt ba góc nhìn cạnh nhau: dùng điều mình coi trọng để chọn câu hỏi, làm rõ thông tin rồi xem công việc và cách học nghề có phù hợp không. Đây là một cách sắp xếp việc tìm hiểu, không phải chuỗi nguyên nhân do các lá chứng minh. Nếu góc nào không giúp ích cho việc xin chuyển của bạn, có thể bỏ qua góc đó.",
    actionSuggestions: [
      "Hỏi đầu mối phụ trách về quy trình, điều kiện và thời điểm xin chuyển nhóm. Bạn có thể ghi lại bước cần làm cùng nơi xác nhận thông tin, thay vì mặc định đã có sự chấp thuận.",
      "Nếu đã có nhóm đích, hỏi về nhiệm vụ thường gặp và cách hỗ trợ người cần học kỹ năng mới. Sau đó đối chiếu câu trả lời với một hoặc hai tiêu chí bạn muốn tìm hiểu.",
      "Trước cuộc trao đổi, viết một danh sách ngắn các câu hỏi còn cần xác nhận. Nếu đã có câu trả lời đáng tin cho một mục, có thể bỏ mục đó thay vì phải theo đủ danh sách.",
    ],
    reflectiveQuestion: "Thông tin nào, nếu có, sẽ giúp bạn quyết định bước tiếp theo về việc xin chuyển nhóm?",
    closingNote: "Bạn có thể điều chỉnh các câu hỏi theo quy trình thực tế của nơi làm việc. Quyết định chuyển hay giữ nguyên nhóm vẫn dựa vào thông tin và ưu tiên của bạn.",
  },
  restart_drawing: {
    cards: [["the-star", "upright"], ["two-of-pentacles", "reversed"], ["page-of-wands", "upright"]],
    summary: "Bạn có thể thử một buổi phác nét ngắn với đồ vật có sẵn, chẳng hạn khoảng 5 phút nếu phù hợp. Sau buổi đó, chọn điều muốn giữ hoặc điều chỉnh; không cần biến tuần đầu thành một lịch tập bắt buộc.",
    overview: "Ba lá có thể gợi ba góc nhìn cho việc vẽ lại: cảm hứng để thử, mức độ vừa sức và sự tò mò khi khám phá. Đây là cách dùng biểu tượng để chọn một trải nghiệm nhỏ, không phải lời giải thích vì sao bạn nghỉ vẽ. Bạn có thể thử một lần rồi quyết định có muốn lặp lại trong tuần đầu hay không.",
    themes: ["Gợi lại cảm hứng", "Chọn mức thử vừa sức", "Khám phá bằng nét vẽ"],
    keyMessages: ["Chọn một điều muốn thử mà không đặt yêu cầu phải vẽ đẹp.", "Thử một buổi ngắn rồi tự xem mức đó có phù hợp không.", "Khám phá một đồ vật quen bằng vài đường nét đơn giản."],
    applications: [
      "Ở vị trí Bối cảnh, bạn có thể chọn một hình ảnh khiến mình muốn đặt nét đầu tiên, nếu có. Biểu tượng này không cho biết bạn từng tổn thương hoặc đã mất niềm vui; cảm hứng ở đây là một hướng để thử, không phải cảm xúc được lá xác nhận.",
      "Ở vị trí Hiện tại, bạn có thể dùng lời nhắc này để chọn mức thử dễ điều chỉnh. Không có dữ kiện cho thấy lịch của bạn bận hoặc bạn đang quá tải. Khoảng 5 phút chỉ là một ví dụ khởi động, có thể ngắn hơn, dài hơn hoặc đổi buổi theo ý bạn.",
      "Ở vị trí Hướng đi, bạn có thể chọn một đồ vật có sẵn và thử phác hình bằng dụng cụ mình muốn dùng, nếu có. Mục tiêu của ví dụ là khám phá nét và hình, không kiểm tra năng lực hoặc dự báo bạn sẽ duy trì được thói quen.",
    ],
    connections: "Có thể dùng cảm hứng như lời mời bắt đầu, mức thử linh hoạt như điều để tự kiểm tra và sự tò mò như cách chọn bài tập. Ba góc này không chứng minh có một trở ngại thời gian hoặc vấn đề cần chữa lành. Nếu không thấy chúng phù hợp, bạn vẫn có thể chọn cách vẽ lại khác.",
    actionSuggestions: [
      "Nếu muốn thử ngay, chọn một đồ vật có sẵn, như chiếc cốc, và phác đường nét bằng dụng cụ bạn có hoặc muốn dùng. Có thể bắt đầu khoảng 5 phút; thời lượng là ví dụ linh hoạt, không phải giới hạn bắt buộc.",
      "Sau buổi thử, xem một chi tiết bạn muốn giữ và một điều có thể điều chỉnh, chẳng hạn đổi đồ vật hoặc thời lượng. Không cần chấm đẹp hay xấu để quyết định có muốn thử thêm.",
      "Trong tuần đầu, bạn có thể chọn lặp lại bài phác nét một lần nữa nếu thấy phù hợp. Nếu không, hãy đổi cách thử hoặc để sang dịp khác, không cần đặt chuỗi ngày liên tục.",
    ],
    reflectiveQuestion: "Sau một lần thử nhỏ, bạn muốn giữ lại hoặc thay đổi điều gì cho lần vẽ tiếp theo, nếu có?",
    closingNote: "Bạn được chọn nhịp bắt đầu của mình. Một buổi thử là cách tìm hiểu sở thích hiện tại, không phải cam kết phải duy trì hay đạt kết quả cụ thể.",
  },
  housework_schedule: {
    cards: [["six-of-wands", "upright"], ["six-of-cups", "reversed"], ["the-hermit", "upright"]],
    summary: "Trước khi trả lời đề nghị đổi lịch dọn dẹp, bạn có thể hỏi giờ mới, đổi một lần hay thường xuyên và phần việc mỗi người. Nếu giờ được đề xuất chưa phù hợp, hãy nêu một giờ khác để hai bên cùng xác nhận.",
    overview: "Ba lá có thể gợi cách xem xét đề nghị: sự ghi nhận công sức, việc nhìn lại cách làm cũ và khoảng riêng để xác định điều mình có thể thu xếp. Chúng không cho biết ai từng làm nhiều hơn hoặc lịch cũ có vấn đề. Bạn có thể tập trung vào các chi tiết cần thống nhất cho lần đổi lịch này.",
    themes: ["Ghi nhận công sức", "Xem lại cách làm khi cần", "Xác định thời gian phù hợp"],
    keyMessages: ["Nếu phù hợp, ghi nhận công sức cụ thể thay vì mặc định ai đang làm nhiều hơn.", "Xem phương án cũ có còn phù hợp với đề nghị mới hay không.", "Xác định thời gian bạn có thể thu xếp trước khi trả lời."],
    applications: [
      "Ở vị trí Bối cảnh, góc nhìn này có thể gợi bạn hỏi hai bên muốn xác nhận phần việc hoàn thành theo cách nào. Nếu có công sức cụ thể muốn ghi nhận, bạn có thể nói rõ điều đó; lá không chứng minh trước đây việc chia việc đã thành công hay ai xứng đáng được khen.",
      "Ở vị trí Hiện tại, bạn có thể xem lại lịch hoặc cách chia việc trước đây nếu điều đó cần cho đề nghị mới. Không có căn cứ nói bạn đang mắc kẹt trong thói quen hay quan hệ đã thay đổi; phương án cũ vẫn có thể phù hợp và không cần sửa toàn bộ.",
      "Ở vị trí Hướng đi, bạn có thể tự kiểm tra giờ mình có thể thu xếp và phần việc sẵn sàng nhận trước khi trả lời. Dành một lúc cân nhắc không đồng nghĩa bạn né xung đột hoặc phải tách khỏi người cùng nhà; đây chỉ là một lựa chọn chuẩn bị cho cuộc trao đổi.",
    ],
    connections: "Có thể xem sự ghi nhận, việc rà lại phương án cũ và thời gian suy xét riêng như ba góc tham khảo cho cuộc trao đổi. Chúng không tạo thành bằng chứng rằng lịch cũ đang xuống cấp hoặc có bất đồng. Bạn có thể chỉ dùng những góc giúp làm rõ giờ và phần việc của lần đổi lịch này.",
    actionSuggestions: [
      "Hỏi rõ giờ mới và đề nghị này áp dụng một lần hay thường xuyên. Nếu chưa có giờ cụ thể, bạn có thể đề nghị chốt giờ trước khi đồng ý.",
      "Xác nhận phần việc mỗi người ở lịch được đề xuất và cách báo cho nhau khi hoàn thành, nếu cần. Không cần mặc định phải đổi cách chia việc chỉ vì đổi giờ.",
      "Nếu giờ được đề xuất chưa phù hợp, nêu một giờ khác bạn có thể thu xếp. Sau khi hai bên thống nhất, có thể nhắc lại giờ và phần việc để cùng kiểm tra đã hiểu giống nhau.",
    ],
    reflectiveQuestion: "Bạn muốn xác nhận chi tiết nào trước khi trả lời đề nghị đổi lịch này?",
    closingNote: "Bạn có thể đồng ý, đề xuất điều chỉnh hoặc hỏi thêm trước khi quyết định. Lá bài không thay cho việc hai bên nói rõ điều mình có thể thu xếp.",
  },
} as const;

export function renderControlledReading(
  question: string,
  cards: InterpretationCardInput[],
  context: ReadingAnchorContext | null,
): InterpretationResult | null {
  const evidence = buildInterpretationEvidence(question, cards);
  if (needsReadingSupport(evidence.facts[0].text) || typeof context !== "string" || !Object.hasOwn(TEMPLATES, context)) return null;
  const template = TEMPLATES[context];
  // Context is manually curated; this fingerprint guard does not infer semantic relevance.
  if (evidence.cards.some((card, i) => card.cardId !== template.cards[i][0] || card.orientation !== template.cards[i][1])) return null;
  return InterpretationResultSchema.parse({
    summary: template.summary, overview: template.overview, themes: [...template.themes],
    perCard: evidence.cards.map((card, i) => ({
      position: card.position, keyMessage: template.keyMessages[i],
      text: `${card.name} (${card.orientation === "upright" ? "xuôi" : "ngược"}): ${CONTROLLED_CARD_SYMBOLS[context][i]} ${template.applications[i]}`,
    })),
    connections: template.connections, actionSuggestions: [...template.actionSuggestions],
    reflectiveQuestion: template.reflectiveQuestion, closingNote: template.closingNote,
  });
}
