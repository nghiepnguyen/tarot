import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

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

  _experimental: {
    // Tạo cron monitor cho job khai trong vercel.json. Bản `webpack.
    // automaticVercelMonitors` không dùng được: nó bọc lúc build bằng loader
    // của webpack, mà Next 16 build bằng Turbopack, và nó cũng không hỗ trợ
    // route handler của App Router — đúng loại route mà cron đang dùng. Bản
    // này chạy lúc runtime dựa trên span nên không vướng cả hai.
    vercelCronsMonitoring: true,
  },

  silent: !process.env.CI,
  telemetry: false,
});
