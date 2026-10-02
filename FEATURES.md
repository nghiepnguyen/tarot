# Features

## Phase 0 — Foundation

- Thiết lập project Next.js + TypeScript.
- Xây dựng design token: màu, typography, spacing, border, shadow và motion.
- Responsive layout cho mobile, tablet và desktop.
- Thiết lập bộ component cơ bản: Button, Input, Card, Modal, Toast, Section và Header.
- Thiết lập logging, error state, loading state và empty state.
- Chuẩn bị nội dung pháp lý: disclaimer tarot, điều khoản, riêng tư và chính sách hoàn tiền.
- Kênh liên hệ hỗ trợ (`SUPPORT_EMAIL` trong `lib/seo/site.ts`): hiện ở footer, ba trang chính sách, và màn hình khi đơn thanh toán chưa chốt.

## Phase 1 — MVP trải nghiệm bốc bài

### Home

- Hero section với tiêu đề ngắn, mô tả giá trị và CTA.
- Ô nhập câu hỏi có placeholder và giới hạn ký tự.
- Gợi ý câu hỏi theo chủ đề: tình yêu, công việc, tài chính, phát triển bản thân.
- Nút “Bốc 3 lá bài”.
- Bộ bài hiển thị dạng vòng cung ở bên dưới màn hình, chỉ để trang trí.
- Bước bốc bài xếp 78 lá thành một vòng tròn khép kín, tâm nằm dưới đáy màn hình nên chỉ lộ cung phía trên (khoảng 13 lá trên điện thoại, 17 lá trên desktop). Không dùng một vòng cung trải phẳng: 78 lá như vậy rộng tới ~3600px, kéo mãi không tới hai đầu.
  - Xoay bằng lăn chuột/trackpad (trang không cuộn theo), kéo/vuốt có quán tính rồi dừng đúng một lá, phím ←/→, hoặc nút ‹ ›. Trên điện thoại, vuốt dọc vẫn cuộn trang.
  - Mỗi lần bốc, vòng mở ở một lá ngẫu nhiên và xoè ra từ đỉnh cung.
  - Chạm lá nào đang lộ cũng được: lá bay lên ô Bối cảnh / Hiện tại / Hướng đi kế tiếp, vòng khép lại chỗ trống. Chạm ô để trả lá về, các ô sau dồn lên.
  - Điện thoại dọc: tiêu đề, 3 ô và vòng bài vừa một màn hình phía trên thanh nút. Điện thoại ngang: giữ nguyên kích thước, trang cuộn.
  - Hình học vòng bài nằm ở `lib/tarot/wheel.ts` (hàm thuần, có unit test), component ở `components/tarot/CardWheel.tsx`. Spec: [tasks/prd-circular-card-wheel.md](tasks/prd-circular-card-wheel.md).
- Hiệu ứng hover/focus nhẹ, hỗ trợ keyboard và reduced motion.

### Trải bài

- Chọn ngẫu nhiên ba lá không trùng nhau.
- Hiển thị ba vị trí theo cấu trúc: Bối cảnh, Hiện tại, Hướng đi.
- Hỗ trợ trạng thái lá bài xuôi/ngược nếu sản phẩm quyết định dùng.
- Animation lật bài theo từng bước.
- Animation xáo bài (~3 giây, hai lượt riffle rồi cắt bài) sau khi bấm "Bốc 3 lá bài", có nút bỏ qua; tự bỏ qua khi người dùng bật `prefers-reduced-motion`.
- Hiển thị tên, hình ảnh, từ khóa và ý nghĩa cơ bản.
- Hiển thị lại câu hỏi để người dùng duy trì ngữ cảnh.
- Nút thực hiện trải bài mới.
- Ghi chú nhỏ dưới nút "Bốc 3 lá bài" nhắc đăng nhập để dùng diễn giải chuyên sâu.
- Người dùng chưa đăng nhập vẫn bốc bài và xem 3 lá bình thường; câu hỏi và 3 lá được giữ lại (sessionStorage) qua lúc đăng nhập/đăng ký, tự khôi phục và mở khóa ngay sau khi đăng nhập thành công thay vì bắt bốc lại.

### Nội dung và an toàn

- Disclaimer rằng kết quả mang tính tham khảo và tự phản tỉnh.
- Không đưa ra tuyên bố tuyệt đối về sức khỏe, pháp lý, tài chính hoặc tương lai.
- Xử lý lỗi khi câu hỏi trống, request thất bại hoặc người dùng rời trang.

