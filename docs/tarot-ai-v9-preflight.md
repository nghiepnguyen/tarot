# Tarot AI v9 — Offline Preflight

Ngày: 20/11/2026. Snapshot: `81998706a409e2c1278217b8c87c552eef8bb622`, branch `main`.
Phạm vi: Phase 0, audit code và artifacts tổng hợp hiện có; chỉ ghi báo cáo/checklist. Không tạo feature branch, sửa code, gọi model, thay database hoặc deployment.

## Cập nhật sau task 3 — 20/11/2026

Candidate `v9-2026-11-20` và evidence/relations đã triển khai offline trên nhánh `codex/tarot-ai-v9-evidence-grounded`. Active vẫn v7; 58 ca baseline v8/v8.1 giữ nguyên hash input. Kiểm tra mới: 556 tests passed, 4 skipped; lint/typecheck đạt; code review không có actionable findings. Chưa gọi model, benchmark chất lượng hoặc sửa rủi ro credit. Chi tiết trong task list và kế hoạch `docs/superpowers/plans/2026-11-20-tarot-ai-v9-implementation.md`. Tiếp theo task 4; chưa GO release. Các kết luận phía dưới giữ mốc lịch sử P0/task 2.

## Cập nhật sau task 2 — 20/11/2026

Thiết kế `docs/superpowers/specs/2026-11-20-tarot-ai-v9-design.md` đã chốt representation F/C/R/H, semantic abstention, protocol và release gates; builder check không còn câu hỏi quan trọng. **READY FOR IMPLEMENTATION — OFFLINE CANDIDATE ONLY** cho task 3 khi người dùng yêu cầu triển khai. Chưa có bằng chứng v9 đạt chất lượng, chưa duyệt paid benchmark và chưa GO production. Các rủi ro credit/rollout nêu ở P0 vẫn giữ nguyên. Kết luận NOT READY bên dưới là quyết định tại thời điểm P0 trước khi hoàn tất thiết kế, được giữ để truy lại bằng chứng.

## Executive summary và quyết định P0 (lịch sử)

**NOT READY — NEEDS MORE EVIDENCE cho implementation v9 hoàn chỉnh.** Đủ bằng chứng để chuyển sang task 2: chốt thiết kế một thử nghiệm offline phương án B. Không đủ bằng chứng để coi B là giải pháp đã hiệu quả hoặc phát hành production.

Các khoảng trống cần giải quyết trước task 3: facts extraction không được tự thêm nghĩa; quy tắc relevance chưa xác định; bộ nhãn semantic chưa độc lập; chưa chốt số lượt/người chấm/ngân sách/latency gate. Semantic detector không được dùng làm điều kiện tự động cho qua khi chưa đo sai số. Không cần đợi production data để thiết kế các bước này.

Phát hiện mới quan trọng: v8.1 đã có thử nghiệm hai bước và model kiểm tra dàn ý nhưng vẫn sai. Input v7 kế thừa chứa yêu cầu hidden question/core tension, và ví dụ system prompt tự gán tình tiết đời thực. Đây là cơ chế khả dĩ cần thử đối chứng, không phải nguyên nhân duy nhất đã chứng minh. Credit có cửa sổ lỗi ngoài khối refund; không được tuyên bố mọi nhánh lỗi đều an toàn.

## 1. Phương pháp và provenance

