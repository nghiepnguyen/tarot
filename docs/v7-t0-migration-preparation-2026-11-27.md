# T12 — Chuẩn bị backup T0 và migration, 27/11/2026

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

**PREPARATION ONLY. T12 chưa thực thi và đang chờ T11.** Mốc release 01/12/2026 lúc21:00 giờ Việt Nam. Không dùng backup preflight ngày24 làm T0.

## Kiểm chứng local đã thực hiện

- Migration `20261123000000_add_unlock_operations` khớp byte với RC1b33a0ac864ba383ef87dc97b5924369dd2a6b87; SHA256 `da5b66ccdecb2a5c59e1c7d478c4b60e3c16b3cf34756d87b7f83de0583f8ab6`.
- `prisma/schema.prisma` khớp RC; SHA256 `d00dff3943eea434098c42a5a6187731da9959d70a953b401324525568715581`.
- 9/9 tests mã hóa và parser đối chiếu đạt: roundtrip, sai khóa, sửa/cắt ciphertext, input gián đoạn, không ghi đè backup, COPY/schema comparison.
- Image local `postgres:18-alpine` có sẵn, ID `sha256:0115267ab5a509022df9319c77be365cef335adb71556c75f60f5360ee247e71`. Đây là metadata image, không phải kiểm tra kết nối production.

## Trình tự và bằng chứng phải giữ

| Gate | Điều kiện qua | Nếu lỗi |
| --- | --- | --- |
| T11 | Freeze/pause/maintenance/drain/fence có bằng chứng trong cùng phiên; người trực xác nhận | Giữ maintenance, không backup mang nhãn T0 hoặc migrate |
| Target | Xác minh lại Neon project flat-thunder-97874961, branch br-shy-rice-azz1mucb, endpoint ep-lingering-bread-azbkzj1u, DB neondb, PG18 và TLS verify-full; runtime chưa có writer | Dừng khi sai target hoặc có writer ngoài kiểm soát |
| Migration trước | Refresh lịch sử/checksum, không có migration thất bại/chạy dở; chỉ migration dự kiến còn pending | Điều tra trạng thái, không dùng resolve applied để ép qua |
| Backup T0 | Dump mới sau fence, direct connection read-only, pg_dump18 custom no-owner/no-acl, Docker logging none, plaintext chỉ RAM/pipe | Dừng trước migration; bảo toàn backup cũ, không ghi đè |
| Crypto | Khóa mới Keychain đọc lại độc lập; authenticate GCM và hash trước khi dùng archive; lưu manifest phase/session/timestamp/fence evidence | Không dùng archive chưa xác thực |
| Restore T0 | Restore archive mới vào target cách ly được xác minh riêng; không app/Auth/Data API; đối chiếu đầy đủ tables/rows/logical schema với chính archive | Giữ maintenance; không suy PASS từ restore snapshot cũ |
| Off-device | Copy ciphertext lên Drive, tải lại so hash; khóa riêng USB theo quy trình đã duyệt | Không đánh dấu backup recovery hoàn tất nếu thiếu khóa ngoài máy |
| Migration | Chạy đúng Prisma migration từ checkout RC bằng operator connection; giữ kết quả đã lọc secrets | Nếu timeout/partial: kiểm tra catalog và migration ledger trước retry |
| Final grants | Chạy 02-runtime-after-migration.sql sau xác minh migration; kiểm tra đầy đủ DML và các quyền phải bị từ chối | Không kích hoạt writer khi schema/grant lệch |
| Handoff T13 | Migration/checksum/catalog đúng; dữ liệu legacy giữ nguyên; UnlockOperation mới rỗng trước writer; idempotencyKey legacy NULL; runtime identity/grants đạt | Không stage writer hoặc mở traffic |

Số bảng/dòng T0 lấy từ archive mới, không ép bằng con số23 bảng/344 dòng của preflight. Phép so phải bao gồm neon_auth và dữ liệu tài chính; chỉ ghi hash/count/metadata vào artifact private, không xuất hàng khách hàng.

