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

# Generate with: openssl rand -base64 32
CRON_SECRET=

# Resend — chỉ dùng cho cảnh báo vận hành
RESEND_API_KEY=
ALERT_EMAIL_FROM=alert@thanhnghiep.top
```

`NEXT_PUBLIC_APP_URL` là origin dùng để dựng `returnUrl`/`cancelUrl` của PayOS trong `app/actions/payments.ts`. Sai giá trị thì sau khi thanh toán người dùng bị đẩy về nhầm domain. Giá trị theo môi trường:

| Môi trường | Giá trị |
| --- | --- |
| Local | `http://localhost:3000` |
| Production (Vercel) | `https://tarot.thanhnghiep.top` |
| Preview (Vercel) | không set biến; code tự lấy `https://$VERCEL_URL` của deployment đó |

`CRON_SECRET` bảo vệ `/api/cron/reconcile-orders`. Vercel Cron gửi nó trong header `Authorization: Bearer ...`. Không set thì endpoint trả 503 và đơn hàng mất đường phục hồi khi webhook trượt — xem "Đối soát đơn hàng" ở dưới.

`RESEND_API_KEY` và `ALERT_EMAIL_FROM` chỉ phục vụ cảnh báo vận hành (xem "Cảnh báo" ở dưới). Thiếu cả hai thì cảnh báo bị bỏ qua kèm một dòng log, không có gì khác hỏng — local và preview không cần cấu hình email.

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

- **Prisma CLI không đọc `.env.local`.** Nó chỉ đọc `.env`, mà dự án không có file đó. Từ khi có `prisma.config.ts` thì nó không đọc file env nào cả (`Prisma config detected, skipping environment variable loading`). Mọi lệnh Prisma vì thế phải được truyền `DATABASE_URL` tường minh — `DATABASE_URL='...' npx prisma ...` cho production, hoặc `set -a && . ./.env.local && set +a` cho local. Không ảnh hưởng runtime của Next.js: Next tự nạp `.env.local`.
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
  api/auth, api/webhooks, api/cron
  credits/              # chọn gói và nạp credit
  history/, login/, signup/, profile/
  terms/, privacy/, refund/
components/
  analytics/            # script GA4, tracker page_view / purchase / auth
  tarot/                # ArcDeck, QuestionForm, ReadingView, FlipCard, ...
  ui/                   # Button, Input, Header, Footer, Toast, Section
lib/
  ai/                   # prompt, gọi Gemini, validate bằng Zod
  email/                # Resend, chỉ dùng cho cảnh báo vận hành
  analytics/            # measurement ID và trackEvent()
  auth/                 # rate limit
  db/                   # Prisma client
  payments/             # PayOS: client, vòng đời đơn hàng, hoàn tiền
  tarot/                # dữ liệu 78 lá, logic rút bài
  validation/
prisma.config.ts        # nơi khai báo schema và lệnh seed
prisma/
  schema.prisma
  migrations/
  seed.ts
public/
  cards/
