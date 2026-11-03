# Kiểm tra UI: trang chính (`/`) và landing page (`/gioi-thieu`)

Ngày kiểm tra: 2026-11-03. Môi trường: `pnpm dev` local, Chromium (Playwright), khách chưa đăng nhập, chưa chọn cookie.
Độ rộng đã chụp: 1280, 768, 390. Có chụp thêm dark mode ở 1280. Ảnh bằng chứng nằm cùng thư mục này và được chụp **trước khi sửa P0**, nên vẫn thấy banner cũ.

Ghi chú về ảnh: các ảnh full-page có vài thứ **không phải lỗi**. Thứ nhất, dải gradient bị cắt ngang ở khoảng y=800 là do `body::before` dùng `position: fixed`, nên ảnh chụp full-page chỉ vẽ nó một lần. Thứ hai, nút tròn chữ "N" là dev indicator của Next và chỉ có ở môi trường dev. Thứ ba, ảnh landing đầu tiên có các section trống vì `animation-timeline: view()` để chúng ở opacity 0 khi chưa cuộn tới. Người dùng thật cuộn trang vẫn thấy đủ nội dung.

---

## Tóm tắt theo mức ưu tiên

| # | Mức | Trang | Vấn đề |
|---|---|---|---|
| 1 | P0 (đã sửa) | `/` | Banner cookie che nút "Bốc 3 lá bài" ở cả desktop lẫn mobile |
| 2 | P0 (đã sửa) | `/` | Ở bước chọn bài trên mobile, bộ bài và banner cookie đè lên nhau |
| 3 | P1 | `/` | Thứ bậc thị giác bị ngược: nút "Đăng nhập nhận quà" nổi hơn hành động chính |
| 4 | P1 | `/` | Khoảng trống lớn dưới bộ bài, và section disclaimer quá cao so với một dòng chữ |
| 5 | P1 | `/` mobile | Thẻ quà chen giữa form câu hỏi và bộ bài |
| 6 | P1 | `/gioi-thieu` | Landing chưa lần nào cho thấy kết quả sản phẩm (màn luận giải) |
| 7 | P2 | `/gioi-thieu` | SpreadPositions: ba vị trí ngang hàng nhưng có ba bố cục khác nhau, không đánh số |
| 8 | P2 | `/gioi-thieu` | Bảng giá chưa có CTA, chưa có gói nổi bật, chưa có giá mỗi lượt |
| 9 | P2 | `/gioi-thieu` mobile | Trang dài 6560px: bảng giá và thẻ vị trí xếp một cột |
| 10 | P2 | cả hai | Chi tiết nhỏ: icon Sparkles, khoảng cách dưới h1, bộ đếm ký tự, ảnh DeepReading bị đóng khung |
| 11 | P3 | SEO | Tiêu đề và H1 của hai trang cùng nhắm một ý định tìm kiếm |

---

## P0: lỗi chặn hành động chính

> **Đã sửa (2026-11-03).** Banner được chuyển sang góc phải trên desktop. Văn bản rút còn hai dòng, padding nhỏ hơn trên mobile. Banner tự ẩn khi `BottomBar` đang hiện, tức là trong bước chọn bài, nhờ `data-bottom-bar` gắn trên `<html>`. `CardWheel` được thêm `isolate`. Đã kiểm tra lại: nút CTA và hai nút xoay bấm được ở 1280 và 390, và e2e `card-wheel` cùng `reading-flow` pass.

### 1. Banner cookie che nút CTA chính

