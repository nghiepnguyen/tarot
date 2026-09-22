# Technical Stack

## Định hướng

Stack ưu tiên tốc độ phát triển, trải nghiệm tương tác tốt, khả năng mở rộng và tích hợp AI, thanh toán, lịch hẹn. Các phiên bản dưới đây nên được kiểm tra lại trong thời điểm triển khai để dùng bản stable mới nhất tương thích với nhau.

## Frontend

| Công nghệ | Phiên bản đề xuất | Lý do chọn |
|---|---:|---|
| Next.js | 16.3.4 | Full-stack React framework, routing, SSR/metadata và API route trong cùng dự án. |
| React | 19.2.8 | Hệ sinh thái lớn, phù hợp giao diện tương tác và component hóa. |
| TypeScript | 5.x | Kiểm tra kiểu, giảm lỗi khi xử lý card, user session, payment và AI response. |
| Tailwind CSS | 4.x hoặc stable mới nhất | Xây dựng layout nhanh, kiểm soát tốt spacing, màu sắc và responsive. |
| Framer Motion | 13.x | Animation bốc bài, hover, reveal và transition nhẹ. |
| Lucide React | stable mới nhất | Bộ icon tối giản, đồng nhất với Swiss Design. |

## Backend và dữ liệu

| Công nghệ | Phiên bản đề xuất | Lý do chọn |
|---|---:|---|
| Next.js Route Handlers / Server Actions | Theo Next.js | API nội bộ, mutation và bảo vệ secret ở server. |
| PostgreSQL | 16+ hoặc managed stable | Dữ liệu quan hệ cho người dùng, tarot card, readings, credit/giao dịch (order, ledger), rate limit và booking. Hiện chạy trên Neon. |
| Prisma ORM | 6.19.3 | Schema rõ ràng, migration và type-safe query. Cấu hình ở `prisma.config.ts`; `package.json#prisma` đã bị Prisma 6 deprecate. |
| Object Storage | S3-compatible | Lưu ảnh card và tài liệu liên quan. Chưa dùng: ảnh card hiện nằm trong `public/`. |

## AI

- Hai nhà cung cấp chạy song song sau một cửa duy nhất (`lib/ai/generate.ts`): Google Gemini (`@google/genai`) và DeepSeek (`fetch` thẳng, giao thức OpenAI — hãng không có SDK JavaScript chính chủ). Thêm nhà cung cấp thứ ba là thêm một `case`, và TypeScript báo ngay nếu quên nối dây.
- Model mặc định đổi được từ `/admin/prompts` mà không cần deploy, trong giới hạn danh sách cho phép ở `lib/ai/models.ts`. Có thêm chế độ **Ngẫu nhiên**: mỗi lượt bốc một model, mỗi model ký tên bằng một bút danh cố định, và người đọc chấm điểm ba tiêu chí mà không thấy tên nhà cung cấp — xem mục chấm mù trong `FEATURES.md`.
- Giá token khai theo model ở `lib/ai/pricing.ts`. Bảng đó là *lịch sử giá*: model đã gỡ vẫn phải giữ giá chừng nào còn row sinh ra bằng nó.
- Prompt nên nhận các biến: câu hỏi, tên lá, vị trí, xuôi/ngược, chủ đề và giọng văn.
- Structured output nên được validate bằng Zod trước khi hiển thị.
- Không gửi thông tin thanh toán hoặc dữ liệu không cần thiết vào prompt.
- Text-to-speech đã gác lại, xem mục "Lưu trữ — không nằm trong kế hoạch" trong `FEATURES.md`.

## Thanh toán và lịch hẹn

