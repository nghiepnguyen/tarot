# Task 3 — Durable unlock và settlement idempotency

Ngày 23/11/2026. **Task 3 đã triển khai và kiểm chứng trên DB test; chưa release/deploy.** Nhánh `codex/v7-unlock-credit-reliability`; active v7 giữ nguyên.

## Hành vi mới

- Một `UnlockOperation` mỗi reading, với token server-generated cho mỗi lần thử. Reserve claim + conditional debit + UNLOCK_SPEND commit cùng transaction; không đủ credit rollback cả claim và không gọi provider.
- Request thấy operation đang xử lý/chờ đối soát không resolve model hoặc gọi provider thêm. Race xảy ra sau preflight cũng được reserve trong DB chặn; chỉ caller nhận `reserved` mới được generate.
- Ledger có `idempotencyKey` unique nullable, keys theo token cho spend/refund. Amount lấy snapshot server, không client; helpers đều gắn ownership/reading/token.
- Finalize khóa operation, kiểm tra receipts/result và thời hạn, rồi lưu bài + SUCCEEDED/interpretationId nguyên tử. Dùng model/prompt snapshot của operation; repeated finalize trả kết quả đã commit, không ghi đè output.
- Refund khóa operation và kiểm tra trạng thái/receipts/result trước tăng credit. Refund + ledger + REFUNDED cùng transaction, duplicate callbacks hoàn tối đa một lần. REFUNDED có receipt hợp lệ mới được explicit retry bằng token mới.
- Worker cũ gặp token khác trả stale; không save hoặc hoàn vào attempt mới. Operation sống qua việc xóa Reading; xóa history sau success không tự refund.
- Receipts/result/ownership bất nhất chuyển RECONCILE_REQUIRED, chặn automatic refund/reserve. Không coi mọi unique/commit error là generation failure để hoàn mù.
- Action settlement đọc trạng thái authoritative: mất finalize response nhưng DB đã success vẫn trả bài; refund acknowledgement mất có thể xác nhận REFUNDED từ DB, không cộng lại. DB chưa đọc được thì trả recovery_pending, không khẳng định đã hoàn.
- `getUnlockStatusAction` có auth/ownership và safety-before-cached-data, chỉ đọc/kiểm tra state, không reserve hoặc gọi model. Action trả code/retryable cho pending/quarantine/refunded; chưa nối thêm UI polling.

## Transaction, clock và migration

`lib/ai/unlock-credit.ts` dùng transaction Serializable, retry tối đa ba lần chỉ với rollback conflicts xác định (Prisma P2034/P2002, hoặc raw-query P2010 có SQLSTATE 40001/40P01). Không retry unknown commit acknowledgement hoặc provider. Tests thật phát hiện raw lock serialization không đi cùng mã ORM thông thường; whitelist đã được sửa theo lỗi quan sát.

Deadline operation là `timestamptz(3)`, so actual `clock_timestamp()` sau operation lock. Transition SUCCEEDED kiểm tra lại clock trong UPDATE sau khi tạo result; nếu quá hạn, toàn transaction result rollback. Test session Asia/Ho_Chi_Minh đã quan sát RED khi draft dùng timestamp không timezone, rồi GREEN sau sửa. Đây là lifetime 55 giây từ reservation theo DB; **chưa phải remaining end-to-end action budget** — task 4 tiếp tục phần đó.

Migration additive `prisma/migrations/20261123000000_add_unlock_operations/migration.sql`:

- Thêm bảng/enum UnlockOperation và User relation; không FK vào Reading để giữ financial evidence khi history bị xóa.
- Thêm nullable unique CreditTransaction.idempotencyKey; không backfill hoặc rewrite ledger/bài cũ.
- Không đổi schema/result prompt v7 hoặc chính sách payment/admin adjustment.

Prisma client đã generate tại workspace. Migrations chỉ chạy trên DB test do task tạo. Không chạy migration production. Draft expiry type được tinh chỉnh trước commit/deploy; final SQL được kiểm chứng độc lập bên dưới.

## Bằng chứng kiểm chứng

**18 PostgreSQL integration tests** qua hai PrismaClient connections độc lập, gồm:

1. Hai reservation đồng thời: một provider owner, một spend/bài.
2. Actual server actions với provider barrier và mock model: request thứ hai thấy processing, không generate/debit thêm.
3. Hai readings tranh 10 credit cuối: một reserved, một insufficient, không âm số dư.
4. Retry sau success/mất response không charge/generate lại.
5. Refund/finalize đồng thời/lặp chỉ settle một lần; success không refund.
6. Token cũ sau REFUNDED/rearm không sửa attempt mới.
7. Result không khớp, missing receipt được quarantine; không mint refund.
8. DB trigger từ chối spend/refund ledger chứng minh rollback mutation và state thật.
9. Reading xóa trước finalize vẫn refund đúng và giữ evidence; xóa sau success không refund.
10. Ownership khác user không đọc/mutate operation.
11. Finalize chờ lock vượt expiry không save; DB session khác UTC vẫn xử lý lifetime đúng.
12. REFUND_PENDING xử lý failure không phải chờ expiry; expiry recovery không hoàn token còn sống.

Unit action suite **40 tests**: ownership/safety/input/key guards, no provider trước reserve hoặc khi pending, đúng token/user propagation, generation errors, commit uncertainty, quarantine, reporter/cache/display failures và status endpoint. Các transaction-state/rollback proofs của fake ở task 2 đã được thay bằng DB thật; không dùng mock arithmetic để chứng minh concurrency.

### Proof nâng cấp

- DB test đầu tiên áp chuỗi 17 migrations cũ, seed legacy và áp draft migration mới để chạy regression.
- DB tổng hợp thứ hai dựng đúng 17 migration SQL cũ, seed User/Reading/AiInterpretation/CreditTransaction, chụp JSONB, áp **final migration SQL** sau sửa timezone. Snapshot trước/sau giống nhau, ledger key mới null, không backfill operations, native expiry type đúng.
- Actual test schema so với `prisma/schema.prisma` bằng migrate diff: **No difference detected**, exit 0. Prisma validate và generate đạt.

### Kết quả cuối

Full Vitest với DB opt-in: **739 passed, 4 skipped; 57 files passed, 1 skipped**. Trong đó 18 DB integration tests đã chạy, không nằm trong skips. Lint/typecheck/diff check exit 0. Fresh reviewer không Critical/Important/Minor findings, độc lập chạy lại 40 action tests đạt; reviewer không tự chạy DB tests.

DB chỉ dùng explicit `UNLOCK_CREDIT_TEST_DATABASE_URL` với guard localhost/user/database test; không fallback DATABASE_URL production. Docker postgres:16-alpine dùng tmpfs/--rm, bind localhost, không user-volume. Container riêng và hai DB tổng hợp đã được xóa cùng container, xác nhận ID không còn. Không gọi provider/PayOS/Sentry thật.

## File delta và giới hạn release

Thay đổi task 3: `app/actions/ai.ts`, `lib/ai/unlock-credit.ts`, unit/integration tests, schema và migration additive. Baseline task 2 lưu tại `.model-compare/v7-credit-task3/`; v7/system/active registry và AiUnlockPanel giữ nguyên hashes. Không xóa research artifacts, không commit/push/deploy.

**Task 4 vẫn chặn release:** chưa scheduler để drain pending nếu user không quay lại, chưa deadline end-to-end/remaining provider budget, chưa bounded telemetry toàn action. Task 5 còn UI status/history E2E; task 8 còn cutover/drain và rollback. Không được chạy old/new financial writers song song chỉ vì schema additive. Rollback về action cũ khi còn operations pending sẽ bỏ fencing; cần dừng reserve mới và giữ settlement/recovery tương thích trước rollback.

Không có tuyên bố exactly-once provider execution khi network timeout; task này chứng minh quyền owner và at-most-once financial settlement trong các ca đã kiểm thử. Quarantine cần đối soát thủ công, không được xóa operation hoặc sửa tiền theo heuristic. Chưa build/E2E, chưa migration hoặc traffic production.

Tiếp theo: task 4 — deadline end-to-end và recovery có vận hành cho pending/expired attempts; không mở lại nghiên cứu prompt v9.x.
