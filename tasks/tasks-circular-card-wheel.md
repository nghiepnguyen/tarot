# Tasks: Vòng bài tròn để bóc bài (Circular Card Wheel)

Nguồn: [prd-circular-card-wheel.md](prd-circular-card-wheel.md). Số "YC n" trong task là số yêu cầu chức năng trong PRD.

## Relevant Files

- `lib/tarot/wheel.ts` - (mới) Hàm thuần tính hình học vòng bài: góc, toạ độ, snap, virtualization, góc ngẫu nhiên, đổi px sang độ. Không import React.
- `lib/tarot/wheel.test.ts` - (mới) Unit test vitest cho `wheel.ts`.
- `components/tarot/CardWheel.tsx` - (mới) Component vòng bài tương tác + 3 ô vị trí.
- `components/tarot/ArcDeck.tsx` - Thay `CardCarousel` bằng `CardWheel` khi `interactive`; giữ `CardFan` và `useBreakout`.
- `components/tarot/TarotExperience.tsx` - Màn `picking`: bố cục mới, truyền props; `handleSelectSlot` / `handleReveal` giữ nguyên logic.
- `components/tarot/CardBack.tsx` - Dùng lại `CardFace` / `CardBack` cho mặt lưng lá (chỉ đọc, không sửa).
- `lib/tarot/draw.ts` - Lấy `SPREAD_POSITIONS` ("Bối cảnh", "Hiện tại", "Hướng đi") và `DECK_SPREAD_SIZE` (chỉ đọc).
- `lib/analytics/gtag.ts` - `trackEvent` dùng cho event mới `deck_rotate` (chỉ đọc).
- `e2e/reading-flow.spec.ts` - Luồng chọn 3 lá chính; cập nhật nếu cần và thêm case mới.
- `e2e/ai-unlock.spec.ts`, `e2e/auth-and-history.spec.ts` - Cũng click `/^Chọn lá thứ/` với `.nth(0..2)`; phải vẫn chạy được.
- `e2e/card-wheel.spec.ts` - (mới) E2E riêng cho vòng bài: xoay, bàn phím, trả lá, mobile.
- `playwright.config.ts` - Thêm project mobile (vd `devices["iPhone 13"]`) nếu chạy e2e mobile.

### Notes

- Unit test chỉ chạy được cho file trong `lib/**/*.test.ts` (xem `vitest.config.mts`, môi trường `node`, không có DOM). Vì vậy mọi phép tính phải nằm trong `lib/tarot/wheel.ts`; component chỉ gọi lại.
- Chạy unit test: `pnpm test` (hoặc `pnpm test lib/tarot/wheel.test.ts`). E2E: `pnpm test:e2e`. Lint: `pnpm lint`. Typecheck: `pnpm exec tsc --noEmit`.
- Project dùng Next 16.3 và framer-motion 13 — đọc `node_modules/next/dist/docs/` trước khi đụng phần Next; kiểm tra API framer-motion (`animate`, `useMotionValue`, `inertia`, `layoutId`) trong `node_modules/framer-motion` thay vì đoán theo phiên bản cũ.
- Không tắt server `pnpm dev` đang chạy của người khác; nếu cần server riêng thì chạy port khác.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [x]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [x] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Tạo feature branch
  - [x] 0.1 Từ `main` mới nhất, tạo và checkout branch: `git checkout -b feature/circular-card-wheel`

