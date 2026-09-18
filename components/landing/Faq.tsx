import { ChevronDown } from "lucide-react";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS } from "@/lib/ai/interpretation";

/**
 * Cùng một mảng dựng ra phần hỏi đáp trên trang và khối FAQPage JSON-LD, nên
 * nội dung Google đọc được không bao giờ lệch với nội dung người đọc thấy.
 * Vì vậy câu trả lời phải là chuỗi thuần, không có JSX bên trong.
 */
export const FAQ_ITEMS = [
  {
    question: "Xem bài tarot ở đây có mất phí không?",
    answer:
      "Bốc ba lá và đọc luận giải cơ bản hoàn toàn miễn phí, không giới hạn số lần và không cần tài khoản. Chỉ bản diễn giải chuyên sâu do AI viết mới cần credit.",
  },
  {
    question: "Có bắt buộc tạo tài khoản không?",
    answer:
      `Không, để bốc bài thì không cần. Tài khoản dùng khi bạn muốn lưu lại lịch sử trải bài và mở diễn giải chuyên sâu. Xác nhận email xong, bạn được ${FREE_TRIAL_UNLOCKS} lượt diễn giải chuyên sâu miễn phí.`,
  },
  {
    question: "Diễn giải chuyên sâu gồm những gì?",
    answer:
      "Một bản đọc dài viết riêng cho câu hỏi và đúng ba lá bạn vừa bốc, gồm năm phần: tổng quan, ý nghĩa từng lá theo vị trí, mối liên hệ giữa ba lá, gợi ý hành động và câu hỏi tự phản tỉnh. Mỗi bản mất khoảng nửa phút để soạn.",
  },
  {
    question: "Một lượt diễn giải chuyên sâu tốn bao nhiêu credit?",
    answer:
      `Mỗi lượt tốn ${COST_PER_INTERPRETATION} credit. Credit mua theo gói, thanh toán qua PayOS; giá từng gói và số lượt tương ứng xem ở mục gói credit phía trên.`,
  },
  {
    question: "Kết quả tarot có chính xác không?",
    answer:
      "Tarot ở đây là công cụ tham khảo và tự phản tỉnh, không thay thế tư vấn y tế, pháp lý hoặc tài chính chuyên nghiệp. Không bản đọc nào khẳng định tương lai là chắc chắn.",
  },
  {
    question: "Câu hỏi của tôi có được lưu lại không?",
    answer:
      "Khi bạn đã đăng nhập, câu hỏi và ba lá được lưu vào lịch sử để đọc lại. Bạn xóa được từng lần trải bài hoặc toàn bộ lịch sử bất cứ lúc nào. Chi tiết nằm trong chính sách riêng tư.",
  },
];

export function Faq() {
  return (
    <div className="flex flex-col gap-10">
      <h2 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
        Câu hỏi thường gặp
      </h2>

      <div className="divide-y divide-border border-t border-b border-border">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium tracking-tight text-foreground transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[68ch] pb-5 text-sm leading-relaxed text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
