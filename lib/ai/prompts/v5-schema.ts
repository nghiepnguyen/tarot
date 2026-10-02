import { V4_RESPONSE_SCHEMA } from "./v4-schema";

const properties = V4_RESPONSE_SCHEMA.properties;

export const V5_RESPONSE_SCHEMA = {
  ...V4_RESPONSE_SCHEMA,
  properties: {
    ...properties,
    summary: {
      ...properties.summary,
      description: "2–3 câu, khoảng 40–60 từ. Mở thẳng bằng luận điểm trung tâm hoặc điểm căng cụ thể nhất của trải bài. Không chào hỏi, tạo không khí, liệt kê tên lá hay trấn an.",
    },
    overview: {
      ...properties.overview,
      description: "Khoảng 90–115 từ. Đặt luận điểm trung tâm vào câu hỏi và mô tả chuyển động của toàn spread bằng bằng chứng từ input. Không tự dựng hoàn cảnh và không nói trước chi tiết từng lá.",
    },
    themes: {
      ...properties.themes,
      description: "3–5 cụm từ cô đọng, đặc thù cho chính câu hỏi và trải bài này. Tránh keyword Tarot chung, lời động viên và các theme trùng nghĩa.",
    },
    perCard: {
      ...properties.perCard,
      description: "Đúng 3 phần tử theo thứ tự input. Mỗi phần chỉ làm rõ đóng góp riêng của lá trong vị trí cụ thể, không kết luận thay cho toàn spread.",
      items: {
        ...properties.perCard.items,
        properties: {
          ...properties.perCard.items.properties,
          keyMessage: {
            ...properties.perCard.items.properties.keyMessage,
            description: "Một câu khoảng 12–20 từ, nêu đóng góp riêng và sắc nhất của lá tại vị trí này. Không phải keyword, lời khuyên hay câu trấn an.",
          },
          text: {
            ...properties.perCard.items.properties.text,
            description: "Khoảng 50–65 từ. Bắt đầu từ chi tiết thật của lá, giải thích ý nghĩa của orientation và nối trực tiếp với position/câu hỏi. Không liệt kê biểu tượng, tự dựng hoàn cảnh hoặc lặp keyMessage.",
          },
        },
      },
    },
    connections: {
      ...properties.connections,
      description: "Khoảng 140–180 từ. Chỉ phân tích điều xuất hiện khi đặt ba lá cạnh nhau: tiếp nối, đối lập, giằng co và hệ quả. Không tóm tắt lại perCard.",
    },
    actionSuggestions: {
      ...properties.actionSuggestions,
      description: "3–5 hướng hành động trong 7–14 ngày. Mỗi mục phải quan sát hoặc kiểm chứng được, gắn với một insight cụ thể; không dùng lời khuyên chung như tin vào trực giác hay đón nhận năng lượng.",
      items: {
        ...properties.actionSuggestions.items,
        description: "Khoảng 35–55 từ, 2–3 câu. Nêu một hành vi, câu hỏi, thử nghiệm, ranh giới hoặc giả định cần kiểm chứng và lý do nó liên quan đến trải bài.",
      },
    },
    reflectiveQuestion: {
      ...properties.reflectiveQuestion,
      description: "Một câu hỏi mở, cụ thể, buộc người đọc đối diện một lựa chọn, đánh đổi hoặc giả định thật sự của trải bài. Không hỏi chung chung hoặc có/không.",
    },
    closingNote: {
      ...properties.closingNote,
      description: "3–4 câu, khoảng 60–90 từ. Chốt hệ quả quan trọng nhất và trả quyền quyết định cho người đọc. Không dỗ dành, chúc tụng, dự đoán hoặc kể lại toàn bài.",
    },
  },
} as const;