- [x] 1.0 Viết module hình học vòng bài thuần (`lib/tarot/wheel.ts`) + unit test
  - [x] 1.1 Tạo `lib/tarot/wheel.ts` với hằng số: `CARD_RATIO = 1.57`, kích thước lá mobile/PC, số lá lộ mục tiêu (mobile 9–13, PC 15–21), breakpoint `640`, ngưỡng tap/kéo `6px`, số lá đệm virtualization `2`.
  - [x] 1.2 Viết `computeWheelLayout(viewportWidth)` trả về `{ cardWidth, cardHeight, radius, visibleCount, visibleArcDeg }`. Bán kính tính sao cho số lá lộ trong chiều rộng viewport rơi vào khoảng mục tiêu (YC 4). Làm tròn số trả về 2 chữ số thập phân.
  - [x] 1.3 Viết `stepDeg(n)` = `360 / n` và `baseAngle(k, n)` = `k * 360 / n` (YC 1).
  - [x] 1.4 Viết `normalizeAngle(deg)` đưa góc về khoảng `[-180, 180)` — dùng cho vòng lặp vô hạn (YC 7).
  - [x] 1.5 Viết `cardTransform(angleDeg, radius)` trả về `{ x, y, rotate }` với `x = R·sin θ`, `y = R·(1 − cos θ)` tính từ đỉnh vòng, `rotate = θ` (YC 3). Làm tròn để tránh lệch hydration.
  - [x] 1.6 Viết `visibleCards(n, rotationDeg, visibleArcDeg, buffer)` trả về danh sách `k` có góc `normalizeAngle(baseAngle(k, n) + rotation)` nằm trong nửa cung lộ + đệm (YC 6).
  - [x] 1.7 Viết `snapRotation(deg, n)` làm tròn góc về bội số gần nhất của `stepDeg(n)` (YC 17).
  - [x] 1.8 Viết `randomStartRotation(n, random = Math.random)` trả về một bội số ngẫu nhiên của `stepDeg(n)`; nhận `random` làm tham số để test được (YC 9).
  - [x] 1.9 Viết `pxToDeg(px, radius)` (= `px / radius` rad, đổi sang độ) và `normalizeWheelDelta(event-like { deltaX, deltaY, deltaMode })` đổi line/page sang px, lấy trục có trị tuyệt đối lớn hơn (YC 12, 13).
  - [x] 1.10 Viết `rotationToCenter(k, n, currentRotation)` trả về góc xoay gần nhất (đi đường ngắn nhất quanh vòng) để lá `k` nằm ở đỉnh — dùng cho phím mũi tên và khi vòng dàn lại.
  - [x] 1.11 Tạo `lib/tarot/wheel.test.ts`: test từng hàm ở trên, gồm các case biên — `n = 78, 77, 75`, góc qua điểm nối 180°/-180°, viewport 320px / 390px / 1440px, `snapRotation` với số âm, `rotationToCenter` chọn chiều ngắn hơn, `randomStartRotation` với `random = () => 0` và `() => 0.999`.
  - [x] 1.12 Chạy `pnpm test lib/tarot/wheel.test.ts`, tất cả pass.

- [x] 2.0 Dựng component `CardWheel`: bố cục, virtualization, góc ngẫu nhiên, hiệu ứng trải bài
  - [x] 2.1 Tạo `components/tarot/CardWheel.tsx` (`"use client"`), nhận props giống `ArcDeckProps`: `size`, `selectedSlots`, `onSelectSlot`.
  - [x] 2.2 Dùng lại `useBreakout` (export nó từ `ArcDeck.tsx` hoặc chuyển sang file chung) để vùng vòng tràn full chiều ngang viewport; vùng vòng có `overflow: hidden`, `self-start` (YC 5).
  - [x] 2.3 Chỉ tính layout sau khi đo được viewport ở client (giống `useBreakout`); trước đó render placeholder cùng chiều cao để không nhảy layout.
  - [x] 2.4 Tạo danh sách lá còn trên vòng: `remaining = [0..size-1]` bỏ các index trong `selectedSlots`, giữ thứ tự index gốc. Lá thứ `k` trong `remaining` có `baseAngle(k, remaining.length)` (YC 22, 24).
  - [x] 2.5 Lưu góc xoay bằng `useMotionValue(0)` — **không** dùng `useState` cho góc (Technical Considerations).
  - [x] 2.6 Virtualization: subscribe `rotation.on("change")`, tính `visibleCards(...)`; chỉ `setState` danh sách lá hiển thị khi tập lá thay đổi (không phải mỗi frame). Mỗi lá hiển thị tự tính transform từ `rotation` qua `useTransform` + `cardTransform` (YC 6).
  - [x] 2.7 Định vị lá bằng `transform` (không dùng `left/top`), thêm `will-change: transform`; điểm neo của vòng là đỉnh cung ở giữa ngang, tâm vòng nằm dưới mép dưới vùng vòng (YC 2, 3).
  - [x] 2.8 Mỗi lá là `<button>` bọc `CardFace` / `CardBack`, cùng kích thước (YC 8), `aria-label="Chọn lá thứ N"` với N = index gốc + 1 (YC 34).
  - [x] 2.9 Góc ngẫu nhiên: trong `useEffect` lúc mount, `rotation.set(randomStartRotation(size))`; chỉ chạy một lần mỗi phiên picking (YC 9).
  - [x] 2.10 Hiệu ứng trải bài: lúc mount, các lá hiển thị bắt đầu ở đỉnh cung (góc 0) rồi xoè ra góc của mình, stagger theo khoảng cách tới giữa, tổng ≤ 0.6s. Trong lúc chạy, đặt cờ `isDealing` để chặn xoay và chọn lá (YC 10).
  - [x] 2.11 Kiểm tra bằng mắt ở viewport 375px và 1440px: vòng khép kín, lá hướng ra ngoài, số lá lộ đúng khoảng mục tiêu, không có lá "nhảy" khi đi qua điểm nối.

