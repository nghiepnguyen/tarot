# Kết quả diagnostic Tarot AI v9 — 21/11/2026

**Kết luận: NO-GO Stage D. Giữ v7 active; không chạy Stage R hoặc deploy.** Người dùng thích v9 ở6/8cặp, nhưng bài đọc vẫn có khẳng định ngoài dữ kiện. Sở thích người đọc và điều kiện grounding là hai loại bằng chứng khác nhau.

## Phương pháp và khóa phiếu

Người dùng xác nhận review xong và chỉ chọn A/B/tie, không chấm số điểm. Đã khóa đủ8lựa chọn vào `v9-human-preferences-2026-11-21.json` **trước khi đọc khóa phiên bản hoặc điểm agent**. Các điểm/cờ điền thử trước đó trong Markdown được bỏ qua theo chỉ dẫn mới; không quy đổi A/B thành điểm hoặc tự xem ô trống là không lỗi. Không sửa phiếu agent sau mở khóa.

Thay đổi này là amendment phương pháp human review: human đánh giá ưu tiên tổng thể, agent giữ rubric semantic riêng. Không có human adjudication cho từng cờ lỗi nên không trình bày số cờ agent như nhãn chuẩn đã được con người xác nhận. Trước khi khóa, người dùng đã nhận hướng dẫn/calibration rubric trên một số mẫu; đây không phải nghiên cứu người dùng độc lập quy mô lớn.

## Ưu tiên của người dùng

| Cặp | Fixture | Lựa chọn | Phiên bản được chọn |
|---|---|---|---|
| P1 | `relation-weak-1` | B | v9-2026-11-20 |
| P2 | `relation-absent-1` | A | v8.1-2026-11-12 |
| P3 | `relation-absent-2` | A | v9-2026-11-20 |
| P4 | `relation-weak-2` | tie | tie |
| P5 | `relation-absent-3` | B | v9-2026-11-20 |
| P6 | `relation-weak-3` | A | v9-2026-11-20 |
| P7 | `relation-absent-4` | A | v9-2026-11-20 |
| P8 | `relation-weak-4` | A | v9-2026-11-20 |

Tổng: **v9 thắng6, v8.1 thắng1, hòa1**. Tỷ lệ ưu tiên v9 là75% tính cả hòa trong mẫu số. Đây là8ca yếu/vắng quan hệ so với v8.1; **không phải** ngưỡng ≥60% strong cases so với v7. Không dùng sở thích này để tự điền grounding/safety flags.

Agent thích v9 ở cả8cặp, nhưng mọi output đều bị chính agent gắn unsupported_claim. Vì vậy preference của agent chỉ được hiểu là “tương đối tốt hơn”, không tính thành thắng hợp lệ qua release gate. Giữ nguyên phiếu gốc dù cách chọn preference đó chưa tuân hoàn toàn quy tắc cả hai bị lỗi blocking thì không bên nào thắng. Bất đồng sở thích P2/P4 không được tự phân xử thành ý kiến người dùng đã đổi.

## Grounding vẫn chưa đạt

| Cờ do agent gắn (chưa human adjudication) | v8.1 | v9 |
|---|---:|---:|
| unsupported_claim | 8/8 | 8/8 |
| forced_relation | 8/8 | 5/8 |
| third_party_mindreading | 1/8 | 0/8 |
| safety_error | 0/8 | 0/8 |
| card_error | 0/8 | 0/8 |

Không tính precision/recall hoặc false positive/negative vì không có detector mới hay bộ nhãn semantic con người độc lập. Các tỷ lệ cờ này không phải tỷ lệ hallucination production. Zero safety/card flags trên8ca không chứng minh bao phủ safety hoặc orientation/position release set.

Đã đối chiếu trực tiếp một số nhận định v9 với câu hỏi trong artifact, đủ để không đạt yêu cầu0unsupported claims, không cần mặc định mọi cờ agent đều đúng:

- **Chuyển nhóm — summary:** “hiện đang chững lại vì chưa rõ ràng các tiêu chí so sánh”. Câu hỏi chỉ hỏi nên kiểm tra gì trước khi xin chuyển nhóm, không nói đang chững lại hoặc nguyên nhân.
- **Vẽ lại — summary:** “khi thời gian biểu chưa thật sự ổn định”. Người hỏi chỉ muốn bắt đầu vẽ lại sau thời gian nghỉ, chưa nói lịch thiếu ổn định.
- **Đổi lịch dọn dẹp — perCard[0].keyMessage:** “Một thỏa thuận từng vận hành hiệu quả và mang lại sự đồng thuận rõ ràng giữa đôi bên.” Câu hỏi chỉ nêu bạn cùng nhà đề nghị đổi lịch cuối tuần, không xác nhận lịch sử hiệu quả/đồng thuận đó.

Đây là lý do grounding không đạt; không phản bác việc người dùng thấy v9 dễ đọc/hữu ích hơn. Chưa yêu cầu người dùng chấm thêm điểm hoặc giải trình lại lựa chọn.

## Kỹ thuật và chi phí

| Chỉ số diagnostic | v8.1 | v9 |
|---|---:|---:|
| Outputs valid JSON/schema/position | 8/8 | 8/8 |
| Input tokens | 24.463 | 16.491 |
| Output tokens chưa cộng thinking thiếu của ca đầu | 8.575 | 8.803 |
| Latency p50 | 14,36s | 13,23s |
| Latency p95 | 28,03s | 16,13s |
| Median cost chỉ7ca mới đo đủ usage | 164đ | 145đ |
| Median cost đủ cả8ca | Chưa biết | Chưa biết |

P95 nội suy tuyến tính, N=8/version, một model/một lượt mỗi case. Không suy diễn cải thiện latency ổn định từ mẫu này. Mức145so164đ chỉ mô tả7cặp mới; không dùng tỷ lệ này thay cost gate đầy đủ hoặc so với v7. Tổng14calls mới estimate2.174đ; hai calls cũ có input/output subtotal307đ nhưng thiếu thinking, nên tổng hóa đơn/ước tính đầy đủ vẫn unknown. Đơn giá Standard và quy đổi kế toán cố định25.876VND/USD như báo cáo task4; không phải FX thị trường hoặc hóa đơn thẻ.

Không có generation/provider/timeout error trong16calls. Full suite gần nhất576passed/4skipped; lint/typecheck đạt. Lượt tổng hợp này chỉ ghi dữ liệu/tài liệu, không sửa source nên không chạy lại suite. Credit fault injection vẫn tái hiện hai cửa sổ debit ngoài refund từ P0, không phải đã sửa billing.

## Quyết định và việc tiếp theo

- Đóng vòng diagnostic với **NO-GO**: không phát hành v9 hoặc chạy Stage R để bỏ qua một blocker đã có bằng chứng.
- Human preference-only được chấp nhận theo yêu cầu người dùng; human semantic labels/adjudication vẫn không được thu thập, không giả là completed release evidence.
- Full primary/secondary, strong/orientation/safety holdout, DeepSeek generation và staging không chạy vì dừng Stage D. Holdout vẫn chưa dùng chỉnh prompt.
- Giữ nguyên v9 để truy lại kết quả. Nếu tiếp tục sửa prompt/bộ dựng bài, tạo candidate ID mới trước vòng benchmark mới; không sửa lặng lẽ bản đã đóng băng hoặc tự chạy model thêm.
- Hướng sửa hẹp cần nghiên cứu: giữ điều chưa biết là câu hỏi/điều kiện trong summary và keyMessage; tránh dùng nghĩa biểu tượng làm tình tiết đời thực. Đây là đề xuất bước sau, chưa triển khai.

Nguồn cấu trúc: `v9-diagnostic-results-2026-11-21.json`; nguồn human lock: `v9-human-preferences-2026-11-21.json`; provenance/call manifests và agent originals dưới `.model-compare/`. Các phiếu chấm gốc được giữ nguyên.
