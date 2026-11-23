# v9.3 Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan inline. Steps use checkbox (`- [ ]`) syntax for tracking. Independent annotation/content reviewers and final code review remain separate as specified below.

**Goal:** Kiểm tra bảy rule biến facts có source spans do curator gán thành hành động đáp ứng điều kiện, trên hai context và bốn ca development.

**Architecture:** Renderer mới validate source spans rồi dựng toàn bộ bài từ prose trung tính và rule theo kind; chỉ tái dùng CONTROLLED_CARD_SYMBOLS/evidence/guards. Runner mới validate toàn run, pin controls v9.2, báo applied hoặc abstention/gaps; packet builder hiện có xáo bốn cặp A/B. Không extraction hoặc router tự động.

**Tech Stack:** TypeScript, Zod, Node filesystem/crypto, Vitest và pnpm hiện có; không dependency mới.

**Spec:** `docs/superpowers/specs/2026-11-22-tarot-ai-v9-3-constraints-design.md`, người dùng duyệt ngày 22/11/2026.

## Global Constraints

- Version mới `constraint-reading-offline-2026-11-22`; 0 model API calls; không commit/push/deploy.
- Giữ active v7 và frozen v9/v9.1/v9.2, deck/schema/parser/providers, DB/credit/UI/Reflection/dependencies. Không sửa source cũ để làm tests/gate qua.
- Chỉ transfer và housework_schedule, fingerprint đúng v9.2, context/annotation từ curator nội bộ; không client input hoặc model phân loại.
- Bốn ca v9.2 thất bại là development. Holdout mới chỉ tạo sau freeze và human/reviewer gate, không chỉnh bản freeze theo holdout.
- Human chỉ A/B/tie, không tự suy scores/semantic labels. Production NO-GO dù nghiên cứu đạt.
- Đọc installed Next.js guide liên quan trước sửa code; kiểm tra workspace/status/hashes, giữ mọi thay đổi và lựa chọn người dùng đang có. Không reset/chuyển workspace làm mất dữ liệu.

## Review Focus

1. Span khớp nhưng nhãn sai/phủ định/trích dẫn/qualifier bị mất: cấu trúc không chứng minh semantics; annotation review riêng (Tasks 1–2).
2. Support question đồng thời facts sai hoặc context null: lỗi cấu trúc trước, support rồi scope rồi constraints; có tests ưu tiên nhánh (Task 1).
3. Một điều kiện chưa hỗ trợ bị bỏ qua để trả bài partial: toàn ca abstain và gaps rõ, không coi null là pass (Task 2).
4. Prose phủ nhận dữ kiện người hỏi đã cung cấp hoặc action lặp quote mà không xử lý: review toàn bài, đủ coverage không thay usefulness (Tasks 1,3–4).
5. Artifact/schema/pins/labels drift sau khi freeze: validate bytes đọc một lần, exclusive outputs, source/annotation hashes và fixture tests portable (Tasks 2–4).

## Files và giao diện

| File | Trách nhiệm |
|---|---|
| `lib/ai/constraint-reading.ts` | Fact schema/validation, guards, hai mẫu prose, bảy action rules, coverage |
| `lib/ai/constraint-reading.test.ts` | Boundary/priority/rule/perturbation/output tests |
| `lib/ai/__fixtures__/constraint-reading-development.json` | Bốn câu đã xem cùng manifests và facts do curator gán, không prose candidate |
| `scripts/prepare-constraint-reading-experiment.ts` | Whole-run source/manifest gates, artifact/provenance và packet adapter |
| `lib/ai/constraint-reading-experiment.test.ts` | Filesystem tạm, integrity, abstention/gaps và blinding |
| `lib/ai/__fixtures__/constraint-reading-controls.json` | Bytes controls/provenance v9.2 synthetic cho tests độc lập ignored files |
| `lib/ai/__fixtures__/constraint-reading-reviewed.json` | Literals sau content review, chỉ regression/freeze |
| `docs/benchmarks/v9-3-review-2026-11-22/` | Phiếu P1–P4/preference-only |
| `docs/benchmarks/v9-3-offline-2026-11-22.md` | Report validation/human gate/giới hạn |
| `lib/ai/__fixtures__/constraint-reading-holdout.json` | Chỉ tạo sau gate, câu mới và annotation độc lập |
| `lib/ai/constraint-reading-holdout.test.ts` | Frozen hashes, coverage/applicability của bộ mới |

Các exports trong module renderer:

- `CONSTRAINT_READING_VERSION = "constraint-reading-offline-2026-11-22"`.
- `ConstraintContext = "transfer" | "housework_schedule" | null`.
- `ConstraintFact = { id: string; kind: ConstraintKind; start: number; end: number; quote: string }`; ConstraintKind gồm chính xác bảy enum ở spec.
- `ConstraintCoverage = { factId: string; supportRef: "F1"; actionIndex: number }`.
- `ConstraintReadingOutcome` là union applied/result/coverage hoặc not_applied/reason theo spec, không output/coverage ở nhánh abstain.
- `validateConstraintInput(question: string, cards: InterpretationCardInput[], context: ConstraintContext, facts: ConstraintFact[])` trả `{ evidence: ReturnType<typeof buildInterpretationEvidence>; context: ConstraintContext; facts: ConstraintFact[] }` sau validation cấu trúc/span. Không quyết định support hoặc render. Runner tái dùng để kiểm tra annotation dù manifest gate sẽ abstain; không viết validator span thứ hai.
- `renderConstraintReading(question: string, cards: InterpretationCardInput[], context: ConstraintContext, facts: ConstraintFact[]): ConstraintReadingOutcome`.

## Task 1: Facts có nguồn và renderer theo kind

**Consumes:** evidence/support/schema/position validator hiện có, CONTROLLED_CARD_SYMBOLS từ module frozen v9.2. Không gọi renderControlledReading trong candidate.

**Produces:** exports trên, manifests development và bốn outputs được rà toàn bài.

- [x] Đọc guide Vitest cài trong Next.js, ghi baseline hashes v9/v9.1/v9.2/deck/evidence/relations/registry và nguồn holdout v9.2. Ghi ledger trong `.model-compare/v9-3-work/`; không sửa artifacts cũ.
- [x] Curator không xem candidate/rules prose gán facts cho bốn câu transfer/housework trong fixture holdout v9.2. Manifest mỗi ca: id/question/cards/context/facts/scopeSupported/annotationComplete/excludedConstraints và annotation provenance. Kind/span phải giữ toàn bộ qualifier, không thêm suy luận; runner không nhận text hành động từ manifest.
- [x] Viết tests source đã trim, offsets UTF-16 end-exclusive, emoji/combining characters không normalize; quote sai/trắng/out-of-range/noninteger, IDs trùng/rỗng, unknown enum/prototype context, >7 facts throw `Invalid constraint reading input.`. Unknown extra prose field trong fact bị từ chối, không trở thành chỉ thị.
- [x] Test ưu tiên: malformed facts + support/null/wrong fingerprint vẫn throw; cấu trúc đúng + support trả needs_support; null/fingerprint sai trả unsupported_scope; đúng scope + facts rỗng hoặc kind thuộc context khác trả unsupported_constraints không partial result.
- [x] Test đủ bảy kinds bằng câu synthetic khác development. Action tương ứng giữ nguyên quote/qualifier và có thao tác theo bảng spec. Mỗi fact có đúng một coverage mapping F1/index hợp lệ, không có fact lạ; nhiều facts cùng kind không mất entry hoặc bị gộp. Text có ký tự markup/code được coi là dữ liệu text, không thực thi.
- [x] Test đổi số/cửa sổ/hạn bàn giao trong source và span hợp lệ khiến action tương ứng đổi, không còn quote cũ; prose biểu tượng không liên quan giữ nguyên. Test input/deck không mutate, object/arrays riêng mỗi lần.
- [x] Chạy `pnpm exec vitest run lib/ai/constraint-reading.test.ts`, xác nhận RED thiếu module/implementation.
- [x] Implement exports; validate toàn cấu trúc trước guards, evidence errors chuyển thành lỗi redacted mới. Soạn prose mới cho hai context, dùng symbols đúng chiều. Actions mỗi fact theo thứ tự manifest, coverage index đúng; thêm action nền cần thiết sau các action theo fact. Không parse số/giờ hoặc khẳng định quan hệ giữa các điều kiện mà source chưa xác nhận.
- [x] Chạy focused GREEN. Reviewer khác curator rà annotation đầy đủ/đúng nguồn và mọi field của bốn candidate, usefulness cho từng điều kiện, specificity ba lá, loaded premises/contradictions. Sửa development trước freeze; lưu kết quả review riêng, không gọi đây là review mù.
- [x] Sau content review đạt, ghi reviewed literal fixture và test deep equality; khóa hashes. Snapshot chỉ chứng minh regression, không semantic correctness.

## Task 2: Runner whole-run validation và abstention reporting