- [ ] 3.0 Thêm tương tác xoay
  - [x] 3.1 Wheel: gắn `addEventListener("wheel", handler, { passive: false })` trên vùng vòng trong `useEffect` (không dùng prop `onWheel`). Handler gọi `preventDefault`, cộng `pxToDeg(normalizeWheelDelta(e), radius)` vào `rotation` (YC 12).
  - [x] 3.2 Sau khi wheel ngừng ~150ms (debounce), animate `rotation` tới `snapRotation(...)` (YC 17).
  - [x] 3.3 Kéo/vuốt: dùng Pointer Events (`onPointerDown/Move/Up/Cancel`) trên vùng vòng, `setPointerCapture` khi đã vượt ngưỡng kéo. Đặt `touch-action: pan-y` để vuốt dọc vẫn cuộn trang (YC 13, 14).
  - [x] 3.4 Trong lúc kéo: cập nhật `rotation` theo `pxToDeg(Δx, radius)` để lá dưới ngón tay đi theo ngón tay; ghi lại vận tốc (độ/giây) từ vài sự kiện gần nhất.
  - [x] 3.5 Khi thả: gọi `animate(rotation, ..., { type: "inertia", velocity, power, timeConstant, modifyTarget: (t) => snapRotation(t, n) })` của framer-motion. Dừng animation đang chạy khi người dùng chạm/kéo lại (YC 13, 17).
  - [x] 3.6 Phân biệt tap với kéo: nếu con trỏ di chuyển > 6px thì đánh dấu là kéo và chặn `click` của lá khi thả tay (YC 18).
  - [x] 3.7 Nút xoay: thêm 2 nút `ChevronLeft` / `ChevronRight` (`lucide-react`) ở hai bên vòng, vùng bấm ≥ 44×44px, `aria-label` "Xoay bài sang trái" / "Xoay bài sang phải". Mỗi lần bấm animate `rotation` thêm ±`round(visibleCount / 2) * stepDeg(n)` (YC 16).
  - [x] 3.8 Bàn phím: roving tabindex — giữ `focusedIndex` (index gốc) trong state; chỉ lá đó có `tabIndex=0`. `←`/`→` đổi sang lá kế bên trong `remaining`, animate tới `rotationToCenter(...)` rồi `focus()` lá đó. `Enter`/`Space` dùng click mặc định của `<button>` (YC 15, 33).
  - [x] 3.9 Event `deck_rotate`: dùng `useRef` cờ "đã bắn"; lần xoay đầu tiên trong phiên picking gọi `trackEvent("deck_rotate", { method })` với `method` là `"wheel" | "drag" | "keyboard" | "button"` (YC 31).
  - [x] 3.10 Gợi ý "Vuốt hoặc cuộn để xoay bài" dưới vòng, ẩn sau lần xoay đầu tiên (dùng chung cờ ở 3.9).
  - [x] 3.11 Chặn mọi cách xoay khi `isDealing` còn `true` (YC 10).
  - [ ] 3.12 _(Đã kiểm tự động: lăn chuột, kéo chuột, phím, nút. Còn thiếu: trackpad và vuốt trên điện thoại thật.)_ Kiểm tra thủ công: chuột lăn, trackpad vuốt 2 ngón (ngang và dọc), kéo chuột, vuốt trên điện thoại thật / DevTools device mode, phím mũi tên, nút ‹ ›. Trang không bị cuộn khi lăn chuột trên vòng; vuốt dọc trên mobile vẫn cuộn trang.

