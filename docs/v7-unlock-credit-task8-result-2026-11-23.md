# Task 8 — Release verification và bàn giao

Ngày 23/11/2026. **Hoàn tất kiểm chứng/handoff task8. Local gates PASS; production chưa GO trước cutover/migration/recovery ownership được duyệt.** Không tự deploy hoặc sửa tiền production.

## Kết quả cuối

| Check | Kết quả |
| --- | --- |
| Full Vitest | **818 passed, 0 skipped**, 66 files |
| Real DB cases | 33 credit integration +4 rate-limit, PostgreSQL16.15; financial transactions Serializable |
| Focused unlock/provider/metrics/history/registry | **168 passed**, 13 files |
| Authenticated Next E2E | **9 passed** trên production build, credentials/DB test + fake DeepSeek HTTP |
| Browser component regressions | **13 passed** |
| Lint / TypeScript / diff check | Đạt |
| Prisma validation / schema diff | Hợp lệ / không khác; 18 migrations áp vào DB test mới |
| Default Next16.3.4 Turbopack build | Đạt, cả trước/sau recovery fairness fix |
| Production duration đọc-only | Deployed index/history +RSC timeout60; runtime nodejs24.x |
| V7/registry/schema/cron | Giữ nguyên hash so đầu task8 |

Task8 chạy cả DATABASE_URL và UNLOCK_CREDIT_TEST_DATABASE_URL trỏ DB localhost test, nên bốn rate-limit tests trước đây skip cũng đã chạy. Không gộp skipped tests vào passed. Không cài/nâng dependency hoặc schema mới trong task8.

## Invariant matrix

| Invariant | Evidence | Đánh giá trong phạm vi test |
| --- | --- | --- |
| Một success có một net spend10 và một result | Independent DB connections, action barrier, repeated finalize/refund, actual main/history E2E | PASS |
| Không âm/không debit hai lần khi balance chỉ đủ một lượt | Concurrent two-readings DB case, reserve/action no-provider branches; E2E insufficient CTA không có call/spend | PASS |
| Spend/ledger và refund/ledger nguyên tử | DB trigger reject ledger, snapshots rollback; guarded receipts | PASS |
| Không hoàn result đã commit | Cache/display/reporter failures, repeated settlement, history deletion, E2E mất POST response sau commit | PASS |
| Retry không generate/charge lại chỉ để lấy result | Lost-ack DB cases, status recovery, reload/history E2E, two tabs processing | PASS |
| Attempt cũ không sửa attempt mới | Token fencing +expiry DB cases, stale outcome attribution tests | PASS |
| Crash/failure giữ durable recovery path | Debit/provider/result cut points, DB fault rồi recovery, ack loss giữa batch, expired/delete/ownership quarantine | PASS |
| Backlog không bị chặn bởi 25 row faults | Regression26charges RED→GREEN, healthy candidate refund ở batch tiếp theo; failed charges giữ nguyên net -10 | PASS với DB metadata rotation hoạt động; rotation_failed phải escalation |
| Safety/ownership/legacy | Action guards, user-scoped status/read-only audit, in-flight owner transfer, actual legacy history E2E | PASS |
| V7 không bị đổi để cleanup | Hash pin, registry/admin/history tests; không paid model calls | PASS |

Không khẳng định exactly-once provider execution hoặc mọi credit lịch sử đều đúng. Ledger legacy/ambiguous không được tự backfill/adjust; report read-only không suy tổng user balance.

## E2E thật đã chạy

`playwright.release.config.ts` và `test/release/` chạy Next production server/auth và DB thật ở localhost3008; không dùng mock action branch/route trong app.

1. Trang chính bốc/lưu/mở khóa: một bài persisted v7/model deepseek, một spend và balance10.
2. History unlock rồi reload: lấy lại đúng bài, provider/ledger không tăng.
3. Không đủ credit: UI chỉ mời nạp, không gọi provider/ghi spend. Đây là UI gating proof, server boundary có tests riêng.
4. Provider lỗi một lần: refund10 đã commit, explicit retry thành công, ledger -10/+10/-10.
5. TimeoutError giả +refund ledger bị từ chối: giữ PROCESSING/pending, không mời paid retry; induce expiry trên DB test, khôi phục DB writes và gọi cron có auth hai lần chỉ một refund.
6. Chặn response POST sau server đã commit: UI chuyển kiểm tra trạng thái, lấy lại bài không gọi provider/charge lại.
7. Tab khác khi owner đang generate: chỉ thấy processing, không có nút mở thêm; sau release provider barrier cả hai nhận cùng persisted result.
8. Legacy result hiển thị qua history/adapter, không provider/spend/operation mới.
9. Recovery không auth với một expired charged candidate thật:401, balance/ledger/status không đổi.

