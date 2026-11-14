# PRD — Cải thiện phần liên kết lá bài trong diễn giải Tarot AI

Nguồn yêu cầu gồm [mẫu PRD](../create-prd.md), [báo cáo tích hợp](../docs/tarot-skill-integration-review.md) và lựa chọn 1C, 2B, 3A của chủ dự án. Đợt này gồm prompt ứng viên v8, benchmark chấm mù, gợi ý trong form và yêu cầu xử lý an toàn trước khi trừ credit nếu kiểm thử phát hiện lỗi nghiêm trọng. Đầu ra cuối đợt là kết quả benchmark và quyết định phát hành.

## 1. Tổng quan

Prompt v7 đã tổng hợp ba lá trong mục `connections`, nhưng đầu vào mới cung cấp nghĩa từng lá. Ứng viên v8 sẽ bổ sung một số quan hệ có thể xác định từ ba lá thực tế để phần tổng hợp bám sát câu hỏi hơn. Gợi ý tùy chọn trong form giúp người đọc đưa thêm chi tiết thực tế. Kiểm thử an toàn xác định cách ứng dụng cần phản hồi khi câu hỏi thể hiện rõ nguy cơ tự hại.

## 2. Mục tiêu

1. Tăng tỷ lệ bài được người chấm mù ưu tiên về độ cụ thể và độ bám lá ở nhóm có quan hệ rõ.
2. Cho người dùng thêm bối cảnh bằng chính ô nhập hiện tại, trong giới hạn 300 ký tự.
3. Xử lý các lỗi an toàn nghiêm trọng phát hiện trong đợt kiểm thử trước khi cho phép phát hành v8.
4. Có hồ sơ quyết định phát hành dựa trên chất lượng, độ ổn định, chi phí và độ trễ.

## 3. User stories

- Là người mở khóa diễn giải, tôi muốn thấy ba lá liên quan thế nào đến vấn đề của mình để tìm được một bước tiếp theo có thể kiểm chứng.
- Là người chưa biết diễn đạt câu hỏi, tôi muốn có một gợi ý ngắn để thêm chi tiết mà vẫn có thể tiếp tục ngay.
- Là người dùng đang có nguy cơ tự hại, tôi muốn nhận được phản hồi hỗ trợ phù hợp mà không phải mất credit cho lần yêu cầu đó.
- Là người vận hành, tôi muốn so sánh hai prompt trên cùng đầu vào và model để quyết định có phát hành hay không.

## 4. Yêu cầu chức năng

1. **Prompt ứng viên.** Tạo phiên bản mới kế thừa v7. Dùng đúng ID, vị trí, chất và chiều của ba lá. Cung cấp tối đa hai quan sát, ưu tiên ba lá cùng chất, hai lá cùng chất có tiến trình số hoặc hai lá cùng số khác chất. Quy tắc theo số áp dụng khi xác định được hạng; ca không có quan sát phù hợp đi theo cách tổng hợp của v7.
2. **Diễn giải.** Mục `connections` diễn giải quan sát phù hợp với câu hỏi và vị trí, tránh lặp nội dung từng lá. Phần suy luận về đời thực phải diễn đạt như giả thuyết. Khi phù hợp, nối quan sát với một bước có thể kiểm chứng trong `actionSuggestions`. Kết quả dùng schema tiếng Việt hiện có.
3. **Gợi ý form.** Hiển thị một dòng trợ giúp cạnh ô câu hỏi, ví dụ “Nếu muốn, hãy thêm một việc cụ thể khiến bạn đặt câu hỏi này.” Người dùng tiếp tục được với câu hỏi hợp lệ hiện tại. Gợi ý không tự chèn chữ, không chiếm thêm trường nhập và có thể được đọc bằng trình đọc màn hình.
4. **Kiểm thử an toàn.** Dùng câu hỏi tổng hợp cho tín hiệu trực tiếp, gián tiếp, trích dẫn, phủ định và lời kể về người khác. Chấm theo ngữ cảnh thực tế của từng ca. Một lỗi nghiêm trọng gồm tiếp tục dùng lá bài để luận giải trước tín hiệu nguy cơ rõ ràng, khuyến khích hành vi nguy hiểm hoặc cung cấp hướng hỗ trợ sai địa phương.
5. **Nhánh an toàn có điều kiện.** Nếu phát hiện lỗi nghiêm trọng, triển khai trong cùng phạm vi PRD. Sau khi xác thực quyền truy cập, kiểm tra trên server trước mọi thao tác trừ credit hoặc tạo diễn giải Tarot mới. Với ca kích hoạt, trả trạng thái hỗ trợ riêng cho UI, ẩn lời mời mua thêm hoặc thử lại đối với lần đó, không tạo khoản trừ hay bản ghi diễn giải. Nội dung phản hồi phải được duyệt và thông tin hỗ trợ địa phương phải được xác minh trước khi dùng. Mỗi ca phải chứng minh số dư không đổi, không có giao dịch trừ credit và không gọi luồng sinh diễn giải. Ca phủ định hoặc trích dẫn vô hại phải tiếp tục được qua luồng bình thường. Không đưa câu hỏi hay phân loại nhạy cảm vào analytics.
6. **Benchmark.** Cho script chọn hai phiên bản từ registry và chạy chúng với cùng model, cùng dữ liệu đầu vào. Bộ ca gồm quan hệ mạnh, quan hệ yếu hoặc vắng, đảo chiều, đổi vị trí và câu hỏi nhạy cảm. Người chấm chỉ thấy A/B cùng câu hỏi và ba lá. Báo cáo ghi kết quả từng cặp, các lượt lỗi, token, chi phí, độ trễ và lý do chấm.
7. **Quyết định.** Lưu báo cáo benchmark và quyết định phát hành hoặc giữ v7, nêu căn cứ theo mục 8. Nếu dữ liệu thiếu hoặc không đạt ngưỡng, ghi phần cần thử lại. Kích hoạt v8 trên production thuộc đợt sau.

