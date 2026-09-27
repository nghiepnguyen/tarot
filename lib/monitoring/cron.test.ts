import { afterEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { withCronCheckIn } from "./cron";

vi.mock("@sentry/nextjs", () => ({
  captureCheckIn: vi.fn(() => "checkin_1"),
  flush: vi.fn(async () => true),
}));

const CONFIG = {
  monitorSlug: "reconcile-orders",
  schedule: "0 20 * * *",
  timezone: "UTC",
  maxRuntimeMinutes: 5,
  checkinMarginMinutes: 60,
};

const captureCheckIn = vi.mocked(Sentry.captureCheckIn);
const flush = vi.mocked(Sentry.flush);

afterEach(() => {
  captureCheckIn.mockClear();
  flush.mockClear();
});

describe("withCronCheckIn", () => {
  it("brackets a successful run with in_progress and ok", async () => {
    const result = await withCronCheckIn(CONFIG, async () => "done", { isVercel: true });

    expect(result).toBe("done");
    expect(captureCheckIn).toHaveBeenCalledTimes(2);
    expect(captureCheckIn.mock.calls[0]?.[0]).toEqual({
      monitorSlug: "reconcile-orders",
      status: "in_progress",
    });
    expect(captureCheckIn.mock.calls[1]?.[0]).toEqual({
      checkInId: "checkin_1",
      monitorSlug: "reconcile-orders",
      status: "ok",
    });
  });

  // Thiếu timezone thì Sentry hiện "At 20:00 (undefined)" và người đọc phải tự
  // đoán lịch là giờ nào.
  it("passes the schedule and its timezone so Sentry knows when a run is late", async () => {
    await withCronCheckIn(CONFIG, async () => null, { isVercel: true });

    expect(captureCheckIn.mock.calls[0]?.[1]).toEqual({
      schedule: { type: "crontab", value: "0 20 * * *" },
      timezone: "UTC",
      maxRuntime: 5,
      checkinMargin: 60,
    });
  });

  it("closes the check-in as error and rethrows, so the caller still sees the failure", async () => {
    const boom = new Error("PayOS timeout");

    await expect(
      withCronCheckIn(
        CONFIG,
        async () => {
          throw boom;
        },
        { isVercel: true },
      ),
    ).rejects.toThrow(boom);

    expect(captureCheckIn.mock.calls[1]?.[0]).toEqual({
      checkInId: "checkin_1",
      monitorSlug: "reconcile-orders",
      status: "error",
    });
  });

  // Route Turbopack không được Sentry bọc, nên không ai flush sau khi response
  // đi. Không flush thì Vercel đóng băng function trước khi check-in đóng tới
  // Sentry, và lượt chạy tốt hiện ra là timeout.
  it("flushes the closing check-in before returning", async () => {
    let flushedAfterClose = false;
    flush.mockImplementationOnce(async () => {
      flushedAfterClose = captureCheckIn.mock.calls.length === 2;
      return true;
    });

    await withCronCheckIn(CONFIG, async () => "done", { isVercel: true });

    expect(flush).toHaveBeenCalledTimes(1);
    expect(flushedAfterClose).toBe(true);
  });

  it("flushes the error check-in too before rethrowing", async () => {
    await expect(
      withCronCheckIn(
        CONFIG,
        async () => {
          throw new Error("boom");
        },
        { isVercel: true },
      ),
    ).rejects.toThrow("boom");

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("stays out of the real monitor when not running on Vercel", async () => {
    const result = await withCronCheckIn(CONFIG, async () => "local", { isVercel: false });

    expect(result).toBe("local");
    expect(captureCheckIn).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });
});
