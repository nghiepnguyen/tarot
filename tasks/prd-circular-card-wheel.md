# PRD: Vòng bài tròn để bóc bài (Circular Card Wheel)

## 1. Tổng quan

Ở bước **"Chọn ba lá bài"** (status `picking` trong `TarotExperience`), bộ bài 78 lá hiện hiển thị dạng **lưới 3 hàng chia trang**, vuốt ngang từng trang (`CardCarousel` trong `components/tarot/ArcDeck.tsx`). Cách này dễ dùng nhưng trông giống danh sách ảnh hơn là một bộ bài, thiếu cảm giác "trải bài" của một buổi xem tarot thật.

Tính năng này thay lưới đó bằng một **vòng bài tròn khép kín**: 78 lá xếp úp quanh một vòng tròn, tâm vòng nằm **dưới mép dưới màn hình**, nên người dùng chỉ thấy **cung phía trên** của vòng. Người dùng cuộn / kéo / vuốt / bấm phím để **xoay vòng**, và **tap vào một lá bất kỳ đang lộ ra** để bóc lá đó. Lá đã bóc **bay lên 3 ô vị trí** (Bối cảnh / Hiện tại / Hướng đi) phía trên vòng.

**Mục tiêu:** tạo trải nghiệm bóc bài có cảm giác nghi thức, hoạt động mượt và dễ dùng trên cả PC (chuột, trackpad, bàn phím) lẫn mobile (cảm ứng).

## 2. Mục tiêu (Goals)

1. Cả 78 lá đều chọn được chỉ bằng thao tác xoay vòng, không cần chuyển trang.
2. Vòng xoay mượt ở 60fps trên máy tầm trung (iPhone 12 / Android tầm trung, laptop phổ thông).
3. Hỗ trợ đầy đủ 4 cách xoay: wheel chuột/trackpad, kéo/vuốt có quán tính, phím mũi tên, nút xoay trái/phải.
4. Không giảm tỉ lệ hoàn tất bước chọn bài (event `reading_reveal` / số lượt vào `picking`) so với lưới hiện tại.
5. Đạt accessibility tương đương hoặc tốt hơn hiện tại (screen reader, bàn phím, `prefers-reduced-motion`).

## 3. User Stories

- **Người dùng mobile**, tôi muốn vuốt ngón tay để xoay vòng bài và tap vào một lá, để bóc bài giống đang rút bài thật trên bàn.
- **Người dùng PC**, tôi muốn lăn chuột hoặc vuốt trackpad để xoay vòng, để không phải kéo giữ chuột liên tục.
- **Người dùng dùng bàn phím**, tôi muốn dùng ←/→ để di chuyển giữa các lá và Enter/Space để chọn, để bóc bài mà không cần chuột.
- **Người dùng không quen vuốt**, tôi muốn có nút xoay trái/phải rõ ràng, để biết vòng bài xoay được.
- **Người dùng**, tôi muốn thấy lá vừa bóc bay vào đúng ô vị trí (Bối cảnh → Hiện tại → Hướng đi), để hiểu lá nào nằm ở vị trí nào trong trải bài.
- **Người dùng đổi ý**, tôi muốn tap vào một ô đã có lá để trả lá đó về vòng, để chọn lại.
- **Người dùng bật "giảm chuyển động"**, tôi muốn vòng bài không có hiệu ứng quán tính / bay lá, để không bị chóng mặt.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1 Bố cục vòng bài

