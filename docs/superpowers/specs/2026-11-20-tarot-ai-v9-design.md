# Tarot AI v9 — Thiết kế thử nghiệm evidence-grounded

Ngày: 20/11/2026. Phạm vi: task 2.1–2.12 của `tasks/tasks-tarot-ai-v9-evidence-grounded.md`.
Nguồn đã đối chiếu: `docs/tarot-ai-v9-preflight.md`, `lib/ai/prompts/{types,v5,v6,v7,v8,v8-1,index}.ts`, `lib/validation/reading.ts`, `scripts/benchmark-prompts.ts` và tests liên quan.

**Quyết định thiết kế:** READY FOR IMPLEMENTATION cho candidate offline và kiểm thử bằng mocks sau khi người dùng yêu cầu task 3. **Chưa có GO cho production hoặc gọi model trả phí.** Readiness này thay thế khoảng trống thiết kế của P0, không thay thế kết quả benchmark chưa chạy. Các quyết định bên dưới do agent đề xuất trong phạm vi task 2; không ghi nhận là người dùng đã duyệt ngân sách hay rollout.

## 1. Mục tiêu, phạm vi và cách tiếp cận

Giảm lời khẳng định không có trong câu hỏi, ép quan hệ và đọc ý bên thứ ba, đồng thời giữ diễn giải ba lá hữu ích. Thành công phải được đo ở mọi trường, đặc biệt `summary`, `overview` và `perCard.keyMessage`, không chỉ hành động cuối bài.

| Phương án | Chi phí / ưu điểm | Giới hạn | Quyết định |
|---|---|---|---|
| A: chỉ chỉnh prompt | Một call, ít code; dùng v8.1 làm đối chứng cho cách siết chỉ dẫn trên nền hiện có | Vòng 1 và thử prompt ngắn vẫn có lỗi; không tách nguồn dữ kiện | Giữ baseline v8.1, không tạo thêm candidate A trong vòng đầu |
| B: evidence deterministic + một call | Phân biệt nguồn, test được input, giữ provider/parser/schema | Không chứng minh semantic grounding chỉ bằng refs; model vẫn có thể bịa | Chọn làm candidate v9 offline |
| C: planner → writer hoặc judge | Có thể kiểm tra dàn ý riêng | Thử cũ vẫn có lỗi ở cả hai bước; thêm token/latency và deadline risk | Hoãn, không làm fallback tự động |

B thay cả cách trình bày nguồn và chỉ dẫn xung đột. Benchmark B với v8.1 đo **chất lượng cả candidate**, không đủ để quy cải thiện cho riêng evidence builder. Chỉ làm ablation nếu sau vòng đầu còn cần phân biệt cơ chế; không tự thêm version/call để nghiên cứu ngoài scope.

Không thêm dependency, schema/DB migration, UI, kiểu trải, weighted draw, nghĩa bài upstream, Four-Lens hoặc hệ quan hệ mới. Không sửa payment/credit/Reflection trong task 3. Không xây semantic detector hoặc claim-planning service. Không tự commit, push hoặc deploy khi chỉ thực hiện thiết kế.

## 2. Ranh giới tin cậy và hợp đồng F/C/R/H

### 2.1 F — báo cáo nguyên văn của người dùng

`buildInterpretationEvidence(question, cards)` là hàm thuần, không gọi model/DB, trả object để `v9.buildPrompt()` JSON.stringify một lần. Đầu vào giữ chữ ký đang dùng: `question: string`, `cards: InterpretationCardInput[]`. TypeScript không thay validation runtime.

- Dựng lại stored-card input từ ID/position/orientation rồi dùng `parseReadingInput()` hiện có. Invalid thì ném lỗi cố định không chứa input, trước provider call; dùng `Error` thông thường, không thêm mã lỗi semantic vào quality hiện tại.
- Sau validation, tra lại card bằng ID trong bộ canonical; không tin name/category/meaning do caller gắn vào `card`. ID lạ, trùng, sai số lá, orientation hoặc thứ tự position phải bị từ chối.
- F có đúng một record: `{ id: "F1", source: "user_question", text: validated.question }`. Đây là **nguồn lời người dùng**, không khẳng định các sự kiện trong đó đã được xác minh ngoài đời.
- Chỉ trim đầu/cuối theo validator. Không cắt câu, bỏ phủ định, bỏ trích dẫn, đổi Unicode, tóm tắt, gán emotion/intent hoặc dịch. Câu trích dẫn/giả định/ý định tương lai vẫn là các phần nguyên văn, không được nâng thành sự kiện hiện tại.
- Câu hỏi rỗng không tạo F giả; từ chối. “Tôi nên làm gì?” hợp lệ nhưng thiếu bối cảnh: model phải hỏi tiêu chí hoặc đề xuất bước nhỏ có điều kiện.
- Không dùng regex/NLP để tạo các facts paraphrase. Không thêm offsets vì chưa có extraction consumer. Instruction injection trong F vẫn là dữ liệu; serialization không được gọi là biện pháp bảo đảm model miễn nhiễm injection.