- VERIFIED: đã đọc registry, v4/v5/v6/v7/v8/v8.1, providers, parser/quality, unlock, metrics, Reflection, draw/cards, validation, fixtures/harness và các báo cáo benchmark. Dẫn nguồn bên dưới theo file/line của snapshot.
- VERIFIED: working tree ban đầu có hai file chưa track: báo cáo nguồn 20/11 và task list v9. Không reset, checkout hoặc thay đổi các file sản phẩm.
- VERIFIED: đọc 8 raw candidate artifacts v8.1 trong `.model-compare/`, đối chiếu ID và câu vi phạm với báo cáo. Các artifacts là dữ liệu tổng hợp, không phải câu hỏi thật. Phụ lục lưu đường dẫn và trích đoạn để truy lại cục bộ; artifacts không được bảo đảm có trong Git.
- Chỉ số lịch sử được ghi là REPORTED khi chưa tính lại hoặc chấm lại đầy đủ. Không xác minh deployment, API/provider hiện hành, upstream mới nhất hoặc pricing hiện hành bằng mạng.
- Công cụ graft không tìm được symbol hằng `PROMPT_V8`; đã fallback sang tìm mọi tham chiếu trong source. Không coi graph là nguồn đầy đủ.

## 2. Architecture assessment và gap matrix

| Hạng mục | Bằng chứng | Trạng thái / quyết định |
|---|---|---|
| Active prompt | `lib/ai/prompts/index.ts:22,31` | VERIFIED registry có v8/v8.1, active là v7 trong mã; deployment UNKNOWN |
| Quan hệ | `lib/ai/prompts/v8.ts:7` | VERIFIED cùng chất cả spread, cặp cùng chất khác số, cặp cùng số khác chất; tối đa 2, không có relevance theo câu hỏi |
| V8.1 | `lib/ai/prompts/v8-1.ts:4` | VERIFIED cùng input/schema/validator v8, thêm chỉ dẫn; chưa có evidence engine |
| Card evidence | `lib/tarot/cards.ts:1`, `lib/ai/prompts/v6.ts:8` | VERIFIED có ID, category, keywords và nghĩa xuôi/ngược; tái dùng, không nhập 78 nghĩa upstream |
| Fact grounding | `lib/ai/prompts/v6.ts:11` | VERIFIED question nguyên văn, context rỗng; chưa có facts/supportRefs được kiểm tra |
| Quality gate | `lib/ai/quality.ts:1`, `lib/ai/parse-output.ts:5` | VERIFIED JSON/schema/position; warning độ dài/lặp/regex văn phong, không chứng minh semantic correctness |
| Draw | `lib/tarot/draw.ts:14` | VERIFIED Fisher–Yates với Math.random và chiều 50/50; giữ nguyên |
| Input boundary | `lib/validation/reading.ts:6` | VERIFIED 3 ID khác nhau, position đúng thứ tự, orientation enum, question 1–300 ký tự sau trim; tái dùng khi cần |
| Dynamic Reflection | `lib/ai/dynamic-reflection.ts:17`, `app/actions/reflection.ts:23` | VERIFIED luồng riêng, tối đa 150 đơn vị, cardRefs 1–2, timeout 8s, feature setting/rate limit; không cần xây Four-Lens mới |
| Upstream | review 11/11 và báo cáo 20/11 | REPORTED phạm vi cards/combinations/license; chưa pin/đọc upstream lại. Không copy nên chưa phát sinh thay đổi license |

Relations mang orientation/position trong refs nhưng quyết định tồn tại và thứ tự chọn dựa chất/hạng và thứ tự input; không có quan hệ nhân quả đời thực. Ba lá cùng chất có thể chiếm hai slot bởi một spread observation và một pair; cần giữ baseline khi extraction, thử selector mới chỉ trong candidate.

Nghĩa card canonical hiện có cũng chứa câu mang sắc thái khẳng định (ví dụ Magician: “Mọi nguồn lực đã sẵn sàng”). Cần gắn nhãn C là nghĩa biểu tượng, không tự đổi nghĩa bộ bài trong v9 để tránh đổi nhiều biến cùng lúc.

## 3. Luồng trạng thái và rủi ro

`auth → ownership/read reading → needsReadingSupport → trả bản đã lưu nếu có → rate limit → resolve model → decrement credit có điều kiện → đọc balance → ghi UNLOCK_SPEND → try dựng cards → metrics/generate → provider → parse/schema/position/style → lưu interpretation → revalidate history → display`.

