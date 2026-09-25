// Tách khỏi `app/actions/readings.ts`: file "use server" chỉ được export hàm
// async, nên hằng số phía client cần đọc phải sống ở đây.
export const SAVE_READING_LIMIT_PER_HOUR = 30;