## Phase 2 — Tài khoản và lịch sử

- Đăng ký, đăng nhập và đăng xuất. Đăng ký phải xác nhận email: tài khoản chưa bấm link trong thư thì chưa đăng nhập được và chưa có credit.
- Đăng nhập bằng tài khoản Google. Email trùng thì gắn vào tài khoản sẵn có, không đẻ tài khoản thứ hai; người mới được tặng credit dùng thử ngay, không phải qua bước xác nhận email.
- Quên mật khẩu: nhận link đặt lại qua email, link sống 1 giờ và dùng một lần. Đổi mật khẩu xong thì mọi thiết bị đang đăng nhập bị đăng xuất trong vòng 5 phút.
- Lưu lịch sử các lần trải bài.
- Xem lại câu hỏi, ba lá bài và diễn giải cơ bản.
- Xóa một reading hoặc xóa toàn bộ lịch sử.
- Hồ sơ người dùng. Sản phẩm chỉ phục vụ tiếng Việt, không làm đa ngôn ngữ.
- Rate limit và chống spam theo tài khoản/IP.

## Phase 3 — VIP và AI

- Hiển thị phần AI bị khóa sau phần diễn giải cơ bản.
- Mô tả rõ quyền lợi và giá trước khi thanh toán.
- Tặng 2 lượt xem miễn phí khi xác nhận email (one-time), sau đó nạp credit theo gói (5/10/20/50 lượt) qua PayOS — chưa có gói VIP theo tháng ở giai đoạn này.
- Ghi sổ giao dịch credit (free grant, mua, chi tiêu, hoàn tiền) để đo tỷ lệ free-to-paid.
- Mỗi lượt sinh AI lưu lại token input, output, thinking và thời gian phản hồi, nên chi phí thật đo được bằng một câu SQL thay vì đoán. Cột nullable: row cũ và lượt sinh không có `usageMetadata` vẫn hợp lệ.
- Nạp credit có trang riêng `/credits`: vào từ badge số credit trên header, menu người dùng, nút ở hồ sơ, và CTA khi hết credit ở panel mở khóa AI.
- Đơn hàng được đối soát lại với PayOS ở bốn đường (webhook, trang trả về, lúc người dùng mở lại trang nạp, và cron mỗi ngày) nên webhook trượt không làm mất credit của người đã trả tiền; chi tiết ở `SETUP.md`. Cron chạy mỗi ngày vì gói Vercel Hobby từ chối deploy nếu lịch dày hơn.
- Số tiền PayOS báo phải khớp giá gói đã chốt lúc tạo đơn. Lệch thì không cộng credit và gửi email cảnh báo qua Resend, vì không đường tự động nào gỡ được tình huống đó.
- Hoàn tiền: tiền hoàn thủ công trên dashboard PayOS, credit thu hồi bằng nút trong `/admin/orders` hoặc `pnpm refund-order <orderId>`. Hai đường chạy chung một đoạn logic; đường qua web ký tên người bấm vào nhật ký quản trị.
- V5 (`v5-2026-10-02`) là bản đang chạy: giữ hợp đồng JSON của v4 nhưng chuyển sang evidence-first, mở bằng luận điểm trung tâm, phân vai rõ từng field và loại lời trấn an/sáo ngữ không có căn cứ. Validator ghi thêm cảnh báo văn phong nhưng không làm mất bài đọc. V4 và dữ liệu lịch sử giữ nguyên để rollback.
- Sinh diễn giải dài theo cấu trúc: tổng quan, từng lá, mối liên hệ, gợi ý hành động và câu hỏi tự phản tỉnh. Prompt yêu cầu giọng huyền bí và đặt mốc số từ cho từng phần. Bản `v2-2026-09-22` cắt ba phần dài nhất sau phản hồi rằng bản đọc dài đến mức người đọc bỏ giữa chừng: từng lá (Bối cảnh / Hiện tại / Hướng đi) từ 200–260 xuống 100–130 từ, tổng quan từ 250–320 xuống 175–225, mối liên hệ từ 200–260 xuống 140–180; các phần ngắn giữ nguyên mốc của v1.
- Benchmark v5 so trực tiếp v4 trên 36 ca giả lập, trong đó có 12 ca nhắm vào văn phong chung chung/thảo mai; script sinh thêm manifest chấm mù sáu tiêu chí. Kết quả API chưa được ghi nhận cho tới khi chạy bằng key nhà cung cấp; xem `docs/benchmarks/v5-2026-10-02.md`. Mốc v4 ngày 30/09/2026 là 9,43 giây và khoảng 159đ/lượt thành công trên 24 ca.
- Panel chưa mở khóa nêu hai đến ba nhận xét về chính trải bài vừa lật — bao nhiêu lá Ẩn Chính, có bộ nào chiếm đa số, lá nào ngược — để người đọc thấy trước bản chuyên sâu nói về cái gì. Dựng thẳng từ thuộc tính lá bài trong `lib/tarot/teaser.ts`, không gọi model: chỗ này đứng trước nút trả credit nên không được tốn tiền, và cùng một trải bài luôn cho cùng mấy dòng đó. Nó không nhắc lại ý nghĩa từng lá vì `FlipCard` đã in ngay phía trên; thứ nó nói là hình dạng của cả ba lá đặt cạnh nhau, đúng phần màn hình này còn thiếu.
- Hiển thị trạng thái đang tạo, retry và lỗi tạm thời. Vì 28 giây là quá lâu để nhìn một nút xám, panel đổi hẳn sang màn chờ có ba lưng bài thở lệch nhịp và năm dòng trạng thái xoay vòng; thanh tiến trình cố tình không hiện phần trăm vì model không trả tín hiệu tiến độ.
- Lưu kết quả AI theo reading ID để không tạo trùng.
- Không cho AI trình bày nội dung như lời khuyên chuyên môn hoặc lời tiên tri chắc chắn.

