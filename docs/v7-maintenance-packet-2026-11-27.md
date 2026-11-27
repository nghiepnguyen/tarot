# T11 — Packet maintenance, 27/11/2026

> **Cập nhật 27/11/2026.** Tài liệu dưới đây ghi lại trạng thái chuẩn bị trước cutover. V7 đã mở production. Xem [kết quả thực thi và trạng thái hiện tại](v7-beta-launch-checklist-2026-11-27.md).

**PACKET READY LOCAL; execution chờ 01/12/2026 lúc 21:00, giờ Việt Nam. Chưa GO live.** Người dùng trực và quyết định dừng. Kết thúc bảo trì khi các gate đạt, không chờ đủ một thời lượng cố định.

## Đã chuẩn bị

`ops/v7-cutover/maintenance-packet.mjs` chỉ đọc metadata và tạo đề xuất; không có network hoặc chế độ apply. Snapshot phải đúng project/team/production cũ, đủ pagination, không quá 5 phút, không có build đang chạy, rule/draft lạ hoặc setting/cron khác baseline đã biết. Snapshot thật phải lấy lại trong phiên release; không dùng fixture kiểm thử làm bằng chứng provider.

Packet gồm request freeze build theo marker candidate đã pin, pause cron PayOS, rule deny toàn bộ path và checklist drain. Không tạo sẵn ngoại lệ operator: chỉ materialize sau khi xác minh deployment production mới READY, đúng candidate, không test overlay, host mới chính xác và một IP công khai đã xác minh. Ngoại lệ host AND IP phải đứng trước deny; vẫn cần deployment protection/auth. Logic ngoại lệ mới được kiểm thử local, chưa được chứng minh live.

Khôi phục trước fence yêu cầu người trực duyệt, trạng thái tài chính rõ, settings vẫn do phiên này sở hữu, đủ toàn bộ rule ID và tên của phiên. Chỉ đề xuất xóa rule sở hữu và phục hồi setting gốc; cron vốn tắt thì không tự bật. Sau fence, migration, activation hoặc không biết phase: giữ maintenance và dùng incident/forward recovery, không tự mở lại legacy.

## Thực thi trong cửa sổ

1. Xác nhận người trực, mục tiêu và canary; refresh đầy đủ project, aliases, deployments, cron và firewall, giữ baseline gốc để phát hiện thay đổi.
2. Review packet mới; freeze builds, xác minh không có build chen ngang, pause cron và xác minh trạng thái provider.
3. Review/publish đúng diff firewall của phiên; xác minh deny tại edge. Hai alias chưa kiểm chứng vẫn là giới hạn cần xử lý, không ghi PASS theo suy đoán.
4. Chứng minh drain bằng invocation/transaction và timeout thực tế của deployment cũ. Không dùng một lần DB rỗng hay sleep cố định làm bằng chứng; bảo toàn chứng cứ payment chưa rõ kết quả.
5. Chỉ sau đó thực hiện credential fence theo runbook và chứng minh login/session cũ bị chặn. T0 backup và migration thuộc T12, chưa chạy.
6. Với deployment mới, xác minh host/IP và thứ tự rule trước probe operator. Chạy routing guard và các gate DB, recovery, canary trước mở traffic.

Nếu dừng trước fence: kiểm tra ownership, tài chính và diff khôi phục rồi người trực quyết định. Nếu đã fence hoặc chuyển schema/runtime: giữ maintenance, theo incident runbook. Output `executable:false` và exit0 chỉ thể hiện metadata hợp lệ, không cấp GO hay chứng minh live an toàn.

## Kết quả kiểm tra

Ngày 27/11: 31/31 tests đạt cho maintenance packet, release session và alias guard; ESLint hai file maintenance đạt. Không thay đổi app/RC, firewall, cron, credential hay dữ liệu production trong lượt hoàn thiện này. Test không thay thế thử nghiệm provider hoặc bằng chứng drain/fence thực tế.
