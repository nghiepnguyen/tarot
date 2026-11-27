# Bàn giao phát hành — v7 unlock credit reliability

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

Ngày 23/11/2026. **Kiểm chứng cục bộ PASS; production NO-GO trước các bước vận hành bên dưới.** Không có deploy, migration production hoặc cron activation trong task8.

Candidate hiện là workspace chưa commit trên `codex/v7-unlock-credit-reliability`, base HEAD `81998706a409e2c1278217b8c87c552eef8bb622`. Giữ v7, giá 10 credit và source/phiếu v9.x. Không phát hành trực tiếp từ một bản vá task7 cũ: bản sửa recovery fairness và tests/handoff task8 phải đi cùng candidate cuối. `04-task8-release.patch` trong artifacts task8 là phần bổ sung sau A/B/C của task7, không phải standalone patch.

## Đã có bằng chứng

- 818/818 Vitest, gồm 33 real-PostgreSQL credit integration tests và 4 rate-limit DB tests; không skip. 168 focused tests, 9 E2E auth/Next/DB thật + fake HTTP provider, 13 browser component tests.
- Lint/typecheck, Prisma validation, 18 migrations lên DB mới, schema diff không khác và default Turbopack build đạt.
- Read-only Vercel inspect cho deployment đã kiểm tra: READY, function `index`, `history`, cả hai RSC counterparts đều timeout60/runtime nodejs24.x. Build mới local cũng khai báo60 cho `/`, `/history`, `/api/cron/recover-unlocks`. Recovery mới chưa deploy. Nguồn cấu hình chung: [Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration); proof cụ thể là metadata đã lọc trong artifacts, không suy từ default của plan.
- Local runtime đã kiểm thử Node23.7.0, PostgreSQL16.15 trên Docker/aarch64; target project Node24.x. Cần smoke bằng runtime target trên preview được duyệt, không coi local build là smoke production.

## Các bước vận hành cần phê duyệt riêng

| Gate | Kết quả cần có trước GO production | Người chịu trách nhiệm |
| --- | --- | --- |
| Candidate bất biến | Review/commit đúng scope; giữ metadata/research evidence; manifest/hash cuối và task8 fix có trong release | Người phát hành/reviewer |
| Recovery owner | Chỉ định người trực, người xử lý quarantine/rotation_failed, lịch batch phù hợp và kênh báo lỗi | Vận hành + người có quyền tài chính |
| Credentials | Xác nhận CRON_SECRET có sẵn đúng environment; header bí mật không lộ URL/log; ai được gọi endpoint có quyền sửa credit | Vận hành |
| Writer cutover | Chặn unlock mới ở writer cũ, kể cả deployment URL/old-client routing; không chỉ đổi alias rồi giả định instance cũ đã biến mất | Người phát hành |
| Drain writer cũ | Chờ tất cả invocations cũ kết thúc theo hard timeout đã xác minh và margin, kiểm tra không còn traffic/write cũ; catch cũ không được coi là bằng chứng rollback | Vận hành |
| Migration | Backup được xác nhận; chạy additive migration bằng quy trình được duyệt, kiểm tra schema/unique nullable keys; không backfill/sửa credit legacy | DB owner |
| Preview/runtime | Build đúng candidate trên Node24 target, test auth/DB test/provider giả; kiểm tra timeout function của artifact thực tế | Người phát hành |
| Recovery trước traffic | Route guarded recovery hoạt động, thử authorization/no-op an toàn trên môi trường được phép; xác nhận schedule/owner rồi mới mở traffic theo canary được duyệt | Vận hành |
| Quan sát/rollback | Có người theo dõi pending theo expiresAt, quarantine, failed rotation và ledger invariants; đường dừng traffic/rollback đã được diễn tập trên test | Vận hành/reviewer |

Không có tên người trực hoặc lịch production nào được tự điền thay người dùng. Task8 chuẩn bị checklist và proof, không cấp quyền tự làm các bước trên.

## Thứ tự cutover

