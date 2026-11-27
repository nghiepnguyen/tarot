# v9.1 — Thử nghiệm offline cho summary và keyMessage

Ngày21/11/2026. Trạng thái cập nhật:**spike offline đã triển khai,chờ người dùng chọn3cặp**;chưa kết luận semantic/preference. Báo cáo:`docs/benchmarks/v9-1-offline-2026-11-21.md`. Nguồn: `docs/benchmarks/v9-diagnostic-result-2026-11-21.md` và schema/evidence hiện tại.

## 1. Câu hỏi cần trả lời và lựa chọn giải pháp

Người dùng ưu tiên v9ở6/8cặp, nhưng summary/keyMessage vẫn biến biểu tượng thành hoàn cảnh có thật. Giả thuyết cần thử: thay đúng bốn trường mở/chốt ý bằng câu hỏi/hướng dẫn đã rà có giảm lỗi ở các trường đó mà vẫn được người đọc thích hơn không?

| Cách thử | Đánh đổi | Quyết định |
|---|---|---|
| Tiếp tục siết prompt | Ít code, nhưng v8.1/v9 và thử cũ vẫn sai | Không chọn cho bước đầu |
| Dựng bốn trường từ nội dung cố định đã rà, áp vào output v9 đã lưu | 0API calls, cô lập đúng phần thay đổi; phạm vi rất hẹp | Chọn cho thử nghiệm này |
| Planner/writer/judge nhiều bước | Thử trước vẫn thêm tiền đề, tốn calls/latency | Hoãn |

Đây là đề xuất cụ thể hóa hướng người dùng đã đồng ý thiết kế. Tái dùng bằng chứng từ thử bản ngắn dựng nguyên văn trong `docs/benchmarks/v8-1-round-1-2026-11-12.md`; không khởi động lại hệ thống hai bước đã thất bại. Mẫu mới giữ nguyên bài đầy đủ để đo riêng ảnh hưởng của bốn trường, khác bản đọc ngắn trước đây.

**Giới hạn cứng:** code mới sau này chỉ là một renderer thuần và công cụ thử offline. Không sửa PromptVersion/parser/provider, không đăng ký prompt candidate trong vòng đầu. Không sửa v9 đã đóng băng, active v7, schema, DB, credit, Reflection, UI, dependency hoặc safety policy. Không deploy/commit/push. Ngân sách bước đầu0đ/0model calls; quyền gửi14requests đã dùng ở task4 không được coi là quyền gọi thêm cho thử nghiệm mới.

Tên “v9.1” ở đây là tên hướng nghiên cứu. Artifact dùng `sourcePromptVersion: v9-2026-11-20` và `transformVersion: anchors-offline-2026-11-21`; không nói model đã sinh bằng một prompt v9.1 chưa tồn tại.

## 2. Phạm vi ba tình huống, routing và abstention

| Context do curator gán | Fixture development | Bộ lá theo Bối cảnh / Hiện tại / Hướng đi |
|---|---|---|
| transfer | relation-absent-1 | Hermit xuôi / Two of Swords xuôi / Eight of Pentacles ngược |
| restart_drawing | relation-absent-2 | Star xuôi / Two of Pentacles ngược / Page of Wands xuôi |
| housework_schedule | relation-weak-3 | Six of Wands xuôi / Six of Cups ngược / Hermit xuôi |

Context là **nhãn nội bộ được rà thủ công cho thí nghiệm**, không đến từ client, keyword matching hoặc model tự phân loại. Fixture ID chỉ giúp manifest tìm artifact; renderer không nhận hoặc phân nhánh theo fixture ID. Không quảng bá đây là router hiểu mọi câu hỏi tự do.

Renderer dự kiến:
`renderReadingAnchors(question, cards, context) -> { summary, keyMessages: [string,string,string] } | null`.

- Tái dùng `buildInterpretationEvidence` để validate/tra canonical cards; structural input sai thì cùng lỗi redacted hiện có.
- Tái dùng `needsReadingSupport`; nếu cần support thì không áp renderer, không thay policy.
- Context null/không được hỗ trợ hoặc fingerprint card ID+position+orientation không khớp trọn bộ cho context: trả null. Runner ghi `not_applied`, giữ control nguyên vẹn và không đếm là sample đã sửa thành công.
- Khi context/fingerprint khớp, trả nguyên văn summary và ba keyMessages bên dưới. Không nhập lại prose tự do của AI, không rewrite/cắt câu hỏi hoặc suy luận facts.
- Nhãn context sai vẫn có thể tạo lời không phù hợp dù fingerprint đúng. Bộ thử bắt buộc kiểm tra nhãn thủ công trước khi áp; chưa có biện pháp tự động chứng minh relevance theo nghĩa câu hỏi. Đây là lý do helper không được nối production hoặc nhận context từ người dùng.
- Đổi lá/chiều/vị trí hiện là **ngoài phạm vi, abstain**, không giả là đã có đủ nội dung thích nghi Tarot. Giữ lá và chiều trên UI không đủ chứng minh diễn giải nhạy theo nghĩa từng lá.

Không dùng lại nguyên prose teaser để dựng anchors vì đó là nội dung cho surface khác, không phải kho nội dung đã qua grounding gate. Tái dùng validation/schema, không xây thêm framework/template engine.

## 3. Bản nháp nội dung có kiểm soát

Các câu bên dưới là bản nháp cần reviewer rà trước khi freeze renderer, không phải kết quả thử đã đạt.

### Chuyển nhóm

**summary:** Bạn có thể bắt đầu bằng việc xác định mình muốn biết gì trước khi xin chuyển nhóm. Nếu đã có nhóm dự định chuyển tới, hãy hỏi về công việc, cách phối hợp và tiêu chí phù hợp với điều bạn tìm kiếm.

- Hermit xuôi / Bối cảnh: Bạn mong việc chuyển nhóm giúp thay đổi điều gì, nếu có?
- Two of Swords xuôi / Hiện tại: Tiêu chí nào bạn muốn làm rõ trước khi cân nhắc các lựa chọn chuyển nhóm?
- Eight of Pentacles ngược / Hướng đi: Nếu đã có nhóm dự định chuyển tới, bạn muốn hỏi gì về cơ hội học hỏi?

### Vẽ lại

**summary:** Để bắt đầu vẽ lại, bạn có thể chọn một việc nhỏ phù hợp với thời gian mình muốn dành cho tuần đầu. Thử xác định thời lượng và chủ đề của một buổi vẽ, rồi tự xem điều gì đáng giữ lại hoặc điều chỉnh sau buổi đó.

- Star xuôi / Bối cảnh: Điều gì khiến bạn muốn trở lại với việc vẽ vào lúc này?
- Two of Pentacles ngược / Hiện tại: Bạn muốn thử dành khoảng thời gian nào cho việc vẽ trong tuần đầu?
- Page of Wands xuôi / Hướng đi: Bạn muốn thử nét vẽ hoặc chủ đề nhỏ nào trong buổi đầu?

### Đổi lịch dọn dẹp

**summary:** Trước khi trả lời đề nghị đổi lịch, bạn có thể làm rõ đổi một lần hay đổi thường xuyên và mỗi người sẽ nhận phần việc nào. Nếu cần, hãy nêu thời gian bạn có thể thu xếp rồi cùng xác nhận phương án phù hợp.

- Six of Wands xuôi / Bối cảnh: Bạn muốn hai bên xác nhận phương án đổi lịch theo cách nào?
- Six of Cups ngược / Hiện tại: Có cách chia việc cũ nào bạn muốn xem lại, nếu có?
- Hermit xuôi / Hướng đi: Bạn cần làm rõ điều gì cho mình trước khi trả lời bạn cùng nhà?

Các mẫu không khẳng định đang trì hoãn/quá tải, lịch cũ hiệu quả hay động cơ chưa được kể. Những ý như “học hỏi”, “thời lượng”, “cách chia việc” là điều để hỏi/đề xuất, không phải hoàn cảnh đã được xác minh. Cần chấm riêng mức liên quan biểu tượng: câu an toàn nhưng quá chung chưa đủ chứng minh bản đọc Tarot tốt.

## 4. Dựng mẫu và giữ provenance

Control là đúng output v9 đã sinh trong diagnostic, cho cả ba fixture, không đổi control theo bản người dùng từng chọn. Runner tìm input/result từ `.model-compare/v9-task4-diagnostic-state.json` và `.model-compare/v9-task4-diagnostic-continuation-2026-11-21.json`, lọc đúng fixture ID và version v9. Mỗi fixture phải có đúng một output nguồn; thiếu/trùng thì dừng, không chọn bản mới nhất hoặc bản có điểm đẹp. Kiểm tra question/cards khớp và source hashes; không dựa vào filename để đoán nội dung.

Tạo bản sao, chỉ thay `summary` và ba `perCard[i].keyMessage`. Giữ nguyên overview/themes/perCard.text/connections/actions/reflectiveQuestion/closingNote và thứ tự ba phần. Không mutate raw artifact hoặc lưu ngược vào DB. Dùng schema/validator v9 hiện tại cho cả control và transformed result.

Artifacts local dưới `.model-compare/` phải ghi: source path/hash, fixture ID, context nhãn thủ công, fingerprint, sourcePromptVersion, transformVersion/hash và bốn field paths đã thay. Generated copies không ghi `promptVersion=v9.1` như thể đã được AI sinh. Raw usage/token/latency là của control đã sinh trước, không phải cost/latency mới của renderer. Thí nghiệm0calls không được diễn đạt thành “một bài đọc AI giá0đ”.

**Các trường khác đã có lỗi sẽ vẫn có lỗi.** Ghi cả lỗi còn lại và mâu thuẫn giữa anchor mới/body cũ; không tuyên bố cả bài đạt grounding chỉ vì12trường mục tiêu đã sạch. Không mở rộng sửa overview/connections trong cùng vòng để làm số đẹp.

## 5. Kiểm chứng và cách đánh giá

### Gate offline trước user review

- 3fixture đúng context/card fingerprint đều áp được; mỗi output có đúng ba keyMessages không rỗng và qua schema/position validator hiện có.
- Mỗi khác biệt nằm trong bốn field paths được phép; raw artifact/control/canonical deck không bị mutate.
- Invalid ID/count/position/orientation/question bị từ chối redacted; safety route, null/unknown context hoặc fingerprint không khớp không được áp mẫu.
- Gán nhãn test với đầy đủ phủ định/trích dẫn/ngoài chủ đề phải do curator quyết định context/null trước khi test. Việc bảo toàn input và manual abstention không chứng minh có semantic router tự động.
- Không sửa output requirements hoặc ghép filler để đạt word count; warning editorial của các keyMessage/summary ngắn được báo riêng, không che giấu.
- Snapshot source v9/prompt registry/active v7 và số calls không đổi. Test/lint/typecheck phù hợp phải đạt khi có code.

### Đánh giá ba cặp development

Một curator xáo A/B control-vs-transformed thành3cặp và giữ key riêng. Một reviewer mới rà đúng12trường mục tiêu, đối chiếu F/C, chốt các cờ và dẫn chứng trước mở key. Reviewer còn phải ghi mâu thuẫn với body và sự mất cụ thể/ý nghĩa lá; không chấm mỗi “câu có dấu hỏi” thành an toàn mặc định.

**Người dùng chỉ chọn A/B/tie**, đúng sở thích đã nêu; không yêu cầu điểm số hoặc tự biến lựa chọn thành semantic labels. Chỉ tiến tới kiểm tra rộng hơn khi:0unsupported/forced/mindreading ở12trường mục tiêu, không sai card metadata/schema, và transformed được chọn ít nhất2/3cặp. Đây là ngưỡng thử nghiệm nhỏ, không phải significance hoặc release gate. Nếu một bản có lỗi ở field không sửa, không đếm nó thành bài đã đạt zero-errors toàn bộ.

Nếu mẫu an toàn nhưng người dùng không thích hơn, report thẳng sự đánh đổi; không tự thêm suy diễn cá nhân hóa hoặc thêm API call để che kết quả.

### Ca mới trước khi gọi thử model