- **Vị trí:** `components/analytics/ConsentBanner.tsx:22` (fixed, bottom-left trên desktop, full width trên mobile), nút ở `components/tarot/QuestionForm.tsx:75`.
- **Bằng chứng:** `elementFromPoint` tại tâm nút "Bốc 3 lá bài" trả về đoạn `<p>` của banner, không phải nút. Lỗi xảy ra ở cả 1280×800 (nút ở y=607, banner từ y≈590) và 390×844 (nút ở y=655, banner từ y≈648). Xem `home-desk-full.png` và `home-mob-full.png`, so với `home-desk-nobanner.png`.
- **Hậu quả:** Ở lần truy cập đầu tiên, người dùng không thấy nút duy nhất để đi tiếp. Họ phải bấm vào banner trước rồi mới thấy được nút này.
- **Cách sửa (chọn một):**
  1. Trên desktop, đặt banner ở `right-6` thay vì `left-6`. Cột phải lúc đó là thẻ quà, che thẻ quà thì nhẹ hơn che CTA. Banner cũng nên gọn hơn: rút văn bản còn khoảng 2 dòng và đưa phần chi tiết vào link chính sách.
  2. Trên mobile, rút banner thành một thanh mỏng khoảng 64px gồm một câu và hai nút nhỏ, rồi thêm `padding-bottom` tương ứng cho `main` khi banner đang hiện để nội dung không bị che.

### 2. Bộ bài và banner cookie đè lên nhau ở bước chọn bài (mobile)

- **Vị trí:** `components/tarot/CardWheel.tsx:518` (z-index của lá bài là `100 + slot`), `CardWheel.tsx:464` (nút mũi tên `z-[200]`), so với banner `z-50` và `BottomBar` `z-30`.
- **Bằng chứng:** `home-mob-picking.png`. Lá bài vẽ đè lên chữ của banner, còn nửa phải của bộ bài lại bị banner che (6 lá báo `covered=true`). Cả hai đều không đọc được và không bấm được.
- **Nguyên nhân:** z-index của các lá trong wheel không bị cô lập nên trồi lên trên lớp fixed.
- **Cách sửa:** Thêm `isolate` (`isolation: isolate`) vào phần tử gốc của `CardWheel` để mọi z-index bên trong chỉ có hiệu lực trong wheel. Sau đó banner `z-50` sẽ nằm trên một cách nhất quán. Kết hợp với cách sửa ở mục 1: khi đang ở bước chọn bài, nên ẩn banner hoặc thu nó về một thanh mỏng nằm trên `BottomBar`.

---

## P1: thứ bậc và nhịp trang

### 3. Thứ bậc bị ngược trên trang chính

- **Vị trí:** `components/tarot/TarotExperience.tsx:207-214`, `components/tarot/GuestGiftCard.tsx`.
- **Quan sát:** Khi textarea còn trống, nút "Bốc 3 lá bài" ở trạng thái disabled màu sage nhạt và không cho biết vì sao bị khóa. Trong khi đó "Đăng nhập nhận quà" là nút xanh đặc, to nhất màn hình. Mắt người dùng rơi vào đăng nhập trước, không phải vào sản phẩm. Đây là vấn đề UX và thứ bậc, không phải lỗi a11y: WCAG không xét độ tương phản của control đang disabled.
- **Cách sửa:**
  - Giữ nút chính ở màu đầy đủ ngay cả khi chưa nhập gì. Khi bấm mà chưa có câu hỏi thì focus vào textarea và hiện gợi ý ngay dưới ô. Cách khác là giữ disabled nhưng thêm một dòng hint "Nhập câu hỏi để bốc bài".
  - Hạ nút trong thẻ quà xuống variant `secondary` (viền), hoặc đổi thành link chữ. Thẻ quà là thông tin phụ, không phải hành động chính.

### 4. Khoảng trống dưới bộ bài và section disclaimer quá cao

- **Vị trí:** `app/page.tsx:72-74`, `components/ui/Section.tsx:6` (`py-20` mặc định).
- **Quan sát:** Ở 1280, từ đáy bộ bài (y≈950) tới đường kẻ (y≈1050) rồi tới dòng disclaimer (y≈1140) là khoảng 190px trống chỉ để chứa một câu. Bộ bài ở trạng thái nhập câu hỏi là hình trang trí, nhưng trông như có thể bấm vào.
- **Cách sửa:**
  - Đưa disclaimer vào ngay dưới bộ bài, cỡ chữ `text-xs`, căn giữa. Bỏ section riêng có `border-t` và `py-20`, hoặc dùng `py-8`.
  - Bộ bài ở bước nhập câu hỏi: hoặc cho nó bấm được (bấm vào thì focus textarea), hoặc giảm độ nổi (opacity, kích thước) để không bị hiểu là control.

