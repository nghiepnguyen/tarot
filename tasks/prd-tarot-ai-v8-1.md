# PRD — Prompt Tarot AI v8.1

Nguồn gồm [mẫu PRD](../create-prd.md), [PRD diễn giải Tarot AI](prd-tarot-ai-connections.md) và [benchmark v7/v8](../docs/benchmarks/v8-2026-11-12.md). Phạm vi đã chốt theo lựa chọn **1A, 2A, 3B**.

## 1. Tổng quan

V8 thắng 2/3 cặp có quan hệ rõ và tăng chi phí trung vị 2,2% so với v7. V8 chưa được phát hành vì vẫn biến suy luận thành sự thật về người dùng khi quan hệ giữa các lá yếu hoặc vắng. Ví dụ, trong ca hỏi cách chuẩn bị buổi góp ý, v8 khẳng định người dùng đã có đầy đủ bằng chứng dù câu hỏi không nêu điều đó.

V8.1 sẽ làm rõ cách dùng dữ kiện từ câu hỏi và quan hệ giữa các lá. Ứng viên đi qua hai vòng thử trên Gemini 3.8 Flash. V7 tiếp tục phục vụ production cho tới khi cả hai vòng đạt và chủ dự án duyệt phát hành v8.1.

## 2. Mục tiêu

1. Trong tám ca quan hệ yếu hoặc vắng, v8.1 không ép liên kết hoặc khẳng định tình tiết đời thực ngoài câu hỏi.
2. Trong sáu ca quan hệ rõ, v8.1 thắng ít nhất 60% so với v7 và giữ chất lượng phần liên kết so với v8 gốc.
3. Chi phí trung vị của v8.1 tăng tối đa 10% so với v7 trong vòng hồi quy.
4. Lưu đủ bằng chứng để chủ dự án quyết định phát hành và có phương án quay về v7.

## 3. User stories

- Là người đặt câu hỏi ngắn, tôi muốn bài đọc phân biệt điều tôi đã kể với điều tôi có thể tự kiểm chứng.
- Là người mở khóa bài đọc có liên kết lá rõ, tôi muốn phần tổng hợp cho thấy mối liên hệ giữa các lá và giúp tôi chọn một bước tiếp theo.
- Là chủ dự án, tôi muốn xem kết quả chấm mù từng cặp, chi phí và kết quả kiểm thử an toàn trước khi duyệt phát hành.

## 4. Yêu cầu chức năng

1. **Đăng ký ứng viên.** Tạo v8.1 với ID riêng trong registry để chạy benchmark và lưu số đo theo phiên bản. Giữ ID và nội dung của v7/v8 gốc để tái lập đối chứng. Ứng viên dùng schema, vị trí, chiều lá và giới hạn hai quan sát hiện có.
2. **Xử lý quan hệ yếu.** Quan hệ từ cùng chất hoặc cùng hạng chỉ được dùng nếu giúp trả lời câu hỏi. Khi liên hệ ít giá trị, phần tổng hợp có thể bỏ qua quan sát đó và dùng vị trí, chiều lá cùng nội dung câu hỏi.
3. **Xử lý quan hệ vắng.** Tổng hợp dựa trên câu hỏi, vai trò của từng vị trí và chiều lá. Không tự thêm quan hệ chất, hạng hay tiến trình giữa các lá.
4. **Diễn đạt suy luận.** Trong `summary`, `overview`, `perCard`, `connections` và gợi ý hành động, diễn đạt suy luận về đời thực thành giả thuyết, câu hỏi hoặc điều kiện kiểm chứng. Tránh giả định ngầm trong hành động. Ví dụ “Nếu có, hãy chọn một hoặc hai tình huống cụ thể để trao đổi” cho phép người dùng tự kiểm tra dữ kiện mình có.
5. **Chuẩn bị mẫu.** Chốt trước khi chỉnh prompt tám ca trọng tâm gồm bốn ca yếu và bốn ca vắng. Tái sử dụng `relation-weak-1` và `relation-absent-1`, thêm sáu ca tổng hợp mới. Chốt sáu ca quan hệ rõ gồm các biến thể đổi chiều và đổi vị trí. Mỗi ca ghi dữ kiện đã biết, suy luận cần kiểm chứng và kỳ vọng chấm.
6. **Vòng 1.** Chạy v8 gốc và v8.1 trên cùng tám ca, cùng model và cùng đầu vào. Codex chấm mù, ghi điểm và lý do từng cặp trước khi mở ánh xạ phiên bản. Chỉ bắt đầu vòng 2 khi v8.1 đạt các tiêu chí vòng 1.
7. **Vòng 2.** Chạy v7, v8 gốc và v8.1 trên cùng sáu ca quan hệ rõ. Dùng đối chiếu v7/v8.1 để tính tỷ lệ thắng và chi phí. Dùng đối chiếu v8/v8.1 để kiểm tra chất lượng `connections`. Giữ tiêu chí chấm và số lượt như đã chốt. Kiểm thử lại hợp đồng đầu ra và luồng hỗ trợ trước khi trừ credit. Xem lại hai ca nhạy cảm vô hại đi tiếp qua luồng thường.
8. **Báo cáo và phát hành.** Lưu kết quả từng cặp, lý do chấm, lỗi hoặc thiếu đầu ra, chi phí và độ trễ vào `docs/benchmarks/`. Nếu một vòng trượt, giữ v7 và ghi rõ hạng mục cần thử lại. Nếu cả hai đạt, trình báo cáo để chủ dự án duyệt. Sau khi được duyệt, đổi prompt đang hoạt động sang v8.1 qua quy trình phát hành hiện có, kiểm tra phiên bản sau deploy và ghi cách quay lại v7 nếu cần.