## Phase 4 — Tư vấn viên và đặt lịch

- Danh sách người tư vấn với ảnh, giới thiệu, chuyên môn, ngôn ngữ và giá.
- Lịch trống theo múi giờ người dùng.
- Chọn thời lượng và hình thức tư vấn.
- Đặt lịch, thanh toán và nhận email xác nhận.
- Nhắc lịch trước buổi hẹn.
- Quản lý hủy, đổi lịch và chính sách hoàn tiền.
- Khu vực tư vấn viên quản lý lịch và trạng thái booking.

## Phase 5 — Quản trị và tăng trưởng

- Phân quyền: `User.role` (`USER`/`ADMIN`), cấp bằng `pnpm grant-admin <email>` — không có đường nào trong giao diện nâng quyền. Quyền kiểm ở server qua `lib/auth/admin.ts`, đọc thẳng database chứ không tin token; không có quyền thì `/admin` trả 404 chứ không redirect. Bản cache trong JWT trễ tối đa 5 phút, chỉ dùng cho việc hiển thị link.
- Trang quản trị `/admin`: tổng quan, người dùng, đơn hàng, sổ credit, nhật ký, bộ bài. Cố tình không có `proxy.ts`: proxy chỉ đọc được JWT, mà JWT là bản cache, nên nó không thêm gì về an toàn và chỉ thêm một mặt phẳng dễ sai.
- Quản lý người dùng, credit và giao dịch: tra theo email, xem sổ và đơn của từng người, chỉnh credit tay (`ADMIN_ADJUST`), hoàn credit và đối soát lại đơn ngay trên trang. Mỗi thao tác bắt buộc ghi lý do và để lại một dòng `AdminAuditLog` trong cùng transaction với thứ nó mô tả. Quản lý booking chưa có vì Phase 4 chưa bắt đầu.
- CRUD bộ bài: chưa làm và chưa định làm. 78 lá nằm static trong `lib/tarot/cards.ts`, sửa nội dung vẫn đi qua code review và deploy; `/admin/deck` chỉ để tra cứu.
- Quản lý prompt template và phiên bản model AI: prompt nằm trong registry `lib/ai/prompts/`, mỗi bản là một file đóng băng gồm system instruction, cách dựng prompt, model mặc định và schema đi kèm. Bản đang chạy khai báo trong code (`ACTIVE_PROMPT_VERSION`), đổi prompt vẫn qua code review và deploy — cố tình không có ô sửa trên web, vì prompt cột chặt vào JSON schema gửi cho model và chứa cả ràng buộc an toàn. Mỗi lượt sinh ghi `AiInterpretation.promptVersion`, nên từ nay tách được chi phí và độ trễ của từng bản.
- Đổi model thì không cần deploy: `/admin/prompts` chọn model mặc định trong danh sách cho phép ở `lib/ai/models.ts` (hiện có `gemini-3.8-flash` và `deepseek-flash`), lưu vào `AppSetting` và ghi một dòng `AdminAuditLog` trong cùng transaction. Đổi model không đổi hợp đồng đầu ra — mọi lượt sinh đều parse lại bằng cùng `resultSchema`, dù DeepSeek chỉ có chế độ JSON tự do nên hình dạng do prompt giữ chứ không do API ép — nên đây là đường lùi trong vài phút khi một nhà cung cấp hỏng hoặc đội giá. Lượt đã sinh giữ nguyên model của chính nó, và `/admin/prompts` gom số đo theo cặp (prompt, model).
- Chấm mù hai model: `/admin/prompts` có thêm lựa chọn **Ngẫu nhiên** bên cạnh các model — mỗi lượt mở khóa bốc một model trong danh sách, xác suất đều, gieo một lần ngay trước khi trừ credit. Mỗi bản diễn giải ký tên bằng bút danh cố định của model (`AiModel.persona`: Gemini là **Minh Trí**, DeepSeek là **Duy Thâm**), hiện ở đầu bài dưới dạng `Tarot Reader: …`. Người đọc thấy bút danh chứ không thấy tên nhà cung cấp, nên điểm họ chấm là điểm chấm mù. Row `AiInterpretation` vẫn ghi model thật, nên không có gì trong dữ liệu bị mờ đi.
- Hộp chấm điểm cuối mỗi bản diễn giải: ba tiêu chí rời — Độ chính xác (Accuracy), Độ rõ ràng & Dễ hiểu (Clarity), Tính hữu ích & Giải pháp (Actionability) — mỗi tiêu chí 1–5 sao, kèm ô nhận xét tự do. Ba tiêu chí chấm rời vì một bài đọc rõ ràng mà không gợi được hành động nào là kết quả có thật, và một điểm tổng sẽ giấu mất điều đó. Chỉ chủ bài đọc chấm được (lọc theo `reading.userId` trong chính truy vấn), một bản diễn giải một đánh giá (`InterpretationReview.interpretationId` là `@unique`), nhưng sửa lại được — đường ghi là upsert. Mỗi lần gửi bắn một email về `thanhnghiep.top@gmail.com` kèm cả bút danh lẫn tên model thật, câu hỏi và id bài đọc; thư sửa có tiền tố `[Sửa]`. Email hỏng không làm hỏng lượt chấm: điểm đã nằm trong database trước khi thư được gửi.
- Giá token tra theo model trong `lib/ai/pricing.ts` chứ không còn là hai hằng số gắn cứng một model: đổi model mà quên khai giá thì `/admin` gọi thẳng số tiền đó là ước lượng và Sentry nhận một cảnh báo ngay lúc sinh, thay vì dashboard sai âm thầm.
- Trang `/admin/prompts`: cặp prompt và model đang chạy, số lượt / token trung bình / p50 / p95 / chi phí mỗi lượt theo từng bản prompt, số lượt được chấm và điểm trung bình ba tiêu chí theo đúng cặp (prompt, model) — số lượt chấm luôn hiện cạnh điểm, vì 5,0 sao trên một lượt và 4,1 sao trên hai trăm lượt nhìn giống hệt nhau nếu chỉ đọc con số trung bình, và xem được nguyên văn system instruction cùng một prompt mẫu dựng từ trải bài giả — không đọc câu hỏi thật của người dùng. Model đổi được ngay tại đây; đổi *bản prompt* thì chưa, lùi bản vẫn là sửa `ACTIVE_PROMPT_VERSION` rồi deploy.
- Khối **Đánh giá người đọc** trong `/admin/prompts` hiển thị riêng số lượt chấm và điểm trung bình độ chính xác, độ rõ ràng, tính hữu ích theo từng cặp prompt/model đã có lượt sinh. Khối nằm trước bảng số đo token, độ trễ và chi phí; cặp chưa có đánh giá hiện 0 lượt chấm và dấu **—** ở điểm. Điểm tính trên toàn bộ lịch sử, thang 1–5 sao, chỉ gồm những lượt đã chấm.
- Danh sách phiên bản prompt trong `/admin/prompts` được gom vào một khối **Các phiên bản prompt**, kèm tổng số bản. Mặc định tất cả thu gọn, mỗi dòng hiện ID, ngày phát hành và model mặc định của bản; bản đang chạy đứng đầu và có nhãn **Đang chạy**. Mở một bản sẽ thu bản đang mở trước đó, hiện ghi chú cùng hai mục **System instruction** và **Prompt mẫu** có thể mở riêng. Nội dung dài có vùng cuộn riêng, bố cục dòng tự xếp lại trên màn hình nhỏ.
- Dashboard conversion: `/admin` có doanh thu ròng, tỷ lệ chốt đơn, chi phí AI, phễu theo người (tài khoản → xác nhận email → bốc bài → mở khóa → trả tiền) và sổ credit theo loại, lọc 7/30/90 ngày. Mọi con số tiền lấy từ Postgres chứ không từ GA4, vì event `purchase` đếm thiếu đơn cứu ở đường đối soát. Phễu bắt đầu từ reading đã lưu: người chưa đăng nhập không vào database, đỉnh phễu ẩn danh chỉ xem được trên GA4. Bước đặt lịch chưa có vì Phase 4 chưa bắt đầu.
- A/B testing CTA, giá và nội dung paywall.
- SEO landing pages theo chủ đề câu hỏi.
- Error tracking: Sentry đã gắn cho cả ba runtime (browser, Node, Edge), kèm `error.tsx`/`global-error.tsx` và báo cáo cho những lỗi app tự xử lý xong — xem `MONITORING.md`. Event không mang cookie, body request, prompt AI hay biến cục bộ; người dùng chỉ đi kèm dưới dạng id.
- Analytics: GA4 đã gắn, phủ toàn bộ phễu bốc bài, mở khóa AI, thanh toán và tài khoản — xem `ANALYTICS.md`. Event không chứa câu hỏi, email hay tên người dùng. Có banner xin đồng ý chạy theo Consent Mode v2: chưa đồng ý thì không cookie phân tích nào được đặt và số liệu chỉ ở dạng ẩn danh; đổi lựa chọn qua “Tùy chọn cookie” ở chân trang.

