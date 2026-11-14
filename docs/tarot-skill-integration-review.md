# Đánh giá tích hợp tarot-skill vào dự án Tarot

Ngày rà soát 11/11/2026 · Mã nguồn dự án tại `7deecb3` · Nguồn đối chiếu là các tệp công khai trên nhánh `main` của `daman-ovo-0404/tarot-skill`.

## Kết luận

Đáng thử nhất là đưa một lượng nhỏ **dữ kiện về quan hệ giữa các lá** vào prompt AI tiếng Việt, rồi chấm mù so với v7. Dự án đã có mục `connections` và đã yêu cầu tổng hợp, chỉ ra mâu thuẫn, bám câu hỏi và đề xuất hành động cụ thể. Phần có thể bổ sung là dữ kiện rõ ràng để AI lập luận, ví dụ hai lá cùng số khác chất hoặc cùng chất theo thứ tự tăng dần. Thử nghiệm này có thể dùng cùng schema kết quả, giao diện và luồng mở khóa hiện có.

| Ưu tiên | Hạng mục | Giá trị và chi phí tương đối |
|---|---|---|
| P1 | Dữ kiện liên kết lá bài và benchmark v7/v8 | Cải thiện phần tổng hợp có thể đo được. Chi phí thấp đến vừa, tập trung ở đầu vào prompt và benchmark. |
| P1 | Kiểm thử phản hồi trước tín hiệu tự hại rõ ràng | Bổ sung một tình huống mà bộ ca hiện tại chưa bao phủ trực tiếp. Chi phí kiểm thử thấp, thay đổi hành vi cần đánh giá riêng do luồng AI dùng credit. |
| P2 | Gợi ý thêm bối cảnh cụ thể trong câu hỏi | Có thể giúp khi đầu vào mơ hồ. Chi phí thấp nếu chỉ sửa gợi ý trong form, cần theo dõi tỷ lệ hoàn tất. |
| P3 | Trải một lá | Có công dụng riêng cho câu hỏi ngắn. Chi phí vừa nếu có lưu lịch sử hoặc mở khóa AI. |
| Hoãn | Năm lá, trải Mặt Trăng, móng ngựa, Celtic Cross | Tăng phạm vi giao diện, dữ liệu, đầu ra AI và QA, đặc biệt với 7–10 lá trên điện thoại. |
| Loại khỏi phạm vi tích hợp | Script rút bài Python và nhập dữ liệu lá bài hàng loạt | Script dùng phân phối có trọng số khác với cơ chế chọn lá của dự án. Tệp nghĩa bài trên nhánh được rà soát chỉ có hướng dẫn tổng quát. |

## 1. Repo nguồn thực sự cung cấp gì

