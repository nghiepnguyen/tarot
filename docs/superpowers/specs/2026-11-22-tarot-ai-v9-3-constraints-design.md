# v9.3 — Dữ kiện có nguồn dẫn tới hành động

Ngày 22/11/2026. Trạng thái: người dùng đã duyệt và triển khai offline ngày 22/11/2026; đang chờ human choices P1–P4. Nguồn: `docs/benchmarks/v9-2-result-2026-11-22.md`. Kế hoạch triển khai: `docs/superpowers/plans/2026-11-22-tarot-ai-v9-3-constraints-implementation.md`. Phạm vi đã duyệt giữ nguyên.

## Vấn đề và phạm vi

v9.2 được chọn 3/3 trên development nhưng chỉ 2/6 ca holdout đạt usefulness. Hai ca chuyển nhóm và hai ca dọn nhà bỏ sót điều kiện đã nêu. Vấn đề không phải thiếu câu chữ về chủ đề mà là không dùng thông tin cụ thể khi đưa hành động.

v9.3 thử một bước hẹp: **với dữ kiện được curator gán đúng và có nguồn, renderer có dùng chúng để tạo hành động phù hợp trên câu hỏi mới không?** Không đồng thời giải quyết việc tự động trích xuất. Bốn ca v9.2 thất bại nay là development, tuyệt đối không gọi lại là holdout chưa xem.

Chỉ mở hai context transfer và housework_schedule với đúng fingerprints v9.2. Không mở bộ lá hoặc chủ đề mới. Hai ca vẽ v9.2 đã đạt chỉ giữ làm regression nguồn không đổi, không quảng bá là coverage mới v9.3. Ngân sách 0 model API calls. Active v7, v9/v9.1/v9.2, canonical deck, schema, providers/parser, DB/credit/UI/Reflection/dependencies giữ nguyên. Không commit/push/deploy; production NO-GO.

## Hướng giải quyết

| Hướng | Đánh đổi |
|---|---|
| Thêm câu mẫu/regex theo các lỗi vừa thấy | Dễ làm nhưng không chứng minh dùng điều kiện mới; khó phủ định, trích dẫn và đơn vị |
| Dữ kiện thủ công có source span + hành động theo loại dữ kiện | 0 calls, cô lập được khâu dùng dữ kiện; cần người gán nhãn nên không phải tính năng production |
| Model tách facts rồi viết bài | Có thể linh hoạt hơn, nhưng cần protocol/cost mới và kiểm chứng extraction riêng |

Đề xuất hướng thứ hai. Không chép nguyên câu hỏi vào cuối một lời khuyên chung để coi là thích nghi. Mỗi loại dữ kiện phải làm thay đổi điều cần kiểm tra hoặc đề xuất cụ thể; reviewer đánh giá tính hữu ích riêng với structural coverage.

## Hợp đồng dữ kiện nội bộ

Renderer mới `renderConstraintReading(question, cards, context, facts)` trả kết quả phân biệt:

- `{ status: "applied", result: InterpretationResult, coverage: ConstraintCoverage[] }`.
- `{ status: "not_applied", reason: "unsupported_scope" | "unsupported_constraints" | "needs_support" }`.

Input cấu trúc sai throw lỗi redacted; không trả bài partial rồi coi là applied. `context` là transfer/housework_schedule hoặc null. `cards` dùng `InterpretationCardInput[]`. `facts` là manifest nội bộ được curator kiểm tra trước, không nhận từ client/model. Không cài route production.

Mỗi fact gồm `id`, `kind`, `start`, `end`, `quote`; không chứa prose hành động hoặc câu suy luận tự do. Các offsets là chỉ số UTF-16 theo JS string, end exclusive, trên **câu hỏi đã trim đúng như evidence F1**, không normalize Unicode/case. Phải thỏa `source.slice(start,end) === quote`, quote không trắng, ID duy nhất, span hợp lệ, tối đa 7 facts. Không âm thầm sửa quote/offset. Dùng source gốc F1 và refs `F1` + fact ID; không phát minh F2 dưới dạng facts đã được code xác minh.

Kind là nhãn do curator gán, không phải kết luận của validator. Span khớp chỉ chứng minh xuất xứ, không chứng minh đó là ý định thật của người hỏi: phủ định, lời trích, giả định, mốc giờ của người khác hoặc nhãn kind sai vẫn cần semantic review. Curator không được chọn mỗi fact dễ xử lý; mọi điều kiện ảnh hưởng quyết định trong câu phải được ghi, hoặc đánh dấu scope không hỗ trợ và abstain toàn ca.

