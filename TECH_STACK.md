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
| PostgreSQL | 16+ hoặc managed stable | Dữ liệu quan hệ cho người dùng, tarot card, readings, credits và booking. |
| Prisma ORM | 6.x hoặc stable mới nhất | Schema rõ ràng, migration và type-safe query. |
| Redis | Managed stable | Rate limit, cache card metadata, job trạng thái và session phụ trợ. |
| Object Storage | S3-compatible | Lưu ảnh card, audio AI và tài liệu liên quan. |

## AI

- Dùng một AI provider có API server-side để tạo diễn giải nâng cao.
- Prompt nên nhận các biến: câu hỏi, tên lá, vị trí, xuôi/ngược, chủ đề và giọng văn.
- Structured output nên được validate bằng Zod trước khi hiển thị.
- Không gửi thông tin thanh toán hoặc dữ liệu không cần thiết vào prompt.
- Audio có thể dùng dịch vụ text-to-speech riêng; lưu audio theo reading ID để tránh tạo lại không cần thiết.

## Thanh toán và lịch hẹn

- Tích hợp cổng thanh toán phù hợp thị trường Việt Nam hoặc Stripe nếu sản phẩm phục vụ quốc tế.
- Xác nhận giao dịch bằng webhook server-side, không chỉ dựa vào redirect từ trình duyệt.
- Giai đoạn đầu có thể dùng form đặt lịch và email notification; sau đó tích hợp Google Calendar hoặc hệ thống booking chuyên dụng.

## Kiểm thử và chất lượng

- Vitest cho unit test.
- Playwright cho flow nhập câu hỏi, bốc bài, unlock AI và booking.
- ESLint và Prettier cho chất lượng mã nguồn.
- Sentry hoặc công cụ tương đương cho error tracking.
- Vercel cho deploy frontend/Next.js; PostgreSQL, Redis và storage dùng dịch vụ managed.

## Ngôn ngữ thiết kế

- Typography sans-serif rõ ràng, hierarchy theo Swiss Design.
- Nền trung tính, một màu nhấn có chủ đích, tránh gradient và hiệu ứng quá mức.
- Grid, khoảng trắng, đường viền mảnh và alignment nhất quán.
- Animation chậm, có chủ ý, không làm giảm khả năng đọc hoặc khả năng tiếp cận.
