# Analytics

Google Analytics 4, property `G-YR3ZHD8JBV`. Production: <https://tarot.thanhnghiep.top>.

## Cách hoạt động

| Thành phần | Vai trò |
|---|---|
| `lib/analytics/gtag.ts` | Measurement ID, `trackEvent()`, `trackPageView()`. Mọi hàm no-op khi `window.gtag` chưa có. |
| `components/analytics/GoogleAnalytics.tsx` | Nạp script gtag (`next/script`, `strategy="afterInteractive"`) và bắn `page_view` theo route. Render trong `app/layout.tsx`. |
| `components/analytics/AuthSuccessTracker.tsx` | Bắn `login` / `sign_up` sau khi server redirect về `/?auth=...`. |
| `components/analytics/PurchaseTracker.tsx` | Bắn `purchase` khi PayOS trả về `/profile`. |
| `components/analytics/CheckoutCancelledTracker.tsx` | Bắn `checkout_cancelled`. |
| `components/analytics/LoginPromptLink.tsx` | Link "Đăng nhập" có tracking, dùng trong server component. |
| `components/analytics/ConsentBanner.tsx` | Banner xin đồng ý, neo ở đáy màn hình. |
| `components/analytics/CookieSettingsButton.tsx` | Link "Tùy chọn cookie" ở footer để mở lại banner. |
| `components/analytics/useConsent.ts` | `useSyncExternalStore` đọc trạng thái đồng ý. |
| `lib/analytics/consent.ts` | Lưu lựa chọn, phát tín hiệu đổi trạng thái, xóa cookie khi rút lại đồng ý. |

Measurement ID hardcode trong `lib/analytics/gtag.ts` chứ không để ở biến môi trường: nó vốn công khai trong HTML, và để trong code thì preview deploy không cần cấu hình thêm. Đổi property thì sửa đúng một hằng số đó.

### Consent Mode v2

Script gtag.js được nạp cho mọi người, nhưng `initGtag()` đẩy `consent default` với `analytics_storage: denied` vào dataLayer **trước** `config`. Ở trạng thái denied, gtag vẫn gửi ping ẩn danh nhưng không ghi cookie và không gắn định danh nào với người dùng. Bấm "Đồng ý" thì `consent update` nâng lên `granted` và cookie `_ga` mới được đặt.

Sản phẩm không chạy quảng cáo nên `ad_storage`, `ad_user_data`, `ad_personalization` luôn denied, không bao giờ update.

Thứ tự là phần dễ hỏng nhất: `consent default` mà nằm sau `config` thì gtag coi như được phép ghi cookie trong lúc chờ. Vì vậy toàn bộ khởi tạo nằm trong `initGtag()` gọi từ effect, chứ không rải ra thẻ `<Script>` inline — dataLayer là hàng đợi nên gọi trước khi gtag.js tải xong vẫn an toàn. Người đã đồng ý từ phiên trước được `consent update` ngay trong `initGtag()`, trước `config`, để hit đầu tiên không bị mất quyền ghi cookie.

Lựa chọn lưu ở `localStorage["tarot:analyticsConsent"]` (`"granted"` | `"denied"`). Không lưu được (private mode, chặn cookie) thì coi như chưa chọn — banner hiện lại ở phiên sau, và trạng thái vẫn là denied nên không có gì bị ghi.

Rút lại đồng ý: `consent update` sang denied chỉ chặn ghi cookie từ lúc đó, cookie đã đặt vẫn nằm lại, nên `setConsent("denied")` tự xóa các cookie `_ga*`.

Đây là đánh đổi có chủ ý so với cách chặn cứng (không nạp script cho tới khi đồng ý): Google Analytics phát hiện được tag nên không còn cảnh báo "Your Google tag wasn't detected", và có dữ liệu mô hình hóa cho những người từ chối. Đổi lại, có request tới Google trước khi người dùng trả lời banner. Banner và mục 6 của chính sách riêng tư nói đúng điều này — sửa hành vi thì phải sửa cả hai.

