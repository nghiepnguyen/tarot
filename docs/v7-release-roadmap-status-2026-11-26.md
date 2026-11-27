# Roadmap và task status v7 — 26/11/2026

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

> **Đổi ưu tiên27/11: beta vẫn bán credit, rút gọn vận hành để tìm user sớm.** Roadmap hiện hành: [Beta launch checklist](v7-beta-launch-checklist-2026-11-27.md). Các task vận hành dưới đây là lịch sử/tham khảo; dùng5 bước trong checklist hiện hành. Không tự thực thi cutover ngày01/12 theo bảng cũ.

**Giữ v7, Vercel Hobby, Neon Free. Chưa GO live.** Người dùng trực/quyết định dừng; xác nhận chỉ app và cron hiện tại dùng DB. Khung bảo trì21:00 ngày1 hằng tháng, giờ Việt Nam; lần tới01/12/2026. Chưa có tác vụ tự động cutover; kết thúc khi các gate đạt, theo yêu cầu bảo trì nhanh nhất có thể.

## Roadmap

| Bước | Status | Đã có | Phần còn lại |
| --- | --- | --- | --- |
| 1. Restore backup thật | XONG | Quarantine;23 bảng/344 dòng/97 logical objects khớp | Backup T0 sau này vẫn phải kiểm chứng riêng |
| 2. Backup ngoài máy/khóa riêng | XONG cho preflight | Drive roundtrip hash; khóa USB độc lập đã thử và eject | Áp quy trình tương đương cho T0 |
| 3. Rollback/incident fallback | CHƯA ĐÓNG | Baseline immutable và durable recovery đã test | Chưa có rollback production deployment độc lập; giữ maintenance/forward recovery khi release đầu lỗi, không về legacy |
| 4. Chuẩn bị maintenance/fence | PHẦN LỚN ĐÃ CHUẨN BỊ |90 grant tests; operator/payment drills; WAF10 hosts+previewPOST; cron pause requests; role NOLOGIN; Keychain secrets; build gate pilot; routing guard | Release runner phải dùng routing guard; thực thi freeze/pause/maintenance/drain/credential fence tại cửa sổ;2 alias chưa chứng minh WAF |
| 5. T0 backup và migration | CHƯA THỰC THI | Tools/SQL additive đã test | Sau fence yên ghi: backup T0, verify/restore, migrate và grant UnlockOperation |
| 6. Release và recovery | CHƯA THỰC THI | RC1b33a0a, Node24/timeout60 test; Cloudflare config tắt | Runtime activation/delivery, stage đúng production, verify aliases/DB/recovery, fallback, duyệt cron |
| 7. Canary và mở traffic | CHƯA THỰC THI | Owner và stop criteria | Chốt tài khoản/budget canary, ledger/pending checks, quan sát rồi mở dần |

## Task list chi tiết

| ID | Task | Status / evidence |
| --- | --- | --- |
| T01 | Restore/compare production preflight | DONE — v7-production-restore-drill-2026-11-24.md |
| T02 | Encrypted off-device backup và USB key | DONE — v7-offdevice-backup-2026-11-25.md |
| T03 | Runtime grant set trên Neon18 | DONE —90/90 tests, v7-runtime-grants-validation-2026-11-25.md |
| T04 | Bootstrap runtime production | DONE INACTIVE — tarot_runtime_v7_20261201 NOLOGIN, chưa password;52 DML checks và isolation đạt |
| T05 | Stage secrets và delivery scope | STAGED —2 secrets Keychain; chưa DB assignment/Vercel/Cloudflare; per-deployment overrides |
| T06 | WAF ingress pilot | DONE WITH LIMITS —10 authenticated GET hosts+1 preview POST; rule/key đã thu hồi;1 host410,2 alias unverified |
| T07 | Operator path và payment outage | DONE ON TEST — rotation/reacquire/terminate; payment missed/race/replay/mismatch; no real provider calls |
| T08 | Git build gate pilot | DONE/RESTORED — unmarked CANCELED, marked static READY;1 alias side effect đã restore, probes đã xóa |
| T09 | Release alias guard | DONE LOCAL —10/10 tests và ESLint; replay incident thật bị chặn; CLI exit0/1/2; chưa có live release để gate |
| T10 | Ghép các gate vào phiên release có kiểm soát | DONE LOCAL — source540/bundle verified;21 tests+ESLint;15-step operator runbook; không có automatic executor |
| T11 | Freeze builds, pause cron, maintenance/fence/drain | PACKET READY LOCAL —31 tests + ESLint; execution WAIT WINDOW; chưa tắt cron hoặc fence credential |
| T12 | T0 backup, migration và final grants | PREPARING / WAIT T11 — checklist và RC hashes xác minh;9 crypto/parser tests đạt; đã có entry point backup T0 có gate; còn worker synthetic smoke và execution |
| T13 | Exact production deployment, recovery và fallback | WAIT T12 — không promote preview/test overlay |
| T14 | Canary/ledger verification và traffic | WAIT T13 — chỉ mở sau gate và người trực xác nhận |

