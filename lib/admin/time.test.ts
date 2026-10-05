import { describe, expect, it } from "vitest";
import { formatVnDate, formatVnDateTime, vnStartOfDaysAgo } from "./time";

describe("vnStartOfDaysAgo", () => {
  it("lấy nửa đêm giờ Việt Nam của hôm nay khi days = 1", () => {
    // 02:00 giờ VN ngày 6/10 = 19:00 UTC ngày 5/10.
    const now = new Date("2026-10-05T19:00:00Z");
    expect(vnStartOfDaysAgo(1, now).toISOString()).toBe("2026-10-05T17:00:00.000Z");
  });

  it("lùi đủ days - 1 ngày lịch", () => {
    const now = new Date("2026-10-06T10:00:00Z");
    expect(vnStartOfDaysAgo(7, now).toISOString()).toBe("2026-09-29T17:00:00.000Z");
  });

  it("đúng nửa đêm VN vẫn tính là ngày mới", () => {
    const now = new Date("2026-10-05T17:00:00Z");
    expect(vnStartOfDaysAgo(1, now).toISOString()).toBe("2026-10-05T17:00:00.000Z");
  });
});

describe("format", () => {
  it("in theo giờ Việt Nam bất kể TZ của server", () => {
    const value = new Date("2026-10-05T19:30:00Z");
    expect(formatVnDate(value)).toBe("6/10/2026");
    expect(formatVnDateTime(value)).toBe("06/10/2026 02:30");
  });
});
