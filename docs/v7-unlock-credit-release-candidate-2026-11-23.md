# Release candidate v7 credit — 23/11/2026

Đã chuẩn bị candidate bất biến và kiểm chứng trên Node24. Chưa push, tạo preview, deploy/migrate production hoặc kích hoạt scheduler.

## Candidate

- Commit cuối: `a6f8e72a66ed7940cc678e0f7727fd6e2eddb9d5`; tree `0e8395a81da6e4d5aa76d9b9f2d96b281e92ab9e`.
- Branch trong repository artifact riêng: `codex/v7-unlock-credit-rc-20261123`.
- Repository: `.model-compare/v7-release-candidate-20261123/source`. Working tree sạch, không cấu hình remote.
- Base: `81998706a409e2c1278217b8c87c552eef8bb622`; bốn commits áp theo đúng A/B/C/task8-fix.
- 141 files khớp từng byte với workspace đã qua task8. Source/prompt v7, registry, schema, pricing, dữ liệu chấm v9.x không đổi.

| Commit | Nội dung |
| --- | --- |
| `35ebae53c414` | chore(ai): retain provider usage metadata |
| `0df9fe5d6358` | fix(ai): make v7 unlock settlement recoverable |
| `bcc3a6f1fff6` | chore(ai): preserve frozen experiments and review evidence |
| `a6f8e72a66ed` | fix(ai): prevent failed refunds from starving recovery backlog |

Bundle tự chứa lịch sử/source: `.model-compare/v7-release-candidate-20261123/v7-credit-rc.bundle`; SHA-256 `b13d4808e7438c8e9bb9f30263d3df829d60b0416d29f5862a8fb6fd0c5a8fd1`. Đã `git bundle verify`. Bundle/repository nằm cục bộ, không phải backup ngoài máy; raw artifacts Git-ignore vẫn được giữ tại chỗ và không đưa thêm vào bundle.

Checkout gốc vẫn trên `codex/v7-unlock-credit-reliability`, HEAD `81998706a409e2c1278217b8c87c552eef8bb622`, index không đổi, toàn bộ 141 files trước bước này giữ nguyên. Chỉ thêm tài liệu này ở docs; không biến lịch sử Git của repository gốc thành các commit RC. Muốn tích hợp/push phải chọn hành động riêng sau khi review candidate.

## Proof Node24

Runtime `node-v24.22.3-darwin-arm64` được tải vào thư mục test, không cài toàn hệ thống. SHA-256 archive `ff6e17d4874b76d272212b908cc020d6e815fba5a6c7eaaa06add725840307fd` khớp SHASUMS256 chính thức tại `https://nodejs.org/dist/latest-v24.x/`.

- **818/818 tests**, 66 files, chạy trực tiếp từ repository RC trên Node24, gồm33 credit PostgreSQL cases và4 rate-limit cases; không skip. Checkout mới vẫn chạy đủ tests, không cần raw research artifacts Git-ignore.
- **9/9 authenticated E2E**: production Next/auth/DB thật +fake HTTP provider; PATH test trỏ Node24 và server wrapper dùng process.execPath. Không gọi model trả phí.
- Default Turbopack production build, lint và typecheck trên Node24 đạt. Build/typecheck chạy trên workspace có141files cùng bytes với RC; unit tests/lint chạy từ RC. Môi trường build/server đã loại credentials production như task8.
- 18 migrations lên PostgreSQL test mới đạt; fixtures user/reading/operation/ledger/interpretation đều0 trước xóa container. Server test dừng và container đã xóa. Runtime/schema/adapters không đổi trong bước này.

Logs/status JSON ở `.model-compare/v7-release-candidate-20261123/`. Node24 proof đóng phần chênh runtime Node23 vsNode24 được ghi tại task8; không thay thế preview Vercel thực tế, backup/migration approval, old-writer fence/drain hay production canary.

## Điều kiện scheduler đã kiểm tra

Vercel team API read-only trả plan **Hobby**, không thay billing. Lịch `crons` kiểu hiện tại trên Hobby chỉ chạy mỗi ngày; không đáp ứng mục tiêu xử lý pending trong vài phút. [Vercel Cron Jobs usage](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).

Schedules mới là beta và trên Hobby có minimum15phút/jitter15phút, cũng không được ngầm coi là đủ cho ngưỡng pending5phút. [Schedules limits](https://vercel.com/docs/schedules/limits). Không âm thầm đổi SLO hoặc thêm một cron mỗi phút sẽ không được gói hiện tại chấp nhận.

Cần người dùng chọn một trong các hướng trước production: giữ Hobby và dùng scheduler riêng được duyệt; hoặc chuyển gói hỗ trợ lịch phù hợp. Chưa tự chọn vendor, thêm secret, nâng gói hoặc tạo lịch. Đồng thời vẫn cần người trực recovery/quarantine, chặn/drain writer cũ, preview/DB test riêng và phê duyệt migration/cutover theo `docs/v7-unlock-credit-release-handoff-2026-11-23.md`.

Đã kiểm tra chỉ metadata local connection: hiện tìm thấy DB localhost, chưa xác nhận cloud preview DB hoặc quyền tạo branch; không kết nối DB production hoặc xuất credentials. Đây là thông tin chuẩn bị, không phải kết luận rằng tài khoản không thể tạo DB cloud qua một kết nối khác.

## Kết luận

RC và target-Node proof sẵn sàng review. **Production vẫn NO-GO** trước lựa chọn scheduler, owner và kế hoạch hạ tầng/cutover được duyệt. Không có code mới cần mở lại nghiên cứu v9.x, không tự coi câu “làm tiếp” là cho phép đổi billing hoặc sửa dữ liệu người dùng production.