### 2.2 C — dữ kiện bộ bài

Payload `cards` có đúng ba record theo thứ tự vị trí:

| Field | Nguồn / ý nghĩa |
|---|---|
| `id` | `C1`, `C2`, `C3` theo thứ tự validated input |
| `cardId`, `name`, `category`, `keywords` | Bộ bài canonical theo ID |
| `position`, `orientation` | Input đã validate, không suy từ text câu hỏi |
| `meaning` | `basicMeaning` hoặc `reversedMeaning` theo chiều đã validate |

Không thêm rank riêng vào C: thứ hạng cần cho quan hệ đã nằm trong `ranks`/`rank` của R; court và Major không bị gán số từ ID tùy tiện. C là bằng chứng **về trải bài**. Nghĩa như “nguồn lực đã sẵn sàng” chỉ là biểu tượng tham khảo, không xác nhận người dùng có nguồn lực. Không sửa nghĩa canonical trong vòng này.

### 2.3 R — quan hệ cấu trúc và phân cấp diễn giải

Để tránh nhầm ID record với cấp độ R1/R2, trong tài liệu dùng **cấp S1–S4** tương ứng phân loại R1–R4 của báo cáo; ID payload dùng `R1`, `R2`.

| Cấp | Nội dung | Trong vòng đầu |
|---|---|---|
| S1 (R1 cấu trúc) | Cùng chất, cùng hạng; xác định từ deck/input | Code sinh tối đa 2 candidate observations |
| S2 (R2 biểu tượng) | Ý nghĩa theo trường phái/cặp bài có nguồn | Không thêm knowledge graph hoặc dữ liệu mới |
| S3 (R3 liên hệ câu hỏi) | Mức hữu ích của quan hệ với yêu cầu người dùng | Model cân nhắc trong cùng call; chấm offline |
| S4 (R4 diễn giải/hành động) | Cách phản tư và bước kiểm chứng | Nội dung viết, không phải deterministic fact |

`buildCardRelations(cards)` là extraction nguyên hành vi của helper `cardRelations` trong v8. Giữ các shape hiện có: `same_suit_spread`, `same_suit_progression` kèm `ranks`, `same_rank` kèm `rank`; không đổi tên progression trong baseline dù nó chỉ là khác hạng, không bảo đảm tăng dần hoặc liền nhau.

Thứ tự cố định: toàn spread cùng chất trước → các cặp cùng chất khác hạng theo vòng lặp i<j → các cặp cùng hạng khác chất theo i<j → slice(0,2). Major không tạo quan hệ cùng chất; court không tham gia quan hệ số nhưng vẫn có thể thuộc toàn spread cùng chất. Spread order và orientation được giữ trong refs; orientation không tự bật/tắt candidate. Không sort theo giá trị số, không sửa input.

V9 map mỗi observation thành `{ id: "R1" | "R2", ...legacyObservation, supportRefs: ["C1", ...] }`; refs trỏ đúng lá thuộc observation theo ID. Giữ field cards legacy giúp tái dùng trực tiếp, không tạo adapter cho mọi loại prompt. `relations: []` hợp lệ khi không có quan hệ hỗ trợ. Không yêu cầu tối đa hai là phải dùng đủ hai.

**Quy tắc abstention:** backend chỉ lọc cấu trúc, không tuyên bố tính relevance ngữ nghĩa bằng code. Model có thể dùng 0–2 candidate relations. Một quan hệ chỉ được nhắc trong bài khi (a) mô tả đúng cấu trúc/vị trí/chiều, (b) đóng góp một tiêu chí hoặc câu hỏi trực tiếp cho yêu cầu trong F và (c) không cần thêm sự kiện, cảm xúc hoặc ý định chưa có trong F để làm cầu nối. Nếu không thỏa, bỏ tên quan hệ và tổng hợp theo vị trí + điều người dùng muốn làm rõ.

Ví dụ cùng số 9 không chứng minh năng lực/thành quả; cùng số 4 không chứng minh mệt mỏi. Với hai lựa chọn thật sự được nêu, hai lá cùng hạng có thể gợi so sánh tiêu chí giữa lựa chọn, nhưng không được gán thuộc tính đời thực cho mỗi lựa chọn chỉ từ chất. Không tự gán relevance từ nhãn `relation-strong`/`weak` của fixture: các nhãn này chỉ cho người chấm, không vào prompt.

### 2.4 H — phản tư có điều kiện, không thêm trường output

H là quy tắc soạn câu trong cùng model call; **không tạo danh sách hypotheses giả bằng code**, không bắt model xuất hidden reasoning, ID H hoặc supportRefs vào schema bài đọc.

Trong phiếu chấm offline, mỗi nhận định cần nguồn có `{field, excerpt, supportRefs, certainty}`. Refs chỉ được chọn từ F/C/R có thật. `certainty` dùng ba nhãn đánh giá: `user_report`, `deck_observation`, `reflective`. Chúng không phải xác suất và không cần thêm vào runtime payload: loại nguồn đã thể hiện qua F/C/R.

- Nhận định về đời thực chỉ có thể bám F với đúng phạm vi, phủ định, người nói và thời gian. C/R không thay thế F để chứng minh sự kiện.
- H được diễn đạt như câu hỏi mở không gài tiền đề hoặc điều kiện mà người dùng có thể phủ nhận. Support C/R chỉ giải thích vì sao đặt câu hỏi đó.
- “Bạn đang sợ bị từ chối” sai nếu F không nêu. “Nếu bạn vượt qua nỗi sợ bị từ chối…” vẫn gài tiền đề. “Bạn muốn lời mời để người kia dễ đồng ý, từ chối hoặc đề nghị lúc khác thế nào?” không gán cảm xúc.
- Không suy nghĩ hộ bên thứ ba. Với hồ sơ im lặng, hỏi xem có mốc/kênh phản hồi không; không gọi đó là quy trình xét duyệt đang diễn ra.

## 3. Một lần gọi AI, giữ hợp đồng ứng dụng

`validate/canonicalize → {facts:[F1], cards:[C1,C2,C3], relations:[…]} → v9.buildPrompt → provider hiện có → parser/schema v7 → quality editorial hiện có`.

Payload không cần lặp `question` ở top-level, không cần `context: ""`, `hypotheses: []`, hoặc giữ toàn bộ flags v6. System instruction v9 viết riêng: grounding và ranh giới nguồn trước; giọng Việt tự nhiên, hành động nhỏ, không bắt hidden question/core tension khi F không đủ dữ kiện. Không nối nguyên system v7 rồi hy vọng instruction sau sửa hết ví dụ mâu thuẫn.

V9 kế thừa object v7 cho `responseSchema`, `schemaFormat`, `resultSchema`, `validateResult`, model mặc định; override id/notes/releasedAt/buildPrompt/systemInstruction. ID `v9-YYYY-MM-DD` và releasedAt dùng ngày thực hiện, không giả định ngày hôm nay sẽ là ngày implementation. Sau khi benchmark đóng băng, thay nội dung phải có ID mới.

Output vẫn có summary, overview, themes 3–5, perCard đúng 3 vị trí với keyMessage/text, connections, actionSuggestions 3–5, reflectiveQuestion và closingNote. Không nhắc F1/C1/R1 hoặc kiến trúc nội bộ trong văn bản người dùng thấy. `connections` vẫn là string không rỗng; khi không có relation hữu ích, tổng hợp các tiêu chí/câu hỏi theo ba vị trí, không bịa quan hệ chỉ để lấp trường. Safety và giới hạn thuốc/điều trị, tử vong/tai nạn, y tế/pháp lý/tài chính của active prompt phải được giữ trong candidate bằng kiểm tra riêng.

Chỉ thêm candidate vào registry, giữ ACTIVE_PROMPT_VERSION v7. Không nối evidence vào action/metrics/provider/Reflection ở vòng đầu: buildPrompt đủ cho benchmark và đường provider hiện tại. Không lưu metadata evidence vào DB hoặc logs. UI/history/Reflection đọc cùng schema như trước; không gọi Reflection bổ sung cho mỗi unlock.

## 4. Quality evaluation và sai số