Trong catch: report lỗi → tăng lại credit → ghi REFUND → trả lỗi. Safety trước credit/model; bản legacy đọc lại bằng `toDisplayInterpretation`, không validate lại bằng schema mới. History dùng cùng adapter (`app/history/page.tsx:137`).

**Rủi ro credit VERIFIED về cấu trúc, INFERRED về tác động khi lỗi:** `app/actions/ai.ts:65–90` trừ credit, đọc balance và ghi spend trước try. Nếu đọc balance hoặc ghi ledger thất bại sau debit, catch refund không chạy. Refund và ghi refund ledger cũng là hai thao tác riêng; lỗi DB/concurrency cần test riêng trước rollout. Tests hiện có chứng minh refund khi generate trả invalid JSON/schema/position và giữ legacy, chưa chứng minh mọi lỗi DB/timeout hoặc unlock đồng thời. Không sửa credit trong P0; tách regression/fix hẹp nếu xác nhận bằng mock fault injection.

Timeout 45s nằm ở từng provider (`lib/ai/interpretation.ts:23`, Gemini/DeepSeek dùng AbortSignal). Đây không phải deadline end-to-end. Pages home/history khai báo maxDuration 60s. Gemini attempts=1, DeepSeek không retry. Multi-call không tự chia sẻ một deadline nên hai call 45s có thể vượt trần. Metrics/DB/refund còn cần thời gian ngoài provider. Reflection riêng có timeout 8s, không có debit trong action.

Metrics hiện lưu version/model/token/latency và số warning, không lưu câu hỏi. Validation errors không mang raw output. DeepSeek có thể đính 500 ký tự response lỗi vào exception; đây là rủi ro cần kiểm tra redaction, chưa thấy bằng chứng rò dữ liệu người dùng. Harness ghi input/output ra đĩa: chỉ dùng fixtures tổng hợp, không tái dùng cho câu hỏi thật.

## 4. Root-cause analysis theo bằng chứng

### 4.1 Tám ca vòng 1

| Ca | Dữ kiện hợp lệ | Lỗi đối chiếu artifact/report | Điều cần kiểm chứng ở v9 |
|---|---|---|---|
| weak-1 | Muốn chuẩn bị góp ý đồng nghiệp | Cặp 9 biến thành năng lực/thành quả có sẵn | Bỏ quan hệ vẫn phải có hành động hữu ích; “ví dụ nếu có” |
| weak-2 | Vừa đăng ký học thử | Gán mệt mỏi/phòng thủ và trải nghiệm học thất vọng | Chỉ hỏi tiêu chí lớp, không dựng lịch sử học |
| weak-3 | Bạn cùng nhà đề nghị đổi lịch | Biến quy ước/lịch từng vận hành thành tiền đề | Phân biệt đề nghị hiện tại với lịch sử thỏa thuận chưa biết |
| weak-4 | Sắp xem căn hộ lần đầu | Gán nôn nóng/chi tiết bị che giấu | Checklist có điều kiện, không đọc ý chủ nhà |
| absent-1 | Cân nhắc chuyển nhóm | Gán bế tắc, né tránh, động lực suy giảm | Không suy ra lý do chuyển từ lá |
| absent-2 | Muốn vẽ lại sau nghỉ | Gán nhịp sinh hoạt quá tải | Tách bước thử lịch mới khỏi kết luận lịch đang bận |
| absent-3 | Gửi hồ sơ, chưa phản hồi | Khẳng định quy trình nội bộ chưa hoàn tất | Trạng thái bên nhận UNKNOWN; chỉ kiểm tra mốc/kênh |
| absent-4 | Muốn mời bạn lâu chưa gặp | Gán sợ từ chối và khó xếp lịch như hệ quả tất yếu | Lời mời mở, không dự đoán phản ứng |

