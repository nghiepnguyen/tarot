# Task 5 — Lưu bài, lịch sử và trạng thái mở khóa

Ngày 23/11/2026. Hoàn tất phạm vi task 5 trong workspace; chưa release.

## Thay đổi

AiUnlockPanel đọc trạng thái authoritative khi mount nếu chưa có bài. PROCESSING, recovery_pending, reconciliation_required, completed_unavailable và transport failure chỉ cho kiểm tra trạng thái/xem lịch sử, không mời mở khóa thêm. Chỉ response `retryable: true` mới cho mở khóa; lỗi không có contract không tự được coi là retryable. Model preparation/rate-limit thất bại trước debit được server phân loại rõ để vẫn thử lại được khi thích hợp.

Số dư được đọc sau status lookup vì lookup có thể vừa settle refund; mỗi unlock/status check cũng đọc lại số dư, bắt lỗi mạng. Không suy số dư bằng phép trừ tại client. Lỗi vẫn hiện khi hết credit nhưng không có nút retry thanh toán. Data đã persist/legacy hiển thị bằng adapter cũ; lỗi transport sau commit lấy lại bằng status/history. Component được remount theo readingId để không trộn trạng thái hai bài.

SaveReadingAction nhận UUID riêng cho mỗi thao tác lưu, dùng khóa chính Reading.id đã có. Retry cùng UUID chỉ thành công nếu cùng owner và canonical question/cards. Replay trước rate limit, concurrent create/commit acknowledgement loss được giải quyết bằng đọc row authoritative; không dedupe theo nội dung của những lượt trải riêng. Lỗi revalidate/report sau create không biến thành save failure. Không thêm schema hoặc dependency.

TarotExperience giữ UUID trong bộ nhớ và sessionStorage trước gửi action; legacy pending chưa có mã được cấp một lần. Retry/reload dùng lại mã; storage bị chặn vẫn retry cùng mã trong trang hiện tại. Reveal chuyển ngay sang trạng thái đã lật/đang lưu, guard đồng bộ chặn double-click. Phản hồi lưu cũ sau reset không thay readingId/cards hoặc ghi lại pending của lượt mới.

## Kiểm chứng

- Full Vitest: **789 passed, 4 skipped; 63 files passed, 1 skipped**.
- Trong đó **29 PostgreSQL integration tests** chạy với DB 16 riêng, independent connections; tất cả 18 migration áp thành công. Bốn skipped là rate-limit DB suite không bật DATABASE_URL. Không dùng fallback DB production.
- **13 browser component tests** bằng Chromium, action/provider giả. Kiểm tra processing/uncertain/quarantine, status-only reload lấy bài cũ, mất phản hồi unlock, số dư sau refund/success, uncoded error fail-closed, UUID qua retry/reload/storage failure, double-click reveal và reset khi response bị giữ.
- Unit/history tests chạy actual history page mapping và adapter cho v7/legacy/review, giữ nguyên dữ liệu và scope user; action trả fields persist thay vì raw provider result.
- PostgreSQL mới kiểm tra concurrent save cùng ID chỉ một row, ID mới với cùng payload tạo lượt trải riêng, cross-user replay bị từ chối, postcommit cache failure/response loss lấy lại đúng ID và chỉ một net spend, xóa history khi provider còn chạy không tạo orphan và hoàn một lần. Đổi Reading.userId trong lúc generate tạo quarantine với ownership_mismatch, giữ debit traceable và không hoàn nhầm tài khoản.
- `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` đạt. Hash schema, v7/registry, history page/legacy adapter và vercel.json không đổi so baseline task5.

Browser tests dùng harness test/unlock-ui và playwright.unlock-ui.config.ts; server actions được thay ở harness, không thêm đường giả vào app production. Đây là kiểm thử component thật trong browser, **không thay thế authenticated Next E2E** ở task 8. Không thêm thư viện; harness dùng Vite đã có qua Vitest. Database test container đã xóa và xác nhận không còn.

## Review và quyết định

Fresh reviewer tìm thấy ba lỗi cần sửa và một thiếu sót coverage. Đã tái hiện RED → GREEN cho double reveal/reset, uncoded errors bật retry và balance đọc trước status refund; bổ sung test đổi owner giữa generation. Full suite/browser suite đều xanh sau sửa; không có minor findings còn hoãn.

Các quyết định:

1. Tái sử dụng Reading.id làm UUID của thao tác, kiểm tra owner/payload khi replay, không thêm bảng. Nếu cùng token bị dùng sai sẽ bị từ chối; một reading đã bị xóa không có tombstone save riêng. Pending cũ trước khi tính năng này được triển khai chưa có token nên không thể suy rằng nó đã lưu ở quá khứ.
2. Dùng nút kiểm tra trạng thái thay vì polling nền liên tục. Người dùng có thể cần kiểm tra thêm sau lease hết hạn; scheduler recovery vẫn phải được bật trong cutover được phê duyệt trước release. Khi storage bị chặn và trang bị đóng, mã thao tác trong RAM không thể khôi phục.
3. Không coi lỗi không có retryability là cho phép unlock. Chỉ những lỗi pre-debit được xác nhận mới có retry rõ ràng; nếu phân loại thiếu, người dùng cần kiểm tra trạng thái thay vì mở khóa ngay.

## Giới hạn và bước tiếp

Giữ v7 active, giá 10 credit/lượt; không chỉnh tiền lịch sử hoặc prompt. Chưa build/authenticated full E2E; task 8 còn giữ những gate này. Task 4.1 effective deployment duration còn mở. Không gọi model thật, DB production, migration production, commit/push/deploy hoặc bật cron.

Tiếp theo là task 6: đối soát read-only, quan sát trạng thái và runbook xử lý sự cố. Bằng chứng baseline/task ledger ở `.model-compare/v7-credit-task5/` được giữ vì chưa commit; không xóa artifacts nghiên cứu hoặc edits khác.