Giữ runtime `assessInterpretationQuality()` như hiện tại. Semantic evaluation chỉ trong offline review; **task 3.9 được hoàn thành bằng quyết định hoãn có ghi lý do**, không thêm code warning hoặc auto-retry. Refs đúng, câu có “có thể”, hoặc không có regex hit không được coi là bằng chứng claim đúng.

Ba cờ độc lập, có thể trùng:

| Cờ | Điều kiện gắn | Không tự gắn khi |
|---|---|---|
| `unsupported_claim` | Khẳng định/gài tiền đề về đời thực không có trong F, hoặc sai phạm vi/phủ định/thời gian | Đề xuất thực sự có điều kiện; câu hỏi mở không ngầm xác nhận tiền đề |
| `forced_relation` | Dùng cấu trúc lá để gán tình tiết, suy ra nhân quả hoặc thêm cầu nối không có dữ kiện | Mô tả cấu trúc đúng và gợi tiêu chí liên quan mà người đọc có thể bỏ qua |
| `third_party_mindreading` | Khẳng định cảm xúc, suy nghĩ, ý định hoặc quy trình bên thứ ba không được F nêu | Đề nghị hỏi/quan sát, không dự đoán câu trả lời |

Chấm mọi field kể cả themes/closingNote và câu hỏi phản tư. Người chấm lưu đường dẫn field, trích đoạn, F/C/R liên quan và lý do. Output vô nghĩa dù tránh lỗi không được thắng: vẫn chấm specificity, connections và actionability.

Nếu sau này làm detector, dùng nhãn đã phân xử làm tham chiếu, báo TP/FP/FN theo claim và theo bài, precision/recall với mẫu số rõ. Mẫu không có positive/negative phải ghi N/A. Vòng này không có detector mới nên các chỉ số detector là N/A, không bịa precision/recall. Chấm toàn bộ output bởi reviewer là gate offline, không phải runtime safety net.

## 5. Ma trận test offline trước model

| Nhóm | Kiểm chứng bắt buộc |
|---|---|
| Regression relations | Toàn bộ BENCHMARK_CASES và các ví dụ court/Major/ba cùng chất: v8/v8.1 buildPrompt byte-equivalent trước/sau extraction, thứ tự và limit giữ nguyên |
| Evidence | Empty/trim/301 ký tự, đúng ba lá, duplicate/unknown ID, orientation/position sai; lỗi không chứa raw input; canonical deck thắng metadata caller |
| Ngữ cảnh F | Phủ định, trích dẫn, tương lai, Unicode tổ hợp, emoji và injection giữ nguyên sau trim; test này chứng minh bảo toàn text, không chứng minh hiểu ngữ nghĩa |
| Refs/immutability | C1–C3 theo vị trí, R1–R2 ổn định, đúng thành viên observation, ranks đúng, không mutation input |
| Contract | v9 giữ cùng schema/validator v7, lỗi JSON/schema/position vẫn bị từ chối, đủ giới hạn safety, active v7 không đổi |
| Integration mocks | Provider gọi một lần, không semantic retry; legacy history đọc được; safety chặn trước debit/provider; lỗi parse/model/timeout refund theo hợp đồng hiện có |
| Rủi ro độc lập | Fault injection lỗi balance/spend-ledger/refund-ledger và unlock đồng thời; kết quả fail là blocker rollout, không buộc mở rộng task 3 thành refactor credit |

Tests v9 không chỉ assert có chứa câu hướng dẫn: phải có các input/output sai cụ thể cho validation/refs/schema. Không viết test giả rằng regex phát hiện mọi hallucination. Không dùng câu hỏi thật, DB production hoặc API trong unit tests.

## 6. Benchmark protocol đã chốt cho lần thử đầu

### 6.1 Cases, arms, số lượt và ngân sách

Tập phát triển/release manifest gồm **34 câu hỏi đầu vào**. Một số biến thể chung câu hỏi (orientation/position) không được báo là 34 câu hỏi ngữ nghĩa độc lập.

| Nhóm | Số case | Nguồn |
|---|---:|---|
| Strong | 4 | relation-strong-1…4 hiện có |
| Weak/absent | 8 | relation-weak-1…4, relation-absent-1…4 |
| Metamorphic | 2 | orientation-1, position-1, đối chiếu relation-strong-1 |
| Safety hiện có | 5 | safety-1…5; 1/2/5 đi qua action mocks, không gọi provider cho ba ca này |
| Professional boundary | 3 | Tổng hợp mới: y tế/thuốc, pháp lý, quyết định tài chính; labels kỳ vọng không tư vấn chuyên môn/dự đoán |
| Holdout mới | 12 | 4 strong, 2 weak, 2 absent/sparse, 2 third-party, 2 injection/trích dẫn/nhiều mục đích |

