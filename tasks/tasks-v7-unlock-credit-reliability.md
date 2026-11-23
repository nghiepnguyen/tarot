# Task list — Giữ v7, bảo toàn credit và lịch sử khi mở khóa AI

Ngày 22/11/2026. Trạng thái: **tasks 0–3 hoàn tất; task 4 hoàn tất code/kiểm thử, còn xác minh duration deploy trước release; tasks 5–7 hoàn tất; task 8 chưa hoàn tất, chưa release**. Baseline: `docs/v7-unlock-credit-task0-baseline-2026-11-22.md`.

## Mục tiêu và phạm vi

Giữ `ACTIVE_PROMPT_VERSION = PROMPT_V7`, giá hiện tại 10 credit/lượt. Ưu tiên sửa tính nhất quán số dư/ledger và phân biệt lỗi trước/sau khi lưu bài; sau đó xử lý request trùng, timeout và recovery. Dừng phát triển v9.x; giữ bằng chứng thử nghiệm để tra cứu.

Trong phạm vi: unlock AI, spend/refund, concurrency/retry, lưu/đọc lịch sử liên quan, observability tối thiểu và phân loại các thay đổi chưa commit. Ngoài phạm vi: đổi prompt/model/pricing, redesign UI, Dynamic Reflection, sửa PayOS/top-up/refund đơn mua, tự điều chỉnh credit lịch sử hoặc deploy production.

Đây là task list triển khai, không chốt sẵn một thiết kế DB mới. Task 1 phải chọn cơ chế đủ đáp ứng invariants; không hứa crash-safety chỉ bằng try/catch hoặc khóa trong RAM.

## Bằng chứng hiện tại

- `app/actions/ai.ts`: debit → đọc balance → tạo UNLOCK_SPEND đều trước try. Tests hiện tại chứng minh lỗi balance/ledger sau debit không refund; chúng là characterization debt, không phải hành vi cần giữ.
- Refund tăng balance và ghi REFUND là hai thao tác tách rời. Lỗi ở giữa có thể làm balance/ledger bất nhất.
- `aiInterpretation.create`, revalidate và display adapter nằm cùng try; lỗi sau khi DB đã lưu có thể bị xử lý như generation failure và refund. Đây là rủi ro cấu trúc cần fault-injection, chưa khẳng định đã xảy ra production.
- `AiInterpretation.readingId @unique` chỉ giới hạn số bài lưu. Chưa có unique unlock attempt/spend/refund key trong CreditTransaction; chưa chứng minh chống debit/provider calls trùng.
- Provider có timeout 45 giây; repo khai báo maxDuration 60 giây ở trang chính/history. Chưa xác minh ngân sách/deployment thực tế; 45 giây chỉ tính từ lúc gọi provider, chưa bao gồm DB/metrics/save/refund.
- Active v7 được xác nhận trong source; deployment đang chạy phiên bản nào cần kiểm tra riêng trước rollout.

## Relevant Files

