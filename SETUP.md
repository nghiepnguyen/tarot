# Setup và Deployment

## Yêu cầu

- Node.js bản LTS tương thích với Next.js.
- npm, pnpm hoặc yarn. Khuyến nghị pnpm để cài đặt nhanh và quản lý workspace tốt.
- PostgreSQL nếu bật tính năng tài khoản và lịch sử.
- Object storage khi triển khai production cần lưu file lớn. Hiện chưa dùng: rate limit nằm trong Postgres, ảnh card nằm trong `public/`.
- API key của nhà cung cấp AI đang chọn nếu bật diễn giải AI: `GEMINI_API_KEY` (Google Gemini) hoặc `DEEPSEEK_API_KEY` (DeepSeek). Model mặc định chọn ở `/admin/prompts`, danh sách cho phép nằm trong `lib/ai/models.ts`. Thiếu key, nút mở khóa AI vẫn hoạt động và nói thẳng tên biến môi trường còn thiếu thay vì crash.

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

# Google OAuth. Thiếu thì nút "Đăng nhập với Google" không hiện.
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# Chỉ cần khi model mặc định ở /admin/prompts trỏ sang DeepSeek.
DEEPSEEK_API_KEY=your_deepseek_api_key

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Generate with: openssl rand -base64 32
CRON_SECRET=

# Resend — cảnh báo vận hành và email xác nhận đăng ký
RESEND_API_KEY=
ALERT_EMAIL_FROM=alert@thanhnghiep.top
AUTH_EMAIL_FROM=no-reply@thanhnghiep.top

# Sentry — theo dõi lỗi. Ba biến dưới chỉ cần lúc build để upload source map.
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

`NEXT_PUBLIC_APP_URL` là origin dùng để dựng `returnUrl`/`cancelUrl` của PayOS trong `app/actions/payments.ts`. Sai giá trị thì sau khi thanh toán người dùng bị đẩy về nhầm domain. Giá trị theo môi trường:

| Môi trường | Giá trị |
| --- | --- |
| Local | `http://localhost:3000` |
| Production (Vercel) | `https://tarot.thanhnghiep.top` |
| Preview (Vercel) | không set biến; code tự lấy `https://$VERCEL_URL` của deployment đó |

`CRON_SECRET` bảo vệ `/api/cron/reconcile-orders`. Vercel Cron gửi nó trong header `Authorization: Bearer ...`. Không set thì endpoint trả 503 và đơn hàng mất đường phục hồi khi webhook trượt — xem "Đối soát đơn hàng" ở dưới.

`RESEND_API_KEY` phục vụ hai việc: cảnh báo vận hành (xem "Cảnh báo" ở dưới) và email xác nhận đăng ký (xem "Xác nhận email" ở dưới). `ALERT_EMAIL_FROM` là địa chỉ gửi cảnh báo; `AUTH_EMAIL_FROM` là địa chỉ gửi thư cho khách, không set thì dùng chung `ALERT_EMAIL_FROM`.

Thiếu cấu hình Resend thì cảnh báo bị bỏ qua kèm một dòng log, còn đăng ký vẫn tạo được tài khoản nhưng link xác nhận chỉ in ra server log. Đủ để chạy local; **không** dùng được trên production.

`NEXT_PUBLIC_SENTRY_DSN` bật gửi lỗi về Sentry. Không set thì SDK vẫn nạp nhưng `enabled: false`, app chạy bình thường và không có event nào rời máy — mặc định hợp lý khi chạy local. `SENTRY_AUTH_TOKEN` cùng `SENTRY_ORG`/`SENTRY_PROJECT` chỉ dùng lúc build để upload source map; thiếu thì build vẫn chạy, chỉ là stack trace trong Sentry ở dạng đã minify. Chi tiết ở [MONITORING.md](MONITORING.md).

Đây là toàn bộ biến code đang đọc. Redis và object storage chưa có trong dự án nên không có biến tương ứng.

Chỉ các biến bắt đầu bằng `NEXT_PUBLIC_` mới được đưa vào client bundle. API key, database URL, payment secret và webhook secret phải chỉ được đọc ở server.

## Chạy local

Khởi động Postgres local qua Docker Compose (Docker Desktop phải đang chạy, nếu không sẽ gặp `Cannot connect to the Docker daemon`):

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

Prisma CLI **không** tự đọc `.env.local`: có `prisma.config.ts` thì nó bỏ qua bước nạp biến môi trường, và báo `Environment variable not found: DATABASE_URL`. Truyền biến ngay trên lệnh (hoặc export trong shell):

```bash
DATABASE_URL=postgresql://tarot:tarot@localhost:5432/tarot pnpm db:migrate
```

Một DB local từng được dựng bằng `db push` sẽ không có bảng `_prisma_migrations`, và `migrate deploy` từ chối với `P3005` (schema không rỗng). Kiểm tra lệch trước khi làm gì khác:

```bash
DATABASE_URL=... npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script
```

Ra `-- This is an empty migration.` nghĩa là schema đã khớp, dùng tiếp được cho dev và e2e. Còn lệch thì DB local là rác, `docker compose down -v` rồi dựng lại cho sạch.

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
  error.tsx             # lỗi trong một route segment
  global-error.tsx      # lỗi văng ra khỏi chính root layout
  actions/              # server action: admin, ai, auth, payments, readings
  api/auth, api/webhooks, api/cron
  admin/                # khu quản trị, mọi trang tự gọi requireAdmin()
  credits/              # chọn gói và nạp credit
  history/, login/, signup/, profile/
  terms/, privacy/, refund/
components/
  admin/                # form chỉnh credit, nút hoàn đơn, khối Panel/Stat
  analytics/            # script GA4, tracker page_view / purchase / auth
  monitoring/           # gắn id người dùng vào scope Sentry phía client
  tarot/                # ArcDeck, QuestionForm, ReadingView, FlipCard, ...
  ui/                   # Button, Input, Header, Footer, Toast, Section
lib/
  admin/                # chỉnh credit, nhật ký quản trị, số liệu dashboard
  ai/                   # prompt, danh sách model, gọi Gemini/DeepSeek, validate bằng Zod
  email/                # Resend: cảnh báo vận hành, thư cho khách, thư báo đánh giá
  analytics/            # measurement ID và trackEvent()
  auth/                 # rate limit, guard quyền quản trị
  db/                   # Prisma client
  monitoring/           # cấu hình Sentry dùng chung + báo lỗi đã xử lý
  payments/             # PayOS: client, vòng đời đơn hàng, hoàn tiền
  tarot/                # dữ liệu 78 lá, logic rút bài
  validation/
instrumentation.ts      # Sentry cho Node/Edge + onRequestError
instrumentation-client.ts
sentry.server.config.ts
sentry.edge.config.ts
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
- Nếu định bật chế độ **Ngẫu nhiên** ở `/admin/prompts`: đặt API key của *mọi* nhà cung cấp trong `lib/ai/models.ts` trước khi bật, xem mục "Chấm điểm bản diễn giải" ở dưới.
- Giới hạn kích thước input, sanitize nội dung và validate response AI bằng schema.
- Không log câu hỏi hoặc dữ liệu nhạy cảm nếu không cần thiết.
- Thiết lập backup database và chính sách retention.
- Theo dõi error rate, latency, AI cost, conversion và giao dịch thất bại.
- Đặt `NEXT_PUBLIC_SENTRY_DSN` cho Production và Preview, cộng `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` để có source map. Thiếu DSN thì lỗi production không đi đâu cả mà cũng không có cảnh báo nào báo cho biết — xem `MONITORING.md`.
- SEO: `app/robots.ts`, `app/sitemap.ts` và `app/opengraph-image.tsx` sinh ra `/robots.txt`, `/sitemap.xml`, ảnh OG; canonical và Open Graph lấy origin từ `SITE_URL` trong `lib/seo/site.ts`. Nếu `NEXT_PUBLIC_APP_URL` sai thì canonical của toàn site sai theo.
- Các alias `*.vercel.app` vẫn trả 200 và không có `x-robots-tag`, nên về lý thuyết Google index được cả hai host. Canonical trỏ về domain chính đã xử lý phần lớn rủi ro; muốn dứt điểm thì gỡ alias `tarot-indol-tau.vercel.app` trong Vercel.
- Analytics: Google Analytics 4 (`G-YR3ZHD8JBV`) hardcode trong `lib/analytics/gtag.ts`, không cần biến môi trường. Sau khi deploy, mở DebugView của GA4 và xác nhận `page_view` bắn đúng một lần mỗi route — điều hướng client-side của App Router là chỗ dễ đếm thiếu hoặc đếm trùng nhất. Danh mục event ở `ANALYTICS.md`.
- Kiểm tra accessibility: contrast, focus state, alt text, keyboard navigation và reduced motion.

