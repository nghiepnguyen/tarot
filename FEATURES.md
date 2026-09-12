# Features

## Phase 0 — Foundation

- Thiết lập project Next.js + TypeScript.
- Xây dựng design token: màu, typography, spacing, border, shadow và motion.
- Responsive layout cho mobile, tablet và desktop.
- Thiết lập bộ component cơ bản: Button, Input, Card, Modal, Toast, Section và Header.
- Thiết lập logging, error state, loading state và empty state.
- Chuẩn bị nội dung pháp lý: disclaimer tarot, điều khoản, riêng tư và chính sách hoàn tiền.

## Phase 1 — MVP trải nghiệm bốc bài

### Home

- Hero section với tiêu đề ngắn, mô tả giá trị và CTA.
- Ô nhập câu hỏi có placeholder và giới hạn ký tự.
- Gợi ý câu hỏi theo chủ đề: tình yêu, công việc, tài chính, phát triển bản thân.
- Nút “Bốc 3 lá bài”.
- Bộ bài hiển thị dạng vòng cung ở bên dưới màn hình, chỉ để trang trí. Bước bốc bài dùng lưới chia trang cuộn ngang có snap, vì vòng cung trải 78 lá rộng tới ~3600px, kéo mãi không tới hai đầu.
- Hiệu ứng hover/focus nhẹ, hỗ trợ keyboard và reduced motion.

### Trải bài

- Chọn ngẫu nhiên ba lá không trùng nhau.
- Hiển thị ba vị trí theo cấu trúc: Bối cảnh, Hiện tại, Hướng đi.
- Hỗ trợ trạng thái lá bài xuôi/ngược nếu sản phẩm quyết định dùng.
- Animation lật bài theo từng bước.
- Hiển thị tên, hình ảnh, từ khóa và ý nghĩa cơ bản.
- Hiển thị lại câu hỏi để người dùng duy trì ngữ cảnh.
- Nút thực hiện trải bài mới.
- Ghi chú nhỏ dưới nút "Bốc 3 lá bài" nhắc đăng nhập để dùng diễn giải chuyên sâu.
- Người dùng chưa đăng nhập vẫn bốc bài và xem 3 lá bình thường; câu hỏi và 3 lá được giữ lại (sessionStorage) qua lúc đăng nhập/đăng ký, tự khôi phục và mở khóa ngay sau khi đăng nhập thành công thay vì bắt bốc lại.

### Nội dung và an toàn

- Disclaimer rằng kết quả mang tính tham khảo và tự phản tỉnh.
- Không đưa ra tuyên bố tuyệt đối về sức khỏe, pháp lý, tài chính hoặc tương lai.
- Xử lý lỗi khi câu hỏi trống, request thất bại hoặc người dùng rời trang.

## Phase 2 — Tài khoản và lịch sử

- Đăng ký, đăng nhập và đăng xuất.
- Lưu lịch sử các lần trải bài.
- Xem lại câu hỏi, ba lá bài và diễn giải cơ bản.
- Xóa một reading hoặc xóa toàn bộ lịch sử.
- Hồ sơ người dùng. Sản phẩm chỉ phục vụ tiếng Việt, không làm đa ngôn ngữ.
- Rate limit và chống spam theo tài khoản/IP.

## Phase 3 — VIP và AI

- Hiển thị phần AI bị khóa sau phần diễn giải cơ bản.
- Mô tả rõ quyền lợi và giá trước khi thanh toán.
- Tặng 2 lượt xem miễn phí khi đăng ký (one-time), sau đó nạp credit theo gói (5/10/20/50 lượt) qua PayOS — chưa có gói VIP theo tháng ở giai đoạn này.
- Ghi sổ giao dịch credit (free grant, mua, chi tiêu, hoàn tiền) để đo tỷ lệ free-to-paid.
- Tạo prompt từ câu hỏi, ba lá bài và vị trí từng lá.
- Sinh diễn giải dài theo cấu trúc: tổng quan, từng lá, mối liên hệ, gợi ý hành động và câu hỏi tự phản tỉnh.
- Hiển thị trạng thái đang tạo, retry và lỗi tạm thời.
- Lưu kết quả AI theo reading ID để không tạo trùng.
- Không cho AI trình bày nội dung như lời khuyên chuyên môn hoặc lời tiên tri chắc chắn.

## Phase 4 — Tư vấn viên và đặt lịch

- Danh sách người tư vấn với ảnh, giới thiệu, chuyên môn, ngôn ngữ và giá.
- Lịch trống theo múi giờ người dùng.
- Chọn thời lượng và hình thức tư vấn.
- Đặt lịch, thanh toán và nhận email xác nhận.
- Nhắc lịch trước buổi hẹn.
- Quản lý hủy, đổi lịch và chính sách hoàn tiền.
- Khu vực tư vấn viên quản lý lịch và trạng thái booking.

## Phase 5 — Quản trị và tăng trưởng

- CRUD bộ bài, hình ảnh, từ khóa và diễn giải cơ bản.
- Quản lý người dùng, credit, giao dịch và booking.
- Quản lý prompt template và phiên bản model AI.
- Dashboard conversion: nhập câu hỏi, bốc bài, unlock AI, đặt lịch. Số liệu thô đã có trên Google Analytics 4; dashboard trong trang quản trị thì chưa.
- A/B testing CTA, giá và nội dung paywall.
- SEO landing pages theo chủ đề câu hỏi.
- Analytics: GA4 đã gắn, phủ toàn bộ phễu bốc bài, mở khóa AI, thanh toán và tài khoản — xem `ANALYTICS.md`. Event không chứa câu hỏi, email hay tên người dùng. Có banner xin đồng ý: chưa đồng ý thì script GA không được nạp và không có cookie phân tích nào được đặt; đổi lựa chọn qua “Tùy chọn cookie” ở chân trang.

## Lưu trữ — không nằm trong kế hoạch

Ý tưởng đã cân nhắc rồi gác lại. Không làm cho đến khi có quyết định mới.

- Nghe diễn giải AI bằng text-to-speech. Ba hướng đã cân nhắc: Web Speech API của trình duyệt (miễn phí, không cần lưu trữ, nhưng giọng phụ thuộc thiết bị và nhiều trình duyệt không có giọng tiếng Việt); Gemini TTS rồi lưu file lên object storage theo reading ID (giọng đồng nhất, tốn phí API và cần thêm dịch vụ lưu trữ, file WAV của bài diễn giải dài lên tới vài MB); Gemini TTS stream trực tiếp không lưu (tốn phí mỗi lần nghe và chờ lâu mỗi lần phát).

## Tiêu chí MVP hoàn thành

- Người dùng có thể nhập câu hỏi và bốc đúng ba lá không trùng.
- Màn hình bốc bài dùng tốt trên cả mobile và desktop, không phải kéo ngang lê thê.
- Kết quả có trạng thái loading, success và error rõ ràng.
- Mỗi lá có tên, hình ảnh và diễn giải cơ bản.
- Paywall AI hiển thị minh bạch; free trial và nạp credit qua thanh toán thật (PayOS) đã hoạt động.
- Có disclaimer và xử lý dữ liệu tối thiểu an toàn.
