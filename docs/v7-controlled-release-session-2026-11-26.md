# T10 — phiên release có kiểm soát, 26/11/2026

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

## Kết quả T10

Đã ghép source/bundle integrity, target identity, thứ tự15 bước, metadata receipts và alias guard vào công cụ local `ops/v7-cutover/release-session.mjs`. Không có --apply/--execute; công cụ không chạy API production, SQL, Keychain, migration, deployment hoặc promotion. Đây là local preflight và runbook cho operator, không phải executor tự động.

Lệnh mặc định: `node ops/v7-cutover/release-session.mjs`. Nó kiểm tra Git HEAD đúng immutable candidate,540 tracked files đúng committed Git blobs (chặn dirty bytes/path traversal/symlink), bundle SHA256 đúng bản đã review; in thứ tự release. Chỉ export/upload tracked candidate từ commit đã pin, không deploy working tree chứa untracked files/secrets hoặc bản root đang sửa ops tools.

Dry-run thật đã đạt toàn bộ artifact checks: candidate1b33a0ac864ba383ef87dc97b5924369dd2a6b87,540 files, bundle624156068e7393aab15a2d26341d0868e1e414e86158093e28a6985a28e0867e. Exit1 vì EXECUTION_PACKET_MISSING là kết quả đúng, không phải một lỗi cần tạo receipt giả để làm xanh.

## Người trực, tài khoản và thời gian

Người dùng trực/quyết định dừng. Giữ mốc01/12/2026 lúc21:00 Asia/Ho_Chi_Minh; người dùng yêu cầu nhanh nhất có thể, nên mở lại ngay khi đủ checks, không chờ đủ60phút. Chưa chốt giờ kết thúc cứng hoặc tự động hóa lịch; không coi yêu cầu nhanh là bỏ proof.

Tài khoản canary được người dùng chọn đã được kiểm tra READ ONLY: tồn tại, email verified, hiện đủ10credit. Chỉ lấy id/credit/status của đúng tài khoản, không password/hash hay rows người khác. Email/ID và snapshot balance giữ trong private canary-plan/canary-account files, không đưa values vào repo. Tài khoản cần được operator đăng nhập và kiểm tra lại tại cửa sổ; không gửi mật khẩu qua chat. Dự kiến tối đa1 unlock10credit sau GO cho bước canary, không top-up/admin grant tự động và chưa thực hiện debit. Chặn lượt thứ hai nếu lượt đầu timeout/settlement chưa rõ; đối chiếu durable evidence trước.

## Thứ tự trong một phiên

| Bước | Gate / hành động | Khi không đạt |
| --- | --- | --- |
| authorize | Xác nhận cửa sổ đang mở, operator, account/budget và fallback | Không bắt đầu writes |
| refresh | Source/hash + target/roles/aliases/cron/builds mới, full pagination | STOP; không dùng metadata cũ thay live |
| freeze | Freeze push/merge/deploy của operator, build gate, drain builds đã xếp hàng | Không giao secrets |
| pause | Pause PayOS cron và bật maintenance ingress đã duyệt; kiểm tra data plane | Giữ NO_GO |
| drain | Chờ/kiểm tra legacy invocations, giữ evidence debit chưa rõ | Không hard-fence giữa settlement đang chạy |
| fence | Provider rotation → owner credential mới → old PIDs terminated, old direct/pooler bị từ chối | Giữ maintenance, không migration |
| t0 | Backup quiescent mới, mã hóa/checksum/restore/đối chiếu, giữ khóa/off-device riêng | Không dùng backup preflight24/11 làm T0 |
| migration | Chỉ additive unlock migration + final56 grants, negative privileges | Giữ maintenance; không down/drop evidence |
| activate | Gán secret an toàn, LOGIN role thường, chỉ delivery exact deployment | Không sửa shared env hoặc cấp lại key cho legacy |
| stage | Exact candidate production + CLI skip-domain, chưa mở traffic | Không promote preview/mock; giữ snapshot alias |
| routing | Alias guard + release DB/runtime/timeout identity, complete snapshots | STOP và owner xử lý đúng owned side effect |
| recovery | Dedicated auth, guarded settlement/receipts, incident fallback đã duyệt | Không mở lại unlock |
| canary | Operator-only new-release canary,1 lượt10credit tối đa, kiểm tra ledger/result | Không retry spend khi chưa rõ outcome |
| promote | Duyệt bằng chứng và promote đúng staged production artifact, xác minh aliases theo kế hoạch | Giữ maintenance, không tự fallback legacy |
| resume | Theo dõi và mở traffic, resume đúng scheduler/build settings sau quyết định operator | Không tự resume vì hết giờ |

