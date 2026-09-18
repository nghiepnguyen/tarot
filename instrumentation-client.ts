import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/monitoring/sentry";

Sentry.init({
  ...sharedSentryOptions,
});

// Cho Sentry biết điều hướng client-side bắt đầu, nếu không mọi span navigation
// của App Router đều thiếu điểm bắt đầu.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
