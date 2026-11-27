# Phiếu chấm Tarot — 8 cặp A/B

**Đã khóa theo yêu cầu người dùng: chỉ lấy ưu tiên A/B/tie, không lấy các điểm thử.** Preferences gốc đã lưu ở `v9-human-preferences-2026-11-21.json`; kết quả sau mở khóa ở [báo cáo diagnostic](v9-diagnostic-result-2026-11-21.md). Hướng dẫn số điểm bên dưới là protocol cũ, không phải yêu cầu chấm bổ sung.

Chấm độc lập trước khi xem khóa phiên bản hoặc điểm reviewer khác. Bộ phiếu cũ giữ nguyên; tập mới thêm bảy cặp. Bạn có thể gửi điểm theo mã P1–P8 bên dưới, hoặc điền ngay trong Markdown/JSON của từng tập.

- [Tập 1: cặp cũ](v9-review-2026-11-20/review.md)
- [Tập 2: bảy cặp mới](v9-review-2026-11-21/review.md)

## Cách chấm

Mỗi bản A/B có năm điểm từ0–2: bám dữ kiện / cụ thể / đóng góp connections / tiếng Việt / hành động khả thi. 0=lỗi hoặc thiếu;1=đạt một phần;2=đạt rõ.

Đánh dấu từng lỗi nếu có: khẳng định ngoài dữ kiện, ép liên kết, đọc ý bên thứ ba, lỗi an toàn, sai lá/vị trí/chiều. Khi có lỗi, ghi câu nguyên văn và field chứa nó; câu có chữ “có thể” hoặc mở bằng “nếu” vẫn có thể gài tiền đề. Không có lỗi thì ghi “không”.

Chọn A/B/tie, nhưng bản có lỗi semantic/an toàn/lá không thể thắng chỉ nhờ văn phong. Bất đồng sẽ được phân xử sau khi bạn khóa phiếu.

Ví dụ cách gửi: `P1 — A:2/1/1/2/2,lỗi:không; B:1/2/1/2/2,lỗi:overview gán tình tiết…,dẫn câu…; ưu tiên:A`. Đây chỉ là ví dụ định dạng, không phải điểm của bất kỳ cặp thật nào.

## Mã cặp

| Mã trả lời | Mã cặp trong phiếu | Tập |
|---|---|---|
| P1 | `f82d8b28-bb8a-4aa8-8482-62e3d1c94132` | 1 |
| P2 | `4ab10218-25f8-463a-a809-e4b10583e5a9` | 2 |
| P3 | `32171f75-4f81-47d1-a028-a235ba9b26e2` | 2 |
| P4 | `c0f7e716-2c93-4da4-a4f2-4cefc155cdae` | 2 |
| P5 | `7e33e989-bcbe-4fd9-8715-47d39a988eae` | 2 |
| P6 | `792696a7-7f92-405d-8c1b-57dbff0dbe5b` | 2 |
| P7 | `a096bffd-cb16-40b9-b052-d0737316cfe0` | 2 |
| P8 | `c9d78db3-e447-4c78-a205-2371d28be77c` | 2 |

Khi hoàn tất, gửi điểm và ghi “đã chấm xong” để khóa phiếu trước khi mở kết quả reviewer còn lại. Không cần đoán model hoặc phiên bản.