REPORTED vòng 1: 8/8 valid mỗi bản, unsupported claims 8/8 mỗi bản, forced relations 3/4 ca yếu; v8.1 thắng 2 hòa 6. Đã đối chiếu raw v8.1, không chấm mù lại toàn bộ v8. V8 trước đó thắng 2/3 quan hệ mạnh so v7 nhưng grounding và safety direct-model không đạt. Một model, một lượt/ca, một người chấm: không suy rộng thành tỷ lệ production.

### 4.2 Giả thuyết xếp theo bằng chứng và phép bác bỏ

1. **INFERRED — ví dụ và mục tiêu viết xung đột grounding.** `v7-system.ts:1` có ví dụ “vết thương từ sự thất vọng gần đây”, còn v6 yêu cầu hiddenQuestion/coreTension và ưu tiên specificity/insight trước evidence. V8.1 nối chỉ dẫn mới nhưng giữ toàn bộ nền này. Đối chứng: cùng evidence/input/schema, thay riêng các chỉ dẫn/ví dụ xung đột; nếu lỗi không giảm, không coi đây là nguyên nhân đủ.
2. **VERIFIED về cơ chế thiếu kiểm tra, INFERRED về đóng góp:** validator không so claims với question, không có supportRefs; JSON đúng vẫn qua. Đối chứng offline bằng output gán nhãn, không dùng regex tự xưng hallucination detector.
3. **INFERRED — relation là chất xúc tác, không phải nguyên nhân duy nhất.** Cả 4 ca absent vẫn có lỗi; chỉ tách relation module không giải quyết grounding. Ablation có/không relations trên cùng weak/absent và mẫu mới.
4. **REPORTED — cả planner và writer có thể thêm tiền đề.** Hai ca thử luồng hai bước: dàn ý tự động gài cảm xúc/tiêu chuẩn; bài từ dàn ý rà vẫn biến điều kiện thành “bằng chứng sẵn có” hoặc “kênh đã chỉ định”. Dùng C làm fallback mặc định không có cơ sở.
5. **REPORTED — semantic judge chưa đáng tin.** Thử kiểm tra dàn ý phát hiện 3/6 mục, bỏ sót 3, thêm 6 cờ ngoài nhãn; 1/4 bản đã sửa vẫn bị chặn. Cần adjudication độc lập trước khi gọi tất cả cờ ngoài nhãn là false positive.

Bằng chứng 4–5 nằm trong các mục thử sau vòng 1 của báo cáo v8.1, không chỉ executive summary. Mẫu ngắn dựng nguyên văn từ nội dung rà thủ công giảm lỗi ở mẫu hẹp, nhưng chưa chứng minh chất lượng đọc bài đầy đủ theo nghĩa lá hoặc giá trị bài trả phí.

## 5. Thiết kế tiếp theo — PROPOSED, chưa triển khai

| Phương án | Đánh giá |
|---|---|
| A prompt-only | Dùng làm đối chứng rẻ, loại chỉ dẫn xung đột; chưa đủ bằng chứng để release |
| B evidence deterministic + một call | Ưu tiên thử: testable, ít tác động deadline/schema. Không tự tách semantic facts bằng keyword/regex |
| C planner + writer/judge | Chưa ưu tiên: thử cũ vẫn sai, thêm latency/cost và deadline/refund risk |

F tối thiểu là question nguyên văn có nhãn nguồn, hoặc trích đoạn có offset kiểm tra được; trích đúng vẫn không chứng minh mô hình hiểu đúng phủ định. Không tạo câu paraphrase factual bằng deterministic code mà không có cơ chế bảo toàn nghĩa. C lấy ID/position/orientation/category/meaning canonical nhưng label là symbolic. R1 thuần cấu trúc tái dùng v8; R2 chỉ thêm khi có định nghĩa/nguồn; R3/R4 không giả làm fact. H chỉ là câu hỏi/điều kiện nội bộ, supportRefs không được coi như bằng chứng đời thực nếu chỉ trỏ C/R.

Pipeline một call: validate input → build F/C/R → prompt candidate → parse schema hiện có → đánh giá offline. H không cần thêm vào output/UI/DB; chưa tạo claim planner service hoặc semantic auto-retry. Cho phép không chọn R; relevance cần task 2 định nghĩa rõ, chưa có thuật toán đáng tin để hứa deterministic relevance theo câu hỏi tự do.

## 6. File-level plan và phạm vi ảnh hưởng

- `lib/tarot/relations.ts` + test: extraction thuần; v8/v8.1 giữ byte-equivalent input khi refactor. Consumer trực tiếp: v8 buildPrompt → v8.1 → registry/harness; tests v8/v8.1/benchmark-cases.
- `lib/ai/evidence.ts` + test: candidate-only, tái dùng validation/types; không sửa nghĩa bộ bài hoặc draw.
- `lib/ai/prompts/v9.ts`, `index.ts`, registry tests: candidate cùng schema/parser v7; active vẫn v7. Registry còn được admin prompts, compare script và admin stats tests đọc.
- `lib/ai/benchmark-cases.ts`, harness/tests: thêm nhãn và holdout, tái dùng selector baseline/candidate đã có; không xây CLI mới.
- `lib/ai/quality.ts`: hoãn semantic warning runtime nếu chưa có nhãn/độ tin cậy; giữ quality editorial.
- `app/actions/ai.ts`, providers, metrics, Reflection, history, UI: audit/compatibility tests; không sửa hành vi trong vòng evidence đầu.

Graft trace `generateMeasuredInterpretation` xác định unlock action, metrics tests, handleUnlock/AiUnlockPanel và unlock tests. Tìm tham chiếu source bổ sung history adapter, admin registry và Reflection. Không cần DB migration, dependency, payment/PayOS, UI hoặc spread mới.

## 7. Benchmark plan và release gates cần chốt ở task 2

Harness hiện hỗ trợ chọn hai prompt ID/model/case/limit, gọi cặp cùng input và ghi blind files. Mỗi lần chạy là một cặp; so v7/v9 và v8.1/v9 riêng. A/B hiện đảo theo index chẵn/lẻ, không random bí mật; nếu chạy --case riêng thì index luôn 0, dễ lộ baseline. Cần xáo/relabel ngoài harness hoặc sửa tối thiểu, giấu blind-key đến khi khóa điểm. Không coi output schema hợp lệ là grounding đạt.

PROPOSED: tập development 8 weak/absent cũ + strong/orientation/position; holdout mới tối thiểu 12 ca gồm sparse, third-party, phủ định, prompt injection và nhạy cảm. Safety direct-provider và safety action chấm riêng. Chạy 3 lượt/ca/version trên cùng model/config sau khi duyệt ngân sách; hai người chấm độc lập, phân xử claim-level. Đây là đề xuất, chưa chốt số mẫu/người chấm/ngân sách. Không tính các lượt lặp là câu hỏi độc lập.

Chấm 0–2 cho grounding, specificity, connections, tiếng Việt và hành động; flags unsupported_claim/forced_relation/third_party_mindreading có trích đoạn và nguồn. Ghi win/tie/loss; mẫu số thắng gồm hòa, tổng hợp theo câu hỏi rồi theo lượt để tránh phóng đại N. Precision/recall detector chỉ sau khi phân xử nhãn.

Gate đề xuất kế thừa: 0 lỗi card/position/orientation (card/chiều cần người chấm vì schema chỉ có position), 100% valid trên mẫu, 0 unsupported/forced trên release-blocking set, ≥60% thắng strong so v7, median cost tăng ≤10%, credit cuối cùng không giảm ở nhánh lỗi và ledger nhất quán. Thêm safety không đọc bài ở action khi bị chặn. Chốt latency budget end-to-end trước chạy; không đánh đồng p95 provider <45s với toàn bộ action <60s.

Rollback: giữ v7 registry/schema/adapter, kiểm tra đọc legacy + candidate rows bằng mocks; chỉ đổi active khi được duyệt release. Rollback về v7 chỉ ảnh hưởng lượt mới, không tự viết lại các interpretation đã lưu. Xác minh build/staging/rollout riêng trước production, chưa thực hiện P0.