## 5. Ngoài phạm vi

- Thay đổi giao diện, bộ bài, thuật toán rút lá, schema kết quả, giá credit hoặc nhánh hỗ trợ hiện có.
- Thay đổi model phục vụ production hoặc mở rộng benchmark sang nhiều model trong đợt này.

## 6. Trải nghiệm người đọc

Phần tổng hợp trả lời câu hỏi bằng tiếng Việt tự nhiên và dùng câu có điều kiện khi dữ kiện còn thiếu. Một gợi ý hành động vẫn phải cho người đọc biết họ có thể làm gì cụ thể, ngay cả khi bài đọc có ít liên hệ giữa các lá. Bài đọc tiếp tục hiển thị theo bố cục hiện có.

## 7. Cân nhắc kỹ thuật và kế hoạch

- [ ] Chốt mẫu, kỳ vọng từng ca và phiếu chấm theo năm tiêu chí hiện có. Ghi các quy tắc xử lý cặp hòa và thiếu đầu ra trước khi chạy.
- [ ] Thêm v8.1 vào registry và kiểm thử đầu vào, schema, vị trí, chiều lá, giới hạn quan sát và phiên bản mặc định.
- [ ] Chạy vòng 1, chấm mù, lưu lý do từng cặp và đánh giá điều kiện qua vòng.
- [ ] Nếu vòng 1 đạt, chạy vòng 2 và kiểm thử lại luồng hỗ trợ. Tái sử dụng cùng đầu ra v8.1 khi đối chiếu với v7 và v8 gốc để tránh hai lượt sinh khác nhau cho cùng ca.
- [ ] Lưu báo cáo và trình chủ dự án. Nếu cả hai vòng đạt và có duyệt, phát hành, kiểm tra phiên bản đang phục vụ và ghi phương án quay về v7.

Tái sử dụng [prompt v8](../lib/ai/prompts/v8.ts), [registry](../lib/ai/prompts/index.ts), [bộ ca](../lib/ai/benchmark-cases.ts) và [CLI benchmark](../scripts/benchmark-prompts.ts). Chạy từng ca theo thứ tự hoặc xác minh thư mục đầu ra riêng cho từng tiến trình để tránh ghi đè. Chỉ gửi câu hỏi tổng hợp vào benchmark.

## 8. Tiêu chí thành công

| Mốc | Điều kiện đạt |
|---|---|
| Vòng 1 | Đủ 8 cặp hợp lệ. Trong 8 đầu ra v8.1, có 0 ca ép liên kết, gọi sai lá/vị trí/chiều hoặc khẳng định tình tiết chưa được cung cấp. Gợi ý khả thi và gắn với câu hỏi. |
| Vòng 2 về chất lượng | Đủ 6 cặp hợp lệ cho mỗi đối chứng. V8.1 thắng ít nhất 4/6 so với v7, tính hòa trong mẫu số. Điểm trung bình `connections` trên cùng sáu ca ít nhất bằng v8 gốc. |
| Vòng 2 về vận hành | Không tăng lỗi JSON, schema hoặc vị trí so với v7. Chi phí trung vị mỗi lượt v8.1 tối đa bằng 110% v7 trên các cặp thành công. Báo riêng lỗi nhà cung cấp, cặp thiếu đầu ra và độ trễ p50/p95. |
| An toàn | Ca kích hoạt hỗ trợ không trừ credit hoặc gọi model. Hai ca vô hại đi tiếp và được rà soát về suy diễn hoặc cách diễn đạt gây hại. Không còn lỗi nghiêm trọng trong các ca được kiểm thử. |
| Phát hành | Có báo cáo, cả hai vòng đạt, chủ dự án đã duyệt và đã xác minh phiên bản đang phục vụ sau deploy. |

Codex chấm mù theo năm mục gồm độ cụ thể, bám dữ kiện, đóng góp của `connections`, giọng tiếng Việt và khả năng thực hiện gợi ý. Chấm từng mục từ 0 đến 2, ghi lý do trước khi mở khóa nhãn. Cỡ mẫu và một người chấm là giới hạn của kết quả.

## 9. Câu hỏi còn mở

- Lịch phát hành và người thực hiện deploy được chốt khi chủ dự án xem báo cáo đạt cả hai vòng.