**Consumes:** Task 1 validation/render exports, bốn manifests, source `.model-compare/controlled-reading-offline-2026-11-21/holdout-results.json` và pinned provenance v9.2. Controls đúng bốn output theo input, không output của câu hỏi khác.

**Produces:**
- `prepareConstraintReadingExperiment(workspaceRoot: string, outputDir: string): Promise<string>`.
- `prepareConstraintReadingReview(workspaceRoot: string, experimentDir: string, reviewDir: string): Promise<string>` trong cùng script, dùng buildReviewPackets.
- Output mới `.model-compare/constraint-reading-offline-2026-11-22/`: input.json/results.json/run.json; annotations/coverage/gaps private trong artifacts, không public packet.

- [x] Bundle bytes nguồn synthetic vào controls fixture; filesystem tests chép fixture và source files cần thiết vào temp root, không đọc raw ignored artifacts để chạy tests.
- [x] Viết test happy path: 4inputs/8rows, controls deep-equal nguồn, candidates đúng renderer/schema/vị trí; source bytes không đổi; sourceUsage nếu có chỉ thuộc lịch sử control, không copy sang candidate. Provenance có từng fact/span/kind/coverage cùng C-ref/nghĩa nguồn/rendered symbol, renderer/deck/evidence/annotation/source hashes và generationCalls 0.
- [x] Test manifest thiếu field/sai enum/span/ref duplicate, control thiếu/trùng/input-card/version mismatch, annotation/source/frozen hash drift: dừng trước ghi output với `Invalid constraint reading experiment artifacts.`. Test late-case error không để ba ca đầu ghi partial output.
- [x] Test valid unsupported manifests từng nhánh scopeSupported=false, annotationComplete=false và excludedConstraints: không gọi renderer để tạo candidate; row origin manifest_gate/reason đúng, không result/coverage. coverageGaps ghi mọi fact chưa dùng, excluded quote/reason không ép kind, annotation_incomplete khi cần. Một fact ngoài context ở renderer tạo origin renderer/unsupported_constraints và không bỏ qua fact đó.
- [x] Test output ngoài `.model-compare` và overwrite bị từ chối; key không nằm trong public review. Test packet không được tạo khi thiếu một trong bốn applied candidates hoặc source/hash drift sau freeze.
- [x] Chạy `pnpm exec vitest run lib/ai/constraint-reading-experiment.test.ts`, xác nhận RED trước code.
- [x] Implement validate mọi source/manifest/input/span cho toàn run trước mkdir. Giữ bytes/objects đã validate để render/hash, không đọc lại sources giữa check và write. Nếu source holdout không có version trên từng row, đối chiếu envelope run.rendererHash/candidateTransformVersion và input/output đúng bằng nguồn frozen; không giả định field không tồn tại.
- [x] Ghi applied rows hoặc not_applied/gaps đúng spec; applied rows không gaps. Manifest gate valid abstention vẫn phải giữ source input/support references đã validate. Context null/support scope báo reason theo priority đã chốt; không gán facts ngoài source để làm đủ mẫu.
- [x] Implement review adapter: đủ bốn pairs, anonymous P1–P4, balanced A/B; chỉ output/question/card names. Không đưa facts/coverage/transform ID vào public packet, human MD/preferences chỉ A/B/tie. Key private exclusive, không overwrite. CLI theo require.main convention, chạy bằng node --conditions=react-server --import tsx.
- [x] Chạy focused GREEN rồi full `pnpm exec vitest run`, `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`; fresh code review toàn extension. Không đọc key/reviewer blind findings để sửa candidate.

## Task 3: Freeze và human gate P1–P4

**Consumes:** Tasks 1–2 GREEN, annotation/content/code review không blocker, sources/hashes không đổi.

**Produces:** Bốn packet, sealed semantic review, report trạng thái chờ human; sau choices có structured gate result.

