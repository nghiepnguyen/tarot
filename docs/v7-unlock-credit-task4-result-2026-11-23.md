# Task 4 — Deadline và khôi phục unlock

Ngày 23/11/2026. Code và kiểm thử hoàn tất; chưa release. Task 4.1 xác minh effective duration của môi trường deploy vẫn mở.

## Hành vi

- Action có ngân sách 55 giây từ trước auth. Provider được cấp tối đa 45 giây và luôn chừa 10 giây cho settlement; preflight chậm không bắt đầu lượt trừ tiền khi không còn đủ thời gian.
- Gemini/DeepSeek nhận remaining timeout, abort và giới hạn cả thời gian chờ SDK/body response. Không retry provider. Abort không bảo đảm nhà cung cấp dừng tính phí; late response không tiếp tục caller.
- Metrics chỉ được chờ tối đa 250ms; reporting failure không thay kết quả generation. Query telemetry có thể kết thúc sau timeout, không có quyền sửa credit.
- Transaction nhận cùng deadline, giới hạn pool wait/transaction/SQL/lock; retry rollback được xác nhận tối đa ba lần và kiểm tra remaining budget. Lease tính theo DB wall clock cộng remaining budget, không cộng lại 55s sau preflight.
- Timeout của action không khẳng định DB đã rollback hoặc credit đã hoàn. Trạng thái chưa rõ trả recovery_pending, durable operation còn để phục hồi. Result commit/expiry/token/receipt guards vẫn quyết định settlement.
- Recovery của lượt đang xem chỉ quét đúng user/reading. Nếu vừa hoàn tiền, action trả refunded, không tự trừ tiền lại; lần mở khóa chủ động tiếp theo mới được tạo attempt mới.
- Batch recovery tối đa 25 candidates/45 giây, chỉ expired PROCESSING hoặc REFUND_PENDING, đi qua cùng guarded refund. SUCCEEDED/quarantine không bị tự hoàn. Một row lỗi không ngăn row sau; hết budget để lần chạy sau tiếp tục. Số refunded là số kết quả xác nhận, không phải số mutation mới khi các workers chạy chồng nhau.
- Endpoint GET `/api/cron/recover-unlocks` xác thực CRON_SECRET, fail closed, no-store, trả 503 khi batch lỗi/deferred. Endpoint tách khỏi PayOS; chưa được thêm vào lịch cron production.

## Bằng chứng

Các regression deadline/provider/metrics/transaction được kiểm tra RED → GREEN. Full Vitest với UNLOCK_CREDIT_TEST_DATABASE_URL trỏ riêng PostgreSQL 16: **772 passed, 4 skipped; 61 files passed, 1 skipped**. 25 integration tests thực sự chạy bằng connections độc lập. Bốn skipped thuộc rate-limit DB suite không có DATABASE_URL; không trỏ suite đó vào DB ứng dụng.

Ca PostgreSQL mới: dừng sau debit/sau provider mà không chạy catch, recovery workers đồng thời và lặp lại, giữ nguyên success/quarantine, refund ledger bị từ chối rồi thử lại khi DB write phục hồi, owned recovery không debit lại, lease ngắn theo budget, mất commit acknowledgement giữa batch rồi recovery tiếp. Fault injection mô phỏng DB write failure, không phải thử nghiệm tắt production database.

`pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` đạt. Fresh read-only reviewer không phát hiện lỗi quan trọng. Không thay schema ở task này; 18 migrations đã áp thành công vào DB test mới. Container test đã xóa và xác nhận không còn. Hash v7/system/registry/schema/vercel.json và page/history không đổi so baseline task4.

## Duration và giới hạn release

Đã đọc hướng dẫn Next.js cài trong repo. Page/history khai báo maxDuration=60; endpoint recovery khai báo 60. Truy vấn Vercel project/deployment chỉ đọc xác nhận project Next.js/Node24, Fluid=true và deployment READY, nhưng metadata không trả effective function duration. Bằng chứng lọc chỉ lưu cấu hình tại `.model-compare/v7-credit-task4/deployment-settings.json` và `deployment-duration.json`, không lưu secrets.

**Không dùng khai báo repo để kết luận production cho phép 60s.** Cần kiểm tra function artifact/settings thực tế khi release; môi trường phải có giới hạn lớn hơn soft deadline và đủ overhead hoặc điều chỉnh ngân sách tương ứng. Task 4.1 và checkbox tổng 4.0 còn mở vì điều kiện này.

Chưa build/E2E (task 8), chưa cập nhật UI (task 5), chưa production migration, commit/push/deploy hoặc kích hoạt schedule. Trước cutover cần ngăn old/new financial writers chạy trộn, xác nhận quyền/lịch recovery và drain pending attempts trước rollback theo thiết kế. Không gọi model thật hoặc sửa credit lịch sử. V7 tiếp tục active.