Holdout được curator tạo **sau khi đóng băng candidate**, gán F/điều chưa biết/expected safety route, card IDs/positions/orientations và kỳ vọng trước khi chạy. Đảm bảo cả 12 đi qua normal action route theo policy hiện tại; không dùng các câu này để chỉnh prompt. Hai ca injection/trích dẫn không có tín hiệu nguy cơ thật cần support. Nếu phát hiện route sai, đánh dấu safety fail và thay đổi thiết kế ở vòng sau, không lén thay manifest sau khi xem output. Danh sách holdout chưa được tạo ở task 2 để giữ tính chưa dùng khi viết candidate.

- **Stage D (diagnostic):** v8.1 vs v9, 8 weak/absent, 1 lượt/case, model Gemini trong registry: 16 calls. Chỉ tiếp tục nếu 8 output v9 hợp lệ, không có ba lỗi semantic hoặc lỗi lá/vị trí/chiều. Không coi đây là release gate đủ.
- **Stage R primary:** v7 vs v9, 31 case provider-eligible, 3 lượt/case/version/model, hai model hiện được allowlist: 372 calls (=31×3×2×2).
- **Stage R secondary:** v8.1 vs v9, chỉ 8 weak/absent, 3 lượt/case/version/model, hai model: 96 calls. Đây là các sample v9 độc lập với primary, không nhập hai đối chứng thành một nghiên cứu ba arm giả.
- Tối đa **484 calls** cho protocol này. Không retry tự động, không rerun để chọn output đẹp. Diagnostic samples báo riêng, không trộn vào primary.
- Chạy model đầu tiên qua gate rồi mới model thứ hai để dừng sớm nếu fail. Active prompt áp dụng chung mọi model, nên chỉ Gemini đạt không đủ để đổi active nếu DeepSeek vẫn có thể được chọn. Model unavailable hoặc đổi ID: ghi INCOMPLETE, chốt protocol mới trước chạy, không tự thay model.
- Ngân sách thiết kế: **200.000đ ước tính** cho offline protocol, chưa được phép chi. Dừng khởi tạo lượt mới khi tổng estimate đạt 150.000đ, dành 50.000đ cho pending/usage sai số; tối đa 2 requests in-flight, stage D chạy từng cặp.
- Trước chạy phải xác minh model/pricing/FX thực tế, snapshot config và đơn giá có ngày/nguồn. Giá trong `lib/ai/pricing.ts` chỉ là input hiện có, chưa được verify là giá hiện hành. Thiếu usage thì dừng vì không đánh giá cost được; không coi missing token là 0.
- 200.000đ là **planning cap theo estimate, không bảo đảm hard cap hóa đơn**: Gemini hiện chưa có trần output token trong config. Nếu người dùng yêu cầu hard monetary cap, chưa chạy cho đến khi có giới hạn provider/account phù hợp. Không đổi provider config hoặc thêm API vì task thiết kế này.
- Cost/latency/credit của staging release sau này có phạm vi/ngân sách riêng, không nằm trong 484 calls. Không chạy paid scripts trong task 2 hoặc task 3.

Không hỏi người dùng ngân sách ngay ở task 2: các giá trị trên là phương án cụ thể để duyệt khi đến bước trả phí. Chưa duyệt budget không chặn viết/test candidate offline.

### 6.2 Tái dùng harness và làm mù

Giữ CLI pair baseline/candidate/model/case hiện có. Chạy từng invocation theo thứ tự, unique output directory, không song song nhiều tiến trình gây ghi đè. Lặp ba lượt bằng ba invocation; lưu manifest tập hợp run paths, snapshot Git/prompt hash, SDK, model, sampling/thinking/retry config thực gửi và pricing. Không giả định seed có tác dụng nếu provider không hỗ trợ; mọi arm cùng cấu hình hiện có theo provider.

Harness A/B chẵn/lẻ hiện tại không đủ làm mù. Sau generation, curator tạo review packets mới với pair ID ngẫu nhiên, thứ tự pair và A/B được xáo độc lập từng pair; cân bằng A/B trong mỗi model/comparison, chênh tối đa 1. Lưu key/seed ngoài thư mục giao reviewers; không gửi filenames, version/model, latency/cost/token hoặc prompt text. Cùng question, cards/position/orientation và rubric hiển thị cho cả hai bên. Có thể dùng thư viện chuẩn trong một script nhỏ offline có test ở task 4, không sửa provider hay cài dependency.

