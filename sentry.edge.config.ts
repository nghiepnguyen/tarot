import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/monitoring/sentry";

// Edge runtime chạy trong isolate riêng nên phải init tách khỏi Node.
Sentry.init({
  ...sharedSentryOptions,
});