Test e2e ghi sẵn `"denied"` vào localStorage qua `e2e/fixtures.ts`: banner neo ở đáy màn hình sẽ che nút và làm Playwright báo element không nhận được pointer event.

### page_view tự bắn, không để gtag tự động

`gtag('config')` chạy với `send_page_view: false`. App Router điều hướng bằng client-side navigation nên gtag chỉ đếm được lần load đầu tiên; `PageViewTracker` theo dõi `usePathname()` + `useSearchParams()` và bắn `page_view` cho mọi route, kể cả lần đầu.

`useSearchParams()` bắt buộc phải nằm trong `<Suspense>`, nếu không `next build` fail với lỗi "Missing Suspense boundary with useSearchParams" và toàn bộ cây client phía trên bị đẩy sang client-side rendering.

## Danh mục event

### Luồng bốc bài

| Event | Bắn khi | Tham số |
|---|---|---|
| `question_suggestion_click` | Bấm chip chủ đề gợi ý | `topic` |
| `draw_start` | Bấm "Bốc 3 lá bài" thành công | `question_length`, `is_logged_in` |
| `draw_blocked` | Bấm khi chưa nhập câu hỏi | `reason` |
| `card_select` / `card_deselect` | Chọn/bỏ chọn một lá | `picked_count` |
| `reading_reveal` | Bấm "Mở lá bài" | `cards` (ba `cardId`, phân tách bằng dấu phẩy), `reversed_count`, `is_logged_in` |
| `reading_reset` | Bấm "Trải bài mới" hoặc "Chọn câu hỏi khác" | `from_status` |
| `reading_restored` | Reading của khách vãng lai được lưu lại sau khi đăng nhập | `reading_id` |

### Diễn giải chuyên sâu (AI)

| Event | Bắn khi | Tham số |
|---|---|---|
| `ai_unlock_view` | Panel khóa hiển thị và đã biết số credit | `reading_id`, `is_free_trial`, `out_of_credits`, `credits_left` |
| `ai_unlock_click` | Bấm nút mở khóa | `reading_id`, `is_free_trial`, `credits_left` |
| `ai_unlock_success` | Server action trả về diễn giải | `reading_id`, `is_free_trial`, `credits_spent` |
| `ai_unlock_error` | Server action trả lỗi | `reading_id`, `error` |
| `ai_unlock_retry` | Bấm "Thử lại" sau lỗi | `reading_id` |
| `topup_prompt_click` | Bấm link nạp thêm khi hết credit | `reading_id`, `has_purchased` |

`ai_unlock_view` là mẫu số để tính tỉ lệ chuyển đổi: `ai_unlock_success / ai_unlock_view`.

### Thanh toán

Theo chuẩn ecommerce của GA4, `currency: "VND"`, `value` là giá gói tính bằng đồng.

| Event | Bắn khi | Tham số |
|---|---|---|
| `begin_checkout` | Bấm mua một gói credit | `currency`, `value`, `items[]` |
| `checkout_error` | Không tạo được link thanh toán | `item_id`, `error` |
| `purchase` | PayOS trả về `/profile` và đơn đã `PAID` | `transaction_id`, `currency`, `value`, `items[]`, `credits_granted` |
| `checkout_cancelled` | PayOS trả về với `status=cancelled` | `transaction_id` |

`purchase` **không** tin vào query param. `app/profile/page.tsx` đọc đơn từ database và chỉ render `PurchaseTracker` khi đơn đó có `status === "PAID"` và thuộc về người đang đăng nhập — webhook mới là nguồn sự thật. Người dùng tải lại trang trả về nhiều lần cũng chỉ bắn một lần, nhờ khóa `tarot:purchaseTracked:<orderId>` trong `sessionStorage`.

### Tài khoản

| Event | Bắn khi | Tham số |
|---|---|---|
| `login_submit` / `signup_submit` | Submit form | — |
| `login_failed` / `signup_failed` | Form trả về lỗi | `reason` (`validation` hoặc `server`), `fields` |
| `login` / `sign_up` | Đăng nhập/đăng ký thành công | `method: "credentials"` |
| `logout` | Submit form đăng xuất | — |
| `login_prompt_click` | Bấm link đăng nhập trong CTA | `placement` |