1. Hệ thống phải xếp toàn bộ `DECK_SPREAD_SIZE` (78) lá úp mặt, cách đều nhau quanh **một vòng tròn khép kín 360°**.
2. Tâm vòng tròn phải nằm **bên dưới** mép dưới của vùng hiển thị vòng bài, để chỉ **cung phía trên** lộ ra.
3. Mỗi lá phải **xoay theo hướng bán kính** (đỉnh lá hướng ra ngoài vòng, đáy lá hướng về tâm), giống quạt bài.
4. Số lá lộ ra cùng lúc phải vừa đủ để tap chính xác:
   - Mobile (< 640px): khoảng **9–13 lá** lộ ra.
   - PC (≥ 640px): khoảng **15–21 lá** lộ ra.
   - Bán kính vòng và kích thước lá được tính từ chiều rộng viewport để đạt các con số trên. Các con số này là mục tiêu, được phép tinh chỉnh khi test thực tế.
5. Vùng hiển thị vòng bài phải **tràn full chiều ngang viewport** (giữ logic breakout hiện có trong `useBreakout`), và phần vòng nằm ngoài vùng hiển thị bị cắt (`overflow: hidden`).
6. Lá nằm ngoài cung đang lộ (và ngoài một vùng đệm nhỏ hai bên) **không được render ra DOM hoặc bị ẩn** (xem Technical Considerations — virtualization), nhưng vẫn phải chọn được khi xoay tới.
7. Vòng phải **lặp vô hạn**: xoay liên tục một chiều thì lá 78 nối tiếp lá 1, không có điểm đầu/cuối, không có chỗ "giật" khi đi qua điểm nối.
8. Tất cả lá trên vòng phải có **cùng kích thước**, kể cả lá ở đỉnh cung (không phóng to lá ở giữa).
9. Khi vào màn picking, **góc ban đầu của vòng phải ngẫu nhiên** (một bội số ngẫu nhiên của `360/n`), để lá nằm ở đỉnh cung mỗi lần mỗi khác. Góc ngẫu nhiên chỉ tính **ở client** sau khi mount (tránh hydration mismatch) và không đổi khi re-render.
10. Khi vào màn picking, vòng phải có **hiệu ứng trải bài**: các lá xoè ra từ đỉnh cung sang hai bên tới vị trí của mình (stagger ngắn, tổng ≤ 0.6s), giống cảm giác của `CardFan`. Trong lúc hiệu ứng chạy, người dùng chưa xoay và chưa chọn được lá.
11. **Màn hình ngang (mobile landscape)** hoặc chiều cao viewport thấp (< 500px): giữ nguyên kích thước lá và vòng, **không thu nhỏ**; cho phép cuộn trang để thấy hết 3 ô và vòng bài (bỏ yêu cầu 30 "vừa một màn hình" cho trường hợp này).

### 4.2 Xoay vòng

12. **Wheel chuột / trackpad (PC):** cuộn dọc (`deltaY`) và cuộn ngang (`deltaX`) đều phải xoay vòng. Khi con trỏ nằm trên vòng bài, sự kiện wheel phải **không cuộn trang** (`preventDefault`, listener `passive: false`).
13. **Kéo / vuốt (PC + mobile):** dùng Pointer Events. Kéo ngang làm vòng xoay theo ngón tay/chuột (lá dưới ngón tay đi theo ngón tay). Khi thả ra, vòng tiếp tục xoay theo **quán tính** rồi chậm dần và dừng.
14. Trên mobile, vuốt **dọc** trên vòng bài phải vẫn **cuộn trang bình thường** (dùng `touch-action: pan-y`), chỉ vuốt **ngang** mới xoay vòng.
15. **Bàn phím:** khi vòng bài có focus, `←` / `→` chuyển focus sang lá kế bên và xoay vòng để lá đó nằm trong vùng nhìn thấy. `Enter` / `Space` chọn lá đang focus. `Home`/`End` không bắt buộc.
16. **Nút xoay:** hiển thị 2 nút `‹` và `›` (icon từ `lucide-react`) hai bên vòng bài. Mỗi lần bấm xoay khoảng **1/2 số lá đang lộ** với animation mượt. Nút có vùng bấm tối thiểu 44×44px và `aria-label` ("Xoay bài sang trái" / "Xoay bài sang phải").
17. Khi dừng xoay (sau quán tính, sau wheel, sau bấm nút), vòng phải **snap** nhẹ để một lá nằm đúng chính giữa đỉnh cung (không dừng lệch nửa lá).
18. Một thao tác kéo (di chuyển > ~6px) **không được** tính là tap chọn lá khi thả tay.

### 4.3 Bóc lá

19. Tap / click vào **bất kỳ lá nào đang lộ** trên vòng phải chọn lá đó (không bắt buộc lá phải ở giữa).
20. Hover (PC) trên một lá phải nhấc lá lên nhẹ theo hướng bán kính (ra ngoài vòng) để báo "bấm được".
21. Khi chọn, lá phải **bay** từ vị trí trên vòng lên ô vị trí trống **tiếp theo** theo thứ tự: 1 Bối cảnh → 2 Hiện tại → 3 Hướng đi.
22. Chỗ lá vừa rời đi trên vòng phải **khép lại**: các lá còn lại dàn đều lại quanh vòng với animation (vòng giờ có 77, 76, 75 lá).
23. Khi đã chọn đủ 3 lá, các lá còn lại trên vòng phải hiển thị trạng thái không bấm được (mờ đi, `disabled`), vòng vẫn xoay được.
24. Mỗi lá trên vòng giữ **index gốc trong `pool`**, để `selectedSlots` vẫn lưu index gốc như hiện tại — logic `handleSelectSlot`, `handleReveal` trong `TarotExperience` **không đổi**.

### 4.4 Ba ô vị trí (slots)

25. Phía trên vòng bài phải có 3 ô úp dạng khung lá bài, có nhãn: **Bối cảnh**, **Hiện tại**, **Hướng đi** (khớp tên trong `components/landing/SpreadPositions.tsx`).
26. Ô trống hiển thị khung viền nét đứt + nhãn. Ô có lá hiển thị mặt lưng lá (`CardFace`/`CardBack`) — **không lật lá** ở bước này, lật vẫn diễn ra ở `ReadingView`.
27. Tap vào một ô đã có lá phải **trả lá đó về vòng** (lá bay ngược về vị trí cũ trên vòng, vòng dàn lại chỗ cho nó). Các lá ở ô phía sau **dồn lên** để lấp chỗ trống (vd trả lá ở ô 1 thì lá ô 2 lên ô 1, lá ô 3 lên ô 2) — khớp hành vi `selectedSlots.filter(...)` hiện tại.
28. Ô có lá phải có `aria-label` dạng "Bối cảnh: đã chọn, bấm để bỏ chọn"; ô trống có `aria-label` "Bối cảnh: chưa chọn".

### 4.5 Phần còn lại của màn picking

29. Giữ nguyên: tiêu đề "Chọn ba lá bài", câu hỏi của người dùng, `BottomBar` với dòng trạng thái `aria-live`, nút "Chọn câu hỏi khác" và "Mở lá bài".
30. Toàn bộ màn picking (tiêu đề + 3 ô + vòng bài + bottom bar) phải **vừa trong một màn hình** trên mobile phổ biến (≥ 667px chiều cao, vd iPhone SE) mà không cần cuộn trang. Vòng bài chiếm phần đáy phía trên `BottomBar`.
31. Analytics giữ nguyên các event hiện có (`card_select`, `card_deselect`, `reading_reveal`). Thêm event mới **`deck_rotate`** bắn **một lần mỗi phiên picking** khi người dùng xoay lần đầu, với thuộc tính `method: "wheel" | "drag" | "keyboard" | "button"`.

### 4.6 Giảm chuyển động (`prefers-reduced-motion`)

32. Khi `useReducedMotion()` trả về `true`: tắt hiệu ứng trải bài lúc vào màn, tắt quán tính, tắt animation bay lá và dàn lại vòng (nhảy thẳng tới trạng thái cuối), nút xoay/phím xoay nhảy ngay không animate. Vòng vẫn xoay được đầy đủ.

### 4.7 Accessibility

33. Vòng bài có `role="listbox"` hoặc nhóm có `aria-label="Vòng bài, dùng phím mũi tên để xoay"`; dùng **roving tabindex** (chỉ lá đang focus có `tabIndex=0`).
34. Mỗi lá giữ `aria-label="Chọn lá thứ N"` (N = index gốc + 1) — e2e `e2e/reading-flow.spec.ts` đang tìm theo `/^Chọn lá thứ/`.
35. Focus ring hiển thị rõ (`focus-visible:ring-2 ring-accent`) như hiện tại.

## 5. Ngoài phạm vi (Non-Goals)

- **Không** thay đổi thuật toán rút bài (`drawSpreadPool`), số lá (78), hay số lá cần chọn (3).
- **Không** lật lá hay hiện mặt lá ở bước picking.
- **Không** thay đổi màn shuffle (`ShuffleDeck`), màn câu hỏi, hay `ReadingView`.
- **Không** thay đổi `CardFan` (bản không tương tác, dùng ở màn câu hỏi với `size={16}`).
- **Không** thêm âm thanh.
- **Không** thêm rung (`navigator.vibrate` / haptics) — đã chốt không cần.
- **Không** hỗ trợ kéo lá ra khỏi vòng để chọn (chỉ tap).
- **Không** thêm thư viện gesture mới nếu `framer-motion` đáp ứng được.

## 6. Thiết kế (Design Considerations)

Phác thảo bố cục (mobile, dọc):

```
┌─────────────────────────────┐
│      Chọn ba lá bài         │
│   Câu hỏi: "…"              │
│                             │
│  ┌───┐    ┌───┐    ┌───┐    │  ← 3 ô vị trí
│  │ 1 │    │ 2 │    │   │    │
│  └───┘    └───┘    └╌╌╌┘    │
│ Bối cảnh  Hiện tại Hướng đi │
│                             │
│ ‹    ╱ ╱ │ │ │ ╲ ╲      ›   │  ← cung trên của vòng bài
│   ╱ ╱               ╲ ╲     │
├─────────────────────────────┤
│  Đã chọn 2/3 — …            │  ← BottomBar (giữ nguyên)
│ [Chọn câu hỏi khác][Mở lá]  │
└─────────────────────────────┘
          (tâm vòng ở đây, ngoài màn hình)
```

- Dùng lại `CardFace` / `CardBack` từ `components/tarot/CardBack.tsx` cho mặt lưng lá; giữ tỉ lệ lá `CARD_RATIO = 1.57`.
- Màu, viền, bo góc dùng token có sẵn (`bg-accent`, `border-accent`, `border-foreground`, `text-muted`) — không thêm màu mới.
- Kích thước lá gợi ý: mobile ~64–72px rộng, PC ~90–100px rộng.
- Gợi ý lần đầu: một dòng chữ nhỏ "Vuốt hoặc cuộn để xoay bài" dưới vòng, ẩn sau lần xoay đầu tiên.

## 7. Kỹ thuật (Technical Considerations)