## Việc tiếp theo

Xếp theo mức độ thiệt hại nếu không làm, không theo mức độ thú vị.

### 1. Không ai biết khi có chuyện

- **Kênh nhận thông báo từ Sentry.** Lỗi đã vào được Sentry, nhưng chưa ai xác nhận issue mới thì thông báo đi đâu. Alert rule mặc định gửi email cho thành viên project; nếu hộp thư đó không ai mở thì tình trạng vẫn là "không ai biết", chỉ khác chỗ chứa.
- **Cron monitor.** Đã bỏ `_experimental.vercelCronsMonitoring` và gọi thẳng `captureCheckIn` trong `lib/monitoring/cron.ts` — option experimental bám check-in vào root span, mà production chỉ lấy mẫu 10% trace, nên một job chạy mỗi ngày phần lớn lượt chạy không sinh check-in nào. Còn lại hai việc bằng tay: kiểm monitor `reconcile-orders` có nhận check-in sau lần deploy này chưa (cách kiểm ở `MONITORING.md`), và gắn alert rule cho nó — monitor mới không tự có.
- **Theo dõi cảnh báo thanh toán.** Email cảnh báo gửi về hộp thư hỗ trợ. Chưa có gì đảm bảo hộp thư đó được đọc trong ngày.

### 2. Vận hành đang phải làm tay

