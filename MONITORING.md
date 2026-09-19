# Theo dõi lỗi (Sentry)

SDK: `@sentry/nextjs`. Bắt lỗi ở cả ba runtime — trình duyệt, Node và Edge — cộng trace hiệu năng lấy mẫu.

## Cách hoạt động

| Thành phần | Vai trò |
|---|---|
| `lib/monitoring/sentry.ts` | Cấu hình dùng chung: DSN, environment, tỉ lệ lấy mẫu trace, và `dataCollection` khai báo tắt từng loại dữ liệu. |
| `instrumentation.ts` | Next gọi `register()` một lần mỗi tiến trình server; nạp config theo `NEXT_RUNTIME`. Đồng thời export `onRequestError` để bắt lỗi server component, route handler và server action. |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | `Sentry.init()` cho runtime Node và Edge. |
| `instrumentation-client.ts` | `Sentry.init()` phía trình duyệt, chạy trước khi React hydrate. Export `onRouterTransitionStart` để span điều hướng có điểm bắt đầu. |
| `app/global-error.tsx` | Lưới an toàn khi lỗi văng ra khỏi `app/layout.tsx`: gửi exception rồi hiện trang xin lỗi kèm nút thử lại. |
| `app/error.tsx` | Lỗi trong một route segment. Chỉ báo Sentry khi lỗi **không** có `digest` — loại có digest đã đi qua `onRequestError`, bắt lại là nhân đôi event. |
| `components/monitoring/SentryUser.tsx` | Gắn id người dùng vào scope phía trình duyệt, render từ `Header` (chỗ đã sẵn có `auth()`). Chỉ id, không email. |
| `lib/monitoring/report.ts` | `reportHandledError()` / `reportHandledIssue()` cho những lỗi app tự xử lý xong — Sentry không tự thấy chúng. |
| `lib/monitoring/cron.ts` | `withCronCheckIn()` bọc một cron job bằng check-in `in_progress` / `ok` / `error`. Gọi thẳng `captureCheckIn`, không dùng bản tự động của SDK. |
| `next.config.ts` | `withSentryConfig` chèn instrumentation lúc build, upload source map, dựng route tunnel. |

## Thiếu DSN thì không hỏng gì

`NEXT_PUBLIC_SENTRY_DSN` trống thì `enabled: false`: SDK vẫn nạp, mọi `captureException` thành no-op, không có request nào rời máy. Chạy local không cần tài khoản Sentry, và người khác clone repo về cũng build được ngay.

DSN để ở biến `NEXT_PUBLIC_` cho cả server lẫn client vì nó vốn nằm công khai trong bundle trình duyệt — không có gì để giấu, và một biến thì preview deploy không phải cấu hình hai lần.

Đánh đổi: biến `NEXT_PUBLIC_` được nướng vào bundle lúc build, kể cả phía server. Đổi DSN thì phải build lại, đặt biến rồi `next start` không có tác dụng — giống hệt `NEXT_PUBLIC_APP_URL`.

### Đừng đặt tên biến là `SENTRY_DSN`

Đây là cái bẫy đã dính một lần khi cấu hình Vercel. Trình duyệt không đọc được env của server, nên DSN phải mang tiền tố `NEXT_PUBLIC_` và phải có mặt **lúc build** thì mới vào được bundle. Đặt tên `SENTRY_DSN` thì client không bao giờ thấy.

Phần khó chịu là server trông vẫn như đã chạy. `@sentry/node-core` tự nhặt biến đó khi `dsn` không được truyền:

```js
dsn: options.dsn ?? process.env.SENTRY_DSN,
```

SDK phân giải được DSN và sinh header trace mang `sentry-public_key`, nhìn HTML tưởng đã xong. Nhưng `lib/monitoring/sentry.ts` quyết định `enabled` theo `NEXT_PUBLIC_SENTRY_DSN`, thiếu biến đó thì `enabled: false` và **không event nào được gửi ở cả hai phía** — chỉ còn header đi ra.

Cách kiểm nhanh, không cần chờ lỗi thật: tải một chunk client của production về rồi grep public key của DSN. Không có nghĩa là biến chưa tới lúc build.

```bash
curl -s https://tarot.thanhnghiep.top/ | grep -oE '/_next/static/immutable/chunks/[^"]+\.js' | sort -u \
  | while read -r p; do curl -s "https://tarot.thanhnghiep.top$p"; done | grep -c '<public key của DSN>'
```

## Quyền riêng tư

Sản phẩm giữ email, câu hỏi và lịch sử thanh toán của người dùng, còn chính sách riêng tư không hứa chia sẻ những thứ đó với bên thứ ba. Nới bất kỳ mục nào dưới đây là phải sửa cả chính sách.

