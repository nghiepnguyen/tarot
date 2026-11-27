# Pipeline và secret delivery v7 — 26/11/2026

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

## Đã thực hiện

- Vercel CLI đã refresh phiên đăng nhập thành công sau GET đầu403; không cần người dùng gửi token hoặc đăng nhập lại.
- Project tarot còn liên kết GitHub nghiepnguyen/tarot, production branch main. Có6 deployments trong inventory phân trang hoàn chỉnh, không build queued/initializing/building;0 deploy hooks (field được provider trả về); ignored build command hiện null. Production ID vẫn dpl_BwWTyYxFfcAMywEn4idcKLk84pKb.
- Workflow CI local và bản tại commit production8199870 chỉ lint/unit/E2E, dùng PostgreSQL16 local trong runner; không có lệnh deploy. Đây không phải xác nhận mọi GitHub setting/credential ngoài workflow, nhưng người dùng đã xác nhận không có writer/job ngoài app và cron đã kiểm kê.
- Stage2 secrets độc lập32randombytes trong macOS Keychain: runtime password và unlock recovery. Readback/format/khác nhau đều đạt; raw values không ghi file/chat/argv. Locator private0600 chỉ chứa service/account metadata. Không gán DB password, không LOGIN, không giao Vercel hoặc Cloudflare. Backup USB key không được dùng lại.
- GET sau stage xác nhận shared env metadata và production deployment không đổi.

## Cách delivery đã chọn

Dùng per-deployment --env KEY / --build-env KEY, giá trị qua process environment của child, không KEY=value trong argv. Cơ chế này đã dùng trong preview PG18 trước, không sửa shared project env. Không cần tạo thêm deployment để chứng minh lại cùng cơ chế trước khi các gate cutover đạt.

Runtime URI chỉ role thường của target đúng. Owner URI không đưa vào app hoặc Worker. Recovery key riêng cho app/Cloudflare; không đổi PayOS CRON_SECRET. Không đọc sensitive project env value hoặc env pull để sao chép secret. Các production env hiện có được nền tảng áp đúng target, không copy key từ preview/test overlay.

Production build phải exact candidate1b33a0a và bundle hash đã pin, target production + --skip-domain để tránh auto alias. Skip-domain không phải writer fence: URL deployment vẫn có thể được gọi, cron còn cần pause riêng. Không build/deploy candidate với runtime mới trước fence/T0/migration/grants và activation gate.

## Freeze plan cụ thể, chưa áp

ops/v7-cutover/deploy-channel-manifest.json chứa request project ignored-build gate và restore giá trị null ban đầu. Gate cho build đi tiếp khi build env TAROT_RELEASE_CANDIDATE đúng immutable SHA; thiếu/sai marker thì exit0 để skip.3 shell cases đã chạy đạt. Platform behavior của gate chưa live-test; không claim pipeline đã freeze.

Không sửa gitProviderOptions.createDeployments để giả định đó là nút khóa Vercel builds: semantics chưa được xác minh đủ từ primary source, và nó có thể liên quan GitHub deployment/status objects. Không đổi source vercel.json của immutable candidate để thêm git.deploymentEnabled.

Tại cửa sổ: freeze pushes/merges/manual deploy của operator, refresh inventory; apply/re-read ignored-build setting nếu dùng gate, kiểm tra không build đang chạy và không config override. Candidate CLI có marker build env. Gate là bảo vệ vận hành, không security boundary chống người có quyền sửa config. Nếu không chứng minh gate ảnh hưởng đúng trigger thì giữ maintenance và không activate/deliver secret; không suy chỉ PATCH/readback thành proof mọi build bị chặn.

Restore chỉ khi setting hiện tại còn đúng gate do phiên này đặt và production verification đạt; không ghi đè thay đổi người khác hoặc tự resume theo giờ. Có manifest nhưng chưa PATCH setting trong phiên này.

## Trạng thái

Runtime production đã bootstrap NOLOGIN ngày25/11. Ngày26/11 chỉ stage secrets vào Keychain, không gán password hoặc activation, không mutation DB/pipeline/env/deployment/cron. Chưa cập nhật shared DATABASE_URL production nên build tự động hiện tại không thể lấy credential mới từ shared env.

Gate còn lại: thực thi/kiểm chứng freeze tại maintenance, secret assignment/delivery đúng stage, drain/fence, T0/migration, rollback/forward recovery và canary. Không tự cutover theo lịch01/12 lúc21:00 Việt Nam.

Proof private: .model-compare/v7-deploy-channel-20261126/{pipeline-inventory,post-stage-pipeline-check,proof,secret-locator-private}.json. Secrets chỉ ở Keychain; locator không phải bản sao password. Giữ để phiên cutover dùng, không tự rotate/generate thêm nếu locator đã có.

Nguồn: https://vercel.com/docs/cli/deploy ; https://vercel.com/docs/project-configuration/git-configuration ; https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel .
