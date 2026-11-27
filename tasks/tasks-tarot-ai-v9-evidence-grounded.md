# Tarot AI v9 — Evidence-Grounded Interpretation

Nguồn: `docs/tarot-skill-integration-report-2026-11-20.md`.

## Relevant Files

- `docs/superpowers/specs/2026-11-20-tarot-ai-v9-design.md` — Thiết kế task 2: hợp đồng F/C/R/H, abstention, protocol benchmark và release gates.
- `lib/ai/prompts/index.ts` — Audit registry và đăng ký candidate; không tự thay active prompt.
- `lib/ai/prompts/v7.ts`, `lib/ai/prompts/v8.ts`, `lib/ai/prompts/v8-1.ts` — Baseline và logic quan hệ hiện có.
- `lib/tarot/cards.ts`, `lib/tarot/draw.ts` — Đối chiếu dữ liệu và hợp đồng rút ba lá; không thay cơ chế rút.
- `lib/tarot/relations.ts`, `lib/tarot/relations.test.ts` — Module quan hệ và test dự kiến.
- `lib/ai/evidence.ts`, `lib/ai/evidence.test.ts` — Evidence builder và test dự kiến, tùy kết quả preflight.
- `lib/ai/prompts/v9.ts` — Prompt candidate dự kiến.
- `lib/ai/quality.ts` — Quality gate hiện tại; chỉ mở rộng khi có bằng chứng đánh giá đáng tin.
- `lib/ai/interpretation.ts`, `lib/ai/dynamic-reflection.ts`, `lib/ai/reading-support.ts`, `app/actions/ai.ts` — Audit schema, timeout, safety, credit và Reflection.
- `lib/ai/benchmark-cases.ts`, `scripts/benchmark-prompts.ts`, `docs/benchmarks/` — Fixtures, benchmark và báo cáo GO/NO-GO.

### Notes

