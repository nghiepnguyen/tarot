import * as Sentry from "@sentry/nextjs";

export interface CronMonitorConfig {
  /** Tên monitor trong Sentry. Đặt tay, không lấy theo đường dẫn. */
  monitorSlug: string;
  /** Lịch crontab, phải khớp `vercel.json` để Sentry biết khi nào là trễ. */
  schedule: string;
  /**
   * Múi giờ của lịch, dạng tz database. Vercel Cron luôn hiểu `schedule` theo
   * UTC. Không truyền thì Sentry hiện "At 20:00 (undefined)" và người đọc phải
   * tự đoán — nó đoán đúng UTC, nhưng đoán ngầm thì sớm muộn cũng có người
   * đoán ra giờ Việt Nam.
   */
  timezone: string;
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
 * Chờ gửi check-in đóng tối đa bấy nhiêu. Cộng vào thời gian chạy của route,
 * nên phải nằm gọn trong phần còn thừa của `maxDuration` sau ngân sách job.
 */
const CHECK_IN_FLUSH_TIMEOUT_MS = 2000;

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
 *
 * Check-in đóng phải được flush trước khi trả về. `captureCheckIn` chỉ xếp
 * hàng một request gửi đi; bản build Turbopack không bọc route handler bằng
 * `wrapRouteHandlerWithSentry`, nên sau khi response đi rồi không ai flush hộ.
 * Vercel đóng băng function ngay khi trả response, request `ok` chết giữa
 * đường, và Sentry chỉ thấy `in_progress` rồi báo "A timeout check-in was
 * detected" cho một lượt chạy hoàn toàn bình thường.
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
    timezone: config.timezone,
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
  } finally {
    // Không throw: flush hết giờ thì trả `false`, và kết quả của job vẫn phải
    // tới tay người gọi dù Sentry có chậm.
    await Sentry.flush(CHECK_IN_FLUSH_TIMEOUT_MS);
  }
}