```

Việc nạp credit có trang riêng `/credits`, vào được từ badge số credit trên header, mục "Nạp credit" trong menu người dùng, nút trên trang hồ sơ, và CTA khi hết credit ở panel mở khóa AI. `returnUrl`/`cancelUrl` của PayOS trỏ về đó. `/profile` vẫn xử lý được `?order=` vì những đơn tạo trước khi tách trang mang link cũ, và các link đó nằm ở PayOS không sửa được nữa.

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
9. Đặt `CRON_SECRET` cho Production. `vercel.json` khai báo cron chạy mỗi ngày lúc `0 20 * * *` UTC, tức 3 giờ sáng giờ Việt Nam. Lịch phải là mỗi ngày: gói Hobby **từ chối deploy** nếu biểu thức chạy hơn một lần một ngày (`0 * * * *` sẽ hỏng deploy với lỗi "Hobby accounts are limited to daily cron jobs"). Hobby cũng không bảo đảm đúng giờ, lệch trong vòng một tiếng là bình thường. Lên Pro thì hạ xuống `0 * * * *` được.

### Checklist production

- Sau khi thêm/sửa biến môi trường trên Vercel, xác nhận nó thực sự có giá trị (không chỉ tạo key rồi để trống). Biến đánh dấu "Sensitive" không xem lại được giá trị qua dashboard lẫn `vercel env pull` — kể cả khi đang hoạt động đúng ở runtime, lệnh pull vẫn trả về rỗng cho biến đó, đây là hành vi bình thường chứ không phải dấu hiệu lỗi.
- `next build` không tự chạy migration. Mỗi lần thêm migration phải áp lên production bằng tay, xem mục "Cơ sở dữ liệu: local và production" ở trên.
- Kiểm tra webhook thanh toán có verify chữ ký và idempotency.
- Sau khi set `CRON_SECRET`, gọi thử `curl -H "Authorization: Bearer $CRON_SECRET" https://tarot.thanhnghiep.top/api/cron/reconcile-orders` và xác nhận trả về `{"ok":true,...}` chứ không phải 401/503.
- Bật rate limit cho API bốc bài và AI.
- Giới hạn kích thước input, sanitize nội dung và validate response AI bằng schema.
- Không log câu hỏi hoặc dữ liệu nhạy cảm nếu không cần thiết.
- Thiết lập backup database và chính sách retention.
- Theo dõi error rate, latency, AI cost, conversion và giao dịch thất bại.
- SEO: `app/robots.ts`, `app/sitemap.ts` và `app/opengraph-image.tsx` sinh ra `/robots.txt`, `/sitemap.xml`, ảnh OG; canonical và Open Graph lấy origin từ `SITE_URL` trong `lib/seo/site.ts`. Nếu `NEXT_PUBLIC_APP_URL` sai thì canonical của toàn site sai theo.
- Các alias `*.vercel.app` vẫn trả 200 và không có `x-robots-tag`, nên về lý thuyết Google index được cả hai host. Canonical trỏ về domain chính đã xử lý phần lớn rủi ro; muốn dứt điểm thì gỡ alias `tarot-indol-tau.vercel.app` trong Vercel.
- Analytics: Google Analytics 4 (`G-YR3ZHD8JBV`) hardcode trong `lib/analytics/gtag.ts`, không cần biến môi trường. Sau khi deploy, mở DebugView của GA4 và xác nhận `page_view` bắn đúng một lần mỗi route — điều hướng client-side của App Router là chỗ dễ đếm thiếu hoặc đếm trùng nhất. Danh mục event ở `ANALYTICS.md`.
- Kiểm tra accessibility: contrast, focus state, alt text, keyboard navigation và reduced motion.

## Đối soát đơn hàng

Webhook PayOS là nguồn sự thật cho việc cộng credit, nhưng nó có thể không bao giờ tới: PayOS lỗi, deploy rơi đúng lúc callback, mạng đứt. Không có gì bù lại thì người dùng trả tiền mà đơn nằm `PENDING` vĩnh viễn.

Có ba đường cùng gọi vào `lib/payments/orders.ts`, nên mọi đường đều idempotent và đều đối chiếu số tiền:

| Đường | Khi nào chạy | File |
| --- | --- | --- |
| Webhook | PayOS gọi ngay sau khi trả tiền | `app/api/webhooks/payos/route.ts` |
| Trang trả về | Người dùng quay lại `/credits?order=...&status=success`; hỏi lại trạng thái mỗi 3 giây trong ~1 phút | `components/tarot/OrderStatusWatcher.tsx` |
| Mở lại trang nạp | Người dùng mở `/credits` (hoặc `/profile`) và đang có đơn `PENDING` cũ hơn 5 phút; chỉ quét đơn của chính họ | `components/tarot/PendingOrdersReconciler.tsx` |
| Cron | Mỗi ngày, quét đơn `PENDING` cũ hơn 5 phút của mọi người | `app/api/cron/reconcile-orders/route.ts` |

Hai đường sau hỏi trực tiếp PayOS bằng `GET /v2/payment-requests/{id}`, dùng `Order.providerPaymentLinkId` lưu lúc tạo đơn. Đơn quá `expiresAt` (30 phút) mà vẫn chưa trả tiền sẽ được đóng thành `EXPIRED`.

