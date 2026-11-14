# Danh sách task — Phản tư nhanh theo trải bài

Nguồn yêu cầu [Đặc tả Phản tư nhanh theo trải bài](../docs/tarot-dynamic-reflection-spec.md).

## Relevant Files

- `docs/tarot-dynamic-reflection-spec.md` — đặc tả và điều kiện nghiệm thu.
- `lib/validation/reading.ts`, `lib/validation/reading.test.ts` — xác thực câu hỏi, ID, vị trí và chiều lá.
- `lib/tarot/cards.ts` — tra dữ liệu lá bài trên server.
- `lib/ai/dynamic-reflection.ts`, `lib/ai/dynamic-reflection.test.ts` — tệp dự kiến cho prompt, schema đầu ra và kiểm thử.
- `app/actions/reflection.ts`, `lib/ai/reflection-action.test.ts` — tệp dự kiến cho luồng server và kiểm thử quyền truy cập, hạn mức, lỗi và hỗ trợ.
- `lib/ai/gemini.ts`, `lib/ai/reading-support.ts`, `lib/auth/rate-limit.ts` — mẫu gọi model, quy tắc hỗ trợ và hạn mức hiện có.
- `components/tarot/ReadingView.tsx`, `components/tarot/TarotExperience.tsx` — trạng thái mở bài, khôi phục, bỏ qua và đổi lượt.
- `e2e/reading-flow.spec.ts`, `e2e/ai-unlock.spec.ts` — kiểm thử giao diện và luồng hỗ trợ.
- `scripts/benchmark-prompts.ts`, `lib/ai/benchmark-cases.ts`, `docs/benchmarks/` — tham chiếu runner và ca hiện có, lưu báo cáo phản tư riêng.
- `app/actions/ai.ts` — luồng chuyên sâu cần bảo toàn trong giai đoạn đầu, điểm đối chiếu khi xem xét dùng ghi chú ở giai đoạn sau.

### Notes

