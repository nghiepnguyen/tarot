# Task 2 — Atomic credit transactions và post-commit boundary

Ngày 22/11/2026. **Task 2 P0 đã triển khai/kiểm chứng; chưa đủ điều kiện release.** Nhánh `codex/v7-unlock-credit-reliability`; không commit, push hoặc deploy.

## Thay đổi

- `lib/ai/unlock-credit.ts`: conditional debit, đọc balance và ghi UNLOCK_SPEND cùng transaction Serializable; refund increment và REFUND cùng transaction. Ledger failure rollback mutation, provider không nằm trong transaction. Không retry transaction hoặc tự tăng credit khi commit response không rõ.
- `app/actions/ai.ts`: validate question/cards/count/position/orientation và kiểm tra cấu hình provider trước debit; giữ ownership/safety/legacy guards. Thiếu key hoặc dữ liệu lỗi không cần spend rồi refund.
- Khi debit transaction reject, không biết chắc rollback hay mất acknowledgement thì không gọi provider/refund mù; báo trạng thái credit chưa được xác nhận.
- Generation hoặc save callback lỗi trước khi callback hoàn tất được compensate từ debit đã xác nhận trong invocation. Save dùng transaction ngắn riêng; callback chưa hoàn tất thì Prisma không được yêu cầu commit result.
- Khi save callback đã trả row nhưng commit acknowledgement mất, chỉ xác nhận thành công bằng query **đúng interpretation ID + reading ID + owner**. Không nhìn thấy/đọc được row không đủ chứng minh rollback; giữ trạng thái không rõ, không refund. Xác nhận được row thì đi cùng nhánh post-commit/revalidate như success bình thường.
- Cache, adapter và pricing reporter sau commit không còn nằm trong catch financial compensation. Adapter lỗi báo bài đã lưu, mời tải lại history thay vì tạo/thu tiền lượt mới. Đọc lại cached row không gọi model/debit.
- Reporter là best-effort, không cản refund và chỉ nhận stage/IDs/model/prompt, không nguyên văn exception payload từ provider/DB.

Không thay schema, phí 10 credit, model selection, prompt v7, provider generation settings hoặc UI contract. Không triển khai durable UnlockOperation/idempotency key/status lookup/recovery trong task này.

## Regression và kiểm chứng

Action suite quan sát **16 failures trên code cũ** trước khi sửa: debit ngoài transaction, validation sau charge, missing key, refund ledger failure, reporter failure và lỗi post-commit. Sau implementation GREEN. Một regression bổ sung phát hiện xác nhận save commit mất response chưa revalidate history; đã quan sát RED rồi sửa cho đi cùng nhánh post-commit.

**41 action tests đạt**, bao gồm:

- Rollback balance/spend-ledger failures; thiếu/âm credit không provider/refund.
- Full stored-input validation, config/model preparation trước debit.
- Provider/schema/position failures, save callback rollback và refund transaction failures.
- Debit/save/refund commit acknowledgement mất; không tự chạy lại provider hoặc refund khi trạng thái không rõ.
- Exact owned saved-row confirmation; cache/display/report failure sau save, đọc lại bài không charge.
- BalanceAfter từ mutation cùng transaction, provider ngoài transaction và output/logs không chứa synthetic private payload.

Unit fake chỉ mô phỏng transaction rollback để fault-inject; không dùng nó làm bằng chứng PostgreSQL isolation.

### PostgreSQL test thật

Dùng image `postgres:16-alpine` đã có, container riêng có --rm, data tmpfs, port ngẫu nhiên **chỉ bind 127.0.0.1**, DB tổng hợp `tarot_credit_task2`, không mount dữ liệu người dùng. Tạo schema hiện tại bằng `prisma db push --skip-generate` trên URL test explicit; không migration hoặc kết nối production.

`lib/ai/unlock-credit.integration.test.ts`: **6 tests đạt**. Trigger test ở DB từ chối spend/refund ledger insert sau mutation để xác nhận rollback thật; success ghi đúng amounts/balanceAfter, số dư 0/9/-10 không debit. Không kiểm chứng durable request concurrency/crash-recovery ở đây.

Test chỉ opt-in qua `UNLOCK_CREDIT_TEST_DATABASE_URL`, guard hostname localhost/127.0.0.1, database/user test; tuyệt đối không fallback `DATABASE_URL`. Chạy thường không có URL sẽ skip sáu tests integration này. Lần kết nối dưới sandbox bị chặn; chạy lại với quyền kết nối DB test đã được chấp thuận đạt. Docker container test đã dừng/xóa, xác nhận không còn đúng ID; không chạm container khác.

### Kết quả cuối

- Full Vitest **728 passed, 4 skipped; 57 files passed, 1 skipped**, với integration URL test được bật. Bốn skips là các tests có sẵn, không phải sáu integration tests mới.
- `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`: exit 0.
- Fresh code review: không Critical/Important/Minor findings. Reviewer đọc baseline delta/design/tests, không tự chạy DB hoặc tests; kết quả chạy do implementer ghi ở trên.
- Pin v7, active registry, schema và AiUnlockPanel giữ nguyên so với snapshot trước task 2. Source/artifacts nghiên cứu được bảo toàn.

## Quyết định triển khai có giới hạn

Dùng transaction save riêng và cờ callback-prepared ID để tách rollback trước commit khỏi acknowledgement không rõ. Không coi exception đơn thuần là bằng chứng chưa lưu. Đánh đổi: có thể giữ credit ở trạng thái cần đối soát thay vì hoàn ngay khi commit thực tế rollback nhưng chưa xác nhận được. Đó là lựa chọn bảo thủ; tasks 3–4 phải cung cấp durable receipt/state và recovery, không để thông báo này thành giải pháp vận hành lâu dài.

Trong P0, “compensate một lần” chỉ là quyền từ debit đã xác nhận trong **invocation hiện tại** và một đường catch; chưa có guard idempotency xuyên requests/process. Trạng thái attempt nêu trong thiết kế chưa tồn tại, được triển khai cùng migration task 3. Không sửa lịch sử hoặc tự hoàn các ca cũ theo heuristic.

## Release blockers và việc chưa kiểm tra

**Chưa release.** Request đồng thời vẫn có thể reserve nhiều lần; process bị giết vẫn có thể để lại spend chưa settle; DB outage/refund/commit ambiguity chưa có worker recovery; UI chưa có durable pending/status guard. Tasks 3–4 và integration proofs tương ứng bắt buộc trước khi gọi đầy đủ concurrency/crash-safe. Task 2 không thay thế chúng.

Chưa chạy build/E2E hoặc xác minh deployment duration; không gọi model/PayOS thật. Active v7 trong source được giữ, không khẳng định đã deploy các fixes này. Tiếp theo là task 3: schema additive, durable attempt ownership/token/idempotency và concurrency tests.