### 5. Thẻ quà chen giữa luồng chính trên mobile

- **Vị trí:** `components/tarot/TarotExperience.tsx:207-218`.
- **Quan sát:** Trên mobile, thứ tự đang là form, thẻ quà (khoảng 400px), rồi bộ bài. Bộ bài nằm ở y≈1150, ngoài màn hình đầu tiên (`home-mob-full.png`).
- **Cách sửa:** Trên mobile, đưa thẻ quà xuống dưới bộ bài, ví dụ dùng `order-last lg:order-none` trên cột thẻ quà. Cách khác là thu nó thành một dòng banner nhỏ "Tạo tài khoản, nhận 2 lượt diễn giải chuyên sâu".

### 6. Landing chưa cho thấy sản phẩm thật sự trả về gì

- **Vị trí:** `components/landing/Hero.tsx`, `components/landing/DeepReading.tsx:58-64`.
- **Quan sát:** Hero là ba ảnh lá bài, DeepReading là một ảnh lá bài nữa. Không chỗ nào trên landing cho thấy màn luận giải: câu hỏi, ba lá theo vị trí, đoạn diễn giải AI. Đây lại chính là thứ người dùng sẽ nhận được. Ảnh lá bài thì trang tarot nào cũng có.
- **Cách sửa:** Thay ảnh High Priestess ở DeepReading bằng một ảnh minh họa sản phẩm (product shot) dựng từ chính `ReadingView`. Ảnh gồm câu hỏi mẫu, ba lá nhỏ có nhãn Bối cảnh / Hiện tại / Hướng đi, và 2–3 đoạn diễn giải thật, trong đó tiêu đề năm phần là chữ thật, phần thân thì mờ dần. Nếu muốn mạnh hơn, đặt một bản thu nhỏ của nó ở hero, chồng lên quạt bài. Ảnh nên là bản dựng tĩnh, không phải screenshot, để giữ nét ở mọi kích thước và tự theo dark mode.

---

## P2: bố cục từng section trên landing

### 7. SpreadPositions không nhất quán

- **Vị trí:** `components/landing/SpreadPositions.tsx:16-33, 53-87`.
- **Quan sát:** Ba vị trí có vai trò ngang nhau nhưng được dựng theo ba kiểu: một ô 2/5, một ô 3/5 nền sage, và một ô full width xếp ngang. Ảnh lá bài nhỏ (`w-32`), nên ô nào cũng thừa nhiều khoảng trống. Không có số 1-2-3 để thể hiện thứ tự đọc, dù tiêu đề section nói "một mạch đọc".
- **Cách sửa:** Dùng ba cột bằng nhau (`md:grid-cols-3`), mỗi ô có số thứ tự "01 / 02 / 03" và ảnh lớn hơn. Nếu muốn giữ điểm nhấn thì chỉ tô nền sage cho "Hiện tại". Trên mobile, mỗi ô xếp ngang với ảnh khoảng 80px bên trái và chữ bên phải để giảm chiều cao.

### 8. Bảng giá thiếu hành động

- **Vị trí:** `components/landing/Pricing.tsx:27-43`.
- **Quan sát:** Bốn ô chỉ để đọc: không bấm được, không đánh dấu gói nên chọn, không có giá mỗi lượt. Riêng tên gói "Phổ biến" lại trông giống một nhãn đánh dấu.
- **Cách sửa:** Thêm dòng giá mỗi lượt, ví dụ "≈ 3.500đ/lượt" (`priceVnd / lượt`), để thấy rõ gói lớn rẻ hơn. Tô viền accent cho một gói. Thêm một CTA chung dưới bảng: "Tạo tài khoản, nhận 2 lượt miễn phí" dẫn tới `/signup`. CTA này nên ở dưới bảng, không đặt trong từng ô, vì mua hàng cần đăng nhập.

### 9. Landing mobile quá dài (6560px)

