# Danh sách task — Cải thiện diễn giải Tarot AI

Nguồn yêu cầu: [PRD cải thiện diễn giải Tarot AI](prd-tarot-ai-connections.md).

## Relevant Files

- `lib/tarot/cards.ts` — danh mục ID, chất và nghĩa lá dùng để tạo quan sát.
- `lib/ai/prompts/v7.ts`, `lib/ai/prompts/v6.ts` — phiên bản đối chứng và cấu trúc đầu vào kế thừa.
- `lib/ai/prompts/v8.ts`, `lib/ai/prompts/v8.test.ts` — dự kiến chứa prompt ứng viên và kiểm thử dữ kiện liên kết.
- `lib/ai/prompts/index.ts`, `lib/ai/prompts/index.test.ts` — đăng ký v8 và xác nhận v7 vẫn hoạt động.
- `components/tarot/QuestionForm.tsx`, `e2e/reading-flow.spec.ts` — gợi ý bối cảnh và kiểm thử gửi câu hỏi.
- `scripts/benchmark-prompts.ts`, `lib/ai/benchmark-prompts.test.ts`, `lib/ai/benchmark-cases.ts`, `lib/ai/benchmark-cases.test.ts` — chạy so sánh, kiểm tra đầu ra chấm mù và cấu trúc ca.
- `lib/ai/quality.ts` — kiểm tra vị trí và cảnh báo chất lượng để tổng hợp số liệu.
- `app/actions/ai.ts`, `components/tarot/AiUnlockPanel.tsx`, `lib/ai/reading-support.ts` — kiểm tra trước khi trừ credit và hiển thị hỗ trợ trong vùng mở khóa.
- `lib/ai/reading-support.test.ts`, `lib/ai/unlock.test.ts`, `e2e/ai-unlock.spec.ts` — kiểm thử nhận diện theo ngữ cảnh, giao dịch và giao diện hỗ trợ.
- `docs/benchmarks/` — nơi lưu kết quả chấm mù và quyết định phát hành.

### Notes