- Đây là Agent Skill tiếng Trung gồm hướng dẫn diễn giải, tệp tham chiếu và CLI Python. Skill có bốn góc nhìn cho từng lá, gồm trạng thái hiện tại, điểm mù, hành động và niềm tin cố định. Phần tổng hợp phân biệt các kiểu quan hệ như tiếp nối, đối thoại, bước ngoặt và nhân quả. Khi chuyển sang sản phẩm, nên ưu tiên cách diễn giải có điều kiện và tránh suy ra quan hệ nhân quả trong đời thực từ các lá. [SKILL.md](https://github.com/daman-ovo-0404/tarot-skill/blob/main/SKILL.md)
- README mô tả bộ nghĩa 78 lá khoảng 1.100 dòng. Tệp `references/cards.md` đọc được trên `main` chỉ có quy tắc theo chất, số, lá Hoàng gia, Ẩn chính và chiều ngược. Tệp `card-relations.md` cũng là bản tóm tắt quy tắc. `combinations.md` liệt kê mười cặp mẫu. Mã Python có danh mục tên 78 lá để rút. [README](https://github.com/daman-ovo-0404/tarot-skill#file-structure) · [Nghĩa bài](https://github.com/daman-ovo-0404/tarot-skill/blob/main/references/cards.md) · [Quan hệ giữa các lá](https://github.com/daman-ovo-0404/tarot-skill/blob/main/references/card-relations.md) · [Cặp bài](https://github.com/daman-ovo-0404/tarot-skill/blob/main/references/combinations.md)
- Sáu kiểu trải lần lượt có 1, 3, 5, 4, 7 và 10 lá. Trải ba lá trong script là Quá khứ, Hiện tại, Tương lai. Dự án hiện dùng Bối cảnh, Hiện tại, Hướng đi, phù hợp với cách diễn giải chú trọng lựa chọn. [Các kiểu trải](https://github.com/daman-ovo-0404/tarot-skill/blob/main/references/spreads.md) · [Script](https://github.com/daman-ovo-0404/tarot-skill/blob/main/scripts/draw.py) · [Vị trí trong dự án](../lib/tarot/draw.ts#L10)
- README ghi MIT, nhưng danh sách tệp gốc không hiển thị `LICENSE` và đường dẫn chuẩn trả 404 khi kiểm tra. Báo cáo đề xuất dùng ý tưởng và tự viết hướng dẫn tiếng Việt. Nếu định sao chép nguyên văn hoặc phân phối lại mã và dữ liệu, cần xác nhận văn bản giấy phép và thông báo bản quyền áp dụng cho commit được dùng. [Cây thư mục và README](https://github.com/daman-ovo-0404/tarot-skill)

## 2. Cải thiện phần tổng hợp AI

### Dự án đang có gì

`ACTIVE_PROMPT_VERSION` là `v7-2026-10-06`. Bản này kế thừa đầu vào và validator từ v6/v5. Mỗi lá đã mang ID, vị trí, chiều, từ khóa và nghĩa tương ứng với chiều. System prompt đã yêu cầu liên kết lá, nêu điểm giằng co, phân biệt dữ kiện với giả thuyết và đưa hành động kiểm chứng được trong 7–14 ngày. Bộ kiểm tra chất lượng có cảnh báo câu sáo, trấn an thiếu căn cứ, hành động mơ hồ và câu lặp. Vì vậy giá trị tăng thêm nằm ở **chất lượng liên kết cụ thể**, không phải thêm một mục diễn giải mới. [Registry](../lib/ai/prompts/index.ts#L27) · [Đầu vào](../lib/ai/prompts/v6.ts#L9) · [Chỉ dẫn v7](../lib/ai/prompts/v7-system.ts#L45) · [Kiểm tra chất lượng](../lib/ai/quality.ts#L38)

### Phạm vi thử nghiệm

1. Tạo prompt ứng viên kế thừa v7. Từ dữ liệu ba lá đã có, cung cấp tối đa hai quan sát ngắn như cặp cùng chất có tiến trình số, cặp cùng số khác chất hoặc ba lá cùng chất. Dùng `cardId`, vị trí và chiều của lá thật. Nếu thiếu căn cứ để nhận dạng hạng, bỏ qua quy tắc dựa trên số.
2. Để AI chọn quan sát phù hợp nhất cho `connections`, giải thích nó trong câu hỏi và gắn với một hành động thực tế ở trường hiện có. Khi không có quan sát phù hợp, ứng viên vẫn dùng cách tổng hợp theo câu hỏi và vị trí của v7.
3. Giữ diễn giải bằng tiếng Việt và ưu tiên nghĩa theo chiều của bộ bài hiện tại. Trì hoãn việc nhập bảng đối ứng lớn, ánh xạ toàn bộ Ẩn chính sang nguyên tố hoặc ép kết luận từ tỷ lệ Ẩn chính. Với ba lá, tỷ lệ nhảy theo bước 33 điểm phần trăm nên rất thô. Lá cùng chất và lá cùng số là dữ kiện, còn cách hiểu chúng vẫn là giả thuyết.

**Ví dụ biên tập.** Với câu hỏi “Tôi nên kiểm tra gì trước khi xin chuyển nhóm?”, Ba Tiền ở Bối cảnh và Tám Tiền ở Hiện tại cho phép đọc một tiến trình từ phối hợp sang rèn kỹ năng. Nếu Hai Kiếm ngược ở Hướng đi, phần tổng hợp có thể nêu giả thuyết rằng quyết định đang chậm vì thiếu một tiêu chí rõ. Bước thử trong bảy ngày là hỏi người phụ trách nhóm mới về một tiêu chí đánh giá, rồi đối chiếu với một ví dụ công việc đã làm. Khi đảo chiều hoặc đổi vị trí, lời giải thích phải được xem lại.

## 3. An toàn và chất lượng đầu vào

- **Tín hiệu tự hại.** Upstream mô tả hành vi dừng trải khi người dùng nói rõ ý định tự hại. Phần an toàn của v7 bao phủ câu hỏi nhạy cảm nói chung, còn nhóm `sensitive` hiện có gồm sức khỏe, thuốc, pháp lý và nỗi sợ lá Death. Nên thêm ca tổng hợp cho phát biểu trực tiếp, cách nói mơ hồ, lời kể về người khác, trích dẫn và câu phủ định. Nếu thử nghiệm dẫn đến một nhánh phản hồi riêng, cần xác định điểm xử lý trước khi trừ credit và kiểm chứng tình huống này không sinh diễn giải Tarot hoặc nội dung hỗ trợ sai địa phương. [Quy tắc upstream](https://github.com/daman-ovo-0404/tarot-skill/blob/main/SKILL.md#必守规则) · [Ranh giới v7](../lib/ai/prompts/v7-system.ts#L86) · [Ca nhạy cảm](../lib/ai/benchmark-cases.ts#L30) · [Luồng mở khóa](../app/actions/ai.ts#L28)
- **Câu hỏi mơ hồ.** Có thể thử một gợi ý tùy chọn trong form, ví dụ “Nếu muốn, thêm một việc cụ thể khiến bạn đặt câu hỏi này.” Đây là cách tận dụng nguyên tắc hỏi bối cảnh từ upstream trong luồng một lượt. Bản thử có thể dùng chính trường câu hỏi đang lưu, hiện tối đa 300 ký tự. Đo tỷ lệ hoàn tất form và tỷ lệ bài đọc bám được một chi tiết thực tế. [Form](../components/tarot/QuestionForm.tsx) · [Giới hạn đầu vào](../lib/validation/reading.ts#L6)

## 4. Cơ chế rút bài và phạm vi nếu thêm kiểu trải

Script upstream tạo seed từ entropy hệ điều hành, thời gian và câu hỏi khi người dùng không cung cấp seed. Quá trình rút dùng `random.Random(seed)` và chọn có trọng số, bỏ lá đã rút khỏi bộ. Vị trí được đánh dấu có thể tăng trọng số Ẩn chính theo hệ số `60/28`, nhóm hợp khung giờ được tăng 8% và xác suất xuôi là 60% hoặc 70% tùy vị trí. Mốc 00:00–05:59 hiện trả `afternoon` vì nhánh thứ hai chỉ kiểm tra giờ nhỏ hơn 18. Khi truyền seed, đổi câu hỏi không đổi các lá nếu kiểu trải và khung giờ giống nhau. [draw.py](https://github.com/daman-ovo-0404/tarot-skill/blob/main/scripts/draw.py)

Dự án xáo bộ bằng Fisher–Yates, gán chiều 50/50 và để người dùng chọn lá từ bộ đã xáo. Nếu mục tiêu riêng là xác minh lượt rút, cần xem xét thiết kế server vì server hiện nhận rồi kiểm tra ID, chiều và vị trí do client gửi. Đổi nguồn số ngẫu nhiên trên trình duyệt chỉ tác động đến cách xáo. Để tái hiện một ca benchmark, fixture cố định ID, chiều và vị trí đã đủ. [Xáo bài](../lib/tarot/draw.ts#L14) · [Luồng chọn](../components/tarot/TarotExperience.tsx#L163) · [Lưu bài](../app/actions/readings.ts#L27)

Nếu có nhu cầu cho một kiểu trải mới, thử **một lá** trước. Nếu lưu lịch sử, cần nhận diện kiểu trải và đọc các bản ghi cũ theo ba vị trí hiện tại. Nếu bán diễn giải AI cho kiểu mới, cần sửa cả schema và nội dung phù hợp với một lá. Hạng mục này đi qua vòng chọn lá, lưu tạm khi đăng nhập, xác thực server, trang kết quả, lịch sử và khung diễn giải AI. Hiện validator lưu bài lẫn schema AI đều cố định ba lá. [Trạng thái chọn và lưu tạm](../components/tarot/TarotExperience.tsx#L74) · [Validator](../lib/validation/reading.ts#L6) · [Schema AI](../lib/ai/prompts/v5.ts#L9) · [Khung AI](../components/tarot/AiUnlockPanel.tsx#L88)

## 5. Cách quyết định có phát hành prompt mới

1. Cho script benchmark nhận hai phiên bản prompt trong registry. Hiện script so cứng v4/v5 dù sản phẩm chạy v7. Tái sử dụng fixture, JSON kết quả, báo cáo token/chi phí và tệp chấm mù có sẵn. [Benchmark](../scripts/benchmark-prompts.ts#L12) · [Registry](../lib/ai/prompts/index.ts#L20)
2. So v7 với ứng viên trên cùng model và cùng fixture. Thêm ca có liên hệ mạnh, ca chỉ có liên hệ yếu, ca đảo chiều hoặc vị trí, và ca nhạy cảm. Giữ dữ liệu tổng hợp để tránh dùng câu hỏi riêng tư. Chấm mù về độ cụ thể, độ bám lá và vị trí, mức bổ sung của `connections` so với `perCard`, giọng tiếng Việt và khả năng thực hiện gợi ý.
3. Chỉ cân nhắc phát hành khi người chấm ưu tiên bản mới ở các ca có liên hệ rõ, các ca liên hệ yếu không bị ép nghĩa, và kiểm thử nhạy cảm đạt. So thêm tỷ lệ lỗi JSON/schema/vị trí, tỷ lệ cảnh báo văn phong, chi phí và độ trễ p50/p95 trên cùng mẫu. Ngưỡng thử đề xuất là bản mới thắng ít nhất 60% cặp có liên hệ rõ và chi phí trung vị tăng tối đa 10%. Đây là tiêu chí đề xuất, chưa có số liệu thực nghiệm.
4. Khi đủ dữ liệu, phát hành qua registry bằng ID mới. Theo dõi theo cặp prompt–model trên admin, kiểm tra các phản hồi đầu tiên và đưa `ACTIVE_PROMPT_VERSION` về v7 nếu chất lượng hoặc tỷ lệ lỗi xấu đi. Luồng hiện có lưu kết quả AI theo lượt đọc và trả kết quả đã có khi mở lại. [Registry](../lib/ai/prompts/index.ts#L20) · [Theo dõi](../app/admin/prompts/page.tsx) · [Mở khóa và đọc lại](../app/actions/ai.ts#L28)

## Phạm vi kiểm chứng

Đã đọc tệp nguồn công khai qua GitHub và đối chiếu các điểm tích hợp trong workspace. Đã chạy hàm test của upstream và kiểm tra 1.800 tổ hợp gồm sáu kiểu trải, ba khung giờ và 100 seed. Các tổ hợp đều cho đúng số lá, không trùng lá và lặp lại được với cùng tham số. Đã kiểm tra riêng hành vi ở ranh giới khung giờ. Kết quả này xác nhận hợp đồng rút bài, chưa đo phân phối thống kê hay chất lượng diễn giải AI.

Kết nối GitHub từ shell không phân giải DNS nên kiểm thử dùng bản nguồn đọc qua web, không phải bản clone đã khóa SHA. Chưa gọi model, chưa triển khai thay đổi ứng dụng. Chi phí và mức cải thiện prompt cần được đo ở bước benchmark.
