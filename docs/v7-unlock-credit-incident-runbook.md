# Runbook — sự cố credit khi mở khóa v7

Phạm vi: UnlockOperation/UNLOCK_SPEND/REFUND của AI unlock, không PayOS/top-up/admin grants. Tài liệu chuẩn bị ngày 23/11/2026; chưa kích hoạt production recovery hoặc phát hành fix. Task8 đã xác minh deployed index/history timeout60 và local build60, build/E2E test đạt; cutover, migration production và kích hoạt recovery vẫn chưa được phép thực hiện. Cần kiểm tra lại duration của release deployment mới trước mở traffic.

## Nhận diện trạng thái

| Bằng chứng | Ý nghĩa | Xử lý |
| --- | --- | --- |
| Metric AiGenerationMetric outcome=success hoặc event generated | Provider/validation đã trả kết quả; chưa chứng minh DB lưu hoặc tiền đã settle | Tra operation và ledger; không tính là persisted success |
| Event persisted | Caller đã xác nhận trạng thái completed từ DB | Dùng ID bài trong history, không gọi model hoặc hoàn tiền để lấy lại bài |
| PROCESSING chưa hết expiresAt | Attempt có quyền còn chạy | Không mở attempt mới/hoàn chủ động; xem lại trạng thái |
| PROCESSING hết hạn hoặc REFUND_PENDING | Candidate recovery; chưa phải khoản đã hoàn | Guarded recovery kiểm tra token, receipt, ownership, result dưới lock |
| REFUNDED + spend/refund receipts hợp lệ | Hoàn đã được xác nhận | Có thể mở lại bằng thao tác mới của người dùng |
| SUCCEEDED nhưng bài/reading bị xóa | completed_unavailable, không tự tạo diễn giải miễn phí mới | Xác minh history deletion; không refund chỉ vì thiếu nội dung |
| RECONCILE_REQUIRED hoặc evidence mismatch | Quarantine cần con người rà, không tự sửa | Dừng auto adjustment, lưu evidence, chỉ người có quyền tài chính xử lý theo quyết định được duyệt |
| recovery_pending / lỗi DB / response mất | Chưa xác nhận settlement | Không hứa đã hoàn; giữ attempt, kiểm tra lại khi DB hoạt động |

Các event JSON có prefix `ai-unlock-lifecycle`, whitelist event/stage/operationId/attemptToken/readingId/userId/model/promptVersion. Stage là ngữ cảnh caller; đây là best-effort logs có thể mất, trùng hoặc đến trễ. Persisted/refunded là xác nhận trạng thái, không nhất thiết mutation mới. Không cộng số events làm số lượt charge/refund hoặc dùng absence của log để kết luận rollback. Durable DB evidence là nguồn chính. Khi settlement response bị mất và chỉ đọc được trạng thái reading, event của token caller vẫn recovery_pending vì kết quả có thể thuộc attempt mới; owned recovery reread bỏ token/model cũ thay vì gắn nhầm. stale và completed_unavailable được ghi riêng, không gọi chung là refund pending. Correlate operationId + attemptToken; retry attempt đổi token nhưng dùng cùng operationId.

## Quyền và dữ liệu

- Chỉ operator được giao trách nhiệm và reviewer tài chính được xem IDs/receipts trong report/log; không đưa bản đầy đủ vào ticket công khai hoặc analytics trình duyệt.
- Report không đọc question/cards/output/email/credentials hoặc provider errors. Không bổ sung các cột đó để debug. Export giới hạn thời gian lưu theo chính sách vận hành; sample task6 chỉ dùng dữ liệu giả.
- Công cụ audit không có lệnh apply/fix và không gọi status action: `getUnlockStatusAction` có thể settle refund, nên không phải truy vấn read-only.
- CLI hiện **chỉ cho DB test localhost**, đúng user credit_test và database tarot_credit_task3 qua UNLOCK_AUDIT_DATABASE_URL. Không tự đọc .env/DATABASE_URL; không đổi guard để chạy production trong incident. CLI từ chối query params/fragment/protocol khác PostgreSQL để không cho host/schema override đổi đích kết nối.
- Production read-only audit tương lai cần phê duyệt riêng, credential chỉ SELECT, test trên bản sao đã khử dữ liệu và giới hạn thời gian. Không dùng account app có quyền ghi để điều chỉnh tiền thủ công theo report.
- Endpoint recovery là công cụ có quyền sửa credit, bảo vệ bằng CRON_SECRET, chỉ operator/scheduler được duyệt. Không chia sẻ secret trong log, URL, terminal history hoặc báo cáo. Không cấp quyền này cho support/read-only auditor.