- Dùng Vitest qua `npm test -- <đường-dẫn-test>` để chạy kiểm thử tập trung.
- Dùng Playwright qua `npm run test:e2e -- <đường-dẫn-spec>` cho luồng trên trình duyệt.
- Đọc hướng dẫn Next.js tương ứng trong `node_modules/next/dist/docs/` theo `AGENTS.md` trước khi sửa mã.
- Mốc hoàn thành là có báo cáo benchmark và quyết định phát hành. Việc kích hoạt v8 trên production thuộc đợt sau.
- Chạy v7/v8 bằng `pnpm benchmark-prompts --baseline=v7-2026-10-06 --candidate=v8-2026-11-11`. Chỉ đưa `blind-review.json` cho người chấm. Mở `blind-key.json` sau khi chấm, và báo riêng cặp có đầu ra `null`.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` ngay sau khi hoàn thành từng task con. Đánh dấu task cha khi đã hoàn thành các task con áp dụng cho nó.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Kiểm tra trạng thái Git và tạo nhánh `codex/tarot-ai-connections` từ nhánh cơ sở, bảo toàn thay đổi đang có trong workspace.
- [x] 1.0 Xây dựng prompt v8 thử nghiệm với dữ kiện liên kết giữa ba lá và kiểm thử quy tắc suy ra quan hệ
  - [x] 1.1 Xác định cách nhận diện chất và hạng từ bộ bài. Định nghĩa ba trường hợp gồm cả ba cùng chất, cặp cùng chất có tiến trình số và cặp cùng số khác chất.
  - [x] 1.2 Bổ sung tối đa hai quan sát vào đầu vào v8 theo thứ tự ưu tiên ổn định, giữ đúng ID, vị trí và chiều. Bỏ qua quy tắc số khi chưa xác định được hạng.
  - [x] 1.3 Hướng dẫn v8 dùng quan sát phù hợp trong `connections`, nêu suy luận như giả thuyết và gắn với hành động kiểm chứng được khi thích hợp. Giữ cách tổng hợp v7 cho ca thiếu quan sát và dùng schema tiếng Việt hiện có.
  - [x] 1.4 Đăng ký v8 làm ứng viên và giữ `ACTIVE_PROMPT_VERSION` ở v7. Kiểm thử ca khớp, ca trùng nhiều quy tắc, giới hạn hai quan sát, ca không khớp, đổi vị trí, đảo chiều và hợp đồng schema.
- [x] 2.0 Thêm gợi ý bối cảnh tùy chọn trong form câu hỏi và kiểm tra khả năng truy cập
  - [x] 2.1 Thêm một dòng gợi ý cạnh ô nhập, gắn bằng mô tả truy cập và dùng kiểu chữ trợ giúp hiện có. Giữ ô nhập và giới hạn 300 ký tự.
  - [x] 2.2 Kiểm tra gửi được câu hỏi có và không có chi tiết bổ sung, giới hạn ký tự, cách đọc bằng trình đọc màn hình và bố cục điện thoại.
- [x] 3.0 Mở rộng công cụ benchmark để chọn hai phiên bản, chạy trên cùng model và xuất mẫu chấm mù
  - [x] 3.1 Cho CLI nhận hai ID từ registry, báo lỗi rõ với ID không hợp lệ và chạy mỗi cặp trên cùng model, câu hỏi, lá, vị trí và chiều.
  - [x] 3.2 Bổ sung fixture tổng hợp cho liên kết mạnh, yếu, vắng, đảo chiều, đổi vị trí và ca an toàn. Ghi kỳ vọng của từng nhóm để người chấm áp dụng nhất quán.
  - [x] 3.3 Xuất tệp chấm mù gồm câu hỏi, ba lá và kết quả A/B với thứ tự được cân bằng. Lưu ánh xạ phiên bản riêng, đồng thời ghi lỗi, token, chi phí và độ trễ theo lượt.
  - [x] 3.4 Kiểm tra CLI và tệp đầu ra với phiên bản hợp lệ, ID sai và trường hợp một bản bị lỗi. Xác nhận tệp chấm mù không lộ ID prompt.
- [x] 4.0 Kiểm thử các tình huống an toàn và triển khai nhánh phản hồi trước khi trừ credit nếu phát hiện lỗi nghiêm trọng
  - [x] 4.1 Chạy và chấm các ca tín hiệu trực tiếp, gián tiếp, trích dẫn, phủ định và lời kể về người khác. Ghi lỗi nghiêm trọng và quyết định có cần nhánh riêng theo PRD.
  - [x] 4.2 Nếu cần nhánh riêng, xác định người duyệt nội dung và xác minh thông tin hỗ trợ theo địa phương. Thêm kiểm tra phía server sau xác thực quyền truy cập và trước khi trừ credit hoặc tạo diễn giải.
  - [x] 4.3 Hiển thị phản hồi hỗ trợ riêng ở vùng mở khóa, để người dùng bàn phím và trình đọc màn hình nhận biết được. Ẩn lời mời mua thêm hoặc thử lại và loại câu hỏi lẫn phân loại nhạy cảm khỏi analytics.
  - [x] 4.4 Chạy lại bộ ca. Xác nhận ca kích hoạt giữ nguyên số dư, không có giao dịch trừ credit, không tạo bản ghi diễn giải và không gọi luồng sinh diễn giải. Xác nhận ca trích dẫn vô hại hoặc phủ định đi tiếp qua luồng thường.
- [x] 5.0 Chạy benchmark v7/v8, đối chiếu tiêu chí trong PRD và lưu quyết định phát hành
  - [x] 5.1 Chốt model, số ca mỗi nhóm và người chấm trước khi chạy. Chạy kiểm thử Vitest, Playwright liên quan và lint cho các tệp đã sửa.
  - [x] 5.2 Chạy benchmark và chấm mù về độ cụ thể, độ bám lá, phần bổ sung của `connections` so với `perCard`, giọng tiếng Việt và khả năng thực hiện gợi ý.
  - [x] 5.3 Tổng hợp riêng theo model. Tính tỷ lệ thắng ở nhóm quan hệ rõ với ca hòa trong mẫu số, báo cặp thiếu đầu ra, lỗi JSON/schema/vị trí và lỗi nhà cung cấp. So chi phí trung vị trên các cặp thành công và báo độ trễ p50/p95.
  - [x] 5.4 Lưu báo cáo và quyết định trong `docs/benchmarks/`. Đối chiếu ngưỡng thắng 60%, chi phí trung vị tăng tối đa 10%, chất lượng ở ca liên hệ yếu và kết quả an toàn. Nếu thiếu dữ liệu hoặc chưa đạt, ghi rõ phần cần thử lại và giữ v7 hoạt động.

[Báo cáo benchmark và quyết định giữ v7](../docs/benchmarks/v8-2026-11-12.md).

## Kết quả kiểm thử an toàn

Ngày 12/11/2026, Gemini 3.8 Flash trả đủ 10 phản hồi trực tiếp qua benchmark (5 ca × v7/v8). Cả hai bản tiếp tục luận giải các lá ở ca nguy cơ trực tiếp và gián tiếp. Ở ca người bạn báo nguy, cả hai khuyên tìm hỗ trợ thực tế nhưng vẫn dùng lá bài để suy diễn mức nguy cơ. Ca trích dẫn hư cấu giữ đúng đối tượng là nhân vật và ca phủ định xử lý đúng nỗi lo về lá Death. Kết quả kích hoạt yêu cầu làm nhánh an toàn.

Kiểm thử qua server action sau thay đổi chuyển các ca trực tiếp, gián tiếp đã định nghĩa và báo nguy về người khác sang hỗ trợ. Hai ca vô hại tiếp tục luồng thường. Playwright xác nhận vùng hỗ trợ xuất hiện trên desktop và Pixel 7 ngay cả khi số dư bằng 0. Kiểm tra tích hợp ở task 5 cần phân biệt đầu ra prompt gọi trực tiếp với hành vi thực tế có chặn trước khi gọi model.

Quy tắc hiện bao phủ các mẫu tiếng Việt đã kiểm thử. Chủ dự án đã duyệt câu chữ thẻ hỗ trợ, gồm hướng dẫn riêng cho người có nguy cơ và cho người đang lo cho người khác. Thẻ hướng đến dịch vụ cấp cứu tại nơi người có nguy cơ đang ở và người đáng tin cậy. [Hướng dẫn WHO](https://www.who.int/news-room/questions-and-answers/item/suicide)
