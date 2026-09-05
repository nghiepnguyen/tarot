# Setup và Deployment

## Yêu cầu

- Node.js bản LTS tương thích với Next.js.
- npm, pnpm hoặc yarn. Khuyến nghị pnpm để cài đặt nhanh và quản lý workspace tốt.
- PostgreSQL nếu bật tính năng tài khoản và lịch sử.
- Redis và object storage khi triển khai production có cache, audio hoặc job bất đồng bộ.
- API key Google Gemini (`GEMINI_API_KEY`) nếu bật diễn giải AI. Không có key, nút mở khóa AI vẫn hoạt động và hiển thị lỗi rõ ràng thay vì crash.

## Tạo project

```bash
pnpm create next-app@latest tarot-reading-web --ts --tailwind --eslint --app
cd tarot-reading-web
pnpm install
```

Cài các dependency dự kiến:

```bash
pnpm add zod framer-motion lucide-react @prisma/client
pnpm add -D prisma vitest playwright prettier
```

## Biến môi trường

Tạo file `.env.local` ở local. Không commit file này vào Git.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=postgresql://tarot:tarot@localhost:5432/tarot

# Generate with: openssl rand -base64 32
AUTH_SECRET=

# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

REDIS_URL=redis://localhost:6379
STORAGE_ENDPOINT=https://your-storage-endpoint
STORAGE_BUCKET=tarot-assets
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key

PAYMENT_PROVIDER=your_provider
PAYMENT_SECRET_KEY=your_payment_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

EMAIL_PROVIDER_API_KEY=your_email_key
```

Chỉ các biến bắt đầu bằng `NEXT_PUBLIC_` mới được đưa vào client bundle. API key, database URL, payment secret và webhook secret phải chỉ được đọc ở server.

## Chạy local

Khởi động Postgres local qua Docker Compose:

```bash
docker compose up -d
```

Sao chép `.env.example` thành `.env.local`, điền `AUTH_SECRET` (dùng `openssl rand -base64 32`), rồi:

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000).

`pnpm install` tự chạy `prisma generate` qua hook `postinstall`. Các lệnh Prisma khác:

```bash
pnpm db:migrate   # tạo/áp dụng migration ở local
pnpm db:seed      # seed dữ liệu mẫu (khi có prisma/seed.ts)
pnpm db:studio    # mở Prisma Studio để xem dữ liệu
```

Các lệnh kiểm tra đề xuất:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm start
```

## Cấu trúc thư mục đề xuất

```text
app/
  page.tsx
  reading/[id]/page.tsx
  api/
components/
  tarot/
  ui/
lib/
  ai/
  db/
  payments/
  booking/
  validation/
prisma/
  schema.prisma
public/
  cards/
  fonts/
```

## Seed dữ liệu bộ bài

- Lưu metadata mỗi lá trong database hoặc file seed versioned.
- Mỗi card nên có `id`, `name`, `image`, `keywords`, `basicMeaning`, `reversedMeaning` và `category`.
- Kiểm tra bản quyền hình ảnh trước khi đưa lên production.
- Tách dữ liệu nội dung khỏi UI để biên tập viên có thể thay đổi mà không sửa component.

## Deploy đề xuất

### Vercel

1. Push repository lên GitHub.
2. Import repository vào Vercel.
3. Chọn framework Next.js.
4. Thêm toàn bộ biến môi trường cho Development, Preview và Production.
5. Kết nối PostgreSQL managed, Redis và object storage.
6. Deploy preview trước để kiểm tra flow bốc bài, paywall và responsive.
7. Cấu hình domain, HTTPS, webhook thanh toán và redirect URL.

### Checklist production

- Chạy migration production bằng pipeline kiểm soát, không chạy migrate dev.
- Kiểm tra webhook thanh toán có verify chữ ký và idempotency.
- Bật rate limit cho API bốc bài và AI.
- Giới hạn kích thước input, sanitize nội dung và validate response AI bằng schema.
- Không log câu hỏi hoặc dữ liệu nhạy cảm nếu không cần thiết.
- Thiết lập backup database và chính sách retention.
- Theo dõi error rate, latency, AI cost, conversion và giao dịch thất bại.
- Kiểm tra SEO metadata, sitemap, robots và Open Graph.
- Kiểm tra accessibility: contrast, focus state, alt text, keyboard navigation và reduced motion.

## CI/CD tối thiểu

Mỗi pull request nên chạy:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test --run
pnpm build
```

Sau khi merge vào branch production, pipeline chạy migration có kiểm soát rồi deploy. Secrets phải được lưu trong secret manager của CI/CD, không đặt trong repository.

## Ghi chú vận hành

- Thời gian hiển thị lịch hẹn phải lưu theo UTC và render theo timezone người dùng.
- Credit AI phải trừ sau khi payment webhook xác nhận thành công.
- Request AI cần có timeout, retry có giới hạn và fallback thông báo dễ hiểu.
- Tách môi trường development, staging và production để tránh dùng nhầm dữ liệu thật.
