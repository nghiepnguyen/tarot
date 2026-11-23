# Task 7 — Phân loại workspace và đóng nghiên cứu v9.x

Ngày 23/11/2026. Task 7 hoàn tất phạm vi review/packaging trong workspace; không commit/stage/push/deploy, không xóa/di chuyển artifacts hoặc sửa prompt output.

## Inventory và bảo toàn

Đầu task: **133 files**, gồm 20 tracked modified và 113 untracked khi mở rộng từng thư mục bằng git ls-files. Inventory từng file, nhóm, lý do giữ/tách: `docs/v7-unlock-credit-workspace-inventory-2026-11-23.md`; JSON có SHA-256/bytes/tracking/backup status tại `.model-compare/v7-credit-task7/inventory.json`.

| Nhóm ở đầu task | Files | Quyết định |
| --- | ---: | --- |
| Sửa sản phẩm/runtime/tests | 41 | Giữ với credit reliability |
| Tài liệu credit | 9 | Giữ design, evidence, runbook và release gates |
| Metadata provider chung với credit | 3 | Tách từng hunk thành A và B |
| Hạ tầng benchmark | 4 | Giữ công cụ tái dùng, tách khỏi credit runtime |
| Registry/definition nghiên cứu | 11 | Giữ historical lookup và compatibility v8/v9 |
| Thử nghiệm offline/fixtures | 23 | Đóng băng; không nối renderer vào app |
| Review artifacts | 31 | Giữ nguyên phiếu/locks/results/hashes, không viết lại kết luận |
| Tài liệu nghiên cứu đóng | 11 | Giữ thiết kế/NO-GO và quyết định dừng |

Hai docs task7 mới (inventory và report này) được liệt kê riêng và đưa vào packet B bổ sung; inventory cuối có **135 files**. Artifacts phân tích mới ở `.model-compare/v7-credit-task7/` là local review evidence, không phải code sản phẩm.

Đã hash **486 artifacts cục bộ có sẵn** trong `.model-compare/`, không gồm artifacts task7 mới. Tất cả **427 artifacts** có trong baseline task0 còn nguyên SHA-256. Các source/review/preferences đầu task7 được giữ nguyên; chỉ task list credit được cập nhật trạng thái, ngoài hai docs task7 mới. Dependencies, build cache và .env không nằm trong inventory nội dung.

Nhiều reports/phiếu/source v9.x hiện **untracked**, raw outputs/keys và snapshots `.model-compare` bị Git ignore. HEAD chỉ là baseline của tracked files, không backup các edits hiện tại. Chưa có bằng chứng backup ngoài máy cho các file này; không đề xuất archive/delete hoặc đổi .gitignore để ép thu gom. File key của packet review là dữ liệu mapping chấm mù, vẫn giữ nguyên tại nơi cũ.

## Giữ v7 và lịch sử

`ACTIVE_PROMPT_VERSION = PROMPT_V7` không đổi. `getPromptVersion` vẫn trả v9/v8.1/v8/v7 và các ID cũ trong registry; admin prompt summary giữ cả unknown/unrecorded IDs lấy từ DB, không làm biến mất thống kê khi một ID không có định nghĩa. History dùng adapter hiện có đọc data đã lưu, không chạy lại prompt hoặc validate legacy theo schema mới.

193 focused tests registry/v8/v9/admin/history đạt; bao gồm hashes input v8/v8.1 từ trước extraction, legacy/history mapping và lookup. V7/system/registry pins giữ nguyên. Không sửa source v8/v9/evidence hoặc những kết quả nghiên cứu để phục vụ cleanup.

Quyết định dừng nghiên cứu đã có tại cuối `tasks/tasks-tarot-ai-v9-evidence-grounded.md`: v9/v9.1/v9.2/v9.3 không tiếp tục rollout/holdout/candidate mới nếu không có yêu cầu mới. Checkbox chưa chạy là lịch sử, không được agent tự tiếp tục. Task7 xác nhận lại quyết định này, không rewrite preferences hoặc gọi model.

## Ba packet và thứ tự commit đề xuất

Chỉ tạo patch để review, **không thực hiện commit**. Base HEAD `81998706a409e2c1278217b8c87c552eef8bb622`; branch `codex/v7-unlock-credit-reliability`.

1. **A — `chore(ai): retain provider usage metadata`**. `01-provider-usage.patch`: chỉ gemini.ts, interpretation.ts và gemini.test.ts ở mức hunk totalTokens/toolInputTokens và test không đoán thinking thiếu. Không đổi prompt, model, pricing hoặc timeout. Giá trị thinking thật không bị thay bằng suy đoán production.
2. **B — `fix(ai): make v7 unlock settlement recoverable`**. `02-credit-reliability.patch`: action/helpers, additive schema/migration, deadline/provider cancellation, bounded metrics, recovery endpoint, UI/save/history, read-only audit/observability và tests/docs tasks0–7. Dựa trên A cho ba file dùng chung; không stage nguyên gemini/interpretation/test lẫn hai mục đích. Hunk timeout/GenerationOptions và tests treo thuộc B; hunk metadata thuộc A.
3. **C — `chore(ai): preserve frozen v9 experiments and review evidence`**. `03-frozen-research.patch`: relations extraction/v8 input compatibility, evidence/v9 definition+registry, benchmark/review infrastructure, offline renderers/fixtures, source plans/reports/preferences. Không đổi active prompt. C giữ metadata lịch sử trong final workspace; việc test A+B riêng là để review độc lập, **không phải đề xuất bỏ registry hiện tại khi deploy**.