- **Biên nhận cho khách.** Mua xong không nhận được email nào. Resend đã tích hợp sẵn, phần thiếu là template và quyết định về hóa đơn.

### 3. Vùng chưa được test

- **E2E chưa chạm PayOS.** Test dừng ở nút thanh toán; toàn bộ phần sau — redirect, webhook, cộng credit — chỉ có unit test với PayOS giả. Cần môi trường sandbox của PayOS mới đi tiếp được.
- **Component chưa có test.** Vitest chỉ quét `lib/`. Panel chọn gói, banner đồng ý và các tracker chỉ được phủ gián tiếp qua e2e.
- **Ranh giới phân quyền chỉ có e2e.** `lib/auth/admin.ts`, `app/actions/admin.ts` và mọi trang `/admin` nằm ngoài tầm Vitest vì cần runtime của Next. `e2e/admin.spec.ts` là lớp phủ tự động duy nhất cho chúng, nên nó không phải test tùy chọn.

### Nợ chưa trả trong khu quản trị

- **Chỉ có một cấp quyền.** `ADMIN` làm được mọi thứ: xem sổ, chỉnh credit, hoàn đơn. Chưa tách quyền chỉ-đọc cho người trực hỗ trợ.
- **Dashboard quét tuần tự.** `Reading`, `AiInterpretation` và `CreditTransaction` không có index `createdAt` đứng riêng (`[userId, createdAt]` không phục vụ được range scan toàn cục). Vô hại ở quy mô hiện tại, nhưng đó là thứ đầu tiên phải thêm nếu `/admin` chậm.
- **Danh sách cắt cứng.** Đơn hàng, giao dịch và nhật ký chỉ hiện 50–100 dòng mới nhất, chưa phân trang như trang người dùng.

