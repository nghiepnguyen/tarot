# v9.2 — Thiết kế thử nghiệm toàn bài có kiểm soát

Ngày 21/11/2026. Trạng thái: người dùng đã duyệt thiết kế ngày 22/11/2026; chưa triển khai. Cơ sở: `docs/benchmarks/v9-1-result-2026-11-21.md`. Kế hoạch triển khai: `docs/superpowers/plans/2026-11-22-tarot-ai-v9-2-offline-implementation.md`. Phạm vi offline và các lựa chọn dưới đây giữ nguyên sau khi duyệt.

## Mục tiêu và bằng chứng

v9.1 được chọn 3/3 cặp, reviewer không gắn cờ ở 12 trường mục tiêu. Body cũ vẫn tự gán động cơ/hoàn cảnh; mẫu an toàn nhưng ý nghĩa lá mờ và mẫu vẽ chưa đưa bài tập cụ thể. v9.2 thử xem một bài đầy đủ dựng từ nội dung có nguồn và lời gợi ý có điều kiện có giải quyết cả hai vấn đề không.

Thành công trong vòng này chỉ là bằng chứng nghiên cứu trên ba context và ba bộ lá cố định. Không phải ứng viên prompt mới, semantic detector hoặc hệ thống tổng quát. Ngân sách 0 model API calls; không đổi active v7, v9/v9.1 đã freeze, schema/parser/provider, DB/credit/UI/Reflection/dependency. Không commit/push/deploy.

## Các hướng và đề xuất

| Hướng | Lợi ích | Giới hạn |
|---|---|---|
| Siết prompt rồi sinh lại | Giữ prose linh hoạt | Cần quyền/ngân sách mới; thử trước chưa loại hết suy diễn |
| Dựng toàn bài offline bằng nội dung có nguồn và gợi ý đã rà | Kiểm tra đúng body còn lỗi, không calls mới | Nội dung soạn sẵn, phạm vi hẹp; có thể khô hoặc lặp |
| Chuỗi planner/writer/judge | Linh hoạt hơn | Tăng chi phí và độ phức tạp, chưa có bằng chứng cần thiết |

Đề xuất hướng thứ hai. Không vá tiếp renderer v9.1 hoặc chỉ thay thêm vài câu dễ thấy: mọi trường prose của candidate phải được dựng độc lập để không giữ lỗi body nguồn. Đây là lựa chọn đề xuất để người dùng duyệt cùng thiết kế.

## Phạm vi áp dụng

Giữ đúng ba context thủ công và fingerprint đã dùng: transfer (Hermit xuôi / Two of Swords xuôi / Eight of Pentacles ngược), restart_drawing (Star xuôi / Two of Pentacles ngược / Page of Wands xuôi), housework_schedule (Six of Wands xuôi / Six of Cups ngược / Hermit xuôi), theo Bối cảnh / Hiện tại / Hướng đi.

Context do curator rà câu hỏi và gán trước khi render; không nhận từ client, không regex phân loại. Null/unknown/prototype context, sai bất kỳ lá/chiều/thứ tự hoặc support route trả null. Input sai cấu trúc dùng lỗi redacted hiện tại. Nhãn sai vẫn có thể áp sai: chưa giải quyết routing tự động. Câu có yêu cầu/điều kiện nằm ngoài nội dung hỗ trợ phải gán null, dù cùng chủ đề.

Hàm mới `renderControlledReading(question, cards, context): InterpretationResult | null` dùng `InterpretationCardInput[]`, `ReadingAnchorContext | null`, evidence builder và support guard hiện có. Không import renderer v9.1 để lấy prose. Context type có thể dùng type-only import. Trả object/arrays mới mỗi lần.

## Hợp đồng nội dung toàn bài

Dùng schema `InterpretationResultSchema` hiện tại; không thêm trường public. Mọi phần dưới đây đều được dựng mới: summary, overview, themes, ba keyMessage/text, connections, actionSuggestions, reflectiveQuestion, closingNote. Metadata vị trí phải khớp input.