Manifest mỗi ca có `scopeSupported`, `annotationComplete` và `excludedConstraints` (quote + lý do). Đây là xác nhận thủ công, không phải code phát hiện thiếu facts. Nếu không complete/supported hoặc có excluded constraint ảnh hưởng yêu cầu, runner không gọi renderer để tạo bài; ghi not_applied, không tính là usefulness pass. Renderer chỉ nhận fact list đã qua manifest gate và tự kiểm tra schema/span/kind/context. Mỗi ca applied cần ít nhất một fact.

## Thứ tự validation, abstention và báo cáo runner

Các quyết định sau do agent chốt để hợp đồng không phụ thuộc thứ tự nhánh ngẫu nhiên:

1. Renderer validate question/cards bằng evidence và toàn bộ cấu trúc facts/spans trước mọi guard. Kind ngoài bảy enum, context ngoài enum/null, hơn 7 facts, span/quote/ID sai đều throw lỗi cố định `Invalid constraint reading input.`; không lộ raw text/ID. Facts rỗng là cấu trúc hợp lệ để trả abstention, không phải schema failure. Không nhận inherited/prototype context như một loại hợp lệ.
2. Sau cấu trúc hợp lệ, support guard có ưu tiên: trả `not_applied/needs_support`, kể cả context null hoặc fingerprint không hỗ trợ.
3. Context null hoặc fingerprint không khớp trọn bộ: `not_applied/unsupported_scope`.
4. Đã đúng scope nhưng facts rỗng hoặc kind hợp lệ không thuộc context: `not_applied/unsupported_constraints`. Một fact ngoài coverage làm abstain cả bài; không lọc rồi trả partial success.
5. Các điều kiện đều hợp lệ mới dựng result/coverage và validate output schema/positions. `not_applied` của renderer không chứa result hoặc coverage.

Runner validate schema manifest, input/fact spans, refs và integrity controls cho **toàn run trước tạo output**. Manifest thiếu required fields, sai type/enum, span hỏng, refs trùng hoặc thiếu/trùng control/hash mismatch là lỗi integrity redacted `Invalid constraint reading experiment artifacts.`, dừng toàn run. Chưa tạo output, không biến lỗi annotation thành unsupported case.

Một manifest hợp schema nhưng curator ghi `scopeSupported=false`, `annotationComplete=false` hoặc có `excludedConstraints` liên quan là case abstention hợp lệ; runner không gọi renderer. Row riêng có `status: not_applied`, `origin: manifest_gate`, `reason: unsupported_scope` nếu scope false, nếu không là `unsupported_constraints`; không chứa candidate result/coverage. Nếu renderer abstain thì row có `origin: renderer` và reason nguyên trạng. Gate nghiên cứu không coi row null là pass; không dựng A/B pair cho row không có candidate.

“Báo coverage thiếu” là **runner-level `coverageGaps`**, không thay type `ConstraintCoverage`. Khi không áp, mỗi fact hợp lệ chưa dùng được có `{factId, quote, reason}`; mỗi excluded constraint có `{quote, reason}` và không cần gán giả supported kind. `annotationComplete=false` thêm gap `{reason: annotation_incomplete}` để không giả là đã biết mọi phần bị thiếu. Applied rows không có gaps. Những trường này mô tả annotation và khả năng hỗ trợ thủ công, không phải code phát hiện omissions. Hạn chế này phải giữ trong mọi báo cáo.

## Bảy loại điều kiện được hỗ trợ

Không chuẩn hóa thành giờ tuyệt đối, không tính lịch chung, không đoán ngày tương đối hoặc khối lượng công việc. Giữ nguyên cụm nguồn trong phần hành động được đặt rõ là điều người hỏi nêu.

| Kind / context | Hành động bắt buộc, theo nghĩa của quote |
|---|---|
| handover_obligation / transfer | Xác nhận người nhận, phần việc và tiêu chí hoàn tất; hỏi cách phối hợp thời điểm chuyển với hạn bàn giao được nêu |
| existing_skill_goal / transfer | Hỏi nhiệm vụ nào dùng được kỹ năng hiện tại; đối chiếu mục tiêu tiếp tục dùng kỹ năng, không tự liệt kê kỹ năng |
| learning_capacity / transfer | Hỏi yêu cầu/nhịp học và so với khả năng học được nêu; không coi số buổi thành số giờ hoặc bảo đảm đào tạo vừa sức |
| unavailable_time / housework_schedule | Nêu rõ không đề xuất vào khoảng bị vướng đã nêu; hỏi giờ thay thế và khả năng người cùng nhà, không đoán lịch họ |
| time_budget / housework_schedule | Hỏi phạm vi/thời lượng phần việc, kiểm tra giới hạn được nêu; nếu vượt thì đề nghị thu hẹp/chia lại/thời điểm khác, không hứa làm xong |
| available_window / housework_schedule | Đề xuất xác nhận người cùng nhà có thể trong cửa sổ được nêu; không khẳng định đó đã là giờ thống nhất |
| task_share_goal / housework_schedule | Thống nhất danh sách và tiêu chí chia đều (công sức/thời lượng cần hỏi thêm); không mặc định chia số lượng là công bằng hoặc trước đây chia lệch |