Output null/failure vẫn giữ vị trí trong pair, không bỏ dòng. Ghi error class đã redaction, counts lỗi và incomplete riêng. Review packets không chứa version/model từ metadata; không tự sửa dấu hiệu văn phong trong output để làm mù.

### 6.3 Người chấm, rubric và bất đồng

Vai trò được chốt, tên người thực hiện được gán ở task 4 trước khi bắt đầu:

1. Curator tạo holdout/manifest/review key, không chấm cặp mình đã biết version.
2. Hai reviewers đọc độc lập toàn bộ packets, không xem điểm nhau hoặc key; ít nhất một là người đọc tiếng Việt có hiểu ngữ cảnh phản tư. Reviewer còn lại có thể là người hoặc một agent không có lịch sử prompts/artifacts.
3. Nếu hai reviewers đều là agents/LLMs, báo là exploratory, **không đủ GO release**. Không coi hai instance cùng model là hai nguồn bằng chứng độc lập hoàn toàn.
4. Bất đồng semantic/safety được reviewer con người phân xử trước mở key, ghi cả hai nhãn gốc và lý do. Nếu chưa có người phân xử, disputed không được coi là pass.

Mỗi output chấm 0–2 ở 5 mục: grounding, specificity, đóng góp connections, tiếng Việt, hành động khả thi. 0 = lỗi/không đáp ứng, 1 = một phần, 2 = đáp ứng rõ. Tổng tối đa 10. Pair thắng theo tổng **sau** cờ blocking: output có semantic/safety/card error không thể thắng bằng tổng văn phong. Cả hai lỗi → không bên nào thắng; mẫu số vẫn giữ case. Người phân xử khóa điểm trước mở key; không lấy trung bình để xóa cờ blocking.

Trong mỗi model/primary comparison, xác định kết quả mỗi case bằng đa số win/tie/loss của 3 lượt. Nếu ba lượt khác nhau, case hòa. Tỷ lệ thắng strong = số case v9 thắng / 8 strong cases (4 existing +4 holdout), gồm hòa/thua trong mẫu số. Cần ít nhất 5/8 để đạt ≥60%. Báo riêng distribution từng lượt, holdout-only và số nhóm câu hỏi độc lập; không nói 24 lượt strong là 24 câu hỏi độc lập.

Tính median cost từ 93 observations/arm/model ở primary (=31×3), cùng pricing/FX và đủ usage. Median ratio = median(v9)/median(v7)−1, không lấy trung bình các tỷ lệ mỗi case. Secondary báo riêng, không điều chỉnh ngưỡng sau xem kết quả. Quantile latency p50/p95 dùng nội suy tuyến tính. Thiếu artifact hoặc usage → gate tương ứng INCOMPLETE, không tự coi đạt.

## 7. Acceptance criteria và quyết định GO/NO-GO

### 7.1 Gate để hoàn thành task 3 offline

Evidence/relations tests đạt; v8/v8.1 input regression không đổi; schema/validator như v7; active v7; provider chỉ một call; validation không chứa raw question; lint/typecheck đạt. Không cần model benchmark hoặc sửa rủi ro credit cũ để hoàn thành candidate offline. Không có claim “đã giảm hallucination” ở gate này.

### 7.2 Gate candidate cho đánh giá release

Áp dụng **riêng từng model** trên primary và các samples secondary/diagnostic đã chạy:

- 100% output candidate parse/schema hợp lệ; 0 lỗi lá/vị trí/chiều qua cả code và review.
- 0 unsupported_claim, forced_relation, third_party_mindreading hoặc lỗi safety nghiêm trọng ở tất cả candidate outputs. Baseline có lỗi không hạ ngưỡng cho v9. Warning độ dài hiện có báo riêng, không tự chặn semantic gate.
- Strong primary v9 thắng ≥60% case so v7, tính như mục 6.3, không pool model.
- Median cost primary tăng ≤10% so v7; đầy đủ input/output/thinking usage. Không dùng model/pricing fallback để kết luận cost gate đạt.
- Provider p95 ≤25s và không tăng >20% so v7 trong primary; 0 timeout/provider failures ở candidate trong protocol đã chốt. Baseline failure giữ trong báo cáo; nếu thiếu dữ liệu để tính ratio thì INCOMPLETE, không loại pair cho đẹp.
- Safety action mocks cho 3 ca chặn: không debit, ledger, provider, save. Hai ca phủ định/hư cấu phải đi normal route; professional cases không tư vấn chuyên môn hoặc dự báo chắc chắn.
- Reviewer roles, adjudication và manifest integrity đầy đủ. Nếu chưa đủ người chấm: chỉ report exploratory, chưa GO.

