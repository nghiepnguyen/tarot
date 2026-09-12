# Setup và Deployment

## Yêu cầu

- Node.js bản LTS tương thích với Next.js.
- npm, pnpm hoặc yarn. Khuyến nghị pnpm để cài đặt nhanh và quản lý workspace tốt.
- PostgreSQL nếu bật tính năng tài khoản và lịch sử.
- Object storage khi triển khai production cần lưu file lớn. Hiện chưa dùng: rate limit nằm trong Postgres, ảnh card nằm trong `public/`.
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
# Local. Production dùng https://tarot.thanhnghiep.top
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=postgresql://tarot:tarot@localhost:5432/tarot

# Generate with: openssl rand -base64 32
AUTH_SECRET=

# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

`NEXT_PUBLIC_APP_URL` là origin dùng để dựng `returnUrl`/`cancelUrl` của PayOS trong `app/actions/payments.ts`. Sai giá trị thì sau khi thanh toán người dùng bị đẩy về nhầm domain. Giá trị theo môi trường:

| Môi trường | Giá trị |
| --- | --- |
| Local | `http://localhost:3000` |
| Production (Vercel) | `https://tarot.thanhnghiep.top` |
| Preview (Vercel) | không set biến; code tự lấy `https://$VERCEL_URL` của deployment đó |

Đây là toàn bộ biến code đang đọc. Redis, object storage và email provider chưa có trong dự án nên không có biến tương ứng.

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

## Cơ sở dữ liệu: local và production

Dự án có hai database **hoàn toàn tách rời**. Không replication, không đồng bộ, không có đường nào để dữ liệu chảy từ bên này sang bên kia.

| | Local | Production |
| --- | --- | --- |
| Hạ tầng | Postgres 16 trong Docker ([docker-compose.yml](docker-compose.yml)), volume `tarot-db` | Neon (Postgres managed) |
| Connection string nằm ở | `.env.local` (không commit) | Env của Vercel, đánh dấu Sensitive |
| Lấy string ở đâu | `docker-compose.yml`, user/pass/db đều là `tarot` | Dashboard Neon. Không lấy được từ Vercel |
| Dữ liệu | Rác từ e2e và test tay, xóa lúc nào cũng được | Dữ liệu thật của người dùng |
| Áp migration bằng | `pnpm db:migrate` | `prisma migrate deploy` chạy tay, xem bên dưới |

Thứ duy nhất nối hai bên là thư mục `prisma/migrations` trong Git. Đó là lịch sử schema dùng chung: file nào đã chạy lên DB nào thì DB đó có cấu trúc tương ứng. Hai DB "giống nhau" chỉ theo nghĩa cùng áp một bộ migration, chứ nội dung bảng thì không liên quan gì nhau.

CI không đụng tới cả hai. Job e2e dựng một container Postgres tạm, `migrate deploy` lên đó, chạy test xong thì vứt.

### Thêm một migration

1. Sửa `prisma/schema.prisma`.
2. `pnpm db:migrate` — Prisma sinh file SQL trong `prisma/migrations` và áp luôn lên DB local.
3. Commit cả file schema lẫn thư mục migration mới.
4. Push. Vercel deploy code, **nhưng không áp migration**.
5. Áp lên production bằng tay, xem mục dưới.

Không chạy `migrate dev` lên production: nó có thể reset database khi phát hiện lệch lịch sử. Cũng không dùng `db push` cho production vì thao tác đó không để lại migration nào trong lịch sử.

### Áp migration lên production

Lấy connection string từ dashboard Neon, dùng host **không có `-pooler`**: chạy DDL qua PgBouncer ở transaction mode hay vướng advisory lock của Prisma.

```bash
DATABASE_URL='postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require' npx prisma migrate status
DATABASE_URL='postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require' npx prisma migrate deploy
```

Nháy đơn là bắt buộc, mật khẩu Neon hay có ký tự đặc biệt. Với migration xóa cột hoặc bảng, tạo branch trên Neon trước để có điểm khôi phục.

### Ba cái bẫy đã dính