Patches đặt tại `.model-compare/v7-credit-task7/`. Đã thử apply --check và apply theo thứ tự trên checkout HEAD tạm, kiểm tra từng byte của toàn bộ files tương ứng, kể cả preferences JSON không có newline cuối. C giữ nguyên Markdown hard-break/EOF whitespace có sẵn; không chạy whitespace-fix lên bằng chứng người dùng.

A+B chạy riêng **481 passed/36 skipped** trên checkout tạm, chưa có C/offline candidate code. Các skip là 32 credit PG +4 rate-limit cần opt-in DB. Không dùng kết quả này để thay proof PostgreSQL task6. Test dùng trực tiếp Vitest Node entry vì pnpm bảo vệ node_modules symlink khi thử chạy từ checkout tạm; không cài/xóa dependencies hoặc đổi lockfile.

Khi thực hiện commit sau này: chỉ chọn file/hunk đúng packet, kiểm tra staged diff và registry/prompt pins, chạy checks tương ứng, rồi review. Không commit `.model-compare`/private mapping hàng loạt hoặc dùng `git add .` cho workspace hỗn hợp. Không reset/stash/clean để dựng packet; các patch không thay đổi index/HEAD hiện tại.

## Import graph và build

Static graph từ emitted JavaScript (type imports đã bị xóa) có **42 production roots, 186 reachable source modules**, không ghi nhận dynamic import/require có đối số không phải string literal; scanner bỏ qua literal path không resolve được, nên không dùng riêng kết quả này để khẳng định mọi import đều resolve. Bốn module anchors/controlled/constraint reading và benchmark-v9-cases không reachable từ app/auth/instrumentation roots. Scripts chuẩn bị packets và fixtures offline cũng không được gọi bởi production roots.

`v9.ts -> evidence.ts -> relations.ts` có reachable **định nghĩa** qua registry; `v8.ts -> relations.ts` cũng vậy. Đây là intentional historical/admin definitions, không phải active generation. Unlock chọn duy nhất ACTIVE_PROMPT_VERSION, đang là v7. Không tuyên bố “v9 hoàn toàn không nằm trong bundle”.

Default **Next 16.3.4 Turbopack production build đạt**, gồm TypeScript, tiến độ prerender 32/32 và route recovery; route summary vẫn phân biệt static/dynamic, không phải 32 trang đều static. Build dùng môi trường đã blank toàn bộ project env keys, test AUTH_SECRET và DATABASE_URL localhost không phục vụ DB, provider keys trống, Sentry upload tắt, Next telemetry tắt; không dùng credentials/DB production. Dòng Next ghi `.env.local` chỉ là tên file config được phát hiện, các keys đã được override trước khi build.

Đã quét **279 emitted JS files và 37 NFT traces**: không có markers/paths của offline renderers, benchmark cases, test harness hoặc `.model-compare`; IDs v7/v9 registry metadata hiện diện như dự kiến. Đây là bằng chứng bổ sung cho source graph/active-version tests, không thay E2E hoặc chứng minh mọi nhánh runtime có thể xảy ra.

Artifacts: `import-graph.json`, `build.log`, `build-status.json`, `build-boundaries.json`, `checkout.json`, `before.json`, `verification.json` trong thư mục task7. Không upload artifacts ra ngoài.

## Review cuối

Reviewer độc lập xác nhận coverage/hashes của 135 workspace files, 486 artifacts, reconstructed checkout và file sets A/B/C, index trống, HEAD/v7 không đổi; không có Important findings. Hai ghi chú về độ chính xác của mô tả import scanner và số prerender đã được sửa trong tài liệu này. Không đổi source hoặc chạy lại model/DB/network trong review.

## Kiểm tra và giới hạn

Workspace full Vitest: **781 passed/36 skipped; 64 files passed/2 skipped**. 32 PostgreSQL tests và 4 rate-limit tests không bật trong task7 vì không đổi logic tài chính/DB; không gộp chúng vào số passed. Task6 đã chạy riêng 32 PostgreSQL tests với full suite 813 passed/4 skipped, bằng chứng vẫn giữ nguyên. Lint/typecheck/diff check đạt. Build/default bundler đạt như trên.

Không deploy, sửa migration/schema, gọi model trả phí, chạy DB production, bật cron, sửa credit hoặc commit. Artifacts và user review choices giữ nguyên; checkout tạm do task7 tạo được dọn sau kiểm chứng, không đụng thư mục/artifacts cũ của người dùng.

Task7 chỉ đóng việc phân loại/tách review, không phải GO release. Task4.1 effective deployed function duration chưa xác nhận; authenticated Next E2E, cutover/no mixed writers, recovery scheduler ownership và rollback drain vẫn thuộc task8. Bước tiếp theo: task8 kiểm chứng/bàn giao release gates, không tự phát hành.