## Đối soát đơn hàng

Webhook PayOS là nguồn sự thật cho việc cộng credit, nhưng nó có thể không bao giờ tới: PayOS lỗi, deploy rơi đúng lúc callback, mạng đứt. Không có gì bù lại thì người dùng trả tiền mà đơn nằm `PENDING` vĩnh viễn.

Có bốn đường cùng gọi vào `lib/payments/orders.ts`, nên mọi đường đều idempotent và đều đối chiếu số tiền:

| Đường | Khi nào chạy | File |
| --- | --- | --- |
| Webhook | PayOS gọi ngay sau khi trả tiền | `app/api/webhooks/payos/route.ts` |
| Trang trả về | Người dùng quay lại `/credits?order=...&status=success`; hỏi lại trạng thái mỗi 3 giây trong ~1 phút | `components/tarot/OrderStatusWatcher.tsx` |
| Mở lại trang nạp | Người dùng mở `/credits` (hoặc `/profile`) và đang có đơn `PENDING` cũ hơn 5 phút; chỉ quét đơn của chính họ | `components/tarot/PendingOrdersReconciler.tsx` |
| Cron | Mỗi ngày, quét đơn `PENDING` cũ hơn 5 phút của mọi người | `app/api/cron/reconcile-orders/route.ts` |

Ba đường sau hỏi trực tiếp PayOS bằng `GET /v2/payment-requests/{id}`, dùng `Order.providerPaymentLinkId` lưu lúc tạo đơn. Đơn quá `expiresAt` (30 phút) mà vẫn chưa trả tiền sẽ được đóng thành `EXPIRED`.

Số tiền PayOS báo phải khớp đúng `Order.amountVnd`. Lệch thì không cộng credit, để đơn nguyên `PENDING`, và gửi email cảnh báo — xem "Cảnh báo" ngay dưới.

Trên gói Hobby cron chỉ chạy một lần mỗi ngày, nên đường thứ ba tồn tại để bịt khe hở đó: khách trả tiền, webhook trượt, **và** khách đóng tab trước khi trang trả về kịp đối soát. Lần sau họ mở `/credits` — thường là để xem credit đã về chưa — đơn được hỏi lại ngay tại đó thay vì đợi tới lượt quét kế tiếp.

Trang chỉ đếm xem có đơn treo hay không; việc gọi PayOS nằm trong server action, không phải trong lúc render. Lần mở trang bình thường vì thế không tốn lượt gọi nào.

## Cảnh báo

Hai tình huống trong luồng thanh toán không có đường tự động nào gỡ được, nên chúng gửi email về `SUPPORT_EMAIL` (`lib/seo/site.ts`) qua Resend:

| Cảnh báo | Nghĩa là gì | Chống lặp |
| --- | --- | --- |
| Số tiền lệch | PayOS báo số tiền khác giá gói đã chốt. Credit **không** được cộng, đơn nằm nguyên `PENDING` | 1 email mỗi đơn mỗi 24 giờ |
| Đơn còn treo | Sau khi đối soát vẫn còn đơn `PENDING` — PayOS cũng chưa chốt, hoặc không gọi được sang PayOS | 1 email mỗi 12 giờ |

Chống lặp dùng chính bảng `RateLimit` ở Postgres, nên khoá sống sót qua deploy. Không có nó thì mỗi lần PayOS gửi lại webhook là một email giống hệt, và cảnh báo nhanh chóng thành thứ bị bỏ qua.

`sendEmail()` trong `lib/email/resend.ts` **không bao giờ ném lỗi**. Nó chạy xen giữa việc cộng credit cho khách; Resend chết mà kéo đổ cả giao dịch thì thuốc độc hơn bệnh. Hỏng thì ghi log và trả `false`.

