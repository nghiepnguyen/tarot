# Recovery scheduler cho Vercel Hobby — 24/11/2026

## Trạng thái

Giữ Vercel Hobby theo quyết định người dùng. Đã chuẩn bị Cloudflare Worker scheduled-only và kết nối thành công một tài khoản Cloudflare qua OAuth. **Chưa deploy Worker, chưa đặt secret ở cloud, chưa bật cron và chưa release backend/migration.** Đây là RC local để review, chưa phải GO production.

## Thay đổi

- `ops/unlock-recovery-worker/worker.ts`: chỉ gọi đúng HTTPS `/api/cron/recover-unlocks`, khóa riêng qua Authorization header, không redirect, một request/lượt; gọi `ScheduledController.noRetry()` trước xử lý; timeout 55 giây bao gồm đọc body, lỗi trả thông báo cố định.
- Backend ưu tiên `UNLOCK_RECOVERY_SECRET`; chỉ fallback `CRON_SECRET` khi biến mới không được khai báo. Giá trị rỗng đóng endpoint với 503. Khóa PayOS cũ bị từ chối khi có khóa riêng.
- Worker giữ ngân sách recovery backend 45 giây. `wrangler.toml` để `crons=[]`, URL placeholder `.invalid`, không public workers.dev/preview URL, không chứa secret.
- Harness E2E dùng khóa dedicated giả và kiểm tra khóa PayOS bị từ chối. ESLint bỏ qua artifact local `.model-compare/**`; source app và ops vẫn được kiểm tra.

## Kết nối tài khoản

Wrangler 4.167.0 được cài riêng dưới artifact ignored, không đổi dependencies ứng dụng. OAuth đã xác nhận bằng `whoami`: account:read, user:read, workers_scripts:write và offline_access. Credentials lưu file mã hóa trong artifact và khóa mã hóa trong macOS Keychain; không nằm trong RC/bundle. Không mở rộng sang các scope mặc định khác dù Wrangler cảnh báo thiếu scope mặc định. Kết nối tài khoản không chứng minh deploy/quota/runtime thực tế.

## Bằng chứng local

Node 24.22.3, PostgreSQL 16 fixture cục bộ, không production DB/provider có phí:

- Full suite sau sửa review: **833/833**, 67 test files; gồm 33 kiểm thử PostgreSQL credit và 4 rate-limit.
- **9/9 E2E** Next production server: main/history, retry/refund/status, dedicated auth và từ chối khóa cũ.
- Next production build, TypeScript noEmit, ESLint đạt. Next build/E2E chạy trước sửa noRetry chỉ thuộc Worker; full suite/types/lint và Wrangler dry-run chạy lại sau sửa đó.
- Wrangler `deploy --dry-run` thành công với config tắt, không upload lên Cloudflare.
- Fresh review phát hiện retry cấp nền tảng; thêm assertions chứng minh 5 ca RED, sửa noRetry rồi toàn bộ suite GREEN. Không còn finding khác trong phạm vi thay đổi.

Logs và manifest/bundle local: `.model-compare/v7-hobby-recovery-20261124/`. Bản RC cũ commit `a6f8e72a66ed7940cc678e0f7727fd6e2eddb9d5` và bundle cũ được giữ nguyên; candidate mới là nhánh con độc lập, chưa push.

## Trước khi kích hoạt

1. Chọn immutable release artifact mới; hoàn tất backup, fence mọi writer cũ, drain và phê duyệt migration/cutover theo release handoff hiện có.
2. Kiểm thử preview với DB test và xác nhận runtime/maxDuration của artifact deploy mới. Production hiện tại chưa có auth dedicated này.
3. Đặt khóa ngẫu nhiên base64url ít nhất 32 ký tự, khác PayOS: app `UNLOCK_RECOVERY_SECRET` khớp Worker `RECOVERY_SECRET`. Chỉ đặt bằng secret manager/CLI bảo mật, không gửi trong chat.
4. Chọn hostname release HTTPS thực, xác nhận owner/quota/cảnh báo lỗi; deploy Worker với cron tắt, smoke có kiểm soát sau backend sẵn sàng.
5. Sau phê duyệt bật `* * * * *`; quan sát các lượt chạy thực tế trước mở traffic. Không suy ra SLA từ cron mỗi phút. Rollback lịch bằng `crons=[]`; lỗi/503 có thể đã settlement một phần, dùng runbook thay vì sửa tiền thủ công.

Hướng dẫn chi tiết: [Worker README](../ops/unlock-recovery-worker/README.md), [release handoff](v7-unlock-credit-release-handoff-2026-11-23.md), [incident runbook](v7-unlock-credit-incident-runbook.md).

## Quyết định kỹ thuật

- Chọn Cloudflare Worker thay scheduler HTTP giới hạn 30 giây để giữ nguyên budget backend 45 giây. Nếu quota/độ trễ không đáp ứng, recovery có thể chậm; cần owner theo dõi, không có cam kết 5 phút khi chưa đo thực tế.
- Tách khóa recovery khỏi PayOS để giới hạn ảnh hưởng khi khóa scheduler lộ. Đổi lại operator phải cấp hai giá trị khớp nhau; sai khóa làm recovery 401/503.

Nguồn chính thức: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/), [Wrangler login](https://developers.cloudflare.com/workers/wrangler/commands/general/).