Provider giả được inject bằng Node preload **chỉ trong process test**, validate target local và synthetic key. Global fetch tới DeepSeek trả fixture; global fetch ra nonlocal khác bị từ chối, browser HTTP cũng được route guard. Không phải OS-level egress firewall; build không có preload và có thể tải fonts công khai. Môi trường build/server được blank project keys, chỉ dùng test DB/auth/provider/cron values, Sentry upload/Next telemetry tắt. 9 E2E tạo7 synthetic provider calls mỗi lượt run; không trả phí. Production JS được quét không có fake keys/preload/harness markers.

## Review và sửa blocker

Fresh reviewer không thấy lỗi atomicity/fencing/commit boundary khác khi chỉ có new writer, nhưng phát hiện một Important: batch luôn chọn25 expired cũ nhất, các row lỗi không tiến ra sau nên có thể bỏ đói row khỏe.

Đã thêm real-PG test26charges:25 row bị trigger từ chối refund +1 row khỏe. Test RED ở batch2 refund0; sau fix GREEN refund1. Recovery giờ chọn updatedAt/expiresAt/id và dùng transaction metadata ngắn có timeouts để rotate failed eligible candidate bằng DB UTC dưới id/token/status/expiry guard. Không đổi expiry/status/receipts/credits, không thêm retry provider/schema. Metadata rotation failure được ghi stage riêng để operator xử lý; không hứa unattended recovery vô điều kiện khi DB không ghi được.

Chạy lại full818, build, E2E9, lint/tsc sau sửa. 13 component tests đạt, không có thay đổi component. Hai ghi chú evidence scope đã ghi rõ (CTA gating so với action proof; fetch/browser guard so với OS firewall); harness tự tạo output directory và reset rate-limit state trên DB test riêng để tái chạy. Không dùng review lần hai thay regression proof.

## Duration task4.1

Vercel read-only project API và `vercel inspect --format json` cho current READY deployment `dpl_BwWTyYxFfcAMywEn4idcKLk84pKb` trả lambda timeout60 cho index/history và RSC variants. Local compiled functions-config cũng60 ở main/history/recovery. Task4.1 có evidence thật và được đóng; deployment mới vẫn phải kiểm tra artifact trước mở traffic. New recovery chưa có trong deployment cũ, không suy nó đã live.

Artifacts đã lọc: `deployment-settings.json`, `deployed-functions.json`, `boundary-proof.json`, `local-functions-config.json` trong `.model-compare/v7-credit-task8/`, không lưu secrets/env payload. Hướng dẫn tham chiếu: [Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration).

## Bàn giao và NO-GO production hiện tại

Chi tiết thứ tự/phân quyền, migration/cutover/observation/rollback: `docs/v7-unlock-credit-release-handoff-2026-11-23.md`. Runbook incident đã cập nhật fairness và rotation_failed. Cần candidate bất biến được review/commit, chặn mọi legacy financial writer kể cả deployment URL/old routing, drain, migration được duyệt, smoke Node24/timeout artifact mới, recovery scheduler/secret/owner và quan sát canary. Những bước này chưa thực hiện hoặc tự cấp quyền trong task8.

Local runtime Node23.7.0, target project24.x; không gọi đây là target-runtime/production smoke. Không sửa vercel.json schedule, không deploy/push/commit, không gọi model thật hoặc DB production. Chưa đưa ra GO traffic tự động; task8 hoàn tất **đánh giá và bàn giao**, không đồng nghĩa đã release.

## Bảo toàn và artifacts

Snapshot/pins ở `.model-compare/v7-credit-task8/before.json`. Task8 chỉ sửa recovery fairness và integration regression, incident runbook, task list; thêm release harness/config cùng hai tài liệu handoff/report. Dữ liệu/phiếu v9.x và v7/registry/schema/pricing giữ nguyên. Task7 A/B/C patches là ảnh chụp cũ; phải áp thêm `04-task8-release.patch` hoặc review final diff tương đương, không deploy riêng snapshot trước fairness fix.

Container PostgreSQL test và child test servers được dọn sau kiểm chứng. Full outputs/summary/preservation và corrective patch nằm trong artifacts task8; không xóa artifacts nghiên cứu của người dùng.