1. Tạo release candidate bất biến từ source đã review; kiểm tra cả bốn review patches hoặc staged diff tương đương. Giữ registry v7/v8/v9 và lịch sử. Không `git add .` để vô tình đưa private mappings/artifacts vào commit.
2. Chốt maintenance/cutover có khả năng ngăn **mọi old financial writer**, bao gồm cached clients, deployment URL cũ và routing/affinity cũ. Nếu chưa chứng minh được, giữ NO-GO. Chờ invocations cũ/drain với hard limit60 đã xác minh và margin vận hành; không dùng một sleep cố định thay kiểm tra traffic.
3. Sau phê duyệt DB, áp additive migration `20261123000000_add_unlock_operations` theo migration deploy của repo. Nullable ledger key giữ NULL ở dữ liệu cũ, không tạo receipts/operations suy đoán. Không chạy reset, db push hoặc down migration phá evidence.
4. Deploy candidate khi đã được yêu cầu riêng; trước mở traffic, xác nhận artifact `/` và `/history` maxDuration ít nhất60 với soft action55 và recovery route maxDuration60/budget45. Kiểm tra thực tế lại, không dùng metadata deployment cũ thay artifact mới.
5. Xác nhận bí mật/authorization recovery, bật schedule riêng đã được duyệt cho `/api/cron/recover-unlocks`, không ghép vào PayOS reconcile-orders. Mỗi batch25 có fairness rotation; failed/deferred trả503 dù một số row có thể đã settle. Không replay SQL increment để bù một request timeout.
6. Smoke/canary theo tài khoản, DB và ngân sách được duyệt. Bất kỳ model call trả phí nào cần authorization/budget riêng; task8 không tự gọi. Quan sát trước tăng traffic.

## Recovery và ngưỡng dừng

Recovery chỉ lấy REFUND_PENDING hoặc PROCESSING hết hạn; guarded refund xác minh token/status/receipt/result/ownership dưới lock. Batch chọn theo updatedAt/expiresAt/id; candidate hoàn thất bại được đưa ra sau bằng update metadata có điều kiện và timeout ngắn, không đổi expiry/status/credits/ledger. Test26charges chứng minh 25 faults không chặn healthy charge của batch sau. `updatedAt` không còn là tuổi debit; dùng expiresAt.

Metadata rotation cũng có thể lỗi khi DB/lock không hoạt động. Stage rotation_failed là escalation, không hứa eventual recovery khi DB không ghi được. Bất kỳ rotation_failed hoặc invariant mismatch: giữ rollout, xác minh DB/backlog và giao operator; pending quá hạn5phút hoặc hai batch lỗi liên tiếp cũng cần xử lý. Quarantine cần người có quyền rà, không tự reset status hoặc hoàn theo heuristic.

Read-only audit CLI hiện chỉ được phép trên local test DB, không mở production target trong task này. Khi cần đọc production để điều tra, dùng quy trình/credential SELECT riêng được duyệt. Không gọi `getUnlockStatusAction` như một audit read-only vì nó có thể thực hiện refund. Không suy user balance từ riêng unlock ledger.

## Rollback

- Ưu tiên phiên bản rollback còn hiểu durable protocol và giữ recovery. Dừng nhận unlock mới trước đổi writer.
- Đợi workers hiện tại hết lease, settle/drain hoặc quarantine pending, xác nhận receipts/result bằng bằng chứng được phép. Không coi HTTP503 hoặc mất response là mọi transaction đã rollback.
- Không drop UnlockOperation/enum/idempotencyKey/index hoặc xóa ledger/pending. Schema additive có thể giữ lại khi rollback code.
- Không đưa writer legacy không có fencing hoạt động cùng writer mới. Nếu buộc rollback về legacy, cần quyết định rủi ro riêng sau chặn/drain, vì các lỗi credit cũ sẽ mở lại; không gọi đây là rollback an toàn mặc định.
- Nếu DB chưa thể settle, giữ phiên bản có recovery và traffic hạn chế/maintenance theo quyết định được duyệt; không bỏ debit tồn đọng để đổi code cho nhanh.

## Giới hạn của proof

Synthetic provider timeout là lỗi TimeoutError từ fake global fetch, không phải thử45giây thật hoặc kill process Vercel. Unit fake timers và real-DB crash/expiry/acknowledgement cases bổ sung phần deadline/crash. E2E insufficient case kiểm tra CTA gating; server-side no-spend/no-provider được chứng minh bởi action/DB suites riêng. E2E unauthorized được thử với expired candidate có spend thật trên DB test và không đổi trạng thái/tiền.

Runtime fake preload bảo vệ global fetch và browser route interception; không phải OS firewall hay network namespace. Build không dùng preload và có thể fetch public fonts, nhưng đã blank project credentials, provider keys là synthetic, Sentry upload/telemetry tắt. Không kiểm thử PayOS/email/OAuth bên ngoài hoặc model thật, không audit/sửa tiền production, không đưa research renderers vào app.