Không suy ra unavailable từ available hoặc đổi “muốn”, “có thể”, “tối đa”, “chỉ” thành điều chắc chắn khác. Giữ trọn qualifier trong quote. Có thể kết hợp nhiều điều kiện nhưng mỗi fact phải có một action riêng truy vết được. Không cắt bớt facts để vừa số actions; schema hiện tại cho phép mảng mở, warning độ dài/số lượng vẫn báo nguyên trạng.

Không hỗ trợ phủ định/trích dẫn của chính điều kiện, điều kiện giả định, mâu thuẫn chưa rõ, yêu cầu khẳng định chính sách công ty/lịch chung thiếu dữ kiện, hoặc loại constraint chưa có hành động: curator đánh dấu không hỗ trợ. Runtime không tự nhận ra các trường hợp đó; tests/manual labels không được quảng bá thành khả năng routing.

## Dựng bài và kiểm soát mâu thuẫn

File mới `lib/ai/constraint-reading.ts`; không sửa renderer v9.2 đã freeze. Candidate dùng các đoạn được nêu dưới đây để dựng object mới, không mutate control hoặc phụ thuộc fixture ID/literal toàn câu hỏi.

Không chỉ thay actionSuggestions rồi giữ mọi câu cũ: v9.2 có câu phủ nhận có dữ kiện về lịch bận/cảm xúc. Candidate phải rà toàn bộ prose và dùng các đoạn mới được soạn cho hai context ở mọi field có thể phủ nhận/ghi đè điều kiện mới. Chọn đơn giản: dùng lại **chỉ CONTROLLED_CARD_SYMBOLS**, tên/chiều canonical và guard/evidence; soạn summary/overview/themes/applications/connections/actions/reflection/closing riêng cho v9.3. Không gọi v9.2 renderer trong candidate để tránh kéo theo body không thích nghi; runner dùng nó hoặc artifact đã pin chỉ làm control.

Actions được dựng bởi bảy rule ở trên, thêm hướng dẫn nền về quy trình/giờ nếu còn cần; không viết lại bảy rule theo từng fixture. Candidate không interpolate raw question, chỉ quote đã validate bằng nội dung text thông thường, không thực thi hoặc coi là chỉ thị. Không log câu hỏi/quotes ngoài artifacts local tổng hợp đã chốt.

`ConstraintCoverage` có `factId`, `supportRef: "F1"`, `actionIndex`. Mỗi fact xuất hiện đúng một coverage entry, index hợp lệ. Câu hành động tương ứng nêu quote và thao tác đặc thù kind; không có facts tự tạo từ lá. Mapping đủ chỉ là structural proof, reviewer vẫn có thể kết luận hành động lặp lại dữ kiện mà không giải quyết.

Khi thiếu thông tin cần để quyết định, hành động là câu hỏi xác nhận cụ thể. Không gán fact giả cho điều chưa biết hoặc thay việc hỏi bằng dự đoán kết quả. Full result vẫn qua schema/position validator v9; báo editorial warnings không thêm filler hoặc nới gate.

## Development, provenance và đánh giá

Bốn controls là đúng output candidate v9.2 của bốn ca thất bại trong `.model-compare/controlled-reading-offline-2026-11-21/holdout-results.json`, không lấy bài của câu hỏi development cũ. Pin artifact/hash/question/cards/version và renderer/deck/evidence. Curator gán fact spans từ bốn câu hỏi ấy, không gán facts dựa trên prose control.

Runner mới filesystem-only `scripts/prepare-constraint-reading-experiment.ts` validate manifests/facts/controls trước ghi; lỗi thiếu/trùng/tamper dừng, output mới exclusive. Version `constraint-reading-offline-2026-11-22`. Ghi sourcePromptVersion v9, controlTransformVersion v9.2, candidateTransformVersion, nguồn/hash bytes đã đọc, annotation provenance, kind/quote/offset, coverage, schema/warnings, source modelRole lịch sử và generationCalls 0. Không tự gán usage cho candidate. Test fixtures synthetic phải chạy được không lệ thuộc local ignored artifacts.

