import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — Tarot Reading Web",
  description: "Điều khoản sử dụng dịch vụ Tarot Reading Web.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Điều khoản sử dụng" updatedAt="05/09/2026">
      <section>
        <h2>1. Bản chất dịch vụ</h2>
        <p>
          Tarot Reading Web cung cấp trải nghiệm xem bài tarot mang tính tham
          khảo và tự phản tỉnh. Kết quả trải bài, diễn giải cơ bản và diễn
          giải AI (nếu có) không phải là lời khuyên y tế, pháp lý, tài chính
          hay lời tiên tri chắc chắn về tương lai. Bạn tự chịu trách nhiệm về
          các quyết định thực hiện dựa trên nội dung dịch vụ cung cấp.
        </p>
      </section>

      <section>
        <h2>2. Điều kiện sử dụng</h2>
        <p>
          Bạn cần đủ 13 tuổi trở lên để sử dụng dịch vụ. Không sử dụng dịch vụ
          cho mục đích quấy rối, lừa đảo hoặc vi phạm pháp luật hiện hành. Nội
          dung câu hỏi bạn nhập vào chỉ phục vụ cho việc tạo trải bài và diễn
          giải, không được dùng để suy diễn hay công khai danh tính người
          khác.
        </p>
      </section>

      <section>
        <h2>3. Tài khoản và bảo mật</h2>
        <p>
          Khi tính năng tài khoản được kích hoạt, bạn chịu trách nhiệm bảo mật
          thông tin đăng nhập của mình. Chúng tôi có thể tạm khóa hoặc chấm
          dứt tài khoản vi phạm điều khoản sử dụng mà không cần báo trước
          trong trường hợp cần thiết để bảo vệ hệ thống hoặc người dùng khác.
        </p>
      </section>

      <section>
        <h2>4. Thanh toán và gói VIP</h2>
        <p>
          Chi phí, quyền lợi và điều kiện sử dụng của credit hoặc gói VIP được
          hiển thị rõ ràng trước khi bạn xác nhận thanh toán. Giao dịch được
          xử lý qua đối tác thanh toán bên thứ ba; chúng tôi không lưu trữ
          thông tin thẻ thanh toán đầy đủ của bạn.
        </p>
      </section>

      <section>
        <h2>5. Giới hạn trách nhiệm</h2>
        <p>
          Dịch vụ được cung cấp trên cơ sở &quot;nguyên trạng&quot;. Chúng tôi
          không đảm bảo dịch vụ không gián đoạn hoặc không có lỗi, và không
          chịu trách nhiệm cho các thiệt hại phát sinh từ việc sử dụng hoặc
          diễn giải nội dung tarot theo cách vượt ngoài mục đích tham khảo.
        </p>
      </section>

      <section>
        <h2>6. Thay đổi điều khoản</h2>
        <p>
          Điều khoản này có thể được cập nhật theo thời gian. Phiên bản mới
          nhất luôn được công bố tại trang này kèm ngày cập nhật lần cuối.
        </p>
      </section>
    </LegalPage>
  );
}