- Cổng thanh toán: PayOS (QR chuyển khoản, phù hợp app indie tại Việt Nam) đã tích hợp cho nạp credit; cân nhắc Stripe nếu sản phẩm mở rộng ra quốc tế.
- Xác nhận giao dịch bằng webhook server-side, không chỉ dựa vào redirect từ trình duyệt. Webhook có thể không bao giờ tới, nên có thêm ba đường đối soát chủ động — xem mục "Đối soát đơn hàng" trong `SETUP.md`.
- Email: Resend, gọi thẳng REST API bằng `fetch` (không thêm dependency, khớp cách viết client PayOS). Dùng cho cảnh báo vận hành về sự cố thanh toán, email xác nhận đăng ký và đặt lại mật khẩu cho khách, và thư báo mỗi lượt người đọc chấm điểm một bản diễn giải. `sendEmail` không bao giờ ném lỗi — chỗ gọi tự quyết định hỏng thì làm gì.
- Giai đoạn đầu có thể dùng form đặt lịch và email notification; sau đó tích hợp Google Calendar hoặc hệ thống booking chuyên dụng.

## Đo lường

- Google Analytics 4 (`G-YR3ZHD8JBV`) nạp qua `next/script` trong root layout.
- `page_view` tự bắn theo route vì App Router điều hướng ở client; `gtag('config')` chạy với `send_page_view: false`.
- Event sản phẩm đi qua `trackEvent()` trong `lib/analytics/gtag.ts`, no-op khi gtag bị chặn để tracking không bao giờ làm hỏng luồng chính.
- Không gửi câu hỏi, email hay tên người dùng vào event. Doanh thu đối soát bằng bảng `Order`, không bằng GA.
- Consent Mode v2: gtag mặc định `analytics_storage: denied` (ping ẩn danh, không cookie), chỉ nâng lên `granted` sau khi người dùng đồng ý ở cookie banner. `ad_*` luôn denied vì sản phẩm không chạy quảng cáo.
- Danh mục event đầy đủ và quy ước đặt tên: `ANALYTICS.md`.

## Kiểm thử và chất lượng

- Vitest cho unit test. Chỉ quét `lib/**/*.test.ts`; logic cần test nằm ở `lib/`, server action và route handler giữ mỏng để gọi xuống đó.
- Playwright cho flow nhập câu hỏi, bốc bài, unlock AI và nạp credit. `e2e/global-setup.ts` tự seed dữ liệu, dọn rate limit và từ chối chạy nếu `DATABASE_URL` không phải database dùng một lần.
- ESLint và Prettier cho chất lượng mã nguồn.
- Sentry (`@sentry/nextjs`) cho error tracking ở cả ba runtime — browser, Node, Edge — cộng trace hiệu năng lấy mẫu 10% ở production. Thiếu `NEXT_PUBLIC_SENTRY_DSN` thì SDK tự tắt, app chạy bình thường. Mọi đường thu thập dữ liệu người dùng đều khai báo tắt tường minh qua `dataCollection`, có test chặn hồi quy. Chi tiết: `MONITORING.md`.
- Vercel cho deploy Next.js; PostgreSQL dùng dịch vụ managed (đang là Neon). Migration production chạy tay, xem `SETUP.md`.

## Ngôn ngữ thiết kế

Token định nghĩa ở `app/globals.css`, chú thích ngay tại đó là nguồn đúng khi hai bên lệch nhau.

- "Mystical Minimalism / Modern Botanical": nền kem, sage (`--accent`) là màu nhấn tương tác **duy nhất**. Rose quartz và warm earth chỉ dùng cho hình minh họa line-art, không bao giờ lên nút hay focus ring.
- Typography là serif (Lora) cho toàn bộ nội dung, mono (Geist Mono) cho mã. Nhịp điệu và khoảng trắng theo tinh thần Swiss Design, nhưng chữ thì không sans-serif.
- Dark mode qua `prefers-color-scheme`, đổi giá trị token chứ không thêm class.
- Grid, khoảng trắng, đường viền mảnh và alignment nhất quán.
- Animation chậm, có chủ ý. `prefers-reduced-motion` xử lý toàn cục ở `globals.css`.
- Quy ước cho phần tử tương tác: `cursor-pointer`, `focus-visible:ring-2 ring-accent`, hover đổi `border-accent` / nền `sage-tint`, transition 150–300ms, vùng chạm tối thiểu 44px (`min-h-11`).
