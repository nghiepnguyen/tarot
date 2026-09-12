import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Chính sách riêng tư",
  alternates: { canonical: "/privacy" },
  description: "Chính sách riêng tư và xử lý dữ liệu của Tarot Reading Web.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Chính sách riêng tư" updatedAt="12/09/2026">
      <section>
        <h2>1. Dữ liệu chúng tôi thu thập</h2>
        <p>
          Câu hỏi bạn nhập khi trải bài, lá bài được chọn, và nếu bạn tạo tài
          khoản: email, lịch sử trải bài, và thông tin giao dịch credit/VIP.
          Chúng tôi không yêu cầu thông tin nhạy cảm ngoài phạm vi cần thiết
          để vận hành dịch vụ.
        </p>
      </section>

      <section>
        <h2>2. Mục đích sử dụng dữ liệu</h2>
        <p>
          Dữ liệu được dùng để tạo trải bài, sinh diễn giải chuyên sâu theo yêu cầu
          của bạn, lưu lịch sử khi bạn đăng nhập, xử lý thanh toán, và cải
          thiện chất lượng dịch vụ. Câu hỏi và nội dung trải bài không được
          bán cho bên thứ ba.
        </p>
      </section>

      <section>
        <h2>3. Chia sẻ với bên thứ ba</h2>
        <p>
          Chúng tôi chỉ chia sẻ dữ liệu cần thiết với nhà cung cấp dịch vụ
          diễn giải chuyên sâu, cổng thanh toán, hoặc dịch vụ email khi bạn
          chủ động sử dụng các tính
          năng tương ứng, và chỉ ở mức tối thiểu để hoàn tất yêu cầu đó.
          Ngoài ra, dữ liệu đo lường ẩn danh được gửi tới Google Analytics như
          mô tả ở mục 6.
        </p>
      </section>

      <section>
        <h2>4. Lưu trữ và bảo mật</h2>
        <p>
          API key, thông tin thanh toán và bí mật webhook chỉ được xử lý ở
          phía server, không xuất hiện trong mã nguồn phía client. Chúng tôi
          hạn chế ghi log câu hỏi hoặc dữ liệu nhạy cảm khi không thực sự cần
          thiết cho vận hành hoặc gỡ lỗi.
        </p>
      </section>

      <section>
        <h2>5. Quyền của bạn</h2>
        <p>
          Bạn có thể xem lại, xóa một reading, hoặc xóa toàn bộ lịch sử và
          tài khoản của mình. Yêu cầu xóa dữ liệu được xử lý trong thời gian
          hợp lý kể từ khi chúng tôi xác nhận yêu cầu.
        </p>
      </section>

      <section>
        <h2>6. Cookie và theo dõi</h2>
        <p>
          Chúng tôi dùng cookie và lưu trữ cục bộ để duy trì phiên đăng nhập
          và ghi nhớ tùy chọn hiển thị; phần này cần thiết để dịch vụ hoạt động
          nên không có lựa chọn tắt. Ngoài ra chúng tôi dùng Google Analytics
          để đo lường cách dịch vụ được sử dụng: số liệu này ghi nhận hành động
          như bốc bài, mở khóa diễn giải hay hoàn tất thanh toán, nhưng không
          bao gồm nội dung câu hỏi, email hay tên của bạn.
        </p>
        <p>
          Google Analytics chỉ được nạp sau khi bạn bấm “Đồng ý” ở thông báo
          cookie. Nếu bạn từ chối hoặc chưa trả lời, script không được tải và
          không có cookie phân tích nào được đặt. Bạn có thể đổi lựa chọn bất cứ
          lúc nào qua liên kết “Tùy chọn cookie” ở chân trang; khi rút lại đồng
          ý, chúng tôi ngừng gửi dữ liệu và xóa cookie phân tích đã đặt. Dịch vụ
          hoạt động như nhau ở cả hai lựa chọn.
        </p>
      </section>
    </LegalPage>
  );
}
