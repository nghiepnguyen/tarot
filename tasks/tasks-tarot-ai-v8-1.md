# Danh sách task — Prompt Tarot AI v8.1

Nguồn yêu cầu [PRD Tarot AI v8.1](prd-tarot-ai-v8-1.md).

## Relevant Files

- `tasks/prd-tarot-ai-v8-1.md` — phạm vi, tiêu chí qua vòng và điều kiện phát hành.
- `docs/benchmarks/v8-2026-11-12.md` — kết quả v7/v8 dùng để chọn ca hồi quy và lỗi cần sửa.
- `lib/ai/benchmark-cases.ts`, `lib/ai/benchmark-cases.test.ts` — dữ liệu tổng hợp, kỳ vọng chấm và kiểm thử cấu trúc ca.
- `lib/ai/prompts/v8.ts`, `lib/ai/prompts/v8.test.ts` — prompt đối chứng và kiểm thử các quy tắc liên kết hiện có.
- `lib/ai/prompts/v8-1.ts`, `lib/ai/prompts/v8-1.test.ts` — ứng viên v8.1 và kiểm thử hợp đồng đầu vào/đầu ra.
- `lib/ai/prompts/index.ts`, `lib/ai/prompts/index.test.ts` — đăng ký ứng viên, kiểm tra prompt mặc định và đổi phiên bản khi phát hành.
- `scripts/benchmark-prompts.ts`, `lib/ai/benchmark-prompts.test.ts` — chạy cặp trên cùng model, xuất phiếu chấm mù và kiểm thử ánh xạ A/B.
- `app/actions/ai.ts`, `lib/ai/reading-support.test.ts`, `lib/ai/unlock.test.ts`, `e2e/ai-unlock.spec.ts` — luồng mở khóa và bộ kiểm thử hồi quy hỗ trợ.
- `app/admin/prompts/page.tsx`, `SETUP.md` — xác minh phiên bản hoạt động và tra quy trình phát hành hiện có.
- `docs/benchmarks/` — nơi lưu kết quả từng vòng, quyết định và phương án quay về v7.

### Notes

