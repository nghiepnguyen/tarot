import * as Sentry from "@sentry/nextjs";

export interface CronMonitorConfig {
  /** Tên monitor trong Sentry. Đặt tay, không lấy theo đường dẫn. */
  monitorSlug: string;
  /** Lịch crontab, phải khớp `vercel.json` để Sentry biết khi nào là trễ. */
  schedule: string;
  /** Phút. Quá số này mà chưa đóng check-in thì Sentry coi là treo. */
  maxRuntimeMinutes: number;
  /**
   * Phút. Cron trên gói Hobby của Vercel không chạy đúng phút đã khai — nó
   * được kích trong khoảng một giờ quanh mốc. Biên hẹp hơn thế thì Sentry báo
   * "missed" gần như mỗi ngày và cảnh báo thành tiếng ồn.
   */
  checkinMarginMinutes: number;
}

/**
 * Chạy một cron job và báo check-in cho Sentry.
 *
 * Gọi thẳng `captureCheckIn` thay vì dùng `_experimental.vercelCronsMonitoring`
 * của SDK. Bản tự động có bốn điều kiện ngầm, trượt cái nào cũng im lặng:
 * config phải được inject vào `globalThis` lúc build, header `user-agent` phải
 * chứa `vercel-cron`, đường dẫn phải khớp `vercel.json`, và check-in bám vào
 * root span — mà span ở production chỉ được lấy mẫu 10%, nên với một job chạy
 * mỗi ngày thì phần lớn lượt chạy không sinh check-in nào.
 *
 * Bỏ qua khi không chạy trên Vercel, để `pnpm dev` và test không ghi vào
 * monitor thật. `captureCheckIn` tự no-op khi Sentry chưa bật (thiếu DSN).
 *
 * Lỗi được đóng check-in bằng `error` rồi ném lại: người gọi vẫn thấy lỗi như
 * thường, Sentry chỉ biết thêm rằng lượt chạy này hỏng.
 */
export async function withCronCheckIn<T>(
  config: CronMonitorConfig,
  run: () => Promise<T>,
  options: { isVercel?: boolean } = {},
): Promise<T> {
  const isVercel = options.isVercel ?? Boolean(process.env.VERCEL);
  if (!isVercel) return run();

  const monitorConfig = {
    schedule: { type: "crontab" as const, value: config.schedule },
    maxRuntime: config.maxRuntimeMinutes,
    checkinMargin: config.checkinMarginMinutes,
  };

  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: config.monitorSlug, status: "in_progress" },
    monitorConfig,
  );

  try {
    const result = await run();
    Sentry.captureCheckIn(
      { checkInId, monitorSlug: config.monitorSlug, status: "ok" },
      monitorConfig,
    );
    return result;
  } catch (error) {
    Sentry.captureCheckIn(
      { checkInId, monitorSlug: config.monitorSlug, status: "error" },
      monitorConfig,
    );
    throw error;
  }
}
