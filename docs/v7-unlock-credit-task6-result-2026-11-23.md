# Task 6 — Đối soát và quan sát unlock

Ngày 23/11/2026. Hoàn tất phạm vi task 6 trong workspace; chưa release, chưa bật monitoring alerts/scheduler production.

## Thay đổi

- `lib/ai/unlock-observability.ts`: lifecycle JSON logs chọn rõ các trường event/stage/operationId/attemptToken/userId/readingId/model/promptVersion, lọc định dạng/độ dài IDs và bỏ mọi extra payload. Logger lỗi không làm settlement thất bại. Reserve trả thêm operationId; không đổi financial transaction logic.
- Action phân biệt reserved, generated, persisted-confirmed, refunded-confirmed và recovery_pending. Generation success không chứng minh result đã commit. Sentry handled failures sau reserve có attempt identity; raw provider/DB exceptions không được đưa vào report.
- Recovery ghi đúng candidate identity và outcome. Stale/completed_unavailable không bị gọi là refund pending. Nếu cần reread reading sau token stale, log bỏ token/model cũ; khi action chỉ đọc được state sau mất settlement response, log token caller là settlement_unconfirmed thay vì gán kết quả attempt mới vào token cũ. UI vẫn nhận authoritative current state.
- `lib/ai/unlock-audit.ts`: RepeatableRead snapshot có PostgreSQL `SET TRANSACTION READ ONLY` trước mọi evidence query, timeout statement 5s/transaction 10s. Quét operation, result metadata và unlock/refund receipts, kể cả reading đã bị xóa; không chọn question/cards/output/email. Tối đa 100 readings, 5000 receipts/trang, cursor readingId.
- Report đối chiếu spend/refund receipts theo token, amount/owner/reading/type, operation/result identity và attempts cũ; trả spendSum/refundSum/net và balanceAfter samples. operationStatus là khai báo DB; state chỉ xác nhận khi evidence phù hợp. Mâu thuẫn thành ambiguous; evidence bị cắt thành incomplete/sumsPartial/evidenceComplete=false. Không suy tổng credits hoặc continuity toàn ledger từ unlock subset.
- Legacy không keys/operation luôn được flag để rà thủ công, không tự backfill hoặc sửa tiền. Quarantine không bị tháo tự động.
- `scripts/audit-unlocks.ts`: bắt buộc --dry-run và UNLOCK_AUDIT_DATABASE_URL riêng, không đọc .env hoặc fallback DATABASE_URL; chỉ cho localhost credit_test/tarot_credit_task3, từ chối query/fragment/protocol overrides. Không có apply/fix mode. Tool chưa được cấp đường chạy remote/production.

## Kiểm chứng

Full Vitest với DB test: **813 passed, 4 skipped; 65 files passed, 1 skipped**; bao gồm **32 PostgreSQL integration tests**. Bốn skipped là rate-limit DB suite không bật DATABASE_URL; audit/credit tests thực sự chạy với URL test opt-in.

Tests mới kiểm tra các phân loại pending/success/refund, receipts giả/thiếu, legacy ambiguous, prior attempts, balanceAfter, contradictions/truncation, log privacy và token attribution, URL guard. Cases mới đã RED → GREEN; PostgreSQL so snapshot trước/sau audit giữ nguyên user/history/operation/ledger/result, lệnh ghi cố tình trong audit transaction bị lỗi read-only từ PostgreSQL, phân trang deterministic trong fixture và không chứa output.

CLI thực tế được chạy trên hai case giả: expired pending hợp lệ và legacy thiếu key/operation; báo cáo tại `.model-compare/v7-credit-task6/dry-run-example.json`. Đã kiểm tra không có marker PRIVATE trong report, không có secrets; CLI thiếu URL bị từ chối trước tạo client. Fixture giả được xóa sau xuất report. Không audit dữ liệu người dùng thật.

13 browser component tests từ task5 tiếp tục đạt. `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` đạt. 18 migration áp thành công vào DB test mới; không thêm schema/dependency. V7/registry/schema/vercel.json pins giữ nguyên. Container DB test đã xóa và xác nhận không còn.

## Review

Fresh reviewer phát hiện ba nhóm lỗi quan trọng: settlement reread gắn nhầm token cũ; state báo terminal dù evidence mâu thuẫn/truncated; URL query overrides làm yếu local test guard. Đã sửa bằng regression tests RED → GREEN, chạy lại full suite và browser suite. Không có minor findings hoãn, không chạy vòng review thứ hai để thay thế test proof.

## Quyết định và giới hạn

1. Không thêm telemetry table: logs best-effort để chẩn đoán, durable operation/ledger là authority. Log có thể mất/trùng/đến trễ; không cộng event counts thành số tiền hoặc coi thiếu log là rollback.
2. Không suy settlement cho legacy thiếu evidence: report ambiguous/manual. Điều này có thể cần thêm điều tra, đổi lại không tự chỉnh credit theo heuristic.
3. CLI hiện chỉ chạy test; runbook chuẩn bị quy trình historical dry-run và quyền SELECT cho tương lai, không tự cho phép đọc/sửa production. Mỗi trang là snapshot riêng; cần kiểm tra lại reading mục tiêu khi hệ thống ổn định, không coi page count là thống kê toàn cục.
4. balanceAfter là mẫu đã lưu, chỉ kiểm tra dạng/không âm; không khẳng định ledger continuity hoặc tổng số dư đúng chỉ nhờ report này. Các nguồn grants/purchases/admin adjustments phải được rà riêng khi điều tra tài chính đầy đủ.

Runbook: `docs/v7-unlock-credit-incident-runbook.md` — định nghĩa event/state, audit, recovery có quyền hạn, thresholds đề xuất và rollback/drain. Ngưỡng đề xuất không có nghĩa alert đã active. Không deploy/migration production/model thật/cron/commit/push; chưa build hoặc authenticated Next E2E (task8), task4.1 effective function duration còn mở. Tiếp theo task7 phân loại workspace và đóng phần nghiên cứu v9.x, không xóa artifacts tùy tiện.