## Đối soát dry-run trên test/bản sao được phép

Khởi tạo DB cô lập và áp migrations theo quy trình test, đặt UNLOCK_AUDIT_DATABASE_URL riêng trong môi trường. Chạy:

```sh
pnpm exec tsx scripts/audit-unlocks.ts --dry-run --limit 50
pnpm exec tsx scripts/audit-unlocks.ts --dry-run --after READING_CURSOR --limit 50
pnpm exec tsx scripts/audit-unlocks.ts --dry-run --reading READING_ID
```

Không có mẫu URL chứa credentials trong runbook. Mỗi lần gọi là RepeatableRead snapshot với `SET TRANSACTION READ ONLY`, statement timeout 5s, transaction 10s. Khóa cursor là readingId tăng dần, không phải thời gian. nextCursor khác null nghĩa là còn trang, không được coi một trang là toàn bộ hệ thống. Các trang chụp ở thời điểm khác nhau; rerun reading mục tiêu sau khi hệ thống ổn định trước quyết định thủ công.

Nguồn candidates: operation, interpretation hoặc unlock/refund ledger còn relatedReadingId; kể cả reading đã xóa. Không có đủ ID/evidence thì không thể suy người dùng/reading liên quan. Tối đa 100 readings và 5000 receipts/trang; `evidenceTruncated`/evidence_truncated nghĩa là **report chưa đầy đủ**, giảm phạm vi theo reading. Nếu một reading vẫn quá lớn, cần truy vấn điều tra được duyệt; không coi các sums trong báo cáo thiếu là kết luận.

operationStatus là trạng thái được lưu trên operation; state là phân loại đã kiểm tra. Có mâu thuẫn thì state=ambiguous, thiếu evidence thì state=incomplete/evidenceComplete=false/sumsPartial=true; không dựa vào operationStatus riêng để nói đã hoàn hay đã persist.

Fields spendSum/refundSum/net chỉ là các khoản unlock trong phạm vi reading được chụp, gồm các attempts cũ. balanceAfter là snapshot mỗi mutation, không phải số dư hiện tại. Có thể có purchase/grant/admin adjustment xen giữa spend/refund; không lấy refund.balanceAfter - spend.balanceAfter để suy refund amount. Không khôi phục tổng user.credits từ riêng unlock ledger; công cụ không chứng minh continuity của toàn bộ ledger hoặc số dư đầu kỳ.

## Rà các trường hợp

- `legacy_unkeyed_receipts`, `missing_operation`, `unknown_receipt_key`: giữ nguyên, flag ambiguous; matching amounts hoặc có bài không chứng minh hai entries thuộc cùng attempt. Không backfill keys/operation hoặc hoàn/trừ theo heuristic.
- `receipt_identity_mismatch`, `missing_current_spend`, `invalid_current_refund`, `missing_current_refund`, `unexpected_refund`, `unexpected_result`, `result_identity_mismatch`, `ownership_mismatch`, `unsettled_prior_attempt`, `invalid_balance_after`: rà receipts của đúng token/user/reading, result ID và mọi nguồn mutation liên quan. Không xóa ledger để hết cảnh báo.
- `quarantined`: luôn manual; không reset trạng thái về PROCESSING để ép recovery. Reading chuyển owner khi AI đang chạy cũng cần quarantine; không hoàn vào owner hiện tại.
- expired_pending/refund_pending không issues: phù hợp để guarded recovery xem xét; report tự nó không cấp quyền sửa tiền. Live attempt hoặc stale token vẫn phải bị recovery helper chặn.