- `app/actions/ai.ts` — action unlock, debit, persistence/refund, credit status và top-up development; chỉ sửa nhánh unlock liên quan.
- `lib/ai/unlock.test.ts` — safety, legacy, provider/schema failures và characterization gaps hiện có.
- `prisma/schema.prisma`, `prisma/migrations/` — User credits, CreditTransaction, Reading/AiInterpretation; chỉ sửa khi thiết kế chứng minh cần durable attempt/idempotency.
- `lib/ai/unlock-credit.ts` và test cùng tên (dự kiến) — transaction helpers nếu cần tách để kiểm thử; không tạo abstraction chung cho payment.
- `lib/ai/unlock-credit.integration.test.ts` (dự kiến) — kiểm chứng rollback/concurrency trên DB test độc lập.
- `lib/ai/generate.ts`, `lib/ai/gemini.ts`, `lib/ai/deepseek.ts` và tests — routing provider, timeout/cancellation, số lần request.
- `lib/ai/metrics.ts`, `lib/ai/metrics.test.ts` — ghi metrics, thời gian bổ sung và xử lý telemetry failure.
- `lib/ai/interpretation.ts` — giá/timeout, adapter hiển thị và tương thích dữ liệu legacy.
- `lib/ai/prompts/index.ts`, `lib/ai/prompts/index.test.ts` — pin active v7, giữ đọc được phiên bản lịch sử.
- `app/actions/readings.ts`, `app/history/page.tsx`, `components/tarot/HistoryList.tsx` — lưu/xóa/đọc lịch sử và ownership.
- `components/tarot/AiUnlockPanel.tsx` — trạng thái pending/error, retry và refresh số dư nếu contract action thay đổi.
- `lib/monitoring/report.ts` — báo lỗi có ID/trạng thái, không đưa câu hỏi/nội dung bài vào logs.
- `lib/admin/credits.ts`, `lib/payments/refund.ts` — tham khảo transaction hiện có; không đổi nghiệp vụ admin/payment.
- `app/page.tsx`, `app/history/page.tsx`, `vercel.json` — kiểm tra route duration và scheduler hiện có, không tự đổi lịch cron.
- `docs/tarot-ai-v9-preflight.md`, `tasks/tasks-tarot-ai-v9-evidence-grounded.md`, `docs/benchmarks/v9-*-result-*.md` — bằng chứng debt và đóng hướng nghiên cứu; không rewrite kết quả cũ.
- `docs/superpowers/specs/2026-11-22-v7-unlock-credit-reliability-design.md` (dự kiến) — invariants, trạng thái, ranh giới transaction và recovery đã chọn.

### Notes

- Làm theo thứ tự ưu tiên; P0 là sửa cửa sổ mất/bất nhất credit, **chưa đồng nghĩa** đã giải quyết process crash/concurrency nếu P1 chưa xong.
- Mock tests chứng minh luồng xử lý, không chứng minh DB rollback hoặc khóa cạnh tranh. Những kết luận đó cần integration tests thật trên DB cô lập, không dùng production.
- Đọc hướng dẫn Next.js cài trong `node_modules/next/dist/docs/` trước sửa code. Test bằng `pnpm exec vitest run <files>`; không dùng Jest theo ví dụ template cũ.
- Không gọi model thật, gửi Sentry thật, chạy migration production, commit/push/deploy hoặc xóa artifacts trong bước lập task list này.

## Instructions for Completing Tasks

Đánh dấu từng subtask sau khi có bằng chứng. Ghi lệnh/test và giới hạn bên cạnh task hoàn tất. Không đánh dấu “an toàn credit” chỉ vì suite cũ pass; các tests characterization lỗi phải được thay bằng assertions hành vi mới khi sửa.

## Tasks

- [x] 0.0 **P0 — Create feature branch và bảo toàn workspace.**
  - [x] 0.1 Ghi branch/HEAD, `git status`, danh sách modified/untracked và các file người dùng vừa chấm; không reset/stash/delete mặc định.
  - [x] 0.2 Chuẩn bị nhánh `codex/v7-unlock-credit-reliability` hoặc worktree cô lập khi bắt đầu implementation; xác định rõ thay đổi nào thuộc nghiên cứu cũ, thay đổi nào thuộc fix mới.
  - [x] 0.3 Lưu baseline hashes prompt v7/active registry và baseline focused tests, lint/typecheck; phân biệt failure có sẵn với regression mới.
  - [x] 0.4 Ghi quyết định dừng mở rộng v9.x trong task list cũ, giữ raw reviews/kết quả và không đổi active prompt.
  - **Hoàn thành khi:** workspace không mất dữ liệu, phạm vi diff fix mới nhận diện được, v7 còn active trong source.

