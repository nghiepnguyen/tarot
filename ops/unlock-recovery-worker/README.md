# Recovery scheduler — Vercel Hobby

Worker chỉ có scheduled handler, gọi `GET /api/cron/recover-unlocks` mỗi lần; không có endpoint public hoặc quyền DB. Server giữ budget45s, client chờ tối đa55s cho cả headers/body; không retry hoặc follow redirect. Lượt chưa rõ settlement để guarded recovery lần sau quyết định, không suy rằng timeout có nghĩa rollback.

`wrangler.toml` mặc định **không có cron**, tắt workers.dev/preview URLs, URL placeholder `.invalid` bị handler từ chối. Không có secret trong source/config. Chưa tạo Worker hay thay lịch production.

## Kết nối và triển khai khi đã được phép

1. Dùng tài khoản Cloudflare của người phụ trách. Kiểm tra Workers Free/quota và notifications; không thay gói Vercel Hobby.
2. Tạo secret ngẫu nhiên mới, ít nhất32 ký tự base64url, khác CRON_SECRET của PayOS. Lưu bằng password manager, không dán vào chat, URL, source hoặc file tracked.
3. Đặt cùng giá trị ở **Vercel `UNLOCK_RECOVERY_SECRET`** và **Worker `RECOVERY_SECRET`** qua kho secrets của từng nền tảng. Khi dedicated key đã set, recovery từ chối CRON_SECRET cũ; PayOS vẫn dùng CRON_SECRET như trước. Nếu dedicated key được đặt chuỗi rỗng, recovery fail closed thay vì fallback; chỉ khi biến hoàn toàn unset mới giữ legacy mode.
4. Đặt `RECOVERY_URL` thành HTTPS release host đã xác minh, đúng path recovery, không query/hash/credentials/port riêng. Deploy Worker với `crons=[]`; không gắn routes hoặc public fetch.
5. Sau migration, new-writer cutover/drain và một invocation test được duyệt, đổi cron thành `["* * * * *"]`, deploy cấu hình đã được duyệt và kiểm tra invocation history. Không enable trước khi backend mới/dedicated key sẵn sàng.
6. Giao owner theo dõi lỗi, missed execution, quota và rotation_failed. Tạm dừng bằng trả `crons=[]`; giữ guarded recovery/schema ở server. Muốn thu hồi quyền scheduler, rotate dedicated recovery secret, không ảnh hưởng PayOS key.

## Quan sát

HTTP401/503, JSON `ok` không true, redirect, lỗi mạng hoặc quá55s đều làm invocation fail bằng lỗi generic; không log headers, URL, body hoặc exception gốc. Một HTTP503 có thể đã hoàn một số rows, không replay increment thủ công. Không hứa exactly-once invocation hoặc lịch chạy đúng giây; DB helper có fencing/idempotency và pending/quarantine phải có owner.

Lịch mỗi phút tương đương1440 triggers/ngày, mỗi trigger một HTTP call; đây chỉ là tải dự kiến, không bảo đảm quota còn trống. Workers Free có giới hạn dùng chung tài khoản, CPU10ms/invocation; thời gian chờ fetch không phải CPU. Chỉ bật sau smoke trên Cloudflare thực tế. Cron changes có thể cần tới15phút để propagate: xác nhận các invocation thành công trước mở traffic.

Nguồn kiểm tra ngày24/11/2026: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/). Local unit tests không thay thế Cloudflare runtime/account test.