## Recovery có kiểm soát

1. Xác nhận đang dùng schema mới, chỉ một protocol financial writer, DB khỏe và function duration thực tế đủ budget. Nếu chưa đạt, giữ NO-GO.
2. Xác định operator/scheduler owner, secret và quyền truy cập trước bật lịch. Endpoint riêng `/api/cron/recover-unlocks`, không ghép vào PayOS reconcile-orders. Task4 chỉ chuẩn bị endpoint, vercel.json chưa thêm lịch.
3. Khi cutover được duyệt, dùng scheduler/HTTP client được phép với bearer secret trong header bảo mật; mỗi batch tối đa 25 candidates, 45s, không gọi provider. Không retry model để chữa một transaction chưa rõ.
4. Batch chọn theo updatedAt/expiresAt/id; row lỗi được cập nhật riêng updatedAt bằng DB UTC dưới token/status/expiry guard để đi ra sau các row chưa thử. Rotation không gia hạn expiresAt, không đổi status hoặc receipts/credits. Nếu metadata rotation không ghi được, có stage rotation_failed: cần operator xử lý DB/backlog, không hứa eventual recovery vô điều kiện.
5. HTTP 503/batch failed/deferred không có nghĩa mọi row đã rollback: có thể một số row đã hoàn. Chạy lại guarded recovery bằng token guard khi DB hoạt động; không thực hiện increment thủ công hoặc replay raw SQL settlement.
6. Kiểm tra lại DB snapshot: confirmed refund có đúng spend/refund receipt, không có result bất ngờ; success không bị refund. Candidate còn sống/stale/quarantine không được ép hoàn.
7. Nếu thiếu receipt/ownership/result mâu thuẫn, dừng sửa tiền tự động và giao reviewer có quyền điều tra. Không xóa pending record khi DB chưa thể xác nhận.

## Ngưỡng dừng/quan sát trước release

Đây là ngưỡng vận hành đề xuất, **chưa có alert/scheduler được bật tự động**:

- Bất kỳ net charge/refund sai, balance âm, receipt/result/ownership mismatch hoặc quarantine mới: giữ/dừng rollout unlock, bảo toàn evidence, điều tra trước khi tiếp tục.
- Bất kỳ rotation_failed: giữ rollout và xác nhận khả năng ghi metadata/recovery trước tiếp tục; nếu đang vận hành, báo operator để ngăn backlog bị kẹt. Không lấy updatedAt làm tuổi debit; rotation có thể cập nhật nó, nên tuổi pending phải tính từ expiresAt.
- Pending quá hạn trên 5 phút hoặc hai batch liên tiếp lỗi/503: báo operator, kiểm tra DB/deadline/recovery; nếu đang rollout thì giữ rollout, không khuyến khích người dùng tạo lượt mới.
- Evidence report bị truncate hoặc thiếu trang: không đưa kết luận toàn cục; audit phạm vi hẹp hơn.
- Quan sát riêng generated, persisted-confirmed, refund-confirmed, recovery_pending và tuổi pending từ expiresAt. Không dùng tỷ lệ generation success thay cho persisted unlock success.

## Rollback

Không hạ code về writer cũ khi còn operation pending hoặc settlement chưa rõ. Dừng nhận unlock mới theo cơ chế maintenance/cutover đã được duyệt, cho workers cũ hết lease, giữ guarded recovery/schema mới để drain hoặc quarantine mọi attempt. Snapshot read-only và reviewer xác nhận các terminal receipts trước đổi writer. Không drop bảng/cột/keys, xóa pending hoặc chạy down-migration mất evidence. Nếu không drain được, giữ phiên bản có recovery và xử lý sự cố; rollback không được bỏ lại debit chưa settle. Các thao tác deploy/migration/maintenance production cần yêu cầu riêng, runbook không tự cấp quyền thực hiện.