`dataCollection` khai báo tường minh từng loại dữ liệu — `userInfo`, `cookies`, `httpBodies`, `genAI`, `graphQL`, `databaseQueryData`, `stackFrameVariables` đều tắt; `httpHeaders` và `urlQueryParams` giữ lại phần hữu ích cho việc gỡ lỗi nhưng chặn các khoá mang danh tính. Đây là đường thay cho `sendDefaultPii`, thứ sẽ bị bỏ ở SDK v11.

Cái bẫy nằm ở chỗ **thiếu** một trường chứ không phải thừa. Trong `@sentry/core` 10.75, `resolveDataCollectionOptions()` chọn base theo `options.dataCollection != null ? DEFAULTS : defaultPiiToCollectionOptions(options.sendDefaultPii)`. Chỉ cần khoá `dataCollection` tồn tại là mọi trường không liệt kê rơi vào `DEFAULTS`, mà `DEFAULTS` bật hết: cookie phiên, body request đi vào (form đăng nhập, câu hỏi tarot, payload webhook PayOS), prompt và output Gemini, dữ liệu truy vấn database. Wizard của Sentry sinh ra đúng `dataCollection: {}` — một object rỗng vẫn là `!= null`, nên nó mở toàn bộ.

Vì vậy chỉ thêm trường vào đối tượng đó, đừng bao giờ bớt. `lib/monitoring/sentry.test.ts` gọi `client.getDataCollectionOptions()` rồi so danh sách khoá sau khi SDK phân giải, nên bản nâng cấp nào thêm một đường thu thập mới cũng làm test đỏ thay vì âm thầm bật.

`stackFrameVariables: false` là lựa chọn có chủ ý, khác mặc định của SDK: biến cục bộ tại chỗ ném lỗi rất dễ đang giữ đúng câu hỏi người dùng vừa gõ.

Session Replay **không** bật. Ngoài chuyện nặng thêm khoảng 50KB cho mọi lượt truy cập, nó sẽ quay lại đúng câu hỏi người dùng gõ vào — thứ riêng tư nhất trong sản phẩm này. Cần bật thì phải che kín text và nói rõ trong chính sách riêng tư.

## Lấy mẫu trace

`tracesSampleRate` là 0.1 ở production, 1 ở mọi môi trường khác. Đủ để thấy route nào chậm mà không đốt hết quota gói free; lỗi thì vẫn gửi 100%, tỉ lệ này chỉ áp cho trace hiệu năng.

Environment đọc theo thứ tự `NEXT_PUBLIC_VERCEL_ENV` → `VERCEL_ENV` → `NODE_ENV`. Biến đầu do Vercel tự đặt và là biến duy nhất client đọc được, nhờ đó lỗi từ preview không lẫn vào production trong dashboard.

## Route tunnel `/monitoring`

`tunnelRoute: "/monitoring"` đẩy event qua chính domain của app thay vì gọi thẳng `ingest.sentry.io`. uBlock và các bộ lọc quảng cáo chặn domain đó, nên không có tunnel thì mất đúng lỗi của nhóm người dùng cài chặn — thường là nhóm hay gặp lỗi nhất. Đổi lại mỗi event tốn một lượt gọi function trên Vercel. Route này bị chặn trong `app/robots.ts`.

## Source map

Upload chỉ chạy khi có `SENTRY_AUTH_TOKEN` (kèm `SENTRY_ORG`, `SENTRY_PROJECT`); thiếu thì bước này tắt hẳn chứ không cảnh báo giữa build. Không upload thì stack trace trong Sentry vẫn ở dạng đã minify — đọc được tên file, không đọc được dòng nào.

`deleteSourcemapsAfterUpload: true` xoá file `.map` khỏi output sau khi upload, để source không lộ ra public.

Token tạo ở Settings → Auth Tokens với scope `project:releases`. Trên Vercel nhớ đặt cho **cả** Production lẫn Preview, nếu không preview deploy sẽ không có source map.

Cài `@sentry/cli` cần chạy script postinstall (tải binary) — đã bật trong `pnpm-workspace.yaml` ở mục `allowBuilds`. Tắt đi thì upload source map fail lúc build.

## Lỗi app tự xử lý

`onRequestError` chỉ thấy lỗi ném ra tới Next. Mọi chỗ bắt lỗi rồi trả về thông báo thân thiện sẽ biến mất khỏi Sentry — mà đó đúng là loại lỗi cần biết nhất, vì người dùng không báo và không ai đọc Runtime Logs. Những chỗ đang gọi `reportHandledError()` / `reportHandledIssue()`:

| Chỗ | Tag `area` | Vì sao |
|---|---|---|
| `app/actions/ai.ts` | `ai-unlock` | Gemini hỏng thì credit được hoàn và người dùng chỉ thấy một câu xin lỗi. |
| `lib/payments/orders.ts` | `payos-reconcile` | PayOS không trả lời lúc đối soát; đơn nằm lại PENDING. |
| `lib/payments/orders.ts` | `payos-amount-mismatch` | Số tiền lệch. Đã có email cảnh báo, nhưng email cũng trượt được. |
| `lib/email/resend.ts` | `email-send` | Resend chết thì mất cả cảnh báo vận hành lẫn email xác nhận. |