- Dùng Vitest qua `npm test -- <đường-dẫn-test>` và Playwright qua `npm run test:e2e -- <đường-dẫn-spec>`.
- Chỉ chạy vòng 2 khi vòng 1 đạt. V7 tiếp tục phục vụ cho đến khi cả hai vòng đạt và chủ dự án duyệt phát hành.
- Đọc hướng dẫn Next.js tương ứng trong `node_modules/next/dist/docs/` theo `AGENTS.md` trước khi sửa mã.
- Chỉ dùng câu hỏi tổng hợp. Chạy benchmark tuần tự hoặc kiểm tra thư mục đầu ra riêng cho từng tiến trình. Với các ca chạy bằng lệnh riêng, cân bằng lại nhãn A/B trước khi chấm và giữ khóa ánh xạ riêng.
- Nếu một vòng trượt, lưu báo cáo, giữ v7 và ghi các bước có điều kiện là không áp dụng cho lượt này.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` ngay sau khi hoàn thành từng task con. Đánh dấu task cha khi các task con áp dụng cho nó đã hoàn thành.

## Tasks

**Trạng thái đợt v8.1:** Đã hoàn tất các việc áp dụng cho đợt đánh giá. Vòng 1 có đủ 8 cặp hợp lệ, nhưng v8.1 khẳng định ngoài dữ kiện ở 8/8 ca và ép liên kết ở 3/4 ca quan hệ yếu. Quyết định giữ v7. [Báo cáo vòng 1](../docs/benchmarks/v8-1-round-1-2026-11-12.md)

- [x] 0.0 Create feature branch
  - [x] 0.1 Kiểm tra nhánh và trạng thái Git, xác định điểm xuất phát đã có v8 gốc và luồng hỗ trợ. Tạo rồi chuyển sang `codex/tarot-ai-v8-1`, bảo toàn thay đổi đang có trong workspace.
- [x] 1.0 Chốt tám ca quan hệ yếu hoặc vắng, sáu ca quan hệ rõ và tiêu chí chấm mù trước khi sửa prompt
  - [x] 1.1 Giữ `relation-weak-1` và `relation-absent-1`, thêm ba ca yếu và ba ca vắng. Ghi dữ kiện người dùng cung cấp, suy luận cần kiểm chứng và kỳ vọng cho từng ca.
  - [x] 1.2 Chốt sáu ca quan hệ rõ, gồm biến thể đổi chiều và vị trí. Kiểm tra ID, ba lá, thứ tự, chiều và số lượng từng nhóm trong bộ ca.
  - [x] 1.3 Chốt Gemini 3.8 Flash, số lượt bằng nhau cho mọi bản trên mỗi ca và Codex là người chấm. Chuẩn bị phiếu chấm 0–2 cho năm mục trong PRD và quy định cách ghi ca hòa, lỗi, cặp thiếu đầu ra và lỗi an toàn.
- [x] 2.0 Tạo ứng viên v8.1, chỉnh cách diễn đạt suy luận và kiểm thử hợp đồng prompt
  - [x] 2.1 Tạo prompt ứng viên có ID riêng từ v8 gốc. Đăng ký phiên bản và xác nhận `ACTIVE_PROMPT_VERSION` vẫn trỏ đến v7.
  - [x] 2.2 Viết chỉ dẫn ưu tiên dữ kiện người dùng đã nêu, cho phép bỏ qua liên hệ yếu và dùng vị trí, chiều lá khi vắng liên hệ. Yêu cầu diễn đạt suy luận dưới dạng giả thuyết, câu hỏi hoặc điều kiện kiểm chứng trong từng trường diễn giải và gợi ý hành động.
  - [x] 2.3 Kiểm thử việc tra ID, schema, thứ tự vị trí, chiều lá, tối đa hai quan sát và đầu vào khi thiếu quan sát. Chạy Vitest liên quan, ESLint và TypeScript.
- [x] 3.0 Chạy vòng 1 để so v8 gốc với v8.1 trên tám ca yếu hoặc vắng và xác định điều kiện qua vòng
  - [x] 3.1 Chạy hai bản trên cùng tám ca, cùng model và cùng đầu vào. Đối chiếu ID ca, trạng thái và số lượng phản hồi trước khi tạo phiếu chấm.
  - [x] 3.2 Chấm mù từng cặp, ghi điểm và lý do trước khi mở ánh xạ. Đánh dấu riêng mọi trường hợp ép liên kết, gọi sai lá/vị trí/chiều, khẳng định tình tiết chưa có và gợi ý thiếu tính khả thi.
  - [x] 3.3 Ghi quyết định qua vòng. Yêu cầu đủ tám cặp hợp lệ, không có lỗi bám dữ kiện nêu ở 3.2 trong tám đầu ra v8.1 và gợi ý gắn với câu hỏi. Nếu trượt, chuyển sang lưu báo cáo ở 5.1.
- [ ] 4.0 **Không áp dụng cho đợt này.** Nếu vòng 1 đạt, chạy vòng 2 để so v8.1 với v7 và v8 gốc trên sáu ca quan hệ rõ, đồng thời kiểm thử lại luồng hỗ trợ
  - [ ] 4.1 Sinh đầu ra v7, v8 gốc và v8.1 trên cùng sáu ca. Dùng chung từng đầu ra v8.1 cho cả hai đối chiếu và tạo hai bộ phiếu chấm mù.
  - [ ] 4.2 Chấm mù và kiểm tra v8.1 thắng ít nhất 4/6 cặp so với v7, tính hòa trong mẫu số. Kiểm tra điểm trung bình `connections` ít nhất bằng v8 gốc trên cùng sáu ca.
  - [ ] 4.3 Báo riêng lỗi JSON, schema, vị trí, lỗi nhà cung cấp, cặp thiếu đầu ra và p50/p95. Xác nhận đủ sáu cặp cho mỗi đối chứng, không tăng lỗi đầu ra so với v7 và chi phí trung vị của v8.1 tối đa bằng 110% v7 trên cặp thành công.
  - [ ] 4.4 Chạy lại kiểm thử server action và Playwright liên quan. Xác nhận ca kích hoạt không trừ credit hay gọi model. Rà soát hai ca nhạy cảm vô hại đi tiếp về suy diễn và cách diễn đạt, ghi lại mọi lỗi nghiêm trọng.
- [x] 5.0 Lưu báo cáo benchmark và quyết định giữ v7 cho đợt này
  - [x] 5.1 Lưu báo cáo vào `docs/benchmarks/` gồm kết quả từng vòng, lý do chấm từng cặp, lỗi, chi phí, độ trễ, kết quả an toàn và quyết định. Nếu trượt, ghi ca cần thử lại và giữ v7.
  - [ ] 5.2 **Không áp dụng cho đợt này.** Nếu cả hai vòng đạt, trình báo cáo cho chủ dự án. Chốt lịch, người thực hiện deploy và cách quay về v7 trước khi thay đổi prompt hoạt động.
  - [ ] 5.3 **Không áp dụng cho đợt này.** Sau khi chủ dự án duyệt, đổi prompt hoạt động sang v8.1 và phát hành theo quy trình hiện có.
  - [ ] 5.4 **Không áp dụng cho đợt này.** Xác minh production đang dùng đúng ID v8.1 qua trang quản trị và kiểm tra luồng mở khóa. Ghi kết quả cùng các bước phục hồi v7 nếu phát hiện lỗi.

## Tiến độ phần Phản tư ngắn

- Các thử nghiệm bổ sung sau vòng 1 dẫn đến hai mẫu phản tư soạn sẵn. Hai mẫu đã được tích hợp dạng tự chọn sau khi mở bài, cùng gợi ý bối cảnh và thẻ hỗ trợ an toàn. Phần này dùng v7 làm prompt mặc định cho diễn giải trả phí.
- Phạm vi review nằm trong commit cục bộ `8a69fa2` trên nhánh `codex/tarot-reflection-support`. Production build, 336 test Vitest, ESLint và TypeScript đã đạt trên checkout riêng. Có 4 test Vitest được bỏ qua.
- Chưa push, mở PR hoặc triển khai. Hệ thống duyệt tự động đã từ chối push vì chưa có xác nhận gửi mã nguồn và bài kiểm thử lên remote GitHub. Kiểm thử của nhánh review xác nhận luồng sản phẩm, còn task 4 yêu cầu benchmark riêng cho v8.1.

## Mẫu và phiếu chấm đã chốt

| Vòng | ID ca | Phiên bản |
|---|---|---|
| 1 | `relation-weak-1` đến `relation-weak-4`, `relation-absent-1` đến `relation-absent-4` | v8 gốc và v8.1 |
| 2 | `relation-strong-1` đến `relation-strong-4`, `orientation-1`, `position-1` | v7, v8 gốc và v8.1 |

Gemini 3.8 Flash (`gemini-3.8-flash`), **một đầu ra mỗi phiên bản mỗi ca**. Vòng 2 dùng lại cùng đầu ra v8.1 cho hai đối chiếu. Codex chấm từ phiếu có câu hỏi, ba lá, kỳ vọng và đầu ra A/B. Lưu lý do trước khi mở khóa ánh xạ. Hai ca an toàn vô hại được rà soát riêng ở vòng 2.

| Mục chấm | 0 điểm | 1 điểm | 2 điểm |
|---|---|---|---|
| Cụ thể | Chung chung hoặc lệch câu hỏi | Trả lời đúng hướng nhưng thiếu chi tiết | Trả lời trực tiếp bằng chi tiết liên quan |
| Bám dữ kiện | Gọi sai lá, vị trí, chiều hoặc khẳng định tình tiết ngoài dữ kiện | Đúng lá và ngữ cảnh chính nhưng có suy luận chưa đủ điều kiện | Phân biệt rõ dữ kiện và giả thuyết có thể kiểm chứng |
| Đóng góp của `connections` | Ép liên kết hoặc bịa quan hệ | Chủ yếu lặp diễn giải từng lá | Bổ sung cách hiểu phù hợp từ vị trí, chiều hoặc liên hệ có căn cứ |
| Giọng tiếng Việt | Khó hiểu hoặc gây sợ hãi | Dễ hiểu nhưng gượng hoặc lặp | Tự nhiên, rõ và tôn trọng người đọc |
| Hành động khả thi | Mơ hồ, lệch câu hỏi hoặc dựa trên giả định | Làm được nhưng còn thiếu bước cụ thể | Có bước rõ ràng, làm được và gắn với câu hỏi |

Mỗi phiếu ghi ID ca, năm điểm cho từng bản, tổng /10, lựa chọn A/B/hòa và lý do. Ghi riêng cờ ép liên kết, sai lá/vị trí/chiều, tình tiết thiếu căn cứ, gợi ý thiếu khả thi và lỗi an toàn. Cặp đủ đầu ra hợp lệ có tổng bằng nhau tính hòa và vẫn nằm trong mẫu số tỷ lệ thắng. Cặp thiếu đầu ra hoặc lỗi kỹ thuật ghi mã lỗi, không cho điểm thắng thua, và không đáp ứng yêu cầu đủ cặp. Lỗi an toàn nghiêm trọng ghi riêng và chặn phát hành dù tổng điểm đạt.
