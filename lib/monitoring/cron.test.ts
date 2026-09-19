import { afterEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { withCronCheckIn } from "./cron";

vi.mock("@sentry/nextjs", () => ({
  captureCheckIn: vi.fn(() => "checkin_1"),
}));

const CONFIG = {
  monitorSlug: "reconcile-orders",
  schedule: "0 20 * * *",
  maxRuntimeMinutes: 5,
  checkinMarginMinutes: 60,
};

const captureCheckIn = vi.mocked(Sentry.captureCheckIn);

afterEach(() => {
  captureCheckIn.mockClear();
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

  it("passes the schedule so Sentry knows when a run is late", async () => {
    await withCronCheckIn(CONFIG, async () => null, { isVercel: true });

    expect(captureCheckIn.mock.calls[0]?.[1]).toEqual({
      schedule: { type: "crontab", value: "0 20 * * *" },
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

  it("stays out of the real monitor when not running on Vercel", async () => {
    const result = await withCronCheckIn(CONFIG, async () => "local", { isVercel: false });

    expect(result).toBe("local");
    expect(captureCheckIn).not.toHaveBeenCalled();
  });
});