- Server thử nghiệm mặc định tắt. Đặt `TAROT_REFLECTION_ENABLED=1` trong `.env.local` để bật với `next dev` cho tài khoản đã đăng nhập. Khách không gọi model. Hạn mức 5 lượt mỗi tài khoản mỗi giờ, chờ model tối đa 8 giây. Chốt cỡ mẫu và ngưỡng chi phí, độ trễ trước khi mở thử nghiệm cho người dùng.
- Ghi chú tự nguyện tối đa 300 ký tự sau khi trim và chỉ tồn tại trong lượt trải ở giai đoạn đầu. Việc dùng ghi chú cho diễn giải chuyên sâu cần quyết định riêng về quyền riêng tư và lưu trữ.
- Dùng Vitest và Playwright cho kiểm thử. Đọc hướng dẫn Next.js tương ứng trong `node_modules/next/dist/docs/` trước khi sửa mã.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` ngay sau khi hoàn thành từng task con. Đánh dấu task cha khi các task con áp dụng đã hoàn thành.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Kiểm tra nhánh, worktree và thay đổi chưa commit. Xác nhận điểm xuất phát có hai mẫu phản tư soạn sẵn và luồng hỗ trợ từ nhánh review. Tạo nhánh `codex/tarot-dynamic-reflection` và bảo toàn thay đổi đang có.
- [x] 1.0 Xây dựng prompt và hợp đồng đầu vào, đầu ra cho ba câu hỏi phản tư có tham chiếu đúng lá trong lượt trải
  - [x] 1.1 Dùng validator lưu bài để yêu cầu câu hỏi đã trim tối đa 300 ký tự và đúng ba lá khác nhau, đúng vị trí, thứ tự và chiều. Tra tên, chất và nghĩa lá từ bộ bài trên server.
  - [x] 1.2 Đóng gói câu hỏi và lá thành dữ liệu riêng. Viết prompt cho câu mở đầu, câu hỏi quan sát, câu hỏi bám bối cảnh và câu hỏi kiểm chứng hoặc hành động. Xử lý câu Có/Không, câu hỏi về người khác và liên hệ yếu theo đặc tả. Chỉ dùng chi tiết hình ảnh có dữ liệu xác minh.
  - [x] 1.3 Kiểm tra JSON gồm `intro`, đúng ba câu và một hoặc hai `cardRefs` khác nhau. Từ chối đầu ra vượt 150 đơn vị tách bằng khoảng trắng, ID ngoài trải hoặc câu thứ hai thiếu tên chuẩn của lá tham chiếu. Kiểm thử cả đầu ra hợp lệ và lỗi.
- [x] 2.0 Kiểm tra dữ liệu và nhánh hỗ trợ tại server trước khi gọi model, áp dụng quyền truy cập và hạn mức cho luồng thử nghiệm
  - [x] 2.1 Chốt đối tượng dùng thử, quyền truy cập của khách và hạn mức trước khi bật endpoint công khai. Dùng cơ chế quyền và hạn mức hiện có khi phù hợp.
  - [x] 2.2 Kiểm tra đầu vào, quyền truy cập, hạn mức và tín hiệu hỗ trợ trên server trước khi gọi model. Khi cần hỗ trợ, trả trạng thái để UI hiển thị thẻ hỗ trợ. Phản tư không đi qua giao dịch credit.
  - [x] 2.3 Áp thời gian chờ, dùng validator đầu ra và trả trạng thái dự phòng khi model lỗi. Ghi trạng thái, độ trễ, token và chi phí ước tính. Loại câu hỏi, ghi chú và phản hồi thô khỏi analytics và log thử nghiệm.
  - [x] 2.4 Kiểm thử số lượt gọi với dữ liệu sai, khách theo quyền đã chốt, hết hạn mức, ca hỗ trợ, model lỗi và đầu ra sai. Xác nhận các nhánh từ chối không gọi model hoặc trừ credit.
- [x] 3.0 Tích hợp phản tư tự chọn sau khi mở đủ ba lá, với ghi chú cục bộ và luồng tiếp tục xem bài khi bỏ qua, gặp lỗi hoặc đổi lượt
  - [x] 3.1 Hiển thị lựa chọn sau khi mở đủ ba lá, cả khi giảm chuyển động hoặc khôi phục bài. Thêm nút **Tiếp tục xem bài** dùng được trước và trong lúc tải.
  - [x] 3.2 Chỉ gọi khi người dùng chọn tạo phản tư. Giới hạn một yêu cầu đang chạy cho mỗi lượt trải và loại phản hồi đến muộn sau khi bỏ qua hoặc đổi lượt.
  - [x] 3.3 Hiển thị câu hỏi dưới dạng văn bản. Cho phép tiếp tục khi lỗi hoặc quá hạn, dùng hai mẫu tự chọn làm phương án dự phòng. Ẩn phản tư khi nhánh hỗ trợ kích hoạt.
  - [x] 3.4 Thêm ghi chú tự nguyện tối đa 300 ký tự sau khi trim. Giữ trong bộ nhớ lượt hiện tại, xóa khi mở bài mới và bảo toàn hành vi của phần diễn giải chuyên sâu.
- [x] 4.0 Chạy benchmark và kiểm thử cục bộ về độ bám dữ kiện, khả năng sử dụng, nhánh hỗ trợ, độ trễ và chi phí
  - [x] 4.1 Chốt model, cỡ mẫu, cách chấm và ngưỡng chi phí, độ trễ. Dùng ca tổng hợp gồm Có/Không, hỏi ý người khác, ít bối cảnh, quan hệ yếu/vắng, đổi chiều/vị trí, chèn chỉ dẫn và nội dung nhạy cảm.
  - [x] 4.2 Chạy benchmark riêng. Chấm xem có khẳng định hoặc tiền đề ngoài dữ kiện hay không, với ngưỡng 0 ca lỗi. Đánh giá riêng tính hữu ích của bước gợi ý. Ghi tỷ lệ hợp lệ, tỷ lệ dự phòng, độ trễ và chi phí.
  - [x] 4.3 Chạy Playwright desktop và điện thoại cho bàn phím/chạm, giảm chuyển động, khôi phục, bỏ qua, lỗi, đổi lượt và ghi chú. Xác nhận bỏ qua trước khi tạo phản tư và ca hỗ trợ đều có 0 lượt gọi phản tư. Kiểm tra nhánh hỗ trợ với khách và tài khoản đăng nhập, cùng luồng diễn giải hiện có.
  - [x] 4.4 Chạy Vitest, ESLint và TypeScript. Ghi kết quả và các giới hạn còn lại của thử nghiệm.
  - [Kết quả Task 4](../docs/benchmarks/dynamic-reflection-task-4-2026-11-14.md). Benchmark đã chạy, ngưỡng dữ kiện và ca chặn dự kiến chưa đạt.
- [x] 5.0 Lưu kết quả benchmark và quyết định có mở thử nghiệm cho người dùng. Xác định điều kiện cho giai đoạn dùng ghi chú trong diễn giải chuyên sâu
  - [x] 5.1 Lưu báo cáo ở `docs/benchmarks/`. Đối chiếu kết quả với tiêu chí về dữ kiện, an toàn, trải nghiệm, độ trễ và chi phí. Ghi quyết định giữ thử nghiệm cục bộ hoặc đề xuất mở cho nhóm người dùng đã chốt.
  - [x] 5.2 Ghi điều kiện cho giai đoạn dùng ghi chú, gồm quyết định về quyền riêng tư và lưu trữ, lựa chọn đồng ý rõ ràng, trường dữ liệu riêng và kiểm tra câu hỏi lẫn ghi chú trước khi trừ credit. Lập ca nghiệm thu ghi chú rỗng, quá dài, có tín hiệu an toàn và mở lại bản diễn giải đã lưu.

  - [Quyết định và ca nghiệm thu](../docs/benchmarks/dynamic-reflection-task-4-2026-11-14.md#quyết-định-task-5). Giữ phản tư động ở môi trường phát triển.
