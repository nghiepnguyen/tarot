/** Hợp đồng v4 từ hướng dẫn; minLength được kiểm ở Zod, không gửi keyword không hỗ trợ lên Gemini. */
export const V4_RESPONSE_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": [
    "summary",
    "overview",
    "themes",
    "perCard",
    "connections",
    "actionSuggestions",
    "reflectiveQuestion",
    "closingNote"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "description": "2–3 câu, khoảng 40–60 từ. Chạm thẳng vào mạch chính của toàn bộ trải bài bằng một hình ảnh gợi mở. Không liệt kê tên lá bài."
    },
    "overview": {
      "type": "string",
      "description": "Khoảng 90–115 từ. Mở bằng bức tranh tổng thể mà toàn bộ spread tạo ra, đặt cạnh câu hỏi của người dùng, rồi lần theo chuyển động giữa các lá. Nêu điều đang chín muồi và điều còn chờ. Không giải thích chi tiết từng lá; phần đó dành cho perCard."
    },
    "themes": {
      "type": "array",
      "minItems": 3,
      "maxItems": 5,
      "items": {
        "type": "string"
      },
      "description": "3–5 chủ đề nổi bật từ toàn bộ trải bài. Mỗi chủ đề là một cụm từ cô đọng, giàu hình ảnh và cụ thể. Không dùng keyword chung chung."
    },
    "perCard": {
      "type": "array",
      "minItems": 3,
      "maxItems": 3,
      "description": "Đúng 3 phần tử, theo đúng thứ tự các lá trong input.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "position",
          "keyMessage",
          "text"
        ],
        "properties": {
          "position": {
            "type": "string",
            "description": "Giữ nguyên chính xác tên position từ input."
          },
          "keyMessage": {
            "type": "string",
            "description": "Một câu duy nhất, khoảng 12–20 từ. Là insight sắc nhất của lá trong vị trí cụ thể. Không phải keyword."
          },
          "text": {
            "type": "string",
            "description": "Khoảng 50–65 từ. Bắt đầu từ một hình ảnh hoặc biểu tượng thực trên lá. Giải thích tác động của orientation xuôi/ngược, liên hệ với position và câu hỏi. Chọn một biểu tượng nổi bật thay vì liệt kê nhiều chi tiết. Không lặp lại keyMessage."
          }
        }
      }
    },
    "connections": {
      "type": "string",
      "description": "Khoảng 140–180 từ. Chỉ phân tích những điều xuất hiện khi đặt các lá cạnh nhau: cộng hưởng, giằng co, đối lập, cách một lá soi sáng hoặc làm rõ lá khác, và mạch chuyển dịch xuyên suốt spread. Không lặp lại phần perCard."
    },
    "actionSuggestions": {
      "type": "array",
      "minItems": 3,
      "maxItems": 5,
      "items": {
        "type": "string",
        "description": "Mỗi gợi ý khoảng 35–55 từ, gồm 2–3 câu. Đưa ra hành động cụ thể có thể thực hiện trong 7–14 ngày và giải thích ngắn gọn vì sao hành động đó liên quan đến chính trải bài. Không dùng giọng mệnh lệnh hoặc khẳng định tương lai."
      }
    },
    "reflectiveQuestion": {
      "type": "string",
      "description": "Một câu hỏi tự phản tỉnh, mở và cụ thể. Phải chạm vào điểm căng thẳng thật sự của trải bài. Không phải câu hỏi có thể trả lời đơn giản bằng có/không."
    },
    "closingNote": {
      "type": "string",
      "description": "3–4 câu, khoảng 60–90 từ. Khép lại bằng một hình ảnh ấm áp và nhắc rằng quyền quyết định thuộc về người đọc. Không dự đoán hoặc khẳng định tương lai."
    }
  }
} as const;