`loginAction` và `signupAction` `redirect()` khi thành công, nên form không còn sống để tự báo cáo. Hai action redirect về `/?auth=login` và `/?auth=signup`; `AuthSuccessTracker` bắn event rồi xóa param bằng `history.replaceState`. Đổi giá trị param ở một nơi thì phải đổi ở cả hai.

### Lịch sử và điều hướng

| Event | Bắn khi | Tham số |
|---|---|---|
| `history_reading_expand` | Mở một reading trong lịch sử | `reading_id` |
| `history_delete_one` | Xóa một reading | `reading_id` |
| `history_delete_all` | Xác nhận xóa toàn bộ | `reading_count` |
| `history_delete_all_cancelled` | Hủy ở hộp thoại xác nhận | — |
| `nav_click` | Bấm mục trong menu tài khoản | `destination`, `source` |

## Quy ước

- **Không gửi dữ liệu cá nhân.** Không bao giờ gửi nội dung câu hỏi, email hay tên — chỉ gửi `question_length`. `reading_id` và `transaction_id` là cuid nội bộ, không suy ra được danh tính nếu không có quyền truy cập database.
- **Tracking không được làm hỏng luồng chính.** `trackEvent` no-op khi gtag vắng mặt (ad blocker, môi trường test, script chưa tải xong). Không bao giờ `await` hay rẽ nhánh logic sản phẩm dựa trên kết quả tracking.
- **Không bắn event trong state updater của React.** Updater có thể chạy hai lần ở StrictMode và làm đếm trùng — tính trạng thái mới ra biến trước rồi bắn, như `handleSelectSlot` trong `TarotExperience.tsx`.
- Tên event dùng `snake_case`. Tên chuẩn của GA4 (`login`, `sign_up`, `purchase`, `begin_checkout`, `page_view`) giữ nguyên để dùng được báo cáo dựng sẵn; event riêng của sản phẩm đặt theo miền (`ai_unlock_*`, `history_*`).

### Trạng thái đồng ý

| Trạng thái | `analytics_storage` | Cookie `_ga` | Dữ liệu gửi đi |
|---|---|---|---|
| Chưa chọn | `denied` | Không | Ping ẩn danh |
| `denied` | `denied` | Không, xóa cookie cũ nếu có | Ping ẩn danh |
| `granted` | `granted` | Có | Đầy đủ |

Hàng đợi trong `gtag.ts` chỉ phục vụ khoảng thời gian ngắn giữa lúc component mount và lúc `initGtag()` chạy (tối đa 20 event, giữ lại cái mới nhất). Nó không liên quan tới đồng ý — Consent Mode lo phần đó ở phía gtag.

## Việc phải làm trong GA4 UI

1. Đánh dấu key event (conversion): `sign_up`, `ai_unlock_success`. `purchase` được GA4 tính tự động.
2. Khai báo custom dimension cho các tham số muốn phân tích: `is_free_trial`, `is_logged_in`, `placement`, `topic`, `reason`. Tham số không khai báo vẫn vào DebugView nhưng không dùng được trong báo cáo chuẩn.
3. Đổi currency của property sang VND nếu muốn báo cáo doanh thu khớp với giá bán.

## Kiểm tra

- DebugView trong GA4 hiện event theo thời gian thực. Bật bằng extension "Google Analytics Debugger" hoặc thêm `debug_mode: true` vào tham số khi cần.
- Ad blocker chặn `googletagmanager.com`, nên số liệu luôn thấp hơn thực tế. Đừng dùng GA để đối soát doanh thu — bảng `Order` mới là số liệu tài chính đúng.
- Ở local, script vẫn gửi dữ liệu thật về property. Lọc theo hostname trong báo cáo nếu cần tách traffic dev.

## Còn thiếu

- `page_view` gửi kèm query string, nên `?auth=...` và `?order=...` xuất hiện trong báo cáo path dù URL đã được dọn ngay sau đó.
- Chưa bật Google signals hay quảng cáo; `ad_*` luôn denied nên các báo cáo liên quan tới quảng cáo sẽ trống.