## 8. Kiểm chứng thực hiện trong P0

Đã chạy `pnpm test --` kèm 15 đường dẫn liên quan. Do cách script truyền dấu `--`, Vitest thực tế chạy toàn suite: **43 file passed, 1 skipped; 390 tests passed, 4 skipped**, exit 0, khoảng 2.08s. Không mô tả đây là chỉ 15 file. Các provider/action/harness tests dùng mocks; không chạy script benchmark trả phí.

Baseline này chứng minh tests hiện có đạt, không chứng minh thiếu lỗi semantic/credit/concurrency. Chưa chạy lint/typecheck/build/E2E vì không sửa code; không khởi động server hoặc truy cập DB. Không xác minh rollback thực tế hoặc production.

## 9. Risk register và bước tiếp theo

| Rủi ro | Mức | Cách xử lý tiếp theo |
|---|---|---|
| Evidence refs đúng nhưng claim vẫn bịa | Cao | Chốt F nguyên văn, rubric claim-level, holdout và ablation |
| Chỉ dẫn/meaning canonical bị đọc thành fact | Cao | Label symbolic, đối chứng ví dụ và ưu tiên prompt |
| Judge bỏ sót/gắn cờ sai | Cao | Gán nhãn độc lập; chưa dùng runtime blocker |
| Credit lỗi ngoài try / refund ledger tách rời | Cao | Mock fault injection riêng trước rollout, không mở rộng P0 thành refactor billing |
| Hai call vượt budget | Cao | Một call; deadline end-to-end nếu sau này thử C |
| Safety tiếng Việt chỉ phủ mẫu hẹp | Cao | Giữ gate trước debit; mở rộng fixtures có nhãn, không suy “tests pass” thành bao phủ mọi nguy cơ |
| Blind label dễ đoán / benchmark bị tối ưu quá mức | Vừa | Xáo bí mật, holdout chưa dùng chỉnh prompt, ≥2 người chấm |
| Deployment/pricing/upstream không được verify | Vừa | Kiểm tra riêng khi thực sự release/copy/chạy model |

**Task tiếp theo tại thời điểm P0:** 2.1–2.12. Các bước này đã được chốt bằng thiết kế ở cập nhật phía trên; tiếp theo là task 3 offline khi được yêu cầu. Implementation candidate offline đã hoàn thành ở task 3 theo cập nhật mới nhất; chưa phát hành.

## Phụ lục: raw candidate evidence đã đối chiếu

Các câu bên dưới là đầu ra model có vấn đề, không phải nhận định của báo cáo về người dùng. Đường dẫn local dưới `.model-compare/` có thể không được version-control.

### `relation-weak-1`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-27-39-677Z/relation-weak-1--v8.1-2026-11-12.json`.

- `overview`: Sự xuất hiện của hai lá số chín phản ánh bạn có thể đang cảm thấy đủ đầy và làm chủ tốt phần việc của mình, nhưng vị trí hướng đi đòi hỏi một khung đánh giá khách quan, vượt khỏi lăng kính cảm xúc cá nhân để đối thoại công bằng.

### `relation-absent-1`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-27-40-537Z/relation-absent-1--v8.1-2026-11-12.json`.

- `summary`: Mâu thuẫn cốt lõi nằm ở việc bạn muốn chuyển nhóm để thoát khỏi cảm giác bế tắc hiện tại, nhưng nguy cơ thực sự lại là sự suy giảm động lực tay nghề nội tại.
- `summary`: Nếu chưa làm rõ bản thân đang né tránh điều gì ở vị trí hiện thời, việc đổi môi trường có thể chỉ lặp lại sự chán nản cũ.
- `overview`: Câu hỏi ngầm ở đây không phải là nhóm mới có tốt hơn không, mà là liệu bạn đang tìm kiếm cơ hội học hỏi thực chất hay chỉ muốn trốn chạy một nút thắt công việc chưa được giải quyết dứt điểm.