- **Vị trí code:** thay `CardCarousel` trong `components/tarot/ArcDeck.tsx` bằng component mới (vd `CardWheel`, có thể tách file `components/tarot/CardWheel.tsx`). `ArcDeck` giữ API props hiện tại (`size`, `interactive`, `selectedSlots`, `onSelectSlot`) để `TarotExperience` không cần đổi nhiều. 3 ô vị trí có thể nằm trong `CardWheel` (để animation bay lá dùng chung layout) — dùng `layoutId` của framer-motion cho hiệu ứng bay lá giữa vòng và ô.
- **Trạng thái xoay:** một giá trị góc `rotation` (độ) dùng `useMotionValue` của framer-motion — **không** lưu góc trong React state, để xoay không gây re-render mỗi frame. Vị trí mỗi lá = `baseAngle(i) + rotation`, tính bằng `useTransform` hoặc cập nhật style trực tiếp.
- **Góc từng lá:** với `n` lá còn lại trên vòng, lá thứ `k` (thứ tự trong danh sách lá chưa chọn) có `baseAngle = k * 360 / n`. Toạ độ: `x = R·sin(θ)`, `y = R·(1 − cos(θ))` tương đối đỉnh vòng, `rotate = θ` (xem `CardFan` hiện có làm mẫu).
- **Quán tính:** dùng `animate(rotation, target, { type: "inertia", velocity, power, timeConstant, modifyTarget })` của framer-motion; `modifyTarget` làm tròn góc đích về bội số của `360/n` để snap.
- **Chuyển px sang độ:** khi kéo, `Δθ = Δx / R` (rad) để lá dưới ngón tay đi theo ngón tay. Wheel: `Δθ = (deltaX || deltaY) / R`, có hệ số tinh chỉnh; chuẩn hoá `deltaMode` (line/page) sang px.
- **Virtualization:** chỉ render lá có `θ` (sau khi chuẩn hoá về [-180°, 180°]) nằm trong khoảng nửa góc lộ + đệm (~2 lá mỗi bên). Render tối đa ~30 node thay vì 78 để giữ 60fps trên mobile. Dùng `transform` (không dùng `left/top`) và `will-change: transform`.
- **Wheel listener:** phải gắn bằng `addEventListener("wheel", fn, { passive: false })` trong `useEffect` — prop `onWheel` của React là passive nên không `preventDefault` được.
- **Pointer:** `setPointerCapture` khi kéo; `touch-action: pan-y` trên vùng vòng; phân biệt tap/drag bằng ngưỡng ~6px.
- **Hydration:** làm tròn số trước khi đưa vào inline style (như comment trong `CardFan`), hoặc chỉ tính layout sau khi đo viewport ở client (như `useBreakout` đang làm).
- **Next.js:** project dùng Next 16.3 — đọc `node_modules/next/dist/docs/` trước khi đụng tới phần liên quan Next (component này là `"use client"`, chủ yếu là React + framer-motion 13).
- **Test:**
  - Cập nhật `e2e/reading-flow.spec.ts` nếu cần — nút lá vẫn phải tìm được bằng `getByRole("button", { name: /^Chọn lá thứ/ })` và click được (lá phải nằm trong vùng lộ).
  - Thêm e2e: chọn 3 lá → 3 ô có lá; bỏ chọn ô 1 → lá ô 2, 3 dồn lên; phím ←/→/Enter chọn được lá; chạy ở viewport mobile (`devices["iPhone 13"]`) và desktop.
  - Unit test (vitest) cho hàm thuần tính góc/toạ độ/virtualization nếu tách ra `lib/`.

## 8. Chỉ số thành công (Success Metrics)

- Tỉ lệ `reading_reveal` / số lần vào bước picking **không giảm** (so 2 tuần trước và sau khi ra mắt).
- Tỉ lệ `card_deselect` trên mỗi reading không tăng đáng kể (tăng mạnh = người dùng chọn nhầm do lá khó bấm).
- Event `deck_rotate` xuất hiện ở ≥ 60% phiên picking (người dùng có khám phá vòng bài), phân bố `method` cho biết cách xoay nào được dùng nhiều.
- Không có lỗi Sentry mới từ component vòng bài.
- Performance: Chrome DevTools trên CPU throttle 4× không có frame > 50ms khi xoay liên tục.

## 9. Câu hỏi còn mở (Open Questions)

Các câu hỏi vòng trước đã chốt (lá cùng kích thước, góc bắt đầu ngẫu nhiên, có hiệu ứng trải bài, màn ngang thì cuộn trang, không rung) và đã đưa vào mục 4.1 / 5. Hiện không còn câu hỏi mở.