## Việc vừa làm trong lượt này

T09 đã hoàn tất: `ops/v7-cutover/release-alias-guard.mjs` cùng test. CLI chỉ đọc JSON metadata và trả kết quả, không network/promotion/revert. Chặn mọi alias thay đổi/thêm/xóa, live target thay đổi, sai account/project, incomplete pagination, snapshot cũ/future, preview/mock/wrong-candidate. Có test tái hiện default alias bị đổi dù custom domain và production ID giữ nguyên. Replay thêm metadata incident thật xác nhận ALIAS_CHANGED, ALIAS_ADDED và non-release artifact bị chặn.

Chưa tích hợp vào runner tạo release tự động vì chưa có production release executor đã duyệt để gọi; README đã quy định bắt buộc chạy và dừng nếu nonzero trước promote. Đây là guard riêng cho routing, không tự chứng minh DB/secret/source hoặc an toàn tài chính.

Không thêm deployment thử hoặc thay đổi provider/DB/role/Keychain trong lượt T09. Candidate gốc giữ nguyên; code guard là công cụ ops ngoài artifact app.

## Bước kế tiếp

T11: chuẩn bị packet maintenance/freeze/cron/WAF/operator-only access/drain và rollback setting; không diễn tập lại những phép thử đã đạt trên project live. Trước cửa sổ cần chốt canary account/budget, thời lượng và fallback; trong cửa sổ phải refresh target/roles/aliases/builds/cron và chứng minh drain, không dùng snapshot ngày25 thay trạng thái live.

Các gate bắt buộc chưa chạy là execution thật, không phải lỗi kiểm thử cần thêm nhiều pilot: legacy writer fence, T0, migration, secret assignment/activation/delivery, exact production release, recovery scheduler và canary. Không tạo GO dựa riêng vào số test xanh.

## Nguồn kết quả

Report lịch sử25/11: v7-release-roadmap-status-2026-11-25.md. Các report chi tiết liên quan: v7-production-runtime-bootstrap-2026-11-25.md, v7-deployment-secret-channel-2026-11-26.md, v7-build-gate-proof-2026-11-26.md và v7-waf-authenticated-proof-2026-11-25.md. Report lịch sử giữ bằng chứng/lỗi từng lượt, roadmap này là tổng hợp hiện hành.

## Cập nhật T10 và canary26/11

T10 local preflight/runbook hoàn tất; dry-run dừng vì chưa có execution packet, không giả GO bằng rehearsal cũ. User chọn canary account, READ ONLY kiểm tra đủ điều kiện; dự kiến tối đa1 unlock10credit sau gate, chưa debit. User muốn bảo trì nhanh nhất có thể, không chờ đủ60phút; giữ mốc01/12 lúc21:00. Xem `v7-controlled-release-session-2026-11-26.md`.

## Cập nhật 27/11 — T11

Đã chuẩn bị helper local tạo packet freeze/cron/maintenance, ngoại lệ operator chỉ cho host production mới + IP xác minh, và đề xuất khôi phục có điều kiện trước fence. 31/31 tests và ESLint đạt. Xem `v7-maintenance-packet-2026-11-27.md`. Snapshot live phải refresh trong cửa sổ; chưa có bằng chứng drain/fence thực tế. Bước tiếp theo là thực thi T11 tại 01/12 lúc21:00 rồi mới T12; không chạy maintenance hoặc migration sớm.

## Chuẩn bị T12 — 27/11

Đã đối chiếu migration/schema với RC, chạy lại9 tests crypto/parser và kiểm tra image PG18 local. Checklist tại `v7-t0-migration-preparation-2026-11-27.md`. Runner backup cũ chỉ dành cho preflight; entry point T0 có gate đã bổ sung; còn kiểm chứng worker happy path trên synthetic DB. Chưa backup T0/migration/restore mới hoặc kết nối production trong lượt chuẩn bị này.

## T12 entry point — cập nhật tiếp 27/11

Có `t0-backup.mjs`, gate cùng worker tái sử dụng crypto/Keychain toolchain private.45 tests tổng hợp và ESLint đạt; CLI từ chối chạy ngoài cửa sổ. Worker chưa được chạy happy path trên synthetic DB; chưa tạo T0 thật. Việc tiếp theo trước cửa sổ: kiểm chứng worker với dữ liệu giả, gồm lỗi dump/cleanup, rồi giữ T12 WAIT T11. Trong cửa sổ phải lấy receipts thật, backup/restore/compare T0, copy off-device, migrate và kiểm tra final grants.