- [x] 1.0 **P0 — Chốt hợp đồng credit, commit point và recovery.**
  - [x] 1.1 Vẽ luồng thực tế auth/ownership/safety/cache/rate-limit/model/input/debit/ledger/provider/metrics/save/display/revalidate/refund; liệt kê mọi điểm await có thể fail.
  - [x] 1.2 Chốt invariants: không đủ credit không gọi model; một unlock thành công chỉ có một net spend 10 credit và một bài; failure trước debit không đổi số dư; failure sau debit trước result commit phải rollback/refund hoặc còn durable recovery record, không báo “đã hoàn” khi chưa xác nhận.
  - [x] 1.3 Chốt result commit point: sau khi bài và trạng thái tài chính liên quan đã commit, lỗi cache/UI/telemetry không tự biến thành generation failure hoặc refund lượt đã thành công.
  - [x] 1.4 Chọn cơ chế nhỏ nhất cho debit/refund nguyên tử và phối hợp đồng thời; dùng conditional writes/transaction hiện có, không giữ transaction mở trong lúc chờ API model.
  - [x] 1.5 Chốt durable operation/attempt identity và ranh giới retry: không trùng net charge/refund, không ghi đè bài của attempt khác; unique readingId hiện có chưa đủ cho pre-generation exclusion.
  - [x] 1.6 Chốt trạng thái terminal/pending/recovery, quyền sở hữu attempt, thời hạn và fencing nếu dùng lease; attempt cũ trả muộn không được commit/refund vào attempt mới.
  - [x] 1.7 Chốt contract action/UI cho in-progress, completed, retryable failure và refund/recovery pending; không dùng lỗi chung để khuyến khích retry khi trạng thái tiền chưa rõ.
  - [x] 1.8 Lưu thiết kế/file plan và matrix failure → DB state → ledger → UI; đánh dấu migration/recovery nào bắt buộc, phần nào có thể hoãn với giới hạn release rõ ràng.
  - **Hoàn thành khi:** mỗi failure/concurrency case có trạng thái tiền/bài xác định, không còn câu “catch sẽ luôn hoàn” hoặc “unique row đủ chống gọi trùng”.

- [x] 2.0 **P0 — Sửa cửa sổ mất credit và ledger không nguyên tử.**
  - [x] 2.1 Viết failing tests cho debit xong nhưng đọc balance/spend ledger fail; thay characterization hiện đang chấp nhận bypass refund bằng expectation an toàn mới.
  - [x] 2.2 Đưa validation stored cards/question không gọi mạng và resolve model vào trước debit khi phù hợp; input lỗi không làm người dùng chịu một lượt spend rồi refund không cần thiết.
  - [x] 2.3 Gộp conditional debit + balance dùng ghi ledger + UNLOCK_SPEND trong transaction ngắn; spend ledger fail phải rollback debit, không gọi provider.
  - [x] 2.4 Kiểm tra balanceAfter thuộc đúng mutation trong transaction, không đọc số dư ngoài transaction nơi request khác có thể chen vào; đồng thời không để credits âm.
  - [x] 2.5 P0: gộp credit increment + REFUND ledger trong transaction ngắn, ledger fail rollback increment. Trạng thái attempt đi cùng schema/durable protocol ở task 3, chưa tồn tại trong P0.
  - [x] 2.6 P0: chỉ compensate debit invocation này đã xác nhận, không refund khi thiếu credit/preflight failure/debit rollback hoặc save commit chưa rõ; không lặp refund trong invocation. Guard settled/refunded xuyên requests/process còn task 3–4.
  - [x] 2.7 Tách generation/persistence failures khỏi post-commit revalidation/display/monitoring errors. Test save đã commit rồi revalidate/adapter/report failure không phát sinh refund, regenerate hoặc charge mới khi đọc lại.
  - [x] 2.8 Test missing API key, provider rejection, JSON/schema/position lỗi, invalid stored data và save failure theo hợp đồng mới; giữ safety/ownership/legacy no-charge guards.
  - **Hoàn thành khi:** fault injection tại debit/spend/refund từng bước không tạo balance/ledger lệch, và failure sau result commit không làm miễn phí lượt đã lưu ngoài chính sách.

