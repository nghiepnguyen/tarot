# v9.2 Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng ba bài đọc hoàn chỉnh có kiểm soát, so mù với ba bản v9.1 và chỉ kiểm tra holdout mới sau gate nghiên cứu.

**Architecture:** Renderer thuần mới dùng validation/evidence hiện có, ba context và fingerprints cố định. Runner filesystem dựng candidate độc lập với body control; provenance lưu nghĩa canonical và đoạn diễn đạt tương ứng, tách khỏi schema public. Tái dùng packet builder, không nối runtime.

**Tech Stack:** TypeScript, Zod hiện có, Node filesystem/crypto, Vitest, pnpm; không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-11-21-tarot-ai-v9-2-offline-design.md` — người dùng duyệt ngày 22/11/2026.

## Global Constraints

- 0 model API calls; không đổi active v7, frozen v9/v9.1, schema/parser/provider, DB/credit/UI/Reflection/dependency.
- Không commit/push/deploy. Giữ toàn bộ thay đổi đang có và lựa chọn review của người dùng.
- Ba context/fingerprints và guard/abstention đúng spec. Context thủ công; không semantic router/regex hoặc context từ client.
- Candidate version `controlled-reading-offline-2026-11-21`; giữ tên này theo spec dù triển khai ngày 22/11.
- Candidate dựng mới mọi trường prose; không spread/copy body control. Không chép câu canonical gán hoàn cảnh cho “bạn”.
- Production vẫn NO-GO kể cả offline đạt. Không dùng lại holdout cũ như dữ liệu chưa xem.
- Trước sửa code, đọc guide liên quan trong `node_modules/next/dist/docs/`; ghi hashes nguồn/frozen và baseline checks. Không di chuyển/reset workspace nhiều thay đổi chỉ để có cây sạch.

## Review Focus

1. Cùng chủ đề nhưng thêm yêu cầu vượt phạm vi: curator gán null; không đếm manual routing như khả năng tự hiểu câu hỏi (Task 4).
2. Nghĩa deck chứa tiền đề suy diễn: diễn đạt trung tính phải giữ ý nghĩa đúng chiều, reviewer kiểm tra mọi perCard, không dùng snapshot làm semantic proof (Task 1).
3. Artifact bị sửa đồng thời sau khi đọc: giữ bytes đã validate để tính hash và tạo control, không đọc lại nguồn khác giữa check/write (Task 2).
4. Control có body sai: packet hiển thị nguyên bản, candidate không giữ prose đó; không lọc control theo preference hoặc warnings (Task 2–3).
5. Candidate được ưa thích nhưng thiếu cụ thể/đặc thù lá: usefulness/card specificity là gate riêng, không chỉ win rate (Task 3–4).

## File boundaries

| File | Trách nhiệm |
|---|---|
| `lib/ai/controlled-reading.ts` | Ba mẫu prose đầy đủ, guard, renderer và mapping nghĩa nguồn |
| `lib/ai/controlled-reading.test.ts` | Hợp đồng renderer, nguồn đúng chiều, mutation, abstention |
| `scripts/prepare-controlled-reading-experiment.ts` | Đọc/validate controls, provenance, output exclusive và blinding |
| `lib/ai/controlled-reading-experiment.test.ts` | Filesystem tạm, integrity và không mutate |
| `docs/benchmarks/v9-2-review-2026-11-22/` | Ba packet anonymous, human preferences tối giản |
| `docs/benchmarks/v9-2-offline-2026-11-22.md` | Báo cáo triển khai/gates/chờ human |
| `lib/ai/__fixtures__/controlled-reading-holdout.json` | Chỉ tạo sau gate bởi curator độc lập |
| `lib/ai/controlled-reading-holdout.test.ts` | Hash/coverage/applicability của holdout sau gate |

## Task 1: Nội dung toàn bài và renderer

**Consumes:** `buildInterpretationEvidence(question, cards)`, `needsReadingSupport(question)`, `InterpretationResultSchema`, `InterpretationCardInput`, type-only `ReadingAnchorContext`.

**Produces:**
- `CONTROLLED_READING_VERSION = "controlled-reading-offline-2026-11-21"`.
- `renderControlledReading(question: string, cards: InterpretationCardInput[], context: ReadingAnchorContext | null): InterpretationResult | null`.
- `CONTROLLED_CARD_SYMBOLS`: record theo ba context, mỗi value là tuple ba string trung tính; renderer ghép các string vào perCard.text. Runner dùng đúng tuple này làm `renderedSymbol`, không viết bản paraphrase thứ hai. Không export toàn bộ kho template.

- [x] Viết tests ba fixtures development `relation-absent-1`, `relation-absent-2`, `relation-weak-3`: schema hợp lệ, ba vị trí đúng, tên/chiều đúng; perCard.text chứa string tương ứng trong `CONTROLLED_CARD_SYMBOLS`.
- [x] Test null/unknown/prototype context, support input trả null; lật từng orientation, thay một valid card, đảo thứ tự với vị trí hợp lệ đều null; invalid question/count/position/id trả đúng lỗi redacted của evidence.
- [x] Test input/deck không mutate và hai lần gọi trả object/arrays riêng. Test ba actions tối thiểu theo spec (chuyển: quy trình/điều kiện/thời điểm; vẽ: ví dụ đồ vật/5 phút linh hoạt; dọn: giờ mới/tần suất/chia việc).
- [x] Chạy `pnpm exec vitest run lib/ai/controlled-reading.test.ts`; xác nhận RED do module chưa tồn tại.
- [x] Viết renderer và ba mẫu đầy đủ theo spec. Dùng canonical evidence để validate; prose trung tính được soạn riêng, không lấy prose v9.1 hoặc raw question. Gắn tên/chiều canonical, giữ đúng từng vị trí. Dùng existing schema validation, không thêm detector.
- [x] Chạy focused tests GREEN; reviewer nội dung độc lập đối chiếu câu hỏi và nghĩa C đúng chiều trên toàn bộ ba outputs. Ghi field/excerpt/reason cho blockers và usefulness/card specificity; sửa development trước freeze, không sửa canonical deck.
- [x] Sau rà nội dung, khóa literal outputs bằng fixture `lib/ai/__fixtures__/controlled-reading-development.json` và hash renderer/deck/evidence. Test fixture chỉ là regression, không thay semantic review.

## Task 2: Runner và provenance integrity

**Consumes:** Task 1 exports, ba controls phiên bản anchors-offline-2026-11-21 từ thư mục `.model-compare/anchors-offline-2026-11-21/`, schema/validator v9 và benchmark development inputs.

**Produces:** `prepareControlledReadingExperiment(workspaceRoot: string, outputDir: string): Promise<string>` trong script mới; CLI dùng defaults theo spec và `if (import.meta.main)`. Từ chối output ngoài `.model-compare` và thư mục đã tồn tại.

- [x] Viết tests temporary filesystem cho nguồn hợp lệ: 3 inputs, 6 rows (control/candidate), control deep-equal nguồn, source bytes/hash không đổi, candidate deep-equal renderer và đầy đủ schema. Gắn sentinel vào prose body control để chứng minh không lọt sang candidate.
- [x] Test thiếu/trùng control, sai version/model/schema, tampered question/cards/hash, frozen source drift và output đã tồn tại. Mọi input failure dừng trước tạo output; lỗi public redacted không lộ câu hỏi/path nội bộ.
- [x] Chạy `pnpm exec vitest run lib/ai/controlled-reading-experiment.test.ts`; xác nhận RED.
- [x] Implement đọc `input.json`, `results.json`, `run.json` v9.1; kiểm tra đúng một control mỗi fixture/version, manifest provenance/source hashes và frozen v9.1 hash. Tính hash trên bytes đã đọc; giữ parsed validated objects để dựng output, không re-read giữa check/write.
- [x] Tạo candidate qua renderer, validate schema/position và ghi quality warnings. Null phải ghi not_applied, không đếm là candidate thành công; nếu không đủ ba cặp thì chưa tạo packet.
- [x] Ghi exclusive output input/results/run. run gồm sourcePromptVersion, controlTransformVersion, candidateTransformVersion, renderer/deck/evidence/source hashes, context/fingerprint, calls 0, appliedCount. Mỗi perCard provenance có C-ref, canonicalMeaning và renderedSymbol từ Task 1. Source model/usage là lịch sử, candidate generationMode là offline rendering.
- [x] Chạy focused tests GREEN, full `pnpm exec vitest run`, `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`. Review code mới và integrity; không coi warnings thấp là semantic pass.

## Task 3: Freeze, ba cặp review và human gate

**Consumes:** Task 2 artifacts; `buildReviewPackets(pairs)` của `scripts/prepare-benchmark-review.ts`.

**Produces:** Ba packet anonymous dưới docs và key/review riêng dưới `.model-compare/controlled-reading-offline-2026-11-21/`.

- [x] Chạy runner thật chỉ trên artifacts local; kiểm tra 3 pairs/6 rows, hashes, nguồn không đổi, 0 calls. Nếu development blocker chưa hết thì dừng NO-GO, không mời human chấm bản lỗi như thể gate đã qua.
- [x] Adapter trong runner tái dùng `buildReviewPackets`: baseline v9.1, candidate version mới, cards/question nguyên input, source model chỉ là metadata. Ghi review.md/review.json/preferences.json và private review-key.json. Human MD chỉ A/B/tie, bỏ mọi điểm số mặc định; không lộ provenance/version.
- [x] Test packet mapping đủ hai variants mỗi pair, anonymous public artifact không chứa tên variants/provenance, key tách riêng, preferences không scores. Không sửa packet builder chung nếu adapter đủ dùng.
- [x] Reviewer mới đọc anonymous packets, chỉ biết câu hỏi/cards/canonical evidence khi cần; rà toàn bộ prose của cả hai variants, không xem key hoặc human choices. Lưu riêng kết quả có hash, gồm blockers, concrete action và card specificity mỗi card.
- [x] Báo cáo triển khai và validation, giao ba phiếu cho người dùng; **dừng chờ choices**, không tạo holdout trước gate.
- [x] Khi người dùng xác nhận xong, khóa choices exclusive với source/hash, scores/flags null; sau đó mới mở key và semantic review. Gate: schema/metadata 100%; 0 blockers toàn bài; usefulness và liên hệ biểu tượng đúng chiều đạt cả ba context; candidate được chọn ≥2/3. Nếu không đạt, ghi NO-GO và dừng vòng.

## Task 4: Holdout mới chỉ sau gate

**Consumes:** Renderer đã freeze và gate Task 3 đạt; không có baseline AI cho câu mới.

**Produces:** Fixture mới, artifacts chỉ candidate, review và kết luận offline; không tích hợp production.

- [x] Curator khác chưa đọc renderer/templates/outputs tạo 6 positives mới (2/context) + ít nhất 3 manual-null negatives: phủ định, trích dẫn, yêu cầu cùng chủ đề vượt phạm vi. Không trùng benchmark/holdout v9/v9.1; lưu unknownFacts/relevanceNotes và frozen hash.
- [x] Test frozen hash, IDs/questions unique, counts/domain coverage, input hợp lệ, applicability đúng nhãn curator, biến thể lá/chiều/thứ tự abstain. Ghi rõ manual null không đo automatic routing.
- [x] Render toàn bài mới; không ghép body control hoặc suy ra sourceUsage. Reviewer mới chỉ đọc question/cards/output, đối chiếu nguồn biểu tượng khi cần, rà toàn bài và usefulness; không chỉnh frozen renderer theo kết quả.
- [x] Nếu có blocker hoặc không đáp ứng yêu cầu hành động cụ thể, ghi NO-GO cho ứng viên. Nếu đạt, chỉ ghi GO nghiên cứu offline. Không báo holdout win rate khi không có baseline; sáu inputs vẫn chỉ dùng ba templates.
- [x] Chạy checks phù hợp sau test/code mới, cập nhật report/task list với lựa chọn human thật, agent findings riêng, hashes, 0 calls và giới hạn. Task 5/production giữ chưa mở.

## Self-review và bàn giao

Spec coverage: renderer/content/abstention → Task 1; integrity/provenance → Task 2; review/human gate → Task 3; fresh holdout/stop → Task 4. Năm review-focus đều có test hoặc semantic review tương ứng; tests không được giả làm semantic detector. Không thêm general router/engine/runtime integration hoặc calls.

Đề xuất thực hiện trực tiếp trong phiên này (native), các reviewer/curator độc lập theo từng gate nội dung đã chốt; tránh chia implementation nhỏ vì hai module phụ thuộc chặt. Chờ người dùng review kế hoạch trước implementation theo writing-plans; không yêu cầu lại quyền cho các bước offline đã duyệt sau khi bắt đầu.

## Execution status — 22/11/2026

Tasks 1–2 đạt; Task 3 đã dựng ba packet và chờ human choices, kết quả reviewer mù niêm phong. Chưa mở Task 4. Full suite 631 passed/4 skipped; lint/typecheck/diff check đạt; fresh code review không findings. Giữ ledger vì chưa kết thúc gate human, không commit theo spec. CLI dùng convention require.main hiện có thay import.meta.main; dùng node --import tsx để không cần IPC của tsx CLI.

## Kết thúc vòng — 22/11/2026

Human preferences khóa trước mở key: candidate 3/3; gate development đạt. Holdout mới 6+3 hoàn tất, reviewer chỉ 2/6 usefulness pass; 4 ca bỏ sót điều kiện thực tế. NO_GO_CANDIDATE, không sửa bản freeze. Full suite 647 passed/4 skipped; lint/typecheck/diff check đạt. Task 4 hoàn tất đánh giá, không đồng nghĩa chất lượng đạt. Không API calls/commit/deploy; production vẫn v7.
