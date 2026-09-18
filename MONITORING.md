# Theo dõi lỗi (Sentry)

SDK: `@sentry/nextjs`. Bắt lỗi ở cả ba runtime — trình duyệt, Node và Edge — cộng trace hiệu năng lấy mẫu.

## Cách hoạt động

| Thành phần | Vai trò |
|---|---|
| `lib/monitoring/sentry.ts` | Cấu hình dùng chung: DSN, environment, tỉ lệ lấy mẫu trace, `sendDefaultPii: false`. |
| `instrumentation.ts` | Next gọi `register()` một lần mỗi tiến trình server; nạp config theo `NEXT_RUNTIME`. Đồng thời export `onRequestError` để bắt lỗi server component, route handler và server action. |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | `Sentry.init()` cho runtime Node và Edge. |
| `instrumentation-client.ts` | `Sentry.init()` phía trình duyệt, chạy trước khi React hydrate. Export `onRouterTransitionStart` để span điều hướng có điểm bắt đầu. |
| `app/global-error.tsx` | Lưới an toàn khi lỗi văng ra khỏi `app/layout.tsx`: gửi exception rồi hiện trang xin lỗi kèm nút thử lại. |
| `lib/monitoring/report.ts` | `reportHandledError()` / `reportHandledIssue()` cho những lỗi app tự xử lý xong — Sentry không tự thấy chúng. |
| `next.config.ts` | `withSentryConfig` chèn instrumentation lúc build, upload source map, dựng route tunnel, bật cron monitor. |

## Thiếu DSN thì không hỏng gì

`NEXT_PUBLIC_SENTRY_DSN` trống thì `enabled: false`: SDK vẫn nạp, mọi `captureException` thành no-op, không có request nào rời máy. Chạy local không cần tài khoản Sentry, và người khác clone repo về cũng build được ngay.

DSN để ở biến `NEXT_PUBLIC_` cho cả server lẫn client vì nó vốn nằm công khai trong bundle trình duyệt — không có gì để giấu, và một biến thì preview deploy không phải cấu hình hai lần.

Đánh đổi: biến `NEXT_PUBLIC_` được nướng vào bundle lúc build, kể cả phía server. Đổi DSN thì phải build lại, đặt biến rồi `next start` không có tác dụng — giống hệt `NEXT_PUBLIC_APP_URL`.

## Quyền riêng tư

`sendDefaultPii: false`: không gửi IP, cookie hay header xác thực. Sản phẩm giữ email và lịch sử thanh toán, còn chính sách riêng tư không hứa chia sẻ những thứ đó với bên thứ ba — bật `sendDefaultPii` là phải sửa cả chính sách.

Không khai báo khoá `dataCollection` trong `Sentry.init()`. Đây là cái bẫy dễ dính nhất của SDK: trong `@sentry/core` 10.75, `resolveDataCollectionOptions()` chọn base theo `options.dataCollection != null ? DEFAULTS : defaultPiiToCollectionOptions(options.sendDefaultPii)` — một object **rỗng** vẫn là `!= null`, nên `dataCollection: {}` bật hết `DEFAULTS`: cookie phiên, body request đi vào (form đăng nhập, câu hỏi tarot, payload webhook PayOS), prompt và output Gemini, dữ liệu truy vấn database. Wizard của Sentry sinh ra đúng đoạn `dataCollection: {}` đó. Bỏ hẳn khoá này thì SDK rơi về nhánh `sendDefaultPii: false` và mọi mục trên đều tắt.

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

`_experimental.vercelCronsMonitoring: true` tạo check-in cho job khai trong `vercel.json`, chỉ chạy khi có biến `VERCEL` nên local không bị ảnh hưởng. Không dùng `webpack.automaticVercelMonitors`: nó bọc lúc build bằng loader webpack, mà Next 16 build bằng Turbopack, và nó cũng không hỗ trợ route handler của App Router — đúng loại route mà `/api/cron/reconcile-orders` đang dùng.

## Đừng chạy lại wizard

`npx @sentry/wizard` ghi đè `next.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` bằng boilerplate của nó: DSN hardcode, `tracesSampleRate: 1`, `dataCollection: {}` (xem mục quyền riêng tư ở trên), tunnel bị comment, và ném token vào `.env.sentry-build-plugin` thay vì `.env.local`. Cần sửa cấu hình thì sửa tay theo tài liệu này.

## Kiểm tra sau khi cấu hình

1. Đặt `NEXT_PUBLIC_SENTRY_DSN` trong `.env.local` (cùng `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`), chạy `pnpm dev`.
2. Ném thử một lỗi trong server action hoặc route handler, mở Issues trong Sentry xem có event chưa.
3. Mở DevTools → Network, lọc `monitoring`: request phải đi tới `/monitoring` của chính domain, không phải `ingest.sentry.io`.
4. Sau deploy có `SENTRY_AUTH_TOKEN`, mở một issue và xác nhận stack trace chỉ đúng file `.ts`/`.tsx` chứ không phải chunk đã minify.