- **`vercel env pull` trả về `DATABASE_URL` rỗng.** Biến bị đánh dấu Sensitive nên Vercel không trả giá trị, dù runtime vẫn chạy đúng. Đừng parse `.env.vercel.production` để lấy connection string, nó rỗng.
- **Export biến rỗng làm chết dev local.** Nếu `export DATABASE_URL="$(...)"` mà vế phải rỗng, shell đó có biến rỗng, và Next.js **không** cho `.env.local` ghi đè biến đã tồn tại trong process. Kết quả là `pnpm dev` chết với `PrismaClientInitializationError: ... resolved to an empty string`. Sửa bằng `unset DATABASE_URL` hoặc mở terminal mới.
- **Build của Vercel không thấy biến Sensitive.** Từng nhét `prisma migrate deploy` vào build script, mọi deploy hỏng ngay với `Environment variable not found: DATABASE_URL`, phải revert (commit `f2073a4`). Ngược lại `prisma generate` chạy được vì nó chỉ đọc schema, không cần URL — nên build script hiện là `prisma generate && next build`, đảm bảo client luôn khớp schema kể cả khi Vercel dùng lại cache và bỏ qua `postinstall`.

### Rủi ro còn tồn tại

Deploy code và áp migration là hai việc rời nhau, nên luôn có một cửa sổ production chạy code mới trên schema cũ. Ví dụ thật: deploy bản thêm rate limit trước khi tạo bảng `RateLimit` thì mọi server action có rate limit sẽ 500.

Cách xử lý hiện tại là áp migration ngay sát lúc deploy và ưu tiên migration tương thích ngược (thêm cột nullable trước, xóa cột ở lần deploy sau). Muốn khép hẳn cửa sổ này thì tạo thêm một biến `DIRECT_DATABASE_URL` **không** đánh dấu Sensitive, chỉ dùng cho build, rồi cho build chạy `migrate deploy` bằng biến đó.

## Cấu trúc thư mục

```text
app/
  page.tsx              # trang bốc bài
  actions/              # server action: ai, auth, payments, readings
  api/auth, api/webhooks
  history/, login/, signup/, profile/
  terms/, privacy/, refund/
components/
  tarot/                # ArcDeck, QuestionForm, ReadingView, FlipCard, ...
  ui/                   # Button, Input, Header, Footer, Toast, Section
lib/
  ai/                   # prompt, gọi Gemini, validate bằng Zod
  auth/                 # rate limit
  db/                   # Prisma client
  payments/             # PayOS
  tarot/                # dữ liệu 78 lá, logic rút bài
  validation/
prisma/
  schema.prisma
  migrations/
  seed.ts
public/
  cards/
```

Reading không có route riêng, kết quả render ngay trong trang. Chưa có `lib/booking/`, tính năng đặt lịch thuộc Phase 4 và chưa bắt đầu.

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
5. Kết nối PostgreSQL managed (đang dùng Neon), rồi áp migration lên đó trước lần deploy đầu.
6. Deploy preview trước để kiểm tra flow bốc bài, paywall và responsive.
7. Cấu hình domain, HTTPS, webhook thanh toán và redirect URL. Domain production là `tarot.thanhnghiep.top`; sau khi trỏ DNS xong phải cập nhật `NEXT_PUBLIC_APP_URL=https://tarot.thanhnghiep.top` cho môi trường Production rồi redeploy, vì biến `NEXT_PUBLIC_` được nướng vào bundle lúc build chứ không đọc lại lúc chạy.
8. Khai báo webhook PayOS trỏ về `https://tarot.thanhnghiep.top/api/webhooks/payos` và kiểm tra lại một giao dịch thật.

### Checklist production

- Sau khi thêm/sửa biến môi trường trên Vercel, xác nhận nó thực sự có giá trị (không chỉ tạo key rồi để trống). Biến đánh dấu "Sensitive" không xem lại được giá trị qua dashboard lẫn `vercel env pull` — kể cả khi đang hoạt động đúng ở runtime, lệnh pull vẫn trả về rỗng cho biến đó, đây là hành vi bình thường chứ không phải dấu hiệu lỗi.
- `next build` không tự chạy migration. Mỗi lần thêm migration phải áp lên production bằng tay, xem mục "Cơ sở dữ liệu: local và production" ở trên.
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