Reviewer development khác người gán facts rà: đúng span/kind/đủ qualifier, không sót điều kiện, hành động dùng từng fact đúng mức, toàn bài không mâu thuẫn/unsupported/forced/mindreading/loaded premise, đúng biểu tượng/metadata và usefulness. Sửa development trước freeze; không gọi đây là chấm mù khi reviewer biết candidate.

Sau freeze tạo **4 cặp P1–P4** bằng packet builder có sẵn, control-vs-candidate cùng input. Human chỉ chọn A/B/tie. Key tách, reviewer mù ghi riêng kết quả, hash trước nhận human choices. Coverage/facts/provenance chỉ lưu private để không lộ version; reviewer mù đối chiếu câu hỏi đầy đủ, nguồn lá và output. Khóa choices trước mở key; không suy ra numeric scores/human semantic labels.

**Gate nghiên cứu:** 100% schema/metadata/span/coverage đúng; 0 blocker semantic trên toàn bài; cả 4 cases đủ actionable response cho mọi điều kiện; card specificity đúng cả ba lá mỗi bài; candidate được human chọn ít nhất 3/4 cặp. Abstention báo riêng, không tính là một bài đạt. Không đạt thì đóng NO-GO; không sửa baseline hoặc thêm ca để đủ thắng.

**Sau gate mới làm holdout:** curator mới chưa đọc rules/outputs soạn 4 positives mới (2/context, dữ kiện/thời điểm/giới hạn mới thuộc bảy kinds) và ít nhất 3 ca ngoài scope thủ công (phủ định, trích dẫn, constraint chưa hỗ trợ hoặc thiếu dữ kiện để khẳng định chính xác). Người annotation khác soạn source spans/manifests mà không xem outputs; reviewer độc lập kiểm tra cả annotation và full reading. Với loại mới phải abstain thật và báo coverage thiếu, không hạ kỳ vọng thành positive pass. Không đếm những ca null là router tự hiểu.

Áp lại cùng semantic/usefulness gates cho mọi positive mới; nếu chỉ một blocker hoặc bỏ sót điều kiện quan trọng thì NO-GO_CANDIDATE. Không có baseline AI mới thì không báo comparative holdout win rate. Không sửa freeze theo holdout; mọi sửa đổi cần version khác và bộ chưa xem. Dù đạt vẫn chỉ chứng minh downstream rule rendering với annotation thủ công đúng, chưa extraction/generalization rộng hoặc production readiness.

## Kiểm chứng và điểm dừng

Tests: span sai/trắng/out-of-range/Unicode combining characters/emoji, IDs trùng/unknown kind/context mismatch, facts rỗng/quá giới hạn; quote/data không bị thực thi; qualifier giữ nguyên. Mỗi kind có example khác development để chứng minh rule dùng quote đầu vào, không phân nhánh bằng fixture ID. Thay số/thời điểm trong quote hợp lệ phải thay đúng action còn prose không liên quan giữ nguyên. Negative/manual annotations không giả làm semantic detector.

Coverage/action index, schema/positions, immutability, support/null/fingerprint guards, source/no-overwrite/manifest failures và hashes frozen phải được test. Reviewer semantic chịu trách nhiệm type/quote relevance và omissions code không tự chứng minh. Chạy focused/full Vitest, lint, typecheck, diff check khi có code; đọc installed Next.js guide trước sửa source.

Lượt hiện tại chỉ thiết kế và task list, chưa code/fixtures/packet hoặc tests. Cần builder check rồi người dùng duyệt thiết kế trước implementation plan. Không dựng thêm hệ thống tổng quát, không nối runtime hoặc tự gọi model sau gate.

## Builder check

Reviewer độc lập xác nhận phạm vi nhất quán nhưng yêu cầu chốt ba hợp đồng: manifest lỗi so với abstention hợp lệ, thứ tự validation/support/scope và coverageGaps cho ca không áp. Đã bổ sung mục riêng với loại lỗi, row shape và priority cụ thể. Không có câu hỏi sản phẩm mới cần người dùng quyết định; đây là quyết định triển khai của agent để người dùng duyệt cùng thiết kế. Chưa kiểm tra code hoặc API trong lượt thiết kế.

## Cập nhật triển khai

Renderer/runner mới có tests và review, giữ source frozen; báo cáo `docs/benchmarks/v9-3-offline-2026-11-22.md`. Chưa mở key/review mù, chưa tạo holdout. 696 tests passed/4 skipped, lint/typecheck đạt; code review không findings; 0 model calls. Annotation vẫn thủ công, scope/production limits giữ nguyên.