T0 tool phải ghi rõ phase quiescent cutover và thời điểm sau fence; tool backup online preflight cũ không tự trở thành tool T0 chỉ vì chạy lại. Bản restore/quarantine chứa dữ liệu thật không dùng làm target app/canary. Muốn smoke/canary trước promote khi catch-all WAF đang bật cần control operator-only trên đúng new-release hostname đã duyệt; không blanket allow recovery/Server Actions trên legacy host hoặc gỡ maintenance chung để thử. Chưa triển khai exception đó trong T10.

## Metadata packet và giới hạn

`node ops/v7-cutover/release-session.mjs --pre-promotion packet.json` vẫn kiểm tra source/bundle, target cố định, cửa sổ authorized đang có hiệu lực và receipt metadata cho authorization/freeze/cronPaused/maintenance/drain/fence/t0/migration/runtimeGrants/scopedSecrets/runtimeIdentity/recovery/fallback/canary. Mỗi receipt cần passed:true, observedAt trong cửa sổ không ở tương lai và evidenceRef tương đối an toàn. Rehearsal logs ngày25 không được tự gắn observedAt mới để giả thành proof thực thi.

Packet gồm target đúng các fields exported releaseTarget; window(start/end/authorized); receipts keyed by requiredReceipts; before/after snapshots và release metadata theo alias guard. Snapshots alias phải đủ trang và còn mới5phút. Dùng file metadata riêng trong session folder0700, file0600; không env values/password/URI/provider output raw. Operator phải mở/đối chiếu evidenceRef gốc, timestamps/identity/hash, xác thực provider và quyết định GO riêng.

Quan trọng: receipt validator chỉ kiểm tra cấu trúc/identity/time của **operator assertions**, chưa đọc/xác thực nội dung referenced evidence hoặc truy vấn live provider. Một packet synthetic pass test không có nghĩa production đạt. Exit0 chỉ là local review pass, không được nối tự động sang promote/SQL; output automaticExecutionSupported=false. Alias guard cũng chỉ chứng minh routing snapshot, không thay financial ledger audit. Không có packet production hiện tại nên tool dừng đúng.

## Kiểm thử và thay đổi phiên này

21/21 tests gồm10 routing/CLI tests và11 session/source tests; ESLint đạt. Cases gồm altered bytes, traversal/symlink, step order, missing/failed/stale-window receipts, identity mismatch, preview/mock promotion và default alias incident. Chạy thật local dry-run, không mutation provider/DB/role/credential. Query canary READ ONLY được user yêu cầu; không trừ/grant credit. Secrets vẫn chỉ Keychain, role vẫn chưa được activate trong phiên này.

Evidence private: .model-compare/v7-release-session-20261126/dry-run.json, canary-account-private.json, canary-plan-private.json và validation.json. Công cụ ops nằm ngoài immutable app candidate; không rebuild app chỉ vì sửa runbook/guard.

## Task kế tiếp

T10 complete cho phạm vi local preflight/runbook; **không** có automatic production executor. Tiếp theo chuẩn bị T11 thành packet thao tác maintenance/freeze/cron/WAF/operator-only access/drain có rollback setting rõ ràng, rồi thực thi đúng cửa sổ và quyền đã duyệt. Chưa làm migration hoặc activate runtime chỉ để giảm số gate đang mở.