- [x] Chạy runner local tạo actual artifacts, xác minh bốn applied/eight rows, đúng nguồn mỗi control và 0calls. Nếu thiếu applied hoặc development blocker, báo NO-GO; không thay control/giảm mẫu để đủ số.
- [x] Tạo packet P1–P4 bằng review adapter, lưu hash packet/key cùng frozen source hashes. Reviewer mới chỉ xem anonymous question/cards/output và deck khi cần; rà toàn bài với đủ điều kiện trong câu hỏi, usefulness/card specificity riêng; ghi field/excerpt/reason và pass status từng candidate. Không xem annotations riêng/key/human choices.
- [x] Lưu reviewer findings riêng và hash trước human choices. Giao phiếu; **dừng chờ người dùng chọn**, không tạo holdout lúc này.
- [x] Khi user xác nhận xong, parse đúng choices và khóa exclusive kèm source hash trước mở key/review. Nếu thiếu/mâu thuẫn choices thì hỏi đúng phần thiếu, không tự điền tie/điểm.
- [x] Chốt development gate: schema/metadata/span/coverage 100%; không blocker semantic toàn bài; mọi điều kiện đủ actionable response, ba lá đúng specificity mỗi bài; human chọn candidate ít nhất 3/4. Báo abstentions riêng không tính pass. Nếu fail, ghi NO_GO_CANDIDATE và kết thúc vòng; preference không biến thành human semantic labels.

## Task 4: Holdout mới và kết luận

**Consumes:** Task 3 gate đạt, renderer/prose/rules/deck/annotation protocol đã freeze. Không chỉnh rules để phù hợp dữ kiện holdout.

**Produces:** Fixture/candidate-only artifacts/review và verdict, không production integration.

- [ ] Curator chưa đọc rules/outputs soạn 4 positives mới (2/context, dữ kiện/thời điểm/giới hạn mới thuộc bảy kinds) và ít nhất 3 negatives ngoài scope (phủ định, trích dẫn, constraint chưa hỗ trợ/thiếu dữ kiện để khẳng định chính xác). Câu mới không trùng mọi development/holdout đã xem; không reuse bốn lỗi v9.2 như câu chưa xem.
- [ ] Annotator khác curator không xem output gán facts/manifest. Negatives dùng scope flags/excludedConstraints phù hợp, không nhét unsupported kinds vào enum để giả test abstention. Reviewer kiểm tra annotation/kind/qualifier/completeness, nhãn manual không được quảng bá thành extraction/router tự động.
- [ ] Viết validation-only tests hash freeze, unique questions/counts, fact spans/coverage cho applied positives; negatives ghi abstention/gaps, không result; biến thể lá/chiều/thứ tự abstain. Không sửa renderer để làm test snapshot pass.
- [ ] Tạo outputs mới không ghép body/control cũ. Reviewer mới đọc source question/cards/facts/output, rà annotation và toàn bài: một blocker hoặc thiếu hành động cho điều kiện quan trọng là NO_GO_CANDIDATE. Không lọc fail hoặc relabel thành negative sau xem output.
- [ ] Chạy checks phù hợp sau test/code mới, ghi report/JSON/task list: gate, human preference thật, agent findings riêng, applied/abstention counts, bảy kinds được thử/không thử, hashes, editorial warnings và 0calls. Không có baseline AI mới thì không holdout win rate. Dù đạt chỉ GO nghiên cứu downstream với annotation thủ công đúng; production/task5 vẫn NO-GO.

## Self-review và bàn giao

Contract/span/guards/rules/prose → Task 1; whole-run manifest/integrity/gaps → Task 2; blinded preference gate → Task 3; fresh inputs/independent annotation/limits → Task 4. Review-focus đều có test cấu trúc hoặc review semantic được chỉ định; không có test nào tự chứng minh nhãn curator đúng.

Giữ cách triển khai trực tiếp trong phiên đã dùng cho v9.2; reviewers/curators độc lập ở các gate đã chốt, không chia nhiều implementation agents cho hai module phụ thuộc chặt. Chưa triển khai code trong lượt lập kế hoạch này. Chờ review kế hoạch theo writing-plans trước bắt đầu; khi bắt đầu không xin lại quyền cho các bước offline đã duyệt, chỉ dừng ở human choices hoặc blocker thật.

## Execution status — 22/11/2026

Tasks 1–2 hoàn tất, 696 tests passed/4 skipped, lint/typecheck/diff check đạt. Annotation đã giữ mốc “cuối tuần này” sau review trước freeze. Fresh code review không findings. Đã dựng 4 cặp P1–P4; Task 3 dừng chờ human choices, key/review findings riêng. Chưa mở Task 4. Không API calls/commit/runtime changes.

## Kết thúc gate — 22/11/2026

Human choices khóa trước key/review: candidate 0/4, control 4/4. Agent rubric candidate pass 4/4 nhưng human threshold ≥3/4 không đạt. NO_GO_CANDIDATE; Task 4 không chạy theo điều kiện kế hoạch, không còn implementation bắt buộc trong vòng này. Không đổi source/hashes hoặc mở ứng viên mới.
