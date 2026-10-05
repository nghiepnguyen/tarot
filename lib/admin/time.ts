/**
 * Mọi mốc giờ trong admin đọc theo giờ Việt Nam. Server trên Vercel chạy UTC,
 * nên `toLocaleString("vi-VN")` không kèm `timeZone` in ra giờ UTC — một đơn
 * trả lúc 8 giờ sáng hiện thành 1 giờ sáng.
 */
export const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Việt Nam không có giờ mùa hè, nên độ lệch cố định. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const vnDateTimeParts = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * `dd/mm/yyyy HH:mm`, ngày trước giờ. Mặc định của vi-VN đặt giờ lên trước
 * ("06:40:53 6/10/2026"), nên cột thời gian trong bảng không quét theo ngày
 * được và độ dài mỗi dòng mỗi khác.
 */
export function formatVnDateTime(value: Date): string {
  const part = Object.fromEntries(vnDateTimeParts.formatToParts(value).map((p) => [p.type, p.value]));
  return `${part.day}/${part.month}/${part.year} ${part.hour}:${part.minute}`;
}

export const formatVnDate = (value: Date) =>
  value.toLocaleDateString("vi-VN", { timeZone: VN_TIME_ZONE });

/**
 * Nửa đêm giờ Việt Nam của ngày cách hôm nay `days - 1` ngày. "7 ngày" là hôm
 * nay cộng sáu ngày trước theo lịch Việt Nam, không phải 168 giờ trượt: số liệu
 * không đổi theo giờ mở trang, và ranh giới ngày khớp với ngày ghi trên bảng.
 */
export function vnStartOfDaysAgo(days: number, now: Date): Date {
  const vnMidnightToday = Math.floor((now.getTime() + VN_OFFSET_MS) / DAY_MS) * DAY_MS - VN_OFFSET_MS;
  return new Date(vnMidnightToday - (days - 1) * DAY_MS);
}