- Tách rõ ý nghĩa biểu tượng và đề xuất kiểm chứng. Không dùng lá để xác nhận chuyện đã xảy ra, nguyên nhân, tính cách, cảm xúc hoặc ý nghĩ người khác.
- Mỗi perCard.text nêu tên lá/chiều, dùng nghĩa canonical đúng chiều từ evidence C làm nguồn, rồi diễn đạt biểu tượng bằng ngôn ngữ trung tính và thêm câu hỏi/gợi ý theo context. Không chép nguyên câu canonical nếu câu ấy gán hoàn cảnh/động cơ cho “bạn”; thêm tiền tố “Về biểu tượng” không vô hiệu hóa lời khẳng định đó. Ví dụ Two of Swords xuôi chỉ gợi chủ đề cân nhắc hoặc chưa nhìn đủ thông tin, không khẳng định người hỏi trì hoãn vì sợ hãi. Bản diễn đạt trung tính phải được reviewer đối chiếu nguồn; không thêm ý mới để làm lời khuyên hấp dẫn. Artifact riêng lưu C-ref, nghĩa nguồn và đoạn diễn đạt tương ứng, không thêm schema public. Nếu không thể giữ đúng biểu tượng mà tránh tiền đề sai thì NO-GO, không sửa deck hoặc hạ gate.
- keyMessage ngắn, liên quan đúng vị trí và nội dung text, không ép thành câu hỏi nếu lời đề xuất rõ hơn. Không chỉ thêm tên lá để coi là đã đạt card specificity.
- Overview/summary mô tả mục đích của cách đọc và các bước có thể thử. Không kể lại câu hỏi thành sự kiện mới. Themes là chủ đề quan sát, không chẩn đoán.
- Connections ở cả ba bộ không khẳng định quan hệ nhân quả hoặc dựng câu chuyện chung bắt buộc. Nêu ba góc nhìn như lựa chọn tham khảo; có thể ghi rõ không cần ghép thành một kết luận về hoàn cảnh thật. Không đổi schema để cho chuỗi rỗng; không thêm filler để qua độ dài.
- Actions là lựa chọn cụ thể, có thể quan sát/điều chỉnh, không mệnh lệnh hoặc bảo đảm kết quả. ReflectiveQuestion không cài tiền đề; closingNote không hứa hẹn tương lai.
- Không interpolation câu hỏi thô vào prose hoặc logs. Không tự trích facts bằng regex. Giữ nguyên câu hỏi trong artifact input để reviewer đối chiếu.

### Nội dung hành động tối thiểu cần có

| Context | Hướng dẫn cụ thể phải xuất hiện | Điều không được mặc định |
|---|---|---|
| transfer | Đề nghị xác nhận quy trình/điều kiện/thời điểm xin chuyển với đầu mối phù hợp; nếu đã có nhóm đích, hỏi công việc và hỗ trợ học kỹ năng | Đã có nhóm đích, được duyệt, đang do dự hoặc không hài lòng |
| restart_drawing | Một ví dụ tùy chọn: chọn đồ vật có sẵn, phác đường nét khoảng 5 phút, xem muốn thử lại hay điều chỉnh; thời lượng linh hoạt | Có đủ dụng cụ/giờ rảnh, kỹ năng sa sút, mệt mỏi hoặc cần chữa lành |
| housework_schedule | Hỏi giờ mới, đổi một lần hay thường xuyên, phần việc mỗi người; nếu chưa phù hợp thì đề xuất giờ khác | Lịch cũ thất bại, từng xung đột, ai thiếu trách nhiệm hoặc né tránh |

Đây là yêu cầu biên soạn cho ba mẫu, không phải literal đã freeze. Builder viết toàn bộ draft trước, reviewer rà nội dung và mức đặc thù từng lá, sửa các lỗi development rồi mới khóa hash. Không dùng kết quả holdout để sửa phiên bản đã freeze. Không xây engine/planner/cơ sở dữ liệu claims hoặc bộ phát hiện hallucination.

## Kiến trúc và provenance

1. Renderer thuần mới trong `lib/ai/controlled-reading.ts`; giữ nguyên `reading-anchors.ts` và hash v9.1.
2. Runner mới `scripts/prepare-controlled-reading-experiment.ts`, chỉ filesystem. Control là đúng ba bản transformed v9.1 trong `.model-compare/anchors-offline-2026-11-21/`, không chọn lại theo preference. Đối chiếu schema, đúng một row mỗi fixture/version, input/cards và hashes nguồn; chưa đủ thì fail trước ghi output.
3. Candidate là object mới, không spread body control. Validate schema/position và ghi editorial warnings nguyên trạng. Không hạ validator để làm số đẹp.
4. Artifact mới `.model-compare/controlled-reading-offline-2026-11-21/`, tạo exclusive, không overwrite. Ghi sourcePromptVersion v9, controlTransformVersion anchors-offline-2026-11-21, candidateTransformVersion controlled-reading-offline-2026-11-21, renderer/deck/evidence hashes, context/card fingerprint, nguồn/hash controls và số calls 0. Usage cũ chỉ là sourceUsage, không phải usage candidate.
5. Tái dùng `buildReviewPackets` cho ba cặp full reading, key tách private. Phiếu chỉ yêu cầu A/B/tie như người dùng đã chọn; không yêu cầu điểm số. Không lộ tên phiên bản/lý do thử trong anonymous packet.

## Kiểm chứng trước khi chấm

Tests có ý nghĩa: schema/metadata của ba context; tên/chiều đúng trong perCard.text và C-ref/nghĩa nguồn đúng chiều trong provenance; literal đã rà được khóa sau development (không bắt buộc chép nghĩa canonical vào prose); các actions tối thiểu; immutability/owned arrays; support/null/unknown/prototype; thay từng lá/chiều/thứ tự phải abstain; lỗi input redacted. Snapshot literals chỉ khóa phiên bản, không chứng minh grounding.

Runner tests dùng filesystem tạm: source thiếu/trùng/tampered question/cards/hash/version, schema sai, từ chối overwrite, control/source không mutate, candidate không giữ prose body nguồn. Không import provider/DB hoặc gọi mạng. Kiểm tra registry/active prompt và hashes frozen vẫn không đổi. Khi có code: focused/full Vitest, lint, typecheck, diff check; đọc guide Next.js cài trong repo trước sửa code.

Reviewer độc lập rà toàn bộ prose của ba candidates, ghi field path/excerpt/reason cho unsupported claim, forced relation, mindreading, loaded premise, lỗi lá/chiều/vị trí, mâu thuẫn giữa các đoạn, usefulness và card specificity. Tests không thay semantic review.

## Gates và thứ tự đánh giá

**Development:** soạn/rà ba mẫu trên ba input development đã dùng. Chỉ tạo packet sau khi không còn blocker semantic/metadata. Freeze renderer, canonical deck/evidence và controls. Reviewer mù kết quả riêng; khóa human choices trước mở key. Người dùng chọn A/B/tie, không suy ra điểm hoặc human semantic labels.

**Gate nghiên cứu:** 100% schema/metadata đúng; 0 unsupported/forced/mindreading/loaded-premise blocker trên toàn bài theo reviewer; mỗi context có hành động cụ thể trả lời yêu cầu và cả ba perCard có liên hệ biểu tượng đúng chiều không biến thành sự kiện. Candidate được người dùng chọn ít nhất 2/3 cặp. Không đạt thì NO-GO mở rộng; báo tradeoff thẳng, không sửa control hoặc sinh thêm cho đủ thắng.

**Holdout chỉ sau gate:** curator khác chưa đọc nội dung/outputs soạn 6 câu positive mới (2/context) và ít nhất 3 ca null thủ công gồm phủ định, trích dẫn, yêu cầu mới vượt phạm vi. Có biến thể lá/chiều/thứ tự để kiểm tra abstention. Không dùng lại holdout v9/v9.1 như câu mới. Chạy candidate anchor/body độc lập, không ghép control/body cũ vào câu mới. Reviewer mới chỉ nhận question/cards/output, rà toàn bài theo cùng tiêu chí. Không có AI baseline mới thì không báo win rate holdout; số câu không phải số templates độc lập.

Nếu holdout phát hiện blocker hoặc thiếu usefulness, ghi NO-GO cho ứng viên; muốn sửa phải tạo phiên bản khác và cần holdout chưa xem. Các bản cũ và tập đã xem trở thành dữ liệu development.

Dù các gate này đạt, **production vẫn NO-GO**: còn thiếu semantic human adjudication, card/question coverage rộng, runtime routing, safety/integration, credit và cost/latency gates. Không tự nối registry hoặc gọi model sau gate offline.

## Điểm dừng và file dự kiến

Trong lượt này chỉ viết thiết kế và cập nhật task list. Sau khi thiết kế được duyệt mới viết implementation plan rồi triển khai. Các file dự kiến: renderer/test mới, runner/test mới; review packets/report mới dưới docs/benchmarks; fixture holdout mới chỉ được curator tạo sau freeze/gate. Không sửa các modules runtime.

Chưa chạy tests/build/E2E cho thiết kế thuần tài liệu. Không gọi model mới. Cần builder check trước bàn giao bản thiết kế; mọi giới hạn phải giữ trong plan và báo cáo sau.

## Builder check

Reviewer mới phát hiện nghĩa canonical có câu trực tiếp gán trì hoãn/sợ hãi cho “bạn”; việc chép nguyên văn trái grounding gate. Đã sửa hợp đồng: dùng diễn đạt biểu tượng trung tính được rà với nguồn, lưu C-ref/nghĩa nguồn riêng; không coi tiền tố hoặc trích dẫn là cách tự động chữa suy diễn. Các quyết định này do agent đề xuất, không phải yêu cầu mới từ người dùng. Reviewer không thấy blocker quan trọng khác; preference chỉ đại diện ba ví dụ đã soạn.