- [x] 4.0 Bóc lá và 3 ô vị trí
  - [x] 4.1 Render 3 ô phía trên vòng theo `SPREAD_POSITIONS` từ `lib/tarot/draw.ts`. Ô trống: khung viền nét đứt + nhãn; ô có lá: mặt lưng lá (`CardFace`), không lật (YC 25, 26).
  - [x] 4.2 Ô `i` hiển thị lá `selectedSlots[i]` — thứ tự ô chính là thứ tự trong `selectedSlots`, nên dồn ô tự đúng khi bỏ chọn (YC 27).
  - [x] 4.3 Tap lá trên vòng gọi `onSelectSlot(index gốc)` — không cần lá ở giữa (YC 19). Không gọi khi đang kéo (3.6) hoặc `isDealing`.
  - [x] 4.4 Hiệu ứng bay lá: bọc lá trên vòng và lá trong ô bằng `motion.div` cùng `layoutId={\`card-${index}\`}` trong một `LayoutGroup`, để framer-motion tự animate lá từ vòng lên ô và ngược lại (YC 21, 27). Lưu ý: lá có thể đang bị virtualization bỏ khỏi DOM khi trả về — chấp nhận lá bay về giữa cung rồi vòng dàn lại.
    - _Đã làm khác:_ `layoutId` trên mọi lá của vòng bắt framer đo layout mỗi lần vòng render, nên bay lá dùng FLIP thủ công (ghi vị trí lá lúc bấm, lá mới animate từ đó). `layoutId` chỉ dùng cho lá trong 3 ô để dồn ô.
  - [x] 4.5 Vòng khép lại: khi `remaining.length` đổi, giữ lá đang ở đỉnh cung đứng yên bằng cách tính lại `rotation` tương ứng với `n` mới (dùng `rotationToCenter`), rồi animate các lá tới góc mới (YC 22).
  - [x] 4.6 Hover (PC, `@media (hover: hover)`): nhấc lá ra ngoài theo hướng bán kính vài px (dịch theo trục của lá sau khi đã xoay, vd `translateY(-8px)` ở lớp con bên trong) (YC 20).
  - [x] 4.7 Khi `selectedSlots.length >= 3`: các lá còn lại `disabled`, mờ đi (`opacity-50`), không hover; vòng vẫn xoay được (YC 23).
  - [x] 4.8 Ô có lá là `<button>` với `aria-label="<Tên vị trí>: đã chọn, bấm để bỏ chọn"`, bấm gọi `onSelectSlot(selectedSlots[i])`. Ô trống là phần tử không bấm được với `aria-label="<Tên vị trí>: chưa chọn"` (YC 27, 28).
  - [x] 4.9 Kiểm tra: chọn 3 lá → 3 ô đầy theo thứ tự; bỏ ô 1 → lá ô 2, 3 dồn lên; vòng từ 78 → 75 → 76 lá dàn đều, không có khoảng trống.