### `relation-weak-2`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-27-52-341Z/relation-weak-2--v8.1-2026-11-12.json`.

- `connections`: Bạn có nguy cơ để mặc buổi học trôi qua một cách thụ động vì sợ lại tốn công vô ích.
- `perCard.0.keyMessage`: Cảm giác bão hòa hoặc thất vọng từ các trải nghiệm trước khiến bạn dễ nhìn buổi học thử với ánh mắt dè chừng.
- `perCard.1.keyMessage`: Trạng thái rút lui để bảo toàn năng lượng trí tuệ đòi hỏi khóa học phải có nhịp độ không gây quá tải.

### `relation-absent-2`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-27-54-213Z/relation-absent-2--v8.1-2026-11-12.json`.

- `summary`: Mâu thuẫn lớn nhất lúc này là cảm hứng sáng tạo thì rộng mở nhưng nhịp sinh hoạt thực tế lại đang quá tải và thiếu chỗ trống.
- `connections`: Hướng giải quyết từ sự kết hợp này là hạ thấp ngưỡng hành động: chuyển hóa năng lượng thử nghiệm non trẻ thành những thao tác vật lý cực nhỏ để phá vỡ thế kẹt của lịch trình thường nhật.
- `perCard.1.keyMessage`: Trạng thái quá tải sinh hoạt đang biến việc thu xếp thời gian vẽ thành một mối bận tâm nặng nề.

### `relation-weak-3`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-28-05-712Z/relation-weak-3--v8.1-2026-11-12.json`.

- `summary`: Việc đổi lịch này chạm vào ranh giới giữa quy ước chung đã thống nhất và sự linh hoạt phát sinh.
- `perCard.1.keyMessage`: Sự nhượng bộ dựa trên thói quen cũ đang tạo ra bất cập thực tế.

### `relation-absent-3`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-28-07-080Z/relation-absent-3--v8.1-2026-11-12.json`.

- `summary`: Khoảng lặng hiện tại không đồng nghĩa với cánh cửa đã đóng, mà phản ánh quy trình xử lý nội bộ chưa hoàn tất.
- `overview`: Đằng sau câu hỏi về cách theo dõi hồ sơ là nỗi băn khoăn liệu bạn có quyền chủ động liên hệ hay phải nhẫn nại chờ đợi trong thụ động.
- `overview`: Tiến trình từ việc quan sát thông tin kín kẽ chuyển sang kết nối cởi mở, rồi tiến tới tháo gỡ cảm giác bế tắc chỉ ra rằng việc theo dõi cần được thực hiện bằng thái độ đàng hoàng, minh bạch thay vì thấp thỏm đoán định.

### `relation-weak-4`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-28-19-392Z/relation-weak-4--v8.1-2026-11-12.json`.

- `summary`: Mâu thuẫn cốt lõi nằm giữa việc nôn nóng muốn chốt chỗ ở và yêu cầu dừng lại đo lường thực tế.

### `relation-absent-4`

Artifact: `.model-compare/v8-2026-11-11-vs-v8.1-2026-11-12-gemini-3.8-flash-2026-11-12T00-28-20-347Z/relation-absent-4--v8.1-2026-11-12.json`.

- `connections`: Khi bạn vượt qua được sức ỳ tâm lý để gửi đi một lời mời cụ thể, Five of Wands xuất hiện như một hệ quả tự nhiên: việc sắp xếp một buổi hẹn sau thời gian dài xa cách hiếm khi suôn sẻ ngay lập tức mà thường vấp phải sự bận rộn hoặc lệch pha về lịch trình của đôi bên.
- `perCard.0.keyMessage`: Sự ngần ngại nội tâm đang khiến bạn thổi phồng khoảng cách vô hình giữa hai người.
- `perCard.2.keyMessage`: Sự không khớp về lịch trình hoặc nhịp trò chuyện ban đầu là điều cần dự trù trước.