Trước khi bật: verify domain trong dashboard Resend, rồi đặt `ALERT_EMAIL_FROM` bằng một địa chỉ thuộc domain đó. Gửi từ domain chưa verify sẽ bị Resend trả 422.

## Xác nhận email

Đăng ký bằng email phải qua bước xác nhận: `signupAction` tạo tài khoản ở trạng thái chưa xác nhận (`User.emailVerifiedAt` null, **chưa có credit**), gửi link tới hộp thư, rồi đưa người dùng sang `/verify-email/sent`. Bấm link mở `/verify-email?token=...`, và chỉ ở bước đó tài khoản mới được đánh dấu đã xác nhận và được cộng credit dùng thử. Chưa xác nhận thì `authorize` trong `auth.ts` từ chối đăng nhập.

| Điểm | Giá trị |
| --- | --- |
| Hạn của link | 24 giờ |
| Lưu trong database | Chỉ SHA-256 của token (`EmailVerificationToken.tokenHash`) |
| Cấp link mới | Huỷ mọi link chưa dùng trước đó của cùng tài khoản |
| Gửi lại | 3 lần mỗi email mỗi giờ, 10 lần mỗi IP mỗi giờ |
| Đăng ký | 10 lần mỗi IP mỗi giờ |

Vài điểm dễ vướng:

- **Link bấm lần hai không báo lỗi.** Trình quét thư của nhiều nhà cung cấp mở sẵn mọi link trước khi người dùng kịp bấm, nên lần bấm "thật" thường là lần thứ hai. Token đã dùng mà tài khoản đã xác nhận thì vẫn dẫn về trang đăng nhập kèm thông báo thành công.
- **Gửi hỏng vẫn đi tiếp tới `/verify-email/sent?status=failed`.** Tài khoản đã tạo rồi nên đăng ký lại sẽ vướng "email đã đăng ký"; trang đó có nút gửi lại, đó mới là đường thoát.
- **Form gửi lại luôn báo "đã gửi"** kể cả khi email không có tài khoản hoặc đã xác nhận rồi. Trả lời khác nhau là biến nó thành công cụ dò xem địa chỉ nào có tài khoản.
- **Người dùng cũ** (tạo trước migration `add_email_verification`) được backfill `emailVerifiedAt = createdAt`. Không có bước đó thì cột NULL sẽ khoá đăng nhập của toàn bộ tài khoản hiện có.

## Đăng nhập bằng Google

Nút "Đăng nhập với Google" ở `/login` và `/signup` đẩy người dùng qua OAuth của Google; đường quay về đi vào callback `signIn` rồi `jwt` trong `auth.ts`, và toàn bộ phần chạm database gói trong `linkGoogleAccount` (`lib/auth/google.ts`).

Không dùng adapter database của Auth.js. Session vẫn là JWT và bảng `User` vẫn là chỗ duy nhất định nghĩa một người dùng — chỉ thêm hai cột: `googleId` (chính là `sub` trong id token của Google) và `passwordHash` giờ cho phép NULL, vì tài khoản chỉ đăng nhập bằng Google không có mật khẩu nào để băm.

Ba tình huống khi Google gọi ngược về:

| Tài khoản trùng | Việc xảy ra |
| --- | --- |
| Không có | Tạo mới, `emailVerifiedAt` đặt ngay, cộng credit dùng thử |
| Có, đã xác nhận email | Gắn `googleId` vào tài khoản đó. Không cộng credit lần hai |
| Có, chưa bấm link xác nhận | Gắn `googleId`, đặt `emailVerifiedAt`, cộng credit dùng thử |

Vài điểm dễ vướng:

- **`profile.email_verified` là chốt duy nhất.** Callback `signIn` từ chối mọi lần đăng nhập Google không có nó. Bỏ chốt đó đi thì ai dựng được một tài khoản Google mang địa chỉ người khác cũng chiếm được tài khoản tương ứng ở đây, vì việc gắn dựa hẳn vào email trùng.
- **Không gửi email xác nhận cho người đăng nhập Google.** Google đã làm đúng việc mà link xác nhận làm; bắt xác nhận thêm lần nữa chỉ là một bước thừa giữa người dùng và credit của họ.
- **Credit dùng thử vẫn chỉ cộng một lần**, và điều kiện `freeCreditsGrantedAt: null` nằm ngay trong mệnh đề `where` của lệnh ghi — giống hệt `consumeVerificationToken`, để hai lần đăng nhập song song không cộng hai lần.
- **Tài khoản chỉ có Google mà đăng nhập bằng mật khẩu sẽ thấy "Email hoặc mật khẩu không đúng".** Nói thẳng "tài khoản này dùng Google" là biến form đăng nhập thành công cụ dò xem địa chỉ nào đăng ký bằng đường nào. Đường ra là nút Google ngay bên dưới form, hoặc "Quên mật khẩu?" — đường đó đặt được mật khẩu cho cả tài khoản chưa từng có.
- **Email trong database không chạy theo Google.** Tra `googleId` trước rồi mới tới email, nên người đổi địa chỉ Gmail chính vẫn về đúng tài khoản cũ, nhưng cột `User.email` giữ nguyên: đó là thứ hoá đơn và mọi đường liên lạc khác đang dùng.
- **Thiếu `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` thì provider không được đăng ký** và nút không hiện. Đăng nhập bằng email/mật khẩu không bị ảnh hưởng.

