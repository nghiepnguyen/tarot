# Phát hành beta v7 ngày 27/11/2026

**Đã mở production lúc 15:47, giờ Việt Nam.** Người vận hành duyệt chuyển phiên cutover từ lịch 01/12 sang 27/11. Tên miền chính phục vụ v7 và PayOS vẫn bán credit. Giá mở khóa AI là 10 credit một lượt. Tài khoản mới vẫn nhận 2 lượt AI khi xác minh. [Tarot production](https://tarot.thanhnghiep.top)

## Kết quả cutover

| Bước | Kết quả |
| --- | --- |
| Chốt nguồn phát hành | Candidate `1b33a0ac864ba383ef87dc97b5924369dd2a6b87`. Đã đối chiếu 540 tệp nguồn theo Git blob và SHA-256 của bundle. Gói upload có hai tệp metadata Vercel, tách riêng khỏi workspace thử nghiệm. |
| Bảo trì và chặn bản cũ ghi DB | Tạm khóa build, tắt cron PayOS và chặn ingress. Đợi 312 giây sau khi xác minh chặn ở edge, dài hơn timeout cũ 300 giây. Khi kiểm tra không còn đơn chờ hay transaction cũ đang chạy. Sau khi xoay credential, login cũ bị từ chối qua cả direct và pooler, không còn session owner cũ, và người vận hành kết nối lại được. |
| Sao lưu T0 | Tạo backup production sau khi chặn tiến trình ghi. Khôi phục vào Neon cách ly và đối chiếu 23 bảng, 354 dòng và 97 đối tượng schema với archive. Dữ liệu bảng tài chính khớp từng byte. Bản mã hóa tải lại từ Drive khớp SHA-256. Bản T0 dùng lại khóa sao lưu đã được xác minh trên USB với nonce mới. Môi trường restore được niêm phong sau đối chiếu. |
| Migration và quyền | Áp dụng `20261123000000_add_unlock_operations` trên Neon PostgreSQL 18. Lịch sử có 18 migration đã áp dụng và 0 lỗi. `UnlockOperation` trống trước khi mở ghi và không có khóa idempotency trên ledger cũ. Đạt 56 kiểm tra quyền DML và các kiểm tra từ chối quyền nhạy cảm. Role ứng dụng đăng nhập được qua direct và pooler. |
| Stage v7 | Deployment `dpl_ExVK7Jpvo9Vgv4PBFTGKK23SB4Yg` được build cho Production và đạt `READY` trên Node 24. Khi stage, các alias giữ nguyên. Ngoại lệ firewall ban đầu giới hạn ở hostname mới và một IP vận hành. |
| Recovery | Endpoint recovery trả `401` khi thiếu hoặc sai xác thực, trả `200` với credential đúng và báo không có lượt cần xử lý ở thời điểm kiểm tra. Người vận hành xử lý recovery khi cần trong beta. |
| Mở khóa AI | Lượt thử trên production dùng prompt v7, thành công và lưu bài diễn giải. Ledger có đúng một dòng `UNLOCK_SPEND` trị giá −10 credit và không có dòng hoàn credit. |
| PayOS | Lượt mua thật 19.000₫ chuyển sang `PAID` sau khi đối soát, có đúng một dòng `PURCHASE` cộng 50 credit. Chạy lại đối soát không cộng thêm. Trong thời gian bảo trì, webhook bị chặn, nên lượt thử được ghi nhận qua cron sau khoảng 5 phút kể từ lúc tạo đơn. |
| Mở traffic | Đã promote v7 và xác minh alias production trỏ đúng deployment. Gỡ các rule bảo trì và thu hồi bypass tạm. Trang chủ, đăng nhập và danh sách provider trả `200`. Trang nạp credit chuyển khách chưa đăng nhập về login. Người vận hành xác nhận đăng nhập Google trên tên miền chính thành công. |
| Khôi phục PayOS | Bật lại cron PayOS và xác minh endpoint đối soát chạy thành công. Endpoint webhook nhận được yêu cầu kiểm tra và từ chối payload thiếu chữ ký tại tầng ứng dụng. |

## Cấu hình cho các bản phát hành tiếp theo

- Vercel lưu `DATABASE_URL` và `UNLOCK_RECOVERY_SECRET` dưới dạng sensitive, phạm vi Production. Mục biến DB Preview cũ được giữ riêng. Đã kiểm tra role ứng dụng qua Neon pooler.
- [PR #5](https://github.com/nghiepnguyen/tarot/pull/5) đã merge sau khi lint, unit test, E2E và GitGuardian đạt. `main` ở `8ddba87af1d52e2be382a03d2d7f57bbf77827c1` và Git tree khớp với candidate đã deploy. Các benchmark v9 được lưu làm tư liệu. Prompt hoạt động vẫn là v7.
- Build do lần merge kích hoạt đã bị bỏ qua khi khóa build còn hiệu lực. Lúc 15:58, giờ Việt Nam, Vercel đã bật lại build tự động sau khi xác minh `main` và cấu hình Production. Tên miền chính vẫn phục vụ deployment v7 đã kiểm thử và trang login trả `200`.

## Các lần kiểm tra tiếp theo

- Xác minh lần build tự động tiếp theo từ `main` lên production thành công. Việc bật lại build đã được xác minh qua cấu hình Vercel.
- Đo độ trễ cộng credit qua webhook với một giao dịch tự nhiên. Lượt mua thử đã xác minh thanh toán và tính idempotent qua đối soát, còn kiểm tra sau khi mở traffic chỉ xác minh endpoint webhook truy cập được và kiểm tra chữ ký.
- Recovery tự động cho lượt unlock vẫn chưa được xác nhận hoạt động. Khi có timeout hoặc lượt chờ, dùng [runbook sự cố unlock](v7-unlock-credit-incident-runbook.md). Bản legacy đã mất quyền ghi và chưa có artifact rollback production độc lập. Nếu lỗi sau migration, giữ dữ liệu và xử lý tiến về trước theo runbook.

Bằng chứng cục bộ nằm trong `.model-compare/v7-live-release-20261127/`. Các tệp tổng hợp gồm `fence-proof.json`, `compare-proof.json`, `offdevice-proof.json`, `migration-grants-proof.json`, `private-smoke.json`, `unlock-canary-proof.json`, `payos-canary-proof.json`, `public-release-proof.json`, `future-production-env-proof.json` và `automatic-build-restore-proof.json`.