- **Vị trí:** `Pricing.tsx:28` (`sm:grid-cols-2`), `SpreadPositions.tsx`, `DeepReading.tsx:58`.
- **Cách sửa:** Bảng giá dùng `grid-cols-2` ngay từ mobile, vì các ô ngắn. Thẻ vị trí xếp ngang như ở mục 7. Ảnh DeepReading trên mobile thu xuống khoảng `max-w-[10rem]`, hoặc thay bằng product shot ở mục 6. Ước tính trang ngắn đi khoảng 1500px.

### 10. Chi tiết nhỏ

- **Icon Sparkles trong thẻ quà** (`GuestGiftCard.tsx:38`): đây là icon "AI" rất phổ biến, dễ làm trang trông như mẫu có sẵn. Nên đổi sang `Check` hoặc ngôi sao bốn cánh đã có trong nền trang.
- **Khoảng cách h1 và đoạn mô tả trên trang chính** (`TarotExperience.tsx:179-183`): `gap-4` cộng với mô tả `text-sm` khiến đoạn mô tả trông như chú thích. Nên dùng `text-base` và giới hạn `max-w-[46ch]` như hero của landing để hai trang đồng bộ.
- **Bộ đếm "0/300 ký tự"** đang cách xa textarea và căn trái, chiếm cả một dòng. Nên đặt vào góc dưới bên phải bên trong ô và chỉ hiện khi đã gõ.
- **Ảnh DeepReading** nằm trong một khung nền `sage-tint` có `p-8`, tức là ảnh trong khung. Bỏ khung hoặc thay ảnh theo mục 6.
- **HowItWorks** (`HowItWorks.tsx:20-35`): các bước so le `lg:mt-10/mt-20` tạo cảm giác bậc thang, nhưng đường kẻ trên mỗi bước lệch nhau nên trông như lỗi căn chỉnh. Nên bỏ so le, hoặc thêm số bước để sự so le có ý nghĩa.
- **Hiệu ứng `reveal-on-scroll`** (`globals.css:145`): nội dung ở opacity 0 cho tới khi cuộn tới. Không ảnh hưởng người dùng, nhưng trình render không cuộn (bản in, một số công cụ preview hay crawler) sẽ thấy trang trống. Nên thêm `@media print { .reveal-on-scroll { animation: none } }`.

---

## P3: SEO

### 11. Hai trang tranh cùng một ý định tìm kiếm

`/gioi-thieu` có title "Xem bài tarot online miễn phí" và H1 "Xem bài tarot online, ba lá cho một câu hỏi", trong khi `/` có H1 "Bốc ba lá bài, soi rõ một câu hỏi". Hai trang cùng nhắm từ khóa "xem bài tarot online". Nên chọn một trang chính cho từ khóa này: thường là `/`, vì đó là nơi dùng công cụ. Khi đó `/gioi-thieu` chuyển sang nhắm các ý định phụ như "cách xem tarot 3 lá" hay "ý nghĩa vị trí trải bài".

---

## Thứ tự làm đề xuất

1. ~~Mục 1 và 2~~: đã sửa. Còn một trường hợp: ở màn ngang thấp khoảng 900×700, nút CTA nằm dưới mép màn hình, và khi cuộn lên nó có thể chạm cạnh trái của banner nổi.
2. Mục 3, 4, 5: chỉnh lại thứ bậc trang chính.
3. Mục 6: product shot cho landing, phần tốn công nhất nhưng tăng chuyển đổi rõ nhất.
4. Mục 7–10, rồi mục 11.

## Chưa kiểm tra

- Trạng thái đã đăng nhập: trang chính khi đó chuyển sang form căn giữa, không có thẻ quà.
- Trạng thái đã mở bài (`ReadingView`) và luồng mở khóa AI.
- Dark mode ở mobile, và dark mode của trang chính ở bước chọn bài. Dark mode desktop của landing đã chụp và không thấy lỗi.
- Safari/iOS thật: `animation-timeline` không có trên Safari cũ, nên hiệu ứng reveal sẽ tắt ở đó.
- Hiệu năng (LCP/CLS), chưa đo.
