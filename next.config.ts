import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tracer kéo nguyên thư mục `@prisma/client/runtime` vào từng function, gồm
  // bản wasm của cả năm loại database (~60MB) chỉ dùng cho driver adapter hoặc
  // edge. App chạy library engine trên Node nên không đụng tới file nào trong
  // số này. Bắt đầu dùng driver adapter (vd. `@prisma/adapter-neon`) thì phải
  // bỏ dòng wasm ra.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/*.wasm-base64.*",
      "node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/*.map",
      "node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.wasm",
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Nhúng metadata vào từng module của mình để `thirdPartyErrorFilterIntegration`
  // trong instrumentation-client.ts nhận ra frame nào là code của app. Đổi chuỗi
  // này thì phải đổi `filterKeys` bên đó theo. Option top-level, không phải
  // `webpack.moduleMetadata` (đã deprecated): Next 16 build bằng Turbopack và
  // bản top-level chạy cho cả hai bundler.
  applicationKey: "tarot-web",

  // Không có token thì bỏ hẳn bước upload source map thay vì để plugin cảnh
  // báo giữa build: người khác clone repo về vẫn build được, chỉ là stack
  // trace trong Sentry còn ở dạng đã minify.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    // Upload xong thì xoá file .map khỏi output, không để lộ source ra public.
    deleteSourcemapsAfterUpload: true,
  },

  // Gửi event qua chính domain của app: uBlock và các bộ lọc quảng cáo chặn
  // thẳng request tới ingest.sentry.io, mất đúng lỗi của nhóm người dùng cài
  // chặn. Đổi lại mỗi event tốn một lượt gọi function trên Vercel. Route này
  // bị chặn trong app/robots.ts.
  tunnelRoute: "/monitoring",

  // Không bật `_experimental.vercelCronsMonitoring`. Nó có bốn điều kiện ngầm
  // và trượt cái nào cũng im lặng — nặng nhất là check-in bám vào root span,
  // mà `tracesSampleRate` ở production là 0.1, nên một job chạy mỗi ngày phần
  // lớn lượt chạy không sinh check-in nào. Cron monitor giờ gọi thẳng
  // `captureCheckIn` trong `lib/monitoring/cron.ts`.
  //
  // Cũng không dùng `webpack.automaticVercelMonitors`: nó bọc lúc build bằng
  // loader của webpack, mà Next 16 build bằng Turbopack, và nó không hỗ trợ
  // route handler của App Router.

  silent: !process.env.CI,
  telemetry: false,
});
