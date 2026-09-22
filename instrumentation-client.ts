import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/monitoring/sentry";

Sentry.init({
  ...sharedSentryOptions,

  // Trình duyệt trong app Zalo (WKWebView trên iOS) tiêm một script inline vào
  // mọi trang nó mở, và script đó tham chiếu `zaloJSV2` trước khi biến này tồn
  // tại. Không sửa được từ phía mình — chỉ có cách bỏ qua. Bộ lọc bên dưới về
  // lý thuyết cũng bắt được, nhưng nó phụ thuộc vào việc frame có `filename`
  // kèm `lineno`/`colno`; một lỗi `onerror` không có stack sẽ lọt. Khớp thẳng
  // theo tên biến thì chắc chắn hơn.
  ignoreErrors: [/\bzaloJSV2\b/],

  // Extension của trình duyệt bọc `fetch` rồi ném lỗi trên mỗi response RSC
  // prefetch — nhiều nhất ở /admin vì nav ở đó có bảy <Link>. Stack của chúng
  // bị `rewriteFrames` gắn tiền tố `app:///` nên trông y hệt code của mình;
  // thứ duy nhất phân biệt được là metadata mà `applicationKey` trong
  // next.config.ts nhúng vào từng module, nên `filterKeys` phải khớp đúng khoá
  // đó. Mảng `integrations` cộng thêm vào bộ mặc định chứ không thay thế.
  integrations: [
    Sentry.thirdPartyErrorFilterIntegration({
      filterKeys: ["tarot-web"],
      behaviour: "drop-error-if-exclusively-contains-third-party-frames",
    }),
  ],
});

// Cho Sentry biết điều hướng client-side bắt đầu, nếu không mọi span navigation
// của App Router đều thiếu điểm bắt đầu.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