## Phần công cụ còn thiếu trước execution

Backup runner private cũ `.model-compare/v7-production-backup-20261124/backup.mjs` ghi cứng phase `preflight-online-not-cutover-T0`, app name và metadata project ngày24. Không chạy nguyên bản rồi sửa nhãn manifest sau đó. Đã bổ sung entry point `ops/v7-cutover/t0-backup.mjs`, gate và worker riêng. Gate yêu cầu người trực duyệt trong cửa sổ, đúng target/session và đủ receipts target/freeze/cronPaused/maintenance/drain/fence trong5 phút. Worker kiểm tra lại gate trước credential và trước dump, kiểm tra DB/role/PG18/read-only và không có client session khác trước dump; metadata mã hóa ghi phase T0 và session ngay từ đầu. Receipt chỉ là assertion của operator: phải kiểm tra bằng chứng provider/DB được tham chiếu; một lần không thấy session không thay thế drain/fence. Chưa chạy happy path worker trên DB hoặc Keychain mới trong lượt này.

Quarantine cũ đã đổi credential và suspend. Không tái sử dụng URI retired hoặc coi suspend là network fence; phải xác minh lại target/credential/isolation và tránh ghi đè dữ liệu restore cũ nếu chưa có quyết định. Không tự tạo thêm project hoặc bản sao khách hàng trong bước chuẩn bị này.

Migration có DDL không idempotent (CREATE TYPE/TABLE, ADD COLUMN): không tự retry mù. Giữ maintenance khi thất bại sau fence; không down migration, không restore đè production hoặc mở writer legacy. Global roles/password/ACL và dịch vụ Neon Auth không thuộc archive no-owner/no-acl, cần recovery riêng.

## Trạng thái

Không kết nối DB production, tạo backup mới, restore dữ liệu khách hàng, migrate, cấp quyền hoặc thay đổi traffic trong lượt này. Entry point backup T0 đã có và kiểm tra local đạt; execution vẫn chờ T11 và cửa sổ đã chốt. Restore/compare T0 mới, off-device copy/key escrow, migration và final grants còn chưa thực thi.

## Cách dùng và giới hạn entry point

`node ops/v7-cutover/t0-backup.mjs --execute operator-packet.json` chỉ dùng khi đã review receipts thật. Thiếu/sai packet trả nonzero; chạy ngoài cửa sổ bị chặn trước import worker. Không có mode tự fence/migrate/restore/publish. Không chain exit0 vào migration: vẫn phải xác thực archive offline, restore/compare và off-device recovery.

Packet có sessionId dạng `v7-20261201-` +8 ký tự hex, target đúng `releaseTarget`, operatorApproved:true, window.start/end ISO và receipts cho6 gate nêu trên. Mỗi receipt có passed:true, sessionId trùng, observedAt ISO, evidenceRef tương đối an toàn. Không đưa credential hoặc dữ liệu khách hàng vào packet.

Worker tái sử dụng private toolchain tại `.model-compare/v7-production-backup-20261124/` (crypto) và `.model-compare/v7-preview-20261124/` (Keychain/NeonCLI). Đây là công cụ cho máy operator hiện tại, chưa phải package portable. Artifact mới ghi trong thư mục backup private hiện có, file0600, khóa Keychain mới; sau kiểm chứng phải đóng package vào `.backups/production/` và áp quy trình Drive/USB. Không đưa toolchain hay backup vào app deployment.

Kiểm tra cuối lượt:45/45 tests (T0 gate/CLI, maintenance, release session, alias guard, crypto, parser) và ESLint các file T0 đạt. CLI đã được chứng minh từ chối cửa sổ tương lai; chưa kiểm chứng happy path worker mới bằng dump DB synthetic. Đây là việc kiểm chứng tiếp theo trước execution thật, không đánh dấu T12 DONE.