- Các điểm tích hợp chính đã được đối chiếu ở P0/task 2; file mới và semantic warnings vẫn là kế hoạch, không phải đã tồn tại.
- Trước mắt chỉ thực hiện preflight offline, read-only đối với code và hệ thống; không gọi Gemini/DeepSeek, đổi database, active prompt, payment/credit, push, merge hoặc deploy.
- Implementation chỉ bắt đầu sau kết luận READY FOR IMPLEMENTATION và được cho phép thực hiện. Benchmark gọi model và rollout là các bước có điều kiện riêng.
- Giữ trải ba lá, schema hiển thị, history và UI trong vòng thử đầu; không nhập nguyên upstream, thêm dependency hoặc dùng weighted draw.
- `package.json` dùng pnpm và Vitest: `pnpm exec vitest run <file>`, `pnpm lint`, `pnpm exec tsc --noEmit`. Chạy `pnpm build` khi cần kiểm chứng tích hợp và đã có môi trường phù hợp; không dùng lệnh migration cho validation.
- Trước khi viết code Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` theo AGENTS.md.
- Task list được chia chi tiết sau phản hồi “Go”; đây là kế hoạch, không phải bằng chứng các bước đã được thực hiện.
- F = dữ kiện người dùng; C = dữ kiện lá bài; R = quan hệ lá; H = giả thuyết phản tư. Không coi biểu tượng lá là bằng chứng về sự kiện đời thực.

## Instructions for Completing Tasks

Đánh dấu `- [x]` ngay sau khi hoàn thành từng task/sub-task và có bằng chứng kiểm tra. Không đánh dấu các bước có điều kiện khi chưa thực hiện; ghi rõ bước bị chặn hoặc không áp dụng cùng lý do.

## P0 — Kết quả ngày 20/11/2026

- Audit task 1.0–1.9 hoàn thành; báo cáo: `docs/tarot-ai-v9-preflight.md`.
- Baseline thực tế: 390 tests passed, 4 skipped. Không gọi model hoặc thay code/production.
- Kết luận: NOT READY — NEEDS MORE EVIDENCE cho implementation đầy đủ; tiếp theo task 2 để chốt thiết kế và tiêu chí còn thiếu.
- Task 0 tạo branch được hoãn đến implementation theo phạm vi preflight read-only.

## Task 2 — Kết quả ngày 20/11/2026

- Hoàn thành 2.1–2.12; thiết kế: `docs/superpowers/specs/2026-11-20-tarot-ai-v9-design.md`.
- READY FOR IMPLEMENTATION cho candidate offline ở task 3; chưa GO production hoặc trả phí model.
- Chốt F nguyên văn, C canonical, R cấu trúc tối đa 2 với quyền abstain, H là quy tắc phản tư; không thêm semantic detector runtime/schema/DB.
- Protocol tối đa 484 calls: diagnostic 16 + primary 372 + secondary 96; ngân sách kế hoạch 200.000đ chưa được duyệt chi. Chi tiết model/repeats/review/gates trong thiết kế.
- Independent builder check không còn câu hỏi quan trọng; kiểm tra số mẫu và đường dẫn tài liệu đạt.
- Rủi ro credit P0 vẫn chưa sửa, là blocker rollout; không chặn implementation candidate offline.

## Task 3 — Kết quả ngày 20/11/2026

- Candidate `v9-2026-11-20` đã được triển khai trên nhánh `codex/tarot-ai-v9-evidence-grounded`; active vẫn `v7-2026-10-06`.
- Tách relations nguyên hành vi; 58 ca × 2 prompt v8/v8.1 giữ nguyên hash đầu vào đã chụp trước extraction.
- Evidence builder validate bằng hợp đồng hiện có, tra canonical cards, giữ nguyên câu hỏi sau trim và gắn refs cấu trúc. Không tạo facts paraphrase/H payload/metadata DB.
- Task 3.9 hoàn thành bằng quyết định hoãn semantic runtime warnings theo thiết kế; không sửa `quality.ts` hoặc thêm auto-retry.
- Kiểm tra cuối: `pnpm test` đạt 556 tests, 4 skipped (46 files passed, 1 skipped); `pnpm lint`, `pnpm exec tsc --noEmit` và `git diff --check` exit 0.
- Fresh-context code review không có actionable findings. Provider/model tests dùng mocks, không gọi API trả phí.
- Chưa chạy benchmark chất lượng, build/E2E hoặc staging; chưa chứng minh v9 giảm unsupported claims. Rủi ro credit P0 chưa được sửa; không GO rollout.
- Đã cập nhật kế hoạch triển khai `docs/superpowers/plans/2026-11-20-tarot-ai-v9-implementation.md`; không commit/push/deploy. Tiếp theo task 4 với các điều kiện trả phí/review trong thiết kế.

## Task 4 — Tiến độ ngày 21/11/2026

- Fixtures34/provider31/diagnostic8 đã chuẩn bị; code review và packet builder đã kiểm tra. Báo cáo: `docs/benchmarks/v9-task-4-2026-11-20.md`.
- Ngày20/11 đã gọi2/16 diagnostic và dừng vì thiếu thinking telemetry. Một cặp A/B có tại `docs/benchmarks/v9-review-2026-11-20/review.md`; người dùng chọn tự chấm, agent reviewer đã lưu điểm riêng và khóa chưa mở.
- Ngày21/11 tiếp tục telemetry amendment: giữ provider total/tool counts, chỉ benchmark suy ra thinking từ tổng hợp lệ trong request không tools; không điền thiếu thành0 vô điều kiện.
- StageD generation đã đủ16outputs/8cặp sau14calls tiếp theo được người dùng đồng ý rõ;14calls mới estimate2.174đ,2calls cũ thiếu thinking nên chi phí đầy đủ unknown. Task4.6/4.7/4.9 chưa hoàn thành toàn bộ: StageR/gates/chấm con người còn chờ. Task4.8 không áp dụng vì không có semantic detector; không dựng precision/recall giả.
- Bộ phiếu đầy đủ và mã P1–P8: `docs/benchmarks/v9-review-index-2026-11-21.md`; một cặp cũ không đổi, bảy cặp mới riêng. Chưa mở key hoặc điểm reviewer trước phiếu người dùng.
- Active v7, credit risk P0 và các điều kiện rollout giữ nguyên.
- Telemetry amendment đã kiểm chứng: 576 tests passed,4 skipped; lint/typecheck đạt, review không có findings. Automatic approval review ban đầu chặn lệnh14calls; sau khi người dùng đồng ý rõ, lệnh được duyệt và14calls đã hoàn tất. Payload/lệnh cụ thể: `docs/benchmarks/v9-task4-continuation-approval-2026-11-21.md`.

## Task 4 — Đã đóng vòng diagnostic ngày21/11/2026

- **NO-GO Stage D**, không chạy StageR; report cuối: `docs/benchmarks/v9-diagnostic-result-2026-11-21.md`.
- Người dùng xác nhận review xong và chỉ chọn A/B/tie. Đã khóa8preferences trước mở key/agent scores, bỏ qua số điểm/cờ thử trước đó theo chỉ dẫn mới. Không yêu cầu chấm lại số điểm.
- Human preference: v9được chọn6cặp, v8.1được chọn1cặp,1hòa. Không áp dụng tỷ lệ này vào gate strong-vs-v7.
- Agent semantic flags được báo riêng, không giả thành human adjudication; đối chiếu source/output xác nhận v9vẫn có claims ngoài dữ kiện. Không sửa agent preference gốc để biến thành gate pass.
- 4.6 hoàn tất nhánh diagnostic16calls; primary/secondary và các bước trả phí tiếp theo không chạy vì blocker. 4.7 hoàn tất theo amendment human preference-only, không phải human semantic labels đủ cho release.
- 4.8 không áp dụng;4.9/4.10 đã tổng hợp đầy đủ phần đã đo và những số liệu chưa biết. Toàn bộ release gate chưa đạt;task5không tự triển khai.
- Không có API calls/source changes trong lượt tổng hợp này. Active v7không đổi; chưa deploy.

## Follow-up sau NO-GO — Thiết kế v9.1 offline

- [x] Chốt thiết kế thử nghiệm summary + ba keyMessages trên3ca đã xác nhận lỗi; tài liệu: `docs/superpowers/specs/2026-11-21-tarot-ai-v9-1-offline-design.md`. Builder check không còn câu hỏi quan trọng.
- [x] Triển khai renderer/spike offline cùng tests theo thiết kế; chưa nối registry/parser/production. Full suite597passed/4skipped;lint/typecheck đạt.
- [x] Tái dùng3outputs v9đã lưu để dựng3cặp; semantic reviewer lưu3phiếu riêng,code review không có important findings. Phiếu:`docs/benchmarks/v9-1-review-2026-11-21/review.md`.
- [x] Nhận/khóa lựa chọn M1–M3 của người dùng (chỉ A/B/tie), rồi mở key/semantic review để đánh giá12trường transformed và mâu thuẫn body; transformed thắng 3/3; reviewer không gắn cờ ở 12 trường mục tiêu, body vẫn có lỗi.
- [x] Gate nghiên cứu đạt; giữ renderer đóng băng, kiểm tra 6 câu mới + 3 ca null thủ công và review độc lập. Không gọi model/chỉnh mẫu. Full suite 607 passed, 4 skipped; lint/typecheck đạt. Câu trả lời còn chung và thiếu bài tập vẽ cụ thể; production NO-GO. Báo cáo: `docs/benchmarks/v9-1-result-2026-11-21.md`.

Báo cáo triển khai:`docs/benchmarks/v9-1-offline-2026-11-21.md`;0model calls mới. v9/v7giữ nguyên; task5rollout vẫn chưa bắt đầu. Mẫu đã sửa bốn trường không được gọi là bài đọc hết lỗi.

## Tasks

- [x] 0.0 Create feature branch — trước implementation; preflight vẫn chỉ đọc code.
  - [x] 0.1 Kiểm tra branch và working tree; ghi nhận thay đổi có sẵn, không reset hoặc ghi đè công việc khác.
  - [x] 0.2 Khi bắt đầu implementation, tạo/checkout nhánh `codex/tarot-ai-v9-evidence-grounded`; nếu đang ở nhánh công việc phù hợp thì ghi rõ nhánh sử dụng.

- [x] 1.0 Audit offline hiện trạng và phân tích nguyên nhân v8/v8.1 NO-GO.
  - [x] 1.1 Đọc báo cáo nguồn, review tích hợp cũ và benchmark v8/v8.1; ghi commit, model, fixtures, cấu hình và giới hạn của bằng chứng sẵn có.
  - [x] 1.2 Đối chiếu v7/v8/v8.1 và prompt registry; ghi active prompt trong mã, tách biệt với trạng thái deployment chưa xác minh.
  - [x] 1.3 Kiểm tra bộ bài, vị trí, orientation, schema và logic quan hệ hiện có; liệt kê phần tái sử dụng, không xây lại.
  - [x] 1.4 Trace callers của các symbol dự kiến sửa; lập bảng ảnh hưởng đến prompt, benchmark, tests, exports và consumers trước khi đề xuất extraction.
  - [x] 1.5 Vẽ luồng request từ action đến safety, model, parse, quality, lưu history, credit và Dynamic Reflection; ghi thứ tự và nhánh lỗi thực tế.
  - [x] 1.6 Xác định timeout 45 giây được áp dụng ở đâu, điều kiện retry và các điểm có thể phát sinh charge hoặc lưu dữ liệu riêng tư.
  - [x] 1.7 Lập bảng từng ca benchmark thất bại: đầu vào tổng hợp, câu khẳng định vi phạm, dữ kiện hỗ trợ/thiếu, loại lỗi và prompt liên quan; ghi thiếu bằng chứng nếu không có raw output.
  - [x] 1.8 Tách root cause đã có bằng chứng khỏi giả thuyết; nêu bằng chứng có thể bác bỏ từng giả thuyết, không suy kết từ điểm tổng hợp.
  - [x] 1.9 Xuất preflight vào `docs/tarot-ai-v9-preflight.md`, phân loại VERIFIED / INFERRED / PROPOSED và liệt kê khoảng trống cần giải quyết.

- [x] 2.0 Chốt thiết kế, phạm vi, test plan và readiness trước implementation.
  - [x] 2.1 So sánh A prompt-only, B deterministic evidence + một AI call, C nhiều bước theo chất lượng, token, độ trễ, timeout và credit; chọn phương án thử có lý do.
  - [x] 2.2 Định nghĩa hợp đồng F/C/R/H tối thiểu: ID, nguồn, supportRefs, certainty và ranh giới tin cậy; tái dùng type/validation hiện có.
  - [x] 2.3 Quy định facts chỉ chứa điều người dùng thực sự nói; giữ nguyên ngữ cảnh/phủ định, không tự suy ra động cơ, cảm xúc hoặc ý định. Nếu chưa tách facts đáng tin bằng code, giữ câu hỏi làm nguồn và ghi rõ giới hạn.
  - [x] 2.4 Quy định card evidence lấy từ dữ liệu chuẩn: ID, vị trí, chiều, chất, số và nghĩa đã có; xử lý ID hoặc vị trí không hợp lệ tại trust boundary.
  - [x] 2.5 Thiết kế selector tái dùng ba loại quan hệ hiện có, thứ tự chọn ổn định, tối đa hai quan sát và kết quả rỗng hợp lệ; định nghĩa relevance để tránh ép quan hệ.
  - [x] 2.6 Phân biệt R1 cấu trúc, R2 biểu tượng, R3 liên hệ câu hỏi và R4 diễn giải; không biến R3/R4 thành sự thật xác định bằng code.
  - [x] 2.7 Quy định H là gợi ý/câu hỏi có điều kiện, không dùng lá bài để chứng minh sự kiện hoặc đọc ý nghĩ bên thứ ba; không bắt buộc thêm H vào schema trả về.
  - [x] 2.8 Chốt cách truyền evidence trong một lần gọi model và giữ schema UI/history/Reflection; quyết định có cần metadata nội bộ hay không, tránh thêm field chưa có consumer.
  - [x] 2.9 Thiết kế quality evaluation cho unsupported_claim, forced_relation, third_party_mindreading; nêu rõ giới hạn regex và không tự retry model khi có warning.
  - [x] 2.10 Chốt ma trận fixtures, rubric, cách làm mù, số lượt mỗi ca, người chấm độc lập, xử lý bất đồng và ngân sách model trước khi chạy.
  - [x] 2.11 Chốt file-level change plan, lệnh validation, release gates và rollback; pin SHA/license nếu thực sự sao chép nội dung upstream.
  - [x] 2.12 Hoàn tất preflight với READY FOR IMPLEMENTATION hoặc NOT READY — NEEDS MORE EVIDENCE; dừng implementation nếu còn thiếu bằng chứng quyết định.

- [x] 3.0 Sau khi được phép implementation: xây ứng viên v9, giữ nguyên active prompt.
  - [x] 3.1 Đọc guide Next.js liên quan và kiểm tra lại callers/phạm vi đã chốt trước sửa code.
  - [x] 3.2 Viết regression tests cho hành vi quan hệ v8 hiện tại trước extraction, gồm thứ tự và giới hạn hai quan sát.
  - [x] 3.3 Tách logic sang `lib/tarot/relations.ts`, cập nhật consumers cần thiết; giữ nguyên hành vi baseline v8/v8.1 để so sánh công bằng.
  - [x] 3.4 Viết tests cho evidence builder: thiếu facts, phủ định, Unicode tiếng Việt, refs hợp lệ, dữ liệu lá/vị trí/chiều không hợp lệ và đầu vào cố chèn chỉ dẫn.
  - [x] 3.5 Tạo `lib/ai/evidence.ts` theo hợp đồng đã chốt, giữ câu hỏi là dữ liệu không tin cậy và không ghi câu hỏi thô vào logs/analytics.
  - [x] 3.6 Thêm selector/evidence tests cho cùng chất, cùng số, Major/Minor, quan hệ yếu/vắng, đảo vị trí/chiều, không trùng và không sửa input.
  - [x] 3.7 Tạo `lib/ai/prompts/v9.ts` với evidence có nhãn, giả thuyết có điều kiện, cho phép bỏ connections yếu và giữ output contract hiện có.
  - [x] 3.8 Đăng ký candidate v9 cho benchmark; thêm kiểm tra active prompt không đổi và prompt versions cũ vẫn sử dụng được.
  - [x] 3.9 Chỉ thêm metadata quality nếu thiết kế đã chứng minh cần và có cơ chế đánh giá đáng tin; nếu chưa đủ bằng chứng, ghi rõ hoãn semantic gate trong báo cáo.
  - [x] 3.10 Chạy unit tests liên quan, lint và typecheck; kiểm tra diff không thêm dependency hoặc thay DB/payment/credit/UI/active prompt.

- [x] 4.0 Kiểm chứng offline và benchmark mù có kiểm soát.
  - [x] 4.1 Bổ sung fixtures tổng hợp cho quan hệ mạnh/yếu/vắng, thiếu dữ kiện, đổi vị trí/chiều và ý định người khác; gán nhãn claims được phép/không được phép.
  - [x] 4.2 Bổ sung ca safety: sức khỏe, pháp lý, tài chính, tự hại, phủ định và trích dẫn; tái dùng hợp đồng safety hiện tại, không tự thay policy trong task này.
  - [x] 4.3 Test với model/storage mocks để chứng minh thứ tự safety, nhánh parse/model/timeout lỗi, kết quả lưu history và credit theo hợp đồng hiện có; không gọi API trả phí hoặc DB production.
  - [x] 4.4 Kiểm tra harness hỗ trợ v7/v8.1/v9 cùng model, sampling, fixtures và giới hạn đầu ra; thay tối thiểu nếu thiếu hỗ trợ, test phần thay đổi.
  - [x] 4.5 Chuẩn bị mã ẩn danh, thứ tự ngẫu nhiên và biểu mẫu chấm; lưu khóa version riêng cho đến khi chấm xong.
  - [x] 4.6 Sau khi được phép gọi model và chốt ngân sách, chạy số lượt đã định; lưu model/config, phiên bản mã, token, latency, lỗi và chi phí theo pricing có nguồn.
  - [x] 4.7 Chấm mù grounding, unsupported claims, forced relations, mindreading, connections, tiếng Việt và bước hành động; ghi lý do và giải quyết bất đồng.
  - [ ] 4.8 Đo false positive/negative của semantic warnings trên nhãn độc lập, nếu có detector; không dùng cùng một model tự chấm làm bằng chứng duy nhất. **Không áp dụng:** không có detector hoặc nhãn semantic con người độc lập; không chặn việc đóng vòng diagnostic NO-GO.
  - [x] 4.9 Tổng hợp win/tie/loss, schema, lỗi lá/vị trí/chiều, chi phí trung vị, p50/p95, timeout và credit; nêu cỡ mẫu và giới hạn suy rộng.
  - [x] 4.10 Viết báo cáo trong `docs/benchmarks/` với đầu ra tổng hợp minh họa lỗi, kết quả từng gate và khuyến nghị GO/NO-GO; không đưa dữ liệu thật của người dùng vào fixtures/logs.

- [ ] 5.0 Xác minh release gate, rollback và chỉ rollout khi đủ điều kiện.
  - [ ] 5.1 Kiểm tra gate: 0 lỗi lá/vị trí/chiều, schema hợp lệ 100% trên mẫu, 0 unsupported claims/forced relations trong bộ ca chặn phát hành.
  - [ ] 5.2 Kiểm tra gate: v9 thắng ≥60% cặp quan hệ mạnh so với v7, chi phí trung vị tăng ≤10%, không phát sinh trừ credit ở các nhánh lỗi kiểm thử; áp dụng cùng cách tính đã chốt trước benchmark.
  - [ ] 5.3 Đối chiếu latency/timeout với ngân sách đã chốt, kết quả safety, bảo mật dữ liệu, history và Dynamic Reflection; ghi gate nào chưa đo thay vì coi là đạt.
  - [ ] 5.4 Xác minh đường rollback về prompt baseline trong môi trường test, gồm dữ liệu đã lưu vẫn đọc được; tài liệu hóa thao tác và điều kiện kích hoạt.
  - [ ] 5.5 Tổng hợp GO/NO-GO, rủi ro còn lại và bằng chứng; nếu NO-GO, giữ candidate offline và liệt kê sửa đổi tối thiểu cho vòng đánh giá sau.
  - [ ] 5.6 Chỉ khi GO và được phê duyệt rollout: chốt phạm vi người dùng, thời gian quan sát, người chịu trách nhiệm và ngưỡng dừng/rollback trước khi đổi production.
  - [ ] 5.7 Thực hiện rollout đã được duyệt, theo dõi lỗi schema, latency, credit và phản hồi chất lượng bằng telemetry không chứa câu hỏi thô; rollback khi chạm ngưỡng dừng.
  - [ ] 5.8 Cập nhật tài liệu phiên bản active và kết quả quan sát; tách cải thiện mobile/Four-Lens/Narrative Arc thành công việc sau nếu chưa có bằng chứng cần thay UI.

## Follow-up v9.2 — Toàn bài offline

- [x] Viết thiết kế đề xuất: `docs/superpowers/specs/2026-11-21-tarot-ai-v9-2-offline-design.md`; thay toàn bộ prose trong ba context cố định, giữ schema/metadata, 0 model calls.
- [x] Người dùng duyệt thiết kế ngày 22/11/2026; viết/self-review kế hoạch `docs/superpowers/plans/2026-11-22-tarot-ai-v9-2-offline-implementation.md`. Chưa triển khai renderer/runner.
- [x] Soạn/rà ba mẫu development, renderer/runner mới; 631 tests passed/4 skipped, lint/typecheck đạt, code review không findings. Frozen v9/v9.1 và active v7 giữ nguyên.
- [x] Freeze và tạo ba cặp full reading N1–N3: `docs/benchmarks/v9-2-review-2026-11-22/review.md`; review mù lưu riêng.
- [x] Nhận/khóa N1=A/N2=B/N3=B trước mở key/review mù; candidate thắng 3/3, gate development đạt. Báo cáo: `docs/benchmarks/v9-2-offline-2026-11-22.md`.
- [x] Sau gate tạo 6 positives + 3 null mới độc lập, review toàn bài. **NO_GO_CANDIDATE**: usefulness 2/6, bỏ sót điều kiện 4/6; renderer giữ freeze. 647 tests passed/4 skipped; lint/typecheck/diff check đạt. Kết quả: `docs/benchmarks/v9-2-result-2026-11-22.md`. Production/task 5 chưa mở.

## Follow-up v9.3 — Dữ kiện → hành động

- [x] Viết thiết kế đề xuất `docs/superpowers/specs/2026-11-22-tarot-ai-v9-3-constraints-design.md`: bốn ca v9.2 thất bại nay là development; hai context, bảy kinds, fact spans gán thủ công và coverage tới action.
- [x] Builder check; đã chốt manifest errors/abstention, validation precedence và runner coverageGaps.
- [x] Người dùng duyệt thiết kế; đã viết/self-review kế hoạch `docs/superpowers/plans/2026-11-22-tarot-ai-v9-3-constraints-implementation.md`. Chưa sửa source hoặc tạo annotation/output thử.
- [x] Triển khai renderer/runner mới, test trust boundary và review development/toàn code; 696 tests passed/4 skipped, lint/typecheck đạt. Frozen versions/active v7 giữ nguyên.
- [x] Freeze và dựng bốn cặp P1–P4: `docs/benchmarks/v9-3-review-2026-11-22/review.md`.
- [x] Human choices khóa trước mở key/review: candidate v9.3 0/4, control v9.2 4/4. **NO_GO_CANDIDATE** do preference gate; reviewer candidate đạt 4/4 không thay human gate. Báo cáo: `docs/benchmarks/v9-3-offline-2026-11-22.md`.
- [ ] Holdout/annotation độc lập **không chạy: preference gate thất bại**, vòng đóng NO-GO. Không coi manual facts/labels là extraction/router; production/task 5 chưa mở. Báo cáo: `docs/benchmarks/v9-3-result-2026-11-22.md`.

## Quyết định dừng nghiên cứu — 22/11/2026

Người dùng yêu cầu giữ v7 và dừng mở rộng v9.x. V9/v9.1/v9.2/v9.3 giữ nguyên kết quả NO-GO/phạm vi nghiên cứu; các checkbox release/holdout chưa chạy trong tài liệu là lịch sử, **không còn là công việc tự động tiếp tục**. Không tạo ứng viên/benchmark/holdout mới trừ yêu cầu mới của người dùng. Giữ reports, lựa chọn đã khóa và raw artifacts; không xóa source/registry lịch sử hoặc sửa bài đã lưu.

Ưu tiên mới: `tasks/tasks-v7-unlock-credit-reliability.md`. Task 0 đã chuẩn bị nhánh `codex/v7-unlock-credit-reliability`, không sửa runtime/active prompt; v7 vẫn active trong source.