Số tiền PayOS báo phải khớp đúng `Order.amountVnd`. Lệch thì không cộng credit, ghi `console.error` và để đơn nguyên `PENDING` cho người thật xử lý.

Trên gói Hobby cron chỉ chạy một lần mỗi ngày, nên đường thứ ba tồn tại để bịt khe hở đó: khách trả tiền, webhook trượt, **và** khách đóng tab trước khi trang trả về kịp đối soát. Lần sau họ mở `/credits` — thường là để xem credit đã về chưa — đơn được hỏi lại ngay tại đó thay vì đợi tới lượt quét kế tiếp.

Trang chỉ đếm xem có đơn treo hay không; việc gọi PayOS nằm trong server action, không phải trong lúc render. Lần mở hồ sơ bình thường vì thế không tốn lượt gọi nào.

## Cảnh báo

Hai tình huống trong luồng thanh toán không có đường tự động nào gỡ được, nên chúng gửi email về `SUPPORT_EMAIL` (`lib/seo/site.ts`) qua Resend:

| Cảnh báo | Nghĩa là gì | Chống lặp |
| --- | --- | --- |
| Số tiền lệch | PayOS báo số tiền khác giá gói đã chốt. Credit **không** được cộng, đơn nằm nguyên `PENDING` | 1 email mỗi đơn mỗi 24 giờ |
| Đơn còn treo | Sau khi đối soát vẫn còn đơn `PENDING` — PayOS cũng chưa chốt, hoặc không gọi được sang PayOS | 1 email mỗi 12 giờ |

Chống lặp dùng chính bảng `RateLimit` ở Postgres, nên khoá sống sót qua deploy. Không có nó thì mỗi lần PayOS gửi lại webhook là một email giống hệt, và cảnh báo nhanh chóng thành thứ bị bỏ qua.

`sendEmail()` trong `lib/email/resend.ts` **không bao giờ ném lỗi**. Nó chạy xen giữa việc cộng credit cho khách; Resend chết mà kéo đổ cả giao dịch thì thuốc độc hơn bệnh. Hỏng thì ghi log và trả `false`.

Trước khi bật: verify domain trong dashboard Resend, rồi đặt `ALERT_EMAIL_FROM` bằng một địa chỉ thuộc domain đó. Gửi từ domain chưa verify sẽ bị Resend trả 422.

## Hoàn tiền

PayOS không mở API hoàn tiền cho merchant, nên tiền phải hoàn thủ công trên dashboard PayOS. Sau đó đóng nốt sổ sách phía mình:

```bash
pnpm refund-order <orderId> --dry-run   # xem đơn trước
pnpm refund-order <orderId>             # đổi sang REFUNDED, trừ lại credit
```

Script cho phép số dư credit xuống âm nếu khách đã tiêu trước khi yêu cầu hoàn — ghi âm vào sổ đúng hơn là bỏ qua, và chặn họ mở khóa tiếp cho tới khi nạp bù.

## Chạy e2e

```bash
pnpm test:e2e
```

Playwright tự dựng server (`pnpm build && pnpm start`), nên không cần `pnpm dev` chạy sẵn. `e2e/global-setup.ts` lo hai việc trước khi test bắt đầu:

- **Chặn chạy nhầm lên production.** Bộ test đăng ký tài khoản và ghi reading thật. `DATABASE_URL` không trỏ tới host local (và không phải CI) thì nó dừng ngay thay vì đổ rác vào dữ liệu người dùng.
- **Dọn bảng `RateLimit`.** Suite tiêu 4 trong số 5 lượt đăng ký mỗi giờ mà `signupAction` cho phép trên mỗi IP. Không dọn thì lần chạy thứ hai trong cùng một giờ sẽ tự chặn chính nó, và lỗi hiện ra là "đăng ký thất bại" chứ không nói gì về rate limit. CI không gặp vì database dựng mới mỗi lần.

Nó cũng tự đọc `.env.local` — tiến trình Playwright không đi qua Next nên không được nạp sẵn biến môi trường.

Test `ai-unlock` kiểm tra nhánh thiếu `GEMINI_API_KEY`, nên nó tự skip khi máy bạn có key thật. Ở CI không cấu hình key nên test chạy bình thường.

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