- [x] 3.0 **P1 — Chống unlock/retry đồng thời bằng trạng thái bền vững.**
  - [x] 3.1 Nếu cần schema mới theo task 1, viết migration additive/backward-compatible và unique operation/settlement constraints; giữ nguyên ledger/bài cũ, không backfill khoản tiền suy đoán.
  - [x] 3.2 Viết test hai request cùng user/reading đi qua barrier đồng thời: chỉ attempt có quyền mới được generate/debit theo hợp đồng; request còn lại đọc trạng thái/chờ/nhận bài, không tự gọi thêm model.
  - [x] 3.3 Chốt operation key từ ownership + reading/attempt do server quản lý; không tin userId hoặc amount client cung cấp; request khác user không lấy trạng thái/bài của nhau.
  - [x] 3.4 Test hai reading khác nhau cạnh tranh số dư chỉ đủ một lượt; một lượt được debit, lượt còn lại không âm credit và không gọi provider.
  - [x] 3.5 Xử lý unique conflict khi lưu: đọc authoritative attempt/result và settle đúng charge; không coi mọi unique error là generation failure để refund tùy tiện.
  - [x] 3.6 Test response bị mất sau commit rồi retry, reload tab hoặc request lặp: trả đúng bài cũ, không spend/refund/generate lần nữa.
  - [x] 3.7 Test cùng callback/recovery/refund chạy hai lần hoặc đồng thời: tối đa một refund cho debit đó; attempt đã succeeded không bị đổi thành failed bởi tác vụ trễ.
  - [x] 3.8 Kiểm tra trên DB test thật với independent connections/transactions; không dùng khóa RAM hoặc `isPending` UI làm bằng chứng concurrency serverless.
  - **Hoàn thành khi:** có bằng chứng at-most-once settlement/net charge và phối hợp attempt; không tuyên bố “exactly once API call” trong tình huống nhà cung cấp/DB có kết quả không rõ.

- [ ] 4.0 **P1 — Deadline end-to-end và phục hồi khi request bị ngắt.**
  - [ ] 4.1 Đối chiếu duration config của trang chính/history với môi trường deploy trước release; không mặc định chú thích 60 giây là giới hạn thực tế ở mọi môi trường.
  - [x] 4.2 Đặt ngân sách từ đầu action tới settlement, tính cả DB/metrics/save/refund; chỉ gọi provider khi còn thời gian xử lý kết quả và failure path. Truyền remaining budget theo API hỗ trợ thay vì tăng timeout cho qua test.
  - [x] 4.3 Test provider treo/abort/timeout bằng fake timers và mocks, không chờ 45 giây thật; xác nhận số requests và hành vi retries của cả Gemini/DeepSeek.
  - [x] 4.4 Test metrics persistence hoặc monitoring chậm/lỗi không cản settlement/hoàn tiền hoặc làm result đã commit bị coi là thất bại; giữ telemetry best-effort có giới hạn.
  - [x] 4.5 Mô phỏng dừng sau debit commit, sau provider response, sau result commit và giữa recovery; tác vụ sau có thể xác định trạng thái từ DB, không phụ thuộc catch của process đã chết.
  - [x] 4.6 Xây recovery tối thiểu cho pending/failed refunds theo thiết kế, có idempotency và giới hạn batch/retries; xác minh trạng thái authoritative trước khi tăng credit hoặc cho phép attempt mới.
  - [x] 4.7 Nếu cần scheduler, thêm endpoint/job riêng có auth và test, không ghép unlock recovery vào reconcile-orders PayOS. Không tự kích hoạt lịch production trong implementation offline.
  - [x] 4.8 Khi DB chưa thể refund, giữ durable recovery record và thông báo đúng trạng thái; khi DB hoạt động lại, recovery settle một lần. Không hứa hoàn ngay khi hệ thống chưa xác nhận.
  - **Hoàn thành khi:** timeout không dựa vào việc catch luôn chạy; các điểm ngắt có đường phục hồi kiểm chứng và stale attempts không sửa tiền/bài của attempt mới.