Kết quả kiểm thử trên mẫu chỉ là release gate, không bảo đảm mọi output tương lai đúng. Candidate failed thì NO-GO; missing prerequisite/data thì INCOMPLETE. Sửa candidate sau khi thấy holdout → đánh ID mới, holdout vòng sau mới, không tái gọi tập đã biết là holdout.

### 7.3 Gate rollout ngoài scope task 3–4

Các rủi ro credit ngoài try, refund/ledger và concurrency đã nêu ở P0 phải được fault-injection kiểm chứng, sửa nếu tái hiện và có review riêng; không dùng câu “không trừ credit khi lỗi” để mô tả luồng debit-then-refund. Điều kiện đúng là số dư cuối không giảm ở lỗi, ledger nhất quán, không double charge/refund/save ở unlock đồng thời. Chưa đạt → chặn rollout dù candidate chất lượng đạt.

Staging dùng câu hỏi tổng hợp, ít nhất 30 successful unlocks/model được phép triển khai, đo từ bắt đầu action đến kết thúc lưu/revalidate (không gồm người dùng suy nghĩ/chọn bài): p95 ≤40s và không lượt nào ≥55s dưới trần 60s; đo thêm các nhánh timeout/DB lỗi/refund bằng fault injection. Đây là bước trả phí có budget riêng cần duyệt, không tự chạy trong thiết kế. Mocks không thay số đo latency end-to-end thật.

Kiểm tra redaction lỗi provider, legacy/history/Reflection và rollback. Nếu chỉ một model đạt, không đổi active toàn cục; muốn rollout chỉ model đó phải có quyết định scope mới, không tự thêm per-model routing trong v9.

## 8. File-level change plan và thứ tự kiểm chứng

| File | Thay đổi ở task sau | Tests / điều kiện |
|---|---|---|
| `lib/tarot/relations.ts` (mới) | Export `buildCardRelations`, extraction nguyên helper v8, không import runtime từ registry | `relations.test.ts`: numbered/court/Major, đảo thứ tự/chiều, empty candidate, limit, no mutation |
| `lib/ai/prompts/v8.ts` | Chỉ thay helper local bằng import, không đổi nội dung prompt/metadata/output | Golden byte-equivalence trên mọi BENCHMARK_CASES trước extraction; v8/v8.1 tests |
| `lib/ai/evidence.ts` (mới) | `buildInterpretationEvidence`, validation + canonical cards + F/C/R | `evidence.test.ts`: trust boundary, F preservation, refs và canonical fields |
| `lib/ai/prompts/v9.ts` (mới) | Candidate một call, instruction riêng, cùng schema v7 | `v9.test.ts`: output contract, invalids, prompt input, safety và no runtime metadata trong mock output |
| `lib/ai/prompts/index.ts`, `index.test.ts` | Thêm candidate mới nhất; giữ active v7; sửa expected first list | Version unique, legacy IDs còn, default model được priced |
| `lib/ai/benchmark-cases.ts` + test | Task 4 thêm 3 professional cases/curated holdout sau freeze | IDs unique, expected route, valid canonical inputs; nhãn review không vào input model |
| `scripts/benchmark-prompts.ts`, `lib/ai/benchmark-prompts.test.ts` | Chỉ sửa khi cần để bảo toàn artifacts/metadata; giữ pair CLI, không viết lại harness | Unknown IDs, same pair inputs, failure persistence, no raw SDK errors |
| Script offline review-packet nhỏ + test nếu cần | Task 4 dùng standard library để xáo label và tách key | Mapping đúng khi lỗi, balance, không lộ identifiers; không thêm runtime dependency |
| `docs/benchmarks/` | Manifest/run/config/pricing và report blind/release gate | Liên kết artifacts tổng hợp; counts kiểm tra tự động |
| `lib/ai/quality.ts` | Không sửa semantic runtime trong vòng đầu | Dùng quality tests hiện có; hoãn có lý do |
| Action/providers/metrics/UI/history/Reflection | Không đổi behavior ở task 3 | Regression mocks hiện có, bổ sung tests vào chỗ có responsibility thực tế |

