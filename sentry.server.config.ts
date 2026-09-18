import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/monitoring/sentry";

// Nạp từ `register()` trong instrumentation.ts khi chạy runtime Node.
Sentry.init({
  ...sharedSentryOptions,
});