- [x] 5.0 **P1 — Bảo đảm lưu/đọc lịch sử và thông báo người dùng nhất quán.**
  - [x] 5.1 Test action trả object đã lưu có đúng interpretation ID, model/promptVersion v7, legacy joined actions và fields hiện có; không trả raw provider result như thể đã persist.
  - [x] 5.2 Test history qua adapter đọc cả bài mới/legacy; không validate lại legacy bằng schema mới hoặc làm thay đổi dữ liệu cũ.
  - [x] 5.3 Test lỗi mạng/cache sau save: người dùng tải lại history vẫn thấy đúng bài, unlock lại không charge/generate; lỗi DB save thật chưa commit đi đúng failure/recovery path.
  - [x] 5.4 Test xóa reading trong lúc unlock đang chạy, ownership thay đổi/reading không còn tồn tại: không lưu bài mồ côi hoặc treo debit; terminal/recovery state vẫn truy vết được dù reading bị xóa.
  - [x] 5.5 Nếu task 1 thay UnlockResult, cập nhật AiUnlockPanel và callers tương ứng cho pending/error/completed; refresh số dư từ server, retry theo authoritative state, không chỉ disable nút để giả chống double spend.
  - [x] 5.6 Rà riêng saveReadingAction: DB create đã commit nhưng revalidate/response lỗi không nên khiến retry cùng thao tác tạo bản ghi ngoài ý muốn. Nếu cần idempotency key, giới hạn theo thao tác, không dedupe mọi câu hỏi/bộ lá giống nhau vì người dùng có thể trải lại hợp lệ.
  - **Hoàn thành khi:** UI/history và ledger cùng phản ánh trạng thái thật; không thu tiền lại chỉ để lấy bài đã lưu.

- [x] 6.0 **P1 — Đối soát và quan sát sự cố tối thiểu.**
  - [x] 6.1 Ghi trạng thái bằng operation/attempt ID, reading/user ID được phép, model/promptVersion, failure stage và recovery state; không đưa raw question, output, credentials hoặc provider payload vào logs/Sentry.
  - [x] 6.2 Phân biệt generated, persisted, refunded và recovery_pending; metric generation success hiện có không được coi là unlock persisted success.
  - [x] 6.3 Tạo cách đối soát read-only trên DB test cho attempt terminal/pending, spend/refund sums và balanceAfter; không suy toàn bộ credits từ riêng unlock ledger vì còn grants/purchases/admin adjustments.
  - [x] 6.4 Chuẩn bị báo cáo dry-run cho dữ liệu lịch sử nếu sau này cần kiểm tra; flag ambiguous cases để rà thủ công, không tự hoàn/trừ credit theo heuristic thiếu bằng chứng.
  - [x] 6.5 Viết runbook: nhận diện sự cố, recovery an toàn, xử lý case không rõ, số liệu ngưỡng dừng và đường rollback. Giới hạn quyền chạy công cụ sửa tiền.
  - **Hoàn thành khi:** lỗi còn tồn đọng nhìn thấy và xử lý được mà không lộ nội dung hoặc tự sửa tiền lịch sử.

- [x] 7.0 **P2 — Rà thay đổi chưa commit và đóng nghiên cứu v9.x.**
  - [x] 7.1 Phân loại từng modified/untracked file thành fix sản phẩm, telemetry/benchmark infrastructure, thử nghiệm offline hoặc review artifacts; ghi lý do giữ/tách, không dựa vào tên v9 để xóa hàng loạt.
  - [x] 7.2 Giữ v7 active và kiểm tra admin/history vẫn đọc prompt IDs đã lưu. Không xóa registry entries khiến historical IDs mất ngữ cảnh chỉ để “dọn sạch”.
  - [x] 7.3 Giữ các reports/preference locks/source hashes v9.x, ghi dừng nghiên cứu; chỉ đề xuất archive artifacts sau khi biết chúng có backup/versioned hay không.
  - [x] 7.4 Tách diff/commit plan cho credit fix khỏi prompt experiments và provider usage metadata đã làm; không bỏ telemetry cải thiện có ích hoặc xóa user edits không liên quan.
  - [x] 7.5 Rà import graph/build để helpers experimental không bị nối vào production ngoài ý muốn; không đổi prompt output để phục vụ debt cleanup.
  - **Hoàn thành khi:** review được fix credit độc lập, v9.x không tiếp tục rollout và không mất bằng chứng nghiên cứu.