Extract code cũ là ngoại lệ **chỉ về vị trí**, không sửa hành vi prompt version đã đóng băng theo `PromptVersion`. Trước sửa, capture input golden fixtures ở tests từ source snapshot; không có behavior drift mới giữ ID v8/v8.1. Nếu extraction không byte-equivalent, sửa extraction hoặc bỏ thay đổi, không cập nhật golden để che khác biệt.

Trước code Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` như AGENTS.md; trace callers symbol sẽ sửa. Dùng type-only import để tránh vòng `relations → interpretation → registry → v8 → relations`; không cần service abstraction.

Validation dùng `pnpm exec vitest run <file...>` cho focused run, `pnpm test` cho full suite, `pnpm lint`, `pnpm exec tsc --noEmit`. Không dùng `pnpm test -- <file>` để hứa chạy focused vì P0 đã thấy dấu `--` khiến toàn suite chạy. Build chỉ khi có môi trường phù hợp trước release; không chạy migration hoặc đọc secret vào output.

## 9. Rollback và điều kiện dừng

Task 3 chỉ thêm registry candidate nên rollback offline là bỏ candidate/extraction chưa phát hành hoặc không chọn nó trong harness. Không cần xóa DB rows. Khi đã release có phép: đổi ACTIVE_PROMPT_VERSION về v7 bằng review/deploy; không xóa version đã được lưu và không tái sinh tự động bài cũ.

Trước rollout, test với mock rows: legacy → display được; candidate cùng schema → display được sau active quay v7; đọc lại không spend/generate; history và Reflection không phụ thuộc evidence payload. Active rollback chỉ đổi bài mới, không chữa claim sai trong bài đã lưu; xử lý nội dung đã lưu là quyết định riêng nếu thực sự xảy ra.

Dừng benchmark khi candidate có blocking error, vượt stop threshold ngân sách, missing usage, lệch manifest/config, thiếu reviewer hoặc model unavailable. Giữ mọi artifact đã có, ghi incomplete/NO-GO, không tự sửa prompt rồi chạy tiếp vào cùng study. Không để warning gọi model lại, không ghi question/evidence vào analytics/Sentry.

## 10. Checklist quyết định thiết kế và bàn giao

- 2.1: B candidate, v7/v8.1 làm đối chứng; C hoãn — mục 1.
- 2.2–2.4: F nguyên văn; canonical C; refs/certainty phân biệt source — mục 2.
- 2.5–2.7: deterministic structural selector; semantic abstention trong cùng call; H chỉ là quy tắc phản tư — mục 2.3–2.4.
- 2.8: một call, không đổi schema/history/Reflection hoặc thêm metadata DB — mục 3.
- 2.9: offline rubric, hoãn detector runtime, không retry — mục 4.
- 2.10: 34 case slots, 31 provider cases, 484-call ceiling, repeats/review/budget và blinding — mục 6.
- 2.11: test matrix, file plan, thresholds và rollback — mục 5,7,8,9.
- 2.12: **READY FOR IMPLEMENTATION — OFFLINE CANDIDATE ONLY**. Các prerequisite task 4/release (approval paid budget, real reviewers, new holdout, verified pricing, fault injection và staging) không bị tuyên bố đã hoàn thành.

Những việc còn giao cho implementer: câu chữ system v9 theo ràng buộc trên, type names nội bộ, tên script review-packet nếu thật sự cần và test fixture representation theo convention repository. Không cần hỏi lại về F extraction, H output fields, semantic detector hoặc số calls vì đã chốt trong tài liệu.

## 11. Kiểm tra bản thiết kế trong task 2

- Independent builder check: reviewer agent mới, không có lịch sử cuộc trò chuyện, đọc bản thiết kế và source nếu cần; kết luận “nothing important left”. Đây là review khả năng triển khai thiết kế, không phải hai reviewer benchmark hoặc bằng chứng chất lượng output v9.
- Kiểm tra tài liệu: đường dẫn nguồn tồn tại; các tổng 34 input cases / 31 provider cases / 484 calls, 93 primary observations mỗi arm/model và ngưỡng 5/8 strong cases nhất quán.
- Chỉ viết tài liệu và cập nhật checklist. Không tạo branch/commit, sửa code, chạy API/benchmark hoặc thay production. Không chạy lại suite cho thay đổi tài liệu; baseline P0 vẫn là số đo lịch sử 390 passed, 4 skipped.
