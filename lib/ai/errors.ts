/**
 * Thiếu API key của nhà cung cấp đang chọn.
 *
 * Tách khỏi `lib/ai/gemini.ts` từ lúc có nhà cung cấp thứ hai: thông điệp phải
 * gọi đúng tên biến môi trường còn thiếu, không thì người vừa đổi model sang
 * Claude lại đi tìm `GEMINI_API_KEY`. Đây là lỗi duy nhất được hiện nguyên văn
 * cho người dùng cuối (xem `app/actions/ai.ts`), nên câu chữ phải đọc được.
 */
export class MissingApiKeyError extends Error {
  constructor(public readonly envVar: string) {
    super(`${envVar} chưa được cấu hình.`);
    this.name = "MissingApiKeyError";
  }
}