Lúc tạo OAuth client ở [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (loại **Web application**), Authorized redirect URI phải khớp đúng từng ký tự:

```
http://localhost:3000/api/auth/callback/google
https://tarot.thanhnghiep.top/api/auth/callback/google
```

## Đặt lại mật khẩu

`/forgot-password` nhận email, `/reset-password?token=...` là đích của link trong thư. Token cùng hình dạng với token xác nhận email — ngẫu nhiên 32 byte, database chỉ giữ SHA-256, cấp mới huỷ cái cũ — nhưng khác ở hai chỗ:

| | Xác nhận email | Đặt lại mật khẩu |
| --- | --- | --- |
| Hạn của link | 24 giờ | **1 giờ** |
| Token bị tiêu lúc | mở link (GET) | **submit form (POST)** |
| Gửi lại | 3 mỗi email, 10 mỗi IP, mỗi giờ | 3 mỗi email, 10 mỗi IP, mỗi giờ |

Hạn ngắn hơn vì token này đổi được mật khẩu người khác, không chỉ mở khoá một tài khoản vốn đã là của người đăng ký. Không tiêu lúc GET vì mở link chỉ là hiện form; tiêu ở đó thì trình quét thư của nhà cung cấp đốt sạch link trước khi người dùng kịp bấm. Trang vẫn kiểm tra token lúc render, để không bắt người ta gõ xong mật khẩu mới rồi mới báo link hỏng.

Vài điểm dễ vướng:

- **Form luôn trả lời giống nhau**, kể cả khi email không có tài khoản hoặc Resend từ chối gửi. Mọi khác biệt ở đây đều là một cách để người lạ dò xem địa chỉ nào có tài khoản.
- **Đổi mật khẩu hạ mọi session cũ**, xem phần dưới.
- **Đặt lại mật khẩu không thay cho xác nhận email.** Tài khoản chưa xác nhận đặt lại mật khẩu xong vẫn chưa đăng nhập được; trang đăng nhập sẽ chỉ sang đường gửi lại email xác nhận. Hai việc cố ý tách rời để mỗi đường chỉ làm đúng một chuyện.
- **Luật mật khẩu dùng chung** `PasswordField` trong `lib/validation/auth.ts`. Để hai chỗ lệch nhau là mở cửa sau đặt một mật khẩu mà đường đăng ký đã từ chối.

### Hạ session sau khi đổi mật khẩu

Session là JWT, không tra database ở mỗi request, nên không có chỗ nào để "thu hồi" một phiên đã phát. `User.passwordChangedAt` là cách vòng qua chuyện đó: mốc này được nhét vào token lúc đăng nhập, và callback `jwt` trong `auth.ts` đối chiếu lại với database — lệch thì trả `null`, Auth.js xoá cookie và request coi như chưa đăng nhập.

Đối chiếu ở **mọi** lần `auth()` thì mất đúng cái nhanh của JWT: `auth()` được gọi vài lần mỗi request, và Header đã có một truy vấn riêng rồi. Nên việc đối chiếu chỉ chạy lại mỗi 5 phút cho mỗi token (`PASSWORD_CHECK_INTERVAL_MS`). Đánh đổi: phiên cũ sống thêm tối đa 5 phút sau khi mật khẩu đổi, và mỗi người tốn thêm một truy vấn khoá chính mỗi 5 phút. Muốn hạ ngay lập tức thì phải bỏ JWT, chuyển session sang database.

Token phát trước khi có `pwdAt` được đọc là 0 — đúng bằng giá trị của tài khoản chưa từng đổi mật khẩu — nên lần deploy đầu tiên không đá mọi người đang đăng nhập ra ngoài.

## Hoàn tiền

PayOS không mở API hoàn tiền cho merchant, nên tiền phải hoàn thủ công trên dashboard PayOS. Sau đó đóng nốt sổ sách phía mình:

```bash
pnpm refund-order <orderId> --dry-run   # xem đơn trước
pnpm refund-order <orderId>             # đổi sang REFUNDED, trừ lại credit
```

Script cho phép số dư credit xuống âm nếu khách đã tiêu trước khi yêu cầu hoàn — ghi âm vào sổ đúng hơn là bỏ qua, và chặn họ mở khóa tiếp cho tới khi nạp bù.

Cùng việc đó làm được từ `/admin/orders`: mở "Hoàn credit" trên dòng đơn, ghi lý do, xác nhận. Hai đường gọi chung `lib/payments/refund.ts`, khác ở chỗ đường qua web ghi thêm một dòng `AdminAuditLog` ký tên người bấm. **Cả hai đều chỉ đụng tới credit — tiền vẫn phải hoàn tay trên dashboard PayOS.**

## Trang quản trị

### Cấp quyền

```bash
pnpm grant-admin <email> --dry-run   # xem tài khoản trước
pnpm grant-admin <email>             # USER -> ADMIN
pnpm grant-admin <email> --revoke    # ADMIN -> USER
```

Nhớ truyền `DATABASE_URL` như mọi lệnh chạm database (`set -a && . ./.env.local && set +a`). Không có đường nào trong giao diện nâng quyền, cho mình hay cho người khác.

Trên production, nếu không có checkout nào trong tay:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = '...';
```

### Độ trễ khi đổi quyền

Session là JWT, mang theo một bản cache của `role`. Nó được làm mới trong cùng lần đối chiếu `passwordChangedAt` mỗi 5 phút (`auth.ts`), nên:

- **Cấp quyền**: người vừa được cấp có thể vẫn thấy 404 ở `/admin` trong vòng 5 phút. Đăng xuất rồi đăng nhập lại thì có hiệu lực ngay. Đây là hành vi đúng, không phải lỗi.
- **Thu quyền**: mục "Quản trị" trên menu còn hiện tối đa 5 phút, nhưng **mọi thao tác bị chặn ngay lập tức** — `lib/auth/admin.ts` đọc `role` thẳng từ database ở mỗi request, không tin token.

### Những gì làm được

`/admin` (tổng quan, lọc 7/30/90 ngày), `/admin/users` (tra theo email, chi tiết từng người, chỉnh credit), `/admin/orders` (lọc theo trạng thái, hoàn credit, đối soát lại), `/admin/transactions`, `/admin/audit`, `/admin/deck` (chỉ đọc), `/admin/prompts` (đổi model đang chạy, xem số đo và điểm người đọc chấm theo từng cặp prompt–model).

Trong tab **Prompt và model** (`/admin/prompts`), khối **Đánh giá người đọc** nằm trước bảng số đo kỹ thuật, hiển thị số lượt chấm và ba điểm trung bình theo từng cặp prompt/model. Điểm theo thang 1–5 sao, chỉ tính những lượt đã chấm trên toàn bộ lịch sử; cặp chưa được chấm hiện 0 và dấu **—** ở điểm.

Xem nội dung prompt ở khối **Các phiên bản prompt** cuối trang:

1. Chọn dòng phiên bản theo ID, ngày phát hành và model mặc định. Bản đang chạy đứng đầu, có nhãn **Đang chạy**; tất cả các bản mặc định thu gọn và chỉ mở một bản mỗi lần.
2. Đọc ghi chú, rồi mở **System instruction** hoặc **Prompt mẫu**. Nội dung dài cuộn trong ô riêng; prompt mẫu dùng trải bài giả, không chứa câu hỏi thật của người dùng.
3. Bấm lại dòng phiên bản để thu gọn, hoặc chọn bản khác để xem tiếp.

Model ở dòng phiên bản là mặc định khi phát hành bản đó. Model đang dùng xem ở **Bản đang chạy**, thay đổi tại **Đổi model** và có hiệu lực ngay với lượt mở khóa tiếp theo. Prompt chỉ đọc; phát hành hoặc lùi bản prompt bằng cách sửa code, qua code review và deploy.

Chỉnh credit và hoàn đơn đều bắt buộc ghi lý do, và ghi một dòng `AdminAuditLog` trong cùng transaction với thay đổi. `AdminAuditLog` cố tình không có khoá ngoại: xoá tài khoản cascade sang đơn và giao dịch, mà dòng nhật ký thì phải sống lâu hơn đối tượng của nó.

Số tiền trên dashboard lấy từ bảng `Order`, không lấy từ GA4: event `purchase` đếm thiếu những đơn được cứu ở đường đối soát thứ ba. Phễu bắt đầu từ reading đã lưu — người chưa đăng nhập không vào database.

Nếu `/admin` chậm: `Reading`, `AiInterpretation` và `CreditTransaction` chưa có index `createdAt` đứng riêng (`[userId, createdAt]` không phục vụ được range scan toàn cục). Đó là chỗ phải thêm trước tiên.

## Chấm điểm bản diễn giải

Cuối mỗi bản diễn giải có hộp chấm ba tiêu chí — độ chính xác, độ rõ ràng, tính hữu ích — mỗi tiêu chí 1–5 sao kèm ô nhận xét. Điểm ghi vào bảng `InterpretationReview`, một dòng cho một `AiInterpretation` (`@unique`), sửa lại được bằng upsert.

Mỗi lượt gửi bắn một email về `thanhnghiep.top@gmail.com` — địa chỉ này là hằng số trong `lib/ai/reviews.ts`, không phải biến môi trường: đổi chỗ nhận ý kiến khách là việc nên đi qua code review, và để trong env thì môi trường nào thiếu biến sẽ lặng lẽ nuốt thư. Thư mang cả bút danh lẫn tên model thật, câu hỏi và id bài đọc; bản sửa có tiền tố `[Sửa]`.

Thư đi **sau** khi điểm đã nằm trong database, và kết quả gửi không ảnh hưởng gì tới người vừa chấm. Nghĩa là thiếu `RESEND_API_KEY` hoặc `ALERT_EMAIL_FROM` thì không mất dữ liệu — chỉ là không ai nhận được thông báo. Chỗ đọc số liệu đầy đủ luôn là `/admin/prompts`, không phải hòm thư.

### Chế độ chấm mù

`/admin/prompts` có lựa chọn **Ngẫu nhiên** bên cạnh các model: mỗi lượt mở khóa bốc một model trong danh sách, xác suất đều. Mỗi model ký tên bằng bút danh cố định (`AiModel.persona`), và người đọc chỉ thấy bút danh đó, nên điểm họ chấm là điểm chấm mù.

Bật chế độ này thì **mọi** nhà cung cấp trong `lib/ai/models.ts` phải có API key trên môi trường đang chạy. Thiếu một key nghĩa là phần số lượt bốc trúng model đó báo lỗi và hoàn credit — nhìn từ bảng số đo thì giống hệt một model chập chờn, chứ không giống một biến môi trường còn thiếu. Trang quản trị cảnh báo ngay tại ô chọn (chỉ nêu *tên* biến, không bao giờ nêu giá trị), nhưng không chặn: local và preview thiếu key là chuyện bình thường.

## Chạy e2e

```bash
pnpm test:e2e
```

Playwright tự dựng server (`pnpm build && pnpm start`), nên không cần `pnpm dev` chạy sẵn. `e2e/global-setup.ts` lo hai việc trước khi test bắt đầu:

- **Chặn chạy nhầm lên production.** Bộ test đăng ký tài khoản và ghi reading thật. `DATABASE_URL` không trỏ tới host local (và không phải CI) thì nó dừng ngay thay vì đổ rác vào dữ liệu người dùng.
- **Dọn bảng `RateLimit`.** Suite tiêu 7 trong số 10 lượt đăng ký mỗi giờ mà `signupAction` cho phép trên mỗi IP. Không dọn thì lần chạy thứ hai trong cùng một giờ sẽ tự chặn chính nó, và lỗi hiện ra là "đăng ký thất bại" chứ không nói gì về rate limit. CI không gặp vì database dựng mới mỗi lần.

- **Seed danh mục gói credit.** CI chỉ chạy `prisma migrate deploy`, không chạy seed, nên bảng `CreditPackage` rỗng và trang nạp tiền hiện nhánh "chưa có gói nào đang mở bán". Danh mục nằm ở `prisma/credit-packages.ts`, dùng chung với `pnpm db:seed`.

Nó cũng tự đọc `.env.local` — tiến trình Playwright không đi qua Next nên không được nạp sẵn biến môi trường.

Test `ai-unlock` kiểm tra nhánh thiếu `GEMINI_API_KEY`, nên nó tự skip khi máy bạn có key thật. Ở CI không cấu hình key nên test chạy bình thường.

Có hai project Playwright: `chromium` (desktop, chạy cả suite) và `mobile` (Pixel 7, chỉ chạy `card-wheel.spec.ts` và `reading-flow.spec.ts` để kiểm bố cục và thao tác của vòng bài trên điện thoại mà không nhân đôi các test đăng ký/nạp tiền).

Khi viết test mới:

- **Bốc bài bằng `pickCards(page)`** trong `e2e/fixtures.ts`, đừng click `getByRole("button", { name: /^Chọn lá thứ/ }).nth(i)`. Vòng bài chỉ render các lá quanh đỉnh cung, và lá đầu tiên trong DOM có thể đang ở mép, bị lá bên cạnh đè hoặc nằm dưới mép cắt của khung, nên click theo thứ tự DOM chập chờn. Helper chạm vào lá ở đỉnh như người dùng thật, và chờ vòng khép lại sau mỗi lá.
- **Dùng `exact: true` cho nút "Đăng ký" / "Đăng nhập".** Có Google OAuth trong `.env.local` thì trang còn hiện nút "Đăng ký với Google", và locator khớp chuỗi con sẽ bắt trúng cả hai. CI không cấu hình Google nên lỗi này chỉ lộ ở local.

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

## Phát hành prompt v4 (30/09/2026)

Trước khi deploy code v4, chạy `pnpm exec prisma migrate deploy` trên database đích để tạo bảng `AiGenerationMetric`; sau đó build/deploy như thường lệ. Không cần backfill bản đọc cũ. Code active v4, Gemini 3.8 dùng `thinkingLevel: low`. Rollback prompt bằng cách đổi `ACTIVE_PROMPT_VERSION` về `PROMPT_V3`, giữ các version trong registry.

Kết quả benchmark lịch sử v4 nằm ở `docs/benchmarks/v4-2026-09-30.md`.

## Phát hành prompt v5 (02/10/2026)

V5 không có migration: giữ nguyên JSON Schema và các cột lưu bài đọc. `ACTIVE_PROMPT_VERSION` đang trỏ tới `PROMPT_V5`; rollback bằng cách trỏ lại `PROMPT_V4`, không sửa hoặc xóa version đã phát hành.

`pnpm benchmark-prompts` chạy 36 ca giả lập v4/v5 bằng key trong `.env.local`, lưu `results.json` và `blind-review.json` vào `.model-compare/`, không ghi database. Có thể chọn một ca bằng `--case=style-challenge-1` hoặc giới hạn bằng `--limit=1`. Chấm từng candidate theo thang 1–5 trong manifest trước khi đối chiếu version ở `results.json`; rubric và ngưỡng phát hành nằm tại `docs/benchmarks/v5-2026-10-02.md`.
