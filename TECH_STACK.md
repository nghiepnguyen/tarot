# Technical Stack

## Định hướng

Stack ưu tiên tốc độ phát triển, trải nghiệm tương tác tốt, khả năng mở rộng và tích hợp AI, thanh toán, lịch hẹn. Các phiên bản dưới đây nên được kiểm tra lại trong thời điểm triển khai để dùng bản stable mới nhất tương thích với nhau.

## Frontend

| Công nghệ | Phiên bản đề xuất | Lý do chọn |
|---|---:|---|
| Next.js | 15.x hoặc stable mới nhất | Full-stack React framework, routing, SSR/metadata và API route trong cùng dự án. |
| React | 19.x hoặc phiên bản tương thích Next.js | Hệ sinh thái lớn, phù hợp giao diện tương tác và component hóa. |
| TypeScript | 5.x | Kiểm tra kiểu, giảm lỗi khi xử lý card, user session, payment và AI response. |
| Tailwind CSS | 4.x hoặc stable mới nhất | Xây dựng layout nhanh, kiểm soát tốt spacing, màu sắc và responsive. |
| Framer Motion | 11.x hoặc stable mới nhất | Animation bốc bài, hover, reveal và transition nhẹ. |
| Lucide React | stable mới nhất | Bộ icon tối giản, đồng nhất với Swiss Design. |

## Backend và dữ liệu

| Công nghệ | Phiên bản đề xuất | Lý do chọn |
|---|---:|---|
| Next.js Route Handlers / Server Actions | Theo Next.js | API nội bộ, mutation và bảo vệ secret ở server. |
| PostgreSQL | 16+ hoặc managed stable | Dữ liệu quan hệ cho người dùng, tarot card, readings, credit/giao dịch (order, ledger), rate limit và booking. Hiện chạy trên Neon. |
| Prisma ORM | 6.x hoặc stable mới nhất | Schema rõ ràng, migration và type-safe query. |
| Object Storage | S3-compatible | Lưu ảnh card và tài liệu liên quan. Chưa dùng: ảnh card hiện nằm trong `public/`. |

## AI

- Dùng một AI provider có API server-side để tạo diễn giải nâng cao.
- Prompt nên nhận các biến: câu hỏi, tên lá, vị trí, xuôi/ngược, chủ đề và giọng văn.
- Structured output nên được validate bằng Zod trước khi hiển thị.
- Không gửi thông tin thanh toán hoặc dữ liệu không cần thiết vào prompt.
- Text-to-speech đã gác lại, xem mục "Lưu trữ — không nằm trong kế hoạch" trong `FEATURES.md`.

## Thanh toán và lịch hẹn

- Cổng thanh toán: PayOS (QR chuyển khoản, phù hợp app indie tại Việt Nam) đã tích hợp cho nạp credit; cân nhắc Stripe nếu sản phẩm mở rộng ra quốc tế.
- Xác nhận giao dịch bằng webhook server-side, không chỉ dựa vào redirect từ trình duyệt.
- Giai đoạn đầu có thể dùng form đặt lịch và email notification; sau đó tích hợp Google Calendar hoặc hệ thống booking chuyên dụng.

## Kiểm thử và chất lượng

- Vitest cho unit test.
- Playwright cho flow nhập câu hỏi, bốc bài, unlock AI và booking.
- ESLint và Prettier cho chất lượng mã nguồn.
- Sentry hoặc công cụ tương đương cho error tracking.
- Vercel cho deploy Next.js; PostgreSQL dùng dịch vụ managed (đang là Neon). Migration production chạy tay, xem `SETUP.md`.

## Ngôn ngữ thiết kế

- Typography sans-serif rõ ràng, hierarchy theo Swiss Design.
- Nền trung tính, một màu nhấn có chủ đích, tránh gradient và hiệu ứng quá mức.
- Grid, khoảng trắng, đường viền mảnh và alignment nhất quán.
- Animation chậm, có chủ ý, không làm giảm khả năng đọc hoặc khả năng tiếp cận.
