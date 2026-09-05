import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền — Tarot Reading Web",
  description: "Chính sách hoàn tiền cho credit, gói VIP và dịch vụ tư vấn.",
};

export default function RefundPage() {
  return (
    <LegalPage title="Chính sách hoàn tiền" updatedAt="05/09/2026">
      <section>
        <h2>1. Credit và gói VIP</h2>
        <p>
          Diễn giải AI được tạo ngay khi bạn xác nhận sử dụng credit hoặc gói
          VIP, vì vậy credit đã dùng để mở khóa một reading cụ thể không được
          hoàn lại. Nếu hệ thống gặp lỗi khiến bạn bị trừ credit nhưng không
          nhận được kết quả, chúng tôi sẽ hoàn lại credit đó hoặc số tiền
          tương ứng.
        </p>
      </section>

      <section>
        <h2>2. Lỗi thanh toán</h2>
        <p>
          Nếu bạn bị trừ tiền nhiều lần cho cùng một giao dịch, hoặc giao dịch
          thất bại nhưng vẫn bị trừ tiền, vui lòng liên hệ trong vòng 7 ngày
          kể từ ngày giao dịch kèm mã giao dịch để được kiểm tra và hoàn tiền
          nếu xác nhận là lỗi hệ thống.
        </p>
      </section>

      <section>
        <h2>3. Đặt lịch tư vấn viên</h2>
        <p>
          Hủy lịch trước thời điểm quy định trong xác nhận đặt lịch được hoàn
          toàn bộ chi phí. Hủy trễ hơn mốc này, hoặc không tham dự buổi hẹn,
          có thể chỉ được hoàn một phần hoặc không được hoàn tùy theo chính
          sách của từng tư vấn viên, được hiển thị rõ khi bạn đặt lịch.
        </p>
      </section>

      <section>
        <h2>4. Thời gian xử lý hoàn tiền</h2>
        <p>
          Yêu cầu hoàn tiền hợp lệ được xử lý trong vòng 5–10 ngày làm việc,
          tùy thời gian xử lý của cổng thanh toán hoặc ngân hàng phát hành
          thẻ của bạn.
        </p>
      </section>
    </LegalPage>
  );
}
