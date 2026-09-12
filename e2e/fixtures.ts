import { test as base, expect } from "@playwright/test";

/**
 * Banner cookie neo cố định ở đáy màn hình, che mất các nút nằm gần cuối trang
 * và làm Playwright báo element không nhận được pointer event. Ghi sẵn lựa
 * chọn vào localStorage trước khi trang chạy để banner không bao giờ hiện.
 * Test chạy với analytics tắt; các flow được kiểm thử không phụ thuộc vào nó.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("tarot:analyticsConsent", "denied");
    });
    await use(page);
  },
});

export { expect };