Tag `handled: true` để lọc riêng khỏi lỗi làm sập request. Extra chỉ chứa id và số — không đưa câu hỏi, email hay nội dung thư vào đó.

## Cron monitor

`lib/monitoring/cron.ts` gọi thẳng `Sentry.captureCheckIn`: `in_progress` trước khi chạy, `ok` hoặc `error` sau khi xong, rồi ném lại lỗi cho người gọi. Monitor tên **`reconcile-orders`**, khai trong chính route handler và phải khớp lịch trong `vercel.json`.

Chỉ chạy khi có biến `VERCEL`, nên `pnpm dev` và test không ghi vào monitor thật. Check-in nằm **sau** cửa kiểm `CRON_SECRET`: request không có quyền không được phép ghi vào monitor.

`checkinMargin` để 60 phút vì cron trên gói Hobby của Vercel không chạy đúng phút đã khai, nó được kích trong khoảng một giờ quanh mốc. Biên hẹp hơn thì Sentry báo "missed" gần như mỗi ngày và cảnh báo thành tiếng ồn.

### Vì sao không dùng bản tự động của SDK

`_experimental.vercelCronsMonitoring` đã thử và đã bỏ. Đọc `node_modules/@sentry/nextjs/build/cjs/server/vercelCronsMonitoring.js` thì nó có bốn điều kiện ngầm, trượt cái nào cũng im lặng không báo gì:

1. `globalThis._sentryVercelCronsConfig` phải được inject lúc build.
2. Header `user-agent` phải chứa `vercel-cron` — nên curl tay không bao giờ sinh check-in.
3. Đường dẫn request phải khớp `path` trong `vercel.json`, và monitor slug chính là đường dẫn đó.
4. Check-in bám vào root span: `spanStart` mở, `spanEnd` đóng.

Điều kiện 4 mới là thứ giết nó ở đây. `tracesSampleRate` ở production là 0.1 (`lib/monitoring/sentry.ts`), span không được lấy mẫu thì không có gì bắt đầu — với một job chạy mỗi ngày một lần, khoảng mười ngày mới có một check-in, và Sentry sẽ báo "missed" gần như mỗi ngày.

Cũng không dùng `webpack.automaticVercelMonitors`: nó bọc lúc build bằng loader webpack, mà Next 16 build bằng Turbopack, và nó không hỗ trợ route handler của App Router.

### Kiểm sau khi deploy

Cron chạy `0 20 * * *` UTC, tức 3 giờ sáng giờ Việt Nam. Không cần chờ tới đó:

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/reconcile-orders
```

Rồi mở Sentry → Crons, tìm monitor `reconcile-orders`. Route này idempotent nên chạy tay an toàn: nó chỉ hỏi lại PayOS trạng thái những đơn `PENDING` quá hạn.

Monitor mới không tự gắn alert rule — vào Alerts bật thông báo cho nó, nếu không thì vẫn là "không ai biết", chỉ khác chỗ chứa.

## Đừng chạy lại wizard

`npx @sentry/wizard` ghi đè `next.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` bằng boilerplate của nó: DSN hardcode, `tracesSampleRate: 1`, `dataCollection: {}` (xem mục quyền riêng tư ở trên), tunnel bị comment, và ném token vào `.env.sentry-build-plugin` thay vì `.env.local`. Cần sửa cấu hình thì sửa tay theo tài liệu này.

## Kiểm tra sau khi cấu hình

1. Đặt `NEXT_PUBLIC_SENTRY_DSN` trong `.env.local` (cùng `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`), chạy `pnpm dev`.
2. Ném thử một lỗi trong server action hoặc route handler, mở Issues trong Sentry xem có event chưa.
3. Mở DevTools → Network, lọc `monitoring`: request phải đi tới `/monitoring` của chính domain, không phải `ingest.sentry.io`. Lỗi phía trình duyệt bắn bằng `setTimeout(() => { myUndefinedFunction(); }, 0)` — gõ thẳng vào console thì không phải lúc nào cũng đi qua `window.onerror`.
4. Sau deploy có `SENTRY_AUTH_TOKEN`, mở một issue và xác nhận stack trace chỉ đúng file `.ts`/`.tsx` chứ không phải chunk đã minify.
5. Trên production, kiểm bundle client có DSN chưa (mục "Đừng đặt tên biến là `SENTRY_DSN`"). Không có nghĩa là biến chưa tới lúc build, và không có lỗi client nào được ghi — dù server vẫn trông như đang chạy.