- [ ] 5.0 Gắn vào màn picking, bố cục responsive, reduced motion, accessibility
  - [x] 5.1 Trong `ArcDeck.tsx`, khi `interactive` thì render `CardWheel` thay cho `CardCarousel`; xoá `CardCarousel` và hằng số chỉ nó dùng. Giữ nguyên `CardFan` (Non-Goals).
  - [x] 5.2 Trong `TarotExperience.tsx` (status `picking`): giữ tiêu đề, câu hỏi, `BottomBar`, 2 nút, dòng `aria-live` (YC 29). Không đổi logic `handleSelectSlot`, `handleReveal` (YC 24).
  - [x] 5.3 Bố cục mobile dọc: dùng flex cột chiều cao `100dvh` trừ `BottomBar`, vòng bài đặt sát phía trên `BottomBar`, 3 ô ở giữa; kiểm tra vừa một màn hình ở 375×667 (iPhone SE) và 390×844 (YC 30). Xem lại `pb-32` đang dùng để chừa chỗ `BottomBar`.
  - [x] 5.4 Màn ngang / chiều cao < 500px: giữ nguyên kích thước lá và vòng, bỏ ràng buộc `100dvh`, cho trang cuộn bình thường (YC 11). Test ở 844×390.
  - [x] 5.5 Reduced motion: khi `useReducedMotion()` là `true` — bỏ hiệu ứng trải bài (đặt thẳng vị trí cuối, `isDealing = false` ngay), thả kéo thì chỉ snap không quán tính, nút/phím xoay đặt `rotation.set(...)` thay vì animate, tắt animation `layoutId` (`transition={{ duration: 0 }}`) (YC 32).
  - [ ] 5.6 Accessibility: vùng vòng có `role="group"` + `aria-label="Vòng bài, dùng phím mũi tên để xoay"`; lá có `focus-visible:ring-2 focus-visible:ring-accent` (YC 33, 35). Kiểm tra bằng VoiceOver (macOS/iOS): đọc được tên lá, tên ô, dòng trạng thái.
  - [x] 5.7 Đảm bảo lá đang focus bằng bàn phím luôn nằm trong vùng render (không bị virtualization bỏ khỏi DOM, nếu không focus sẽ mất).
  - [x] 5.8 Kiểm tra hydration: mở trang ở `pnpm dev`, console không có cảnh báo hydration mismatch.

- [ ] 6.0 Kiểm thử và hoàn thiện
  - [ ] 6.1 _(3 spec đã chuyển sang helper `pickCards`; `reading-flow` đã pass. `ai-unlock` và `auth-and-history` chưa chạy vì cần Postgres local.)_ Chạy e2e hiện có (`reading-flow`, `ai-unlock`, `auth-and-history`). Các test đang click `deckButtons.nth(0..2)` — đảm bảo 3 nút đầu tiên trong DOM luôn nằm trong vùng lộ và click được sau khi hiệu ứng trải bài xong. Nếu không, sửa test để chờ hết hiệu ứng / chọn lá đang lộ, không nới lỏng yêu cầu.
  - [x] 6.2 Tạo `e2e/card-wheel.spec.ts`: (a) chọn 3 lá → 3 ô có `aria-label` "đã chọn"; (b) bỏ ô "Bối cảnh" → còn 2 ô đầy, ô "Hướng đi" trống; (c) focus vòng, bấm `ArrowRight` vài lần rồi `Enter` → 1 lá được chọn; (d) bấm nút "Xoay bài sang phải" → tập lá hiển thị thay đổi; (e) khi đủ 3 lá, lá trên vòng `disabled`.
  - [x] 6.3 Thêm project mobile vào `playwright.config.ts` (vd `devices["iPhone 13"]`) và chạy `card-wheel.spec.ts` + `reading-flow.spec.ts` trên cả desktop và mobile.
  - [x] 6.4 Hiệu năng: Chrome DevTools → Performance, CPU throttle 4×, xoay liên tục 5 giây; không có frame > 50ms. Nếu có, giảm số lá đệm hoặc bỏ bớt shadow/filter.
  - [x] 6.5 Chạy `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` — tất cả sạch.
  - [ ] 6.6 Thử trên máy thật: iPhone (Safari), Android (Chrome), Mac (trackpad + chuột), Windows/Chrome (chuột lăn). Ghi lại vấn đề nếu có.
  - [ ] 6.7 Tự review diff theo PRD (đối chiếu YC 1–35 và Non-Goals), rồi tạo PR vào `main`.