- [ ] 8.0 **Release gate — Kiểm chứng và bàn giao trước khi cân nhắc phát hành.**
  - [ ] 8.1 Chạy focused tests unlock/credit/providers/metrics/history/registry sau từng thay đổi; tests mới phải chứng minh failure trước fix đối với logic mới, không chỉ mock implementation.
  - [ ] 8.2 Chạy DB integration suite: rollback debit+spend, rollback refund+ledger, double unlock, insufficient balance concurrency, retry sau commit và recovery idempotency. Ghi rõ DB version/isolation; không khẳng định concurrency safe nếu chỉ mock pass.
  - [ ] 8.3 Chạy full Vitest, lint, typecheck, Prisma validation/migration checks khi có schema change và build phù hợp; giải thích từng skipped/unavailable check thay vì coi đạt.
  - [ ] 8.4 Chạy E2E với auth/DB test và provider giả: mở khóa từ trang chính/history, success, insufficient credits, timeout/refund pending, retry/reload và bài legacy. Không gọi API trả phí hoặc dùng DB production.
  - [ ] 8.5 Fresh code review tập trung money boundary, transaction isolation, fencing/idempotency, post-commit failures và data compatibility; sửa blockers rồi chạy lại checks bị ảnh hưởng.
  - [ ] 8.6 Báo cáo GO/NO-GO theo invariants: v7 nguyên trạng; không âm/trừ trùng/hoàn trùng; ledger khớp settlement; không provider call khi chưa đủ điều kiện; crash/recovery có bằng chứng. Thiếu recovery/DB proof phải ghi giới hạn release rõ ràng.
  - [ ] 8.7 Chuẩn bị migration/rollback/observation plan nếu cần; chỉ deploy hoặc áp migration môi trường chung khi có yêu cầu/phê duyệt riêng. Rollback code không được làm mất khả năng settle các attempts đang tồn đọng.
  - **Hoàn thành khi:** người review có test evidence, diff đúng phạm vi, đường rollback/recovery rõ; task list xong không tự đồng nghĩa đã deploy.

## Thứ tự thực hiện đề xuất

Bắt đầu **0 → 1 → 2** để đóng các cửa sổ debit/refund và lỗi sau save. Tiếp **3 → 4 → 5 → 6** để đạt concurrency/crash-safety đầy đủ; **7** làm sau khi đã có inventory, không trộn cleanup vào fix tiền; **8** là gate phát hành. Không mở lại benchmark prompt trong các task này.

## Kết quả task 0 — 22/11/2026

Nhánh `codex/v7-unlock-credit-reliability`, HEAD giữ `81998706a409e2c1278217b8c87c552eef8bb622`. Inventory 85 files workspace + 427 artifacts giữ nguyên khi đổi nhánh; không reset/stash/xóa/commit. Focused baseline 94 tests/7 files đạt, lint/typecheck/diff check đạt; pin v7/registry/ai action/schema đã lưu. Chỉ cập nhật task lists/report, không sửa credit. Chưa bắt đầu task 1; chi tiết và giới hạn tại `docs/v7-unlock-credit-task0-baseline-2026-11-22.md`.

## Kết quả task 1 — 22/11/2026