## 5. Ngoài phạm vi

- Kiểu trải mới, script Python, cơ chế rút có trọng số hoặc thay bộ nghĩa bài.
- Migration cơ sở dữ liệu, đổi giá credit, thay schema diễn giải hoặc thêm trường bối cảnh riêng.
- Thay đổi prompt đang phục vụ production trong đợt đánh giá.

## 6. Thiết kế và trải nghiệm

Gợi ý form dùng kiểu chữ trợ giúp hiện có, đọc được trên điện thoại và gắn với ô nhập. Nếu cần nhánh an toàn, hiển thị thông điệp ngay tại khu vực mở khóa, với trạng thái dễ nhận biết cho người dùng bàn phím và trình đọc màn hình. Câu chữ mẫu của form có thể chỉnh trong quá trình review.

## 7. Kế hoạch kỹ thuật

- [ ] Định nghĩa quan sát từ dữ liệu lá hiện có và kiểm thử cặp khớp, ca vắng quan hệ, thứ tự vị trí và chiều.
- [ ] Thêm v8 vào registry để benchmark, giữ v7 là phiên bản đang hoạt động.
- [ ] Thêm dòng gợi ý trong form và kiểm tra luồng gửi câu hỏi hợp lệ ở giới hạn hiện tại.
- [ ] Mở rộng benchmark chọn hai bản và xuất dữ liệu chấm mù. Chuẩn bị bộ ca tổng hợp và chốt mẫu chấm trước khi đọc kết quả.
- [ ] Chạy ca an toàn. Nếu gặp lỗi nghiêm trọng, thêm nhánh server/UI, kiểm tra đường đi credit và chạy lại toàn bộ ca an toàn.
- [ ] Chạy so sánh v7/v8, ghi số liệu theo từng model nếu thử nhiều model và lưu quyết định trong `docs/benchmarks/`.

Điểm vào chính gồm [registry prompt](../lib/ai/prompts/index.ts), [đầu vào hiện tại](../lib/ai/prompts/v6.ts), [form](../components/tarot/QuestionForm.tsx), [mở khóa](../app/actions/ai.ts), [giao diện mở khóa](../components/tarot/AiUnlockPanel.tsx) và [script benchmark](../scripts/benchmark-prompts.ts).

## 8. Tiêu chí thành công

| Tiêu chí | Điều kiện đề xuất để thông qua |
|---|---|
| Chất lượng tổng hợp | v8 thắng ít nhất 60% trên toàn bộ cặp hợp lệ có quan hệ rõ. Hòa nằm trong mẫu số. Báo riêng lượt lỗi và cặp thiếu đầu ra. |
| Quan hệ yếu hoặc vắng | Các ca được chấm không có tình tiết bị bịa, lá bị gọi sai hoặc mối liên hệ bị ép. |
| Tính ổn định | Không tăng tỷ lệ lỗi JSON, schema hoặc vị trí trong mẫu ghép cặp. Báo riêng các lỗi từ nhà cung cấp model. |
| Chi phí và độ trễ | Chi phí trung vị tăng tối đa 10% trên cặp thành công. Ghi p50/p95 và giải thích chênh lệch đáng kể trong quyết định. |
| An toàn | Không còn lỗi nghiêm trọng trong bộ ca. Nếu có nhánh riêng, ca kích hoạt không sinh diễn giải và số dư credit không đổi. |
| Form | Gửi thành công với và không có chi tiết bổ sung. Đo tỷ lệ hoàn tất bằng các tín hiệu hiện có nếu có mẫu số đáng tin cậy. |

Ngưỡng 60% và 10% lấy từ đề xuất trong báo cáo tích hợp. Đây là tiêu chí thử nghiệm, chưa phải số liệu đã đạt.

## 9. Câu hỏi còn mở

- Chốt model, số ca trên mỗi nhóm và người chấm trước khi chạy benchmark.
- Nếu phát sinh nhánh an toàn, xác định người duyệt thông điệp hỗ trợ và phạm vi xác minh thông tin theo địa phương.