Sau khi renderer và templates đã freeze, curator khác chuẩn bị6câu mới:2mỗi context, cùng bộ lá/chiều/phạm vi trên, có diễn đạt khác nhưng không ép bỏ qua dữ kiện mới. Thêm ít nhất3negative routing cases (phủ định/đổi chủ đề/trích dẫn) gán context null, cùng các biến thể card/position/orientation để kiểm tra abstention. Chưa viết các câu mới trong thiết kế này để tránh dùng chúng chỉnh mẫu.

Phase này vẫn0calls: chỉ rà anchors và applicability trên input mới. Không có baseline AI output cho câu hỏi mới thì không tự ghép body v9 của câu hỏi cũ để gọi là một bài đọc holdout đúng. Muốn so full reading trên câu mới cần protocol/API budget riêng sau đó.

Không dùng12holdout v9 đã có để chỉnh nội dung, không cộng các lần đọc cùng câu vào số câu hỏi độc lập. Mọi GO ở đây chỉ cho phép nghiên cứu bước kế tiếp; production vẫn NO-GO do cả bài, safety/model coverage, credit và latency/cost gates chưa giải quyết.

## 6. File plan nhỏ nhất cho bước triển khai sau

| File dự kiến | Trách nhiệm |
|---|---|
| `lib/ai/reading-anchors.ts` (mới) | Renderer thuần,3context/3fingerprints,12literal strings, validate+abstain như trên; không runtime integration |
| `lib/ai/reading-anchors.test.ts` (mới) | Fingerprints/negative cases, literals sau rà, redaction, immutability và schema compatibility |
| Script thử offline nhỏ trong `scripts/` | Đọc3raw artifacts đúng manifests, tạo bản sao với4field thay và provenance; assert chỉ thay allowed paths; không API/DB |
| `scripts/prepare-benchmark-review.ts` | Ưu tiên tái dùng blinding nếu shape provenance phù hợp; không gắn transform ID vào registry cho tiện CLI. Nếu cần adapter riêng, giữ3pairs và key tách biệt, không viết lại framework |
| `docs/benchmarks/` | Report targeted-field results, human preferences, lỗi body còn lại và GO/NO-GO phạm vi nghiên cứu |

Không sửa `v9.ts`, active registry, `parse-output.ts`, providers, metrics hoặc `PromptVersion` để phục vụ spike. Tên script/thể hiện manifest để implementer quyết định theo convention, nhưng tuyệt đối không route bằng fixture ID trong renderer hoặc tự phân loại câu hỏi bằng regex.

## 7. Bàn giao và điểm dừng

Đây là thiết kế offline có scope rõ, không phải feature production hay cam kết loại bỏ hallucination. Bước tiếp theo là triển khai renderer/spike bằng tests trước, rồi dựng3cặp từ artifacts sẵn có. Không tự triển khai trong lượt thiết kế này; không gọi model/đổi active/đụng credit. Sau spike, chỉ mở scope hoặc lập candidate prompt/integration mới khi có bằng chứng và yêu cầu tiếp tục.


## 8. Kiểm tra thiết kế

- Builder check bởi reviewer mới, không có lịch sử cuộc trò chuyện: “nothing important left”. Đây là kiểm tra đủ rõ để triển khai, không phải review chứng minh12câu an toàn trong mọi ngữ cảnh.
- Đã kiểm tra cấu trúc3context/3summary/9keyMessages, các đường dẫn nguồn tồn tại và scope0API calls. Nội dung literal còn cần semantic review theo gate ở mục5 sau khi dựng mẫu.
- Lượt thiết kế ban đầu chỉ viết thiết kế và cập nhật follow-up task list; chưa sửa source, dựng output thử, chạy unit tests hoặc gọi model. Chưa phát sinh chi phí model mới. Trạng thái: sẵn sàng triển khai spike offline theo thiết kế khi người dùng yêu cầu; production vẫn NO-GO.


## Cập nhật triển khai

Người dùng đã yêu cầu tiếp tục implementation. Renderer/runner offline có tests/validation,3cặp M1–M3 sẵn sàng;597tests passed/4skipped,lint/typecheck đạt,code review không có important findings.0model calls mới,active v7/frozen v9không đổi. Semantic review đã lưu riêng nhưng chưa mở;human preference và GO mở rộng còn chờ. Ranh giới thiết kế vẫn áp dụng.