Thiết kế đề xuất: `docs/superpowers/specs/2026-11-22-v7-unlock-credit-reliability-design.md`. Đã có luồng hiện tại/await failures, 10 invariants, reserve/finalize/refund boundaries, commit ambiguity matrix, token fencing, deadline và contract UI. Chọn một UnlockOperation mỗi reading + attempt token, unique nullable ledger key; trạng thái quarantine RECONCILE_REQUIRED chặn automatic refund khi evidence bất nhất. Expiry check dùng actual DB wall clock sau operation row lock.

Builder check phát hiện quarantine/clock ambiguities, đã chốt xử lý trong thiết kế. Migration/durable protocol và recovery là bắt buộc trước khi tuyên bố concurrency/crash-safe; P0 task 2 atomic debit/refund/post-commit fix có thể làm riêng nhưng chưa đủ release. Chưa sửa source/schema hoặc chạy DB/model/migration; source pins task 0 giữ nguyên. Task 1 hoàn tất tài liệu, thiết kế cần được người dùng duyệt trước code task 2.

## Kết quả task 2 — 22/11/2026

Atomic spend/refund helpers và action preflight/post-commit boundaries đã triển khai. 41 action tests và 6 PostgreSQL integration tests (DB-side ledger rejection → rollback thật) đạt; full suite 728 passed/4 skipped, lint/typecheck/diff check đạt; fresh code review không findings. Báo cáo: `docs/v7-unlock-credit-task2-result-2026-11-22.md`.

P0 không thêm schema/attempt state: compensate chỉ theo invocation đã xác nhận debit; ambiguity trả thông báo cần xác nhận, không refund mù. Durable idempotency/concurrency/recovery còn task 3–4 và **chặn release**. Không deploy, gọi model hoặc DB production; container test tạm đã được xóa. v7/registry/schema/UI giữ nguyên.

## Kết quả task 3 — 23/11/2026

Durable UnlockOperation/token, unique nullable ledger keys, reserve/finalize/refund atomic và quarantine đã triển khai; status action không gọi provider, giữ safety/ownership. 18 PostgreSQL integration tests (connections độc lập + actual server action barrier/provider giả) và 40 action tests đạt. Full suite 739 passed/4 skipped; lint/typecheck/Prisma validate/schema diff đạt, fresh review không findings. Upgrade final SQL từ 17 migration cũ giữ nguyên JSONB legacy, không backfill keys/operations.

Báo cáo: `docs/v7-unlock-credit-task3-result-2026-11-23.md`. Chỉ DB test, container đã xóa; không production migration/commit/deploy. V7/registry/UI giữ nguyên. 55s hiện là operation lifetime, chưa end-to-end budget; scheduler recovery và cutover/rollback còn chặn release (tasks 4/8).

## Kết quả task 4 — 23/11/2026

Đã triển khai ngân sách action 55s từ trước auth, provider tối đa 45s và chừa 10s settlement; timeout/abort cả provider và giới hạn chờ metrics. Transaction/retry nhận remaining budget, durable expiry không vượt ngân sách còn lại. Recovery theo chủ sở hữu và batch 25 lượt/45s dùng guarded settlement; endpoint riêng `/api/cron/recover-unlocks` có bearer auth, không kích hoạt lịch production.

Full suite **772 passed/4 skipped**, gồm **25 PostgreSQL tests**; lint/typecheck/diff check đạt, fresh reviewer không phát hiện lỗi quan trọng. Đã kiểm chứng crash trước/sau provider, sau commit và mất acknowledgement giữa recovery, refund bị DB từ chối rồi phục hồi, recovery đồng thời. Container test đã xóa. V7/registry/schema/lịch cron giữ nguyên.

**4.1 còn mở:** truy vấn Vercel chỉ đọc xác nhận Fluid bật nhưng không trả effective function duration; repo 60s chưa đủ chứng minh production. Chưa build/E2E/deploy/kích hoạt cron. Báo cáo: `docs/v7-unlock-credit-task4-result-2026-11-23.md`. Task 4.0 chỉ đánh dấu toàn bộ sau xác minh duration môi trường release; có thể tiếp task 5 trong workspace.