### 4. Nợ đã biết

- **Cron mỗi ngày trên Hobby.** Nếu lên Pro thì đổi `vercel.json` về `0 * * * *`, khe hở còn lại thu từ một ngày xuống một giờ.
- **Migration và deploy là hai việc rời nhau.** Luôn có cửa sổ production chạy code mới trên schema cũ. Cách khép hẳn đã ghi ở cuối mục "Cơ sở dữ liệu" trong `SETUP.md`.
- **`purchase` đếm thiếu.** Đơn cứu được ở đường đối soát thứ ba không bắn event. Sổ `CreditTransaction` mới là con số doanh thu đúng.
- **Free trial không có trần.** Mỗi tài khoản mới được 2 lượt miễn phí, nay tốn khoảng 730đ tiền API và không thu lại gì. Xác nhận email nâng giá của một lần lạm dụng lên một hộp thư thật, nhưng hộp thư thì miễn phí và vô hạn — không có gì chặn một người đăng ký email mới để lấy tiếp.
- **Model mặc định đã đổi sang Gemini 3.8 Flash ngày 30/09/2026.** `DEFAULT_AI_MODEL_ID` trong `lib/ai/models.ts` là mặc định khi chưa chọn model hoặc lựa chọn cũ đã bị gỡ; metadata của các prompt đã phát hành và giá của `gemini-3-flash-preview` vẫn giữ để đọc lịch sử. Giá Standard của `gemini-3.8-flash` đến 31/12/2026 là $0,75/1M input và $3,75/1M output (gồm thinking); từ 01/01/2027 tăng lên $1,50 và $7,50, cần cập nhật cách tính theo thời điểm phát sinh. Đã có benchmark 24 ca giả lập v3/v4 cho model mới trong `docs/benchmarks/v4-2026-09-30.md`; chưa có điểm chấm mù người dùng thật cho v4. Đường đo là chế độ chấm mù: bật **Ngẫu nhiên**, để người đọc thật chấm, rồi đọc điểm theo cặp (prompt, model) ở `/admin/prompts`. `deepseek-flash` vẫn chọn được; các số đo so sánh ngày 22/09/2026 là với Gemini cũ, không áp dụng cho 3.8. `claude-haiku-4-5-20251001` đã gỡ khỏi danh sách ngày 22/09/2026.

## Lưu trữ — không nằm trong kế hoạch

Ý tưởng đã cân nhắc rồi gác lại. Không làm cho đến khi có quyết định mới.

- Nghe diễn giải AI bằng text-to-speech. Ba hướng đã cân nhắc: Web Speech API của trình duyệt (miễn phí, không cần lưu trữ, nhưng giọng phụ thuộc thiết bị và nhiều trình duyệt không có giọng tiếng Việt); Gemini TTS rồi lưu file lên object storage theo reading ID (giọng đồng nhất, tốn phí API và cần thêm dịch vụ lưu trữ, file WAV của bài diễn giải dài lên tới vài MB); Gemini TTS stream trực tiếp không lưu (tốn phí mỗi lần nghe và chờ lâu mỗi lần phát).

## Tiêu chí MVP hoàn thành

- Người dùng có thể nhập câu hỏi và bốc đúng ba lá không trùng.
- Màn hình bốc bài dùng tốt trên cả mobile và desktop, không phải kéo ngang lê thê.
- Kết quả có trạng thái loading, success và error rõ ràng.
- Mỗi lá có tên, hình ảnh và diễn giải cơ bản.
- Paywall AI hiển thị minh bạch; free trial và nạp credit qua thanh toán thật (PayOS) đã hoạt động.
- Có disclaimer và xử lý dữ liệu tối thiểu an toàn.

- V4 ghi số đo từng lần gọi vào `AiGenerationMetric` (kể cả lỗi), chỉ metadata và số cảnh báo; `/admin/prompts` hiển thị lỗi JSON/schema, vị trí, nhà cung cấp và cảnh báo độ dài/lặp. Số đo tự động không đánh giá tính đúng đắn ngữ nghĩa.