## Kết quả task 5 — 23/11/2026

UI đọc status authoritative trước khi cho retry, bắt transport failures, kiểm tra số dư sau reconciliation và có nút kiểm tra trạng thái cho pending/quarantine. Save có UUID ổn định qua retry/reload, guard owner/payload và postcommit cache boundary; chặn double reveal và bỏ phản hồi lưu cũ sau reset. Không thêm schema/dependency, không dedupe các lượt trải riêng có cùng nội dung.

Full Vitest **789 passed/4 skipped**, gồm **29 PostgreSQL tests**; **13 browser component tests** đạt. Lint/typecheck/diff check đạt. Reviewer tìm thấy race reveal, uncoded retry và stale balance; đã RED→GREEN và chạy lại suites, bổ sung ownership-transfer khi generation chạy. Không thay v7/registry/adapter/history page/lịch cron; container test đã xóa.

Báo cáo: `docs/v7-unlock-credit-task5-result-2026-11-23.md`. Browser harness có action giả, chưa thay authenticated Next E2E/build ở task 8. Task 4.1 duration deploy vẫn mở; chưa production DB/model/cron/deploy/commit. Có thể tiếp task 6.

## Kết quả task 6 — 23/11/2026

Lifecycle logs whitelist có operation/attempt identity, phân biệt generated với persisted/refunded-confirmed và pending; không dùng generation success làm persistence success. Đã có audit snapshot chỉ đọc, phân trang và flag legacy/ambiguous; không tự sửa credit, không suy tổng user balance từ unlock ledger. CLI dry-run chỉ cho DB test rõ ràng, từ chối connection overrides. Runbook: `docs/v7-unlock-credit-incident-runbook.md`.

Full suite **813 passed/4 skipped**, gồm **32 PostgreSQL tests**; **13 browser component tests** đạt, lint/typecheck/diff check đạt. Review findings về gắn nhầm token, terminal state sai khi evidence mâu thuẫn/truncated và URL guard đã RED→GREEN; DB thực sự chặn ghi trong audit snapshot. Dry-run example chỉ có hai case giả, fixture/container test đã xóa.

Báo cáo: `docs/v7-unlock-credit-task6-result-2026-11-23.md`. V7/schema/registry/cron giữ nguyên; không production audit/adjustment/deploy/commit. Task4.1 và build/authenticated E2E task8 vẫn mở; có thể tiếp task7.

## Kết quả task 7 — 23/11/2026

Đã phân loại từng file: 133 files đầu task (20 modified/113 untracked), cộng 2 docs task7; inventory cuối 135 files. Tạo 3 ordered review patches tách provider usage metadata, credit reliability và frozen research; apply theo thứ tự ở checkout HEAD tạm tái tạo đúng bytes, không stage/commit/reset/move/delete workspace. A+B riêng đạt 481 tests/36 skipped, không cần C để review fix credit.

Source graph 42 roots/186 modules xác nhận renderers offline không nối vào app; v9/evidence/relations vẫn có definition-only reachability qua registry cho lịch sử, v7 active không đổi. Default Turbopack build đạt với sanitized environment; 279 JS/37 NFT traces không có offline/test-artifact markers. Registry/admin/history focused 193 tests đạt. Full suite không DB 781 passed/36 skipped, lint/typecheck/diff check đạt; PG proof task6 giữ nguyên.

427 raw artifacts task0 và 486 artifacts local đầu task7 được hash/bảo toàn; source/preferences/reports cũ giữ nguyên. Không archive vì chưa xác minh backup bền vững cho untracked/ignored evidence. Báo cáo + commit plan: `docs/v7-unlock-credit-task7-result-2026-11-23.md`; từng file: `docs/v7-unlock-credit-workspace-inventory-2026-11-23.md`.

Không paid calls/production DB/cron/deploy/commit. Task4.1 effective duration vẫn mở; task8 tiếp tục E2E/cutover/release handoff, không tự GO.
