import { test, expect } from "@playwright/test";
import type { UnlockResult } from "../../app/actions/ai";
const available: UnlockResult = { ok: false, code: "available", retryable: true, error: "Chưa mở khóa" };
const refunded: UnlockResult = { ok: false, code: "refunded", retryable: true, error: "Credit đã được hoàn" };
const pending = (code: string): UnlockResult => ({ ok: false, code, retryable: false, error: `Trạng thái ${code}` });
const saved: UnlockResult = { ok: true, data: { id: "saved-row", overview: "Bài đã lưu", perCard: [], connections: "Liên hệ", actionSuggestions: ["Hành động cũ"], reflectiveQuestion: "Câu hỏi?" } };
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.unlockFixture = { statuses: [], unlocks: [], credits: 20, statusCalls: 0, unlockCalls: 0, creditCalls: 0 }; });
});
for (const code of ["processing", "recovery_pending", "reconciliation_required", "completed_unavailable"]) {
  test(`${code} allows status checking but never another unlock`, async ({ page }) => {
    await page.addInitScript(value => { window.unlockFixture.statuses = [value]; }, pending(code));
    await page.goto("/test/unlock-ui/index.html");
    await expect(page.getByText(`Trạng thái ${code}`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Mở khóa|Thử lại/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Kiểm tra trạng thái" }).click();
    expect(await page.evaluate(() => window.unlockFixture.unlockCalls)).toBe(0);
  });
}
test("reload/status can recover a saved result without generation", async ({ page }) => {
  await page.addInitScript(value => { window.unlockFixture.statuses = [value]; }, saved);
  await page.goto("/test/unlock-ui/index.html");
  await expect(page.getByText("Bài đã lưu")).toBeVisible();
  await page.reload(); await expect(page.getByText("Hành động cũ")).toBeVisible();
  expect(await page.evaluate(() => window.unlockFixture.unlockCalls)).toBe(0);
});
test("lost unlock response blocks paid retry until server confirms refund", async ({ page }) => {
  await page.addInitScript(value => { window.unlockFixture.statuses = [value]; window.unlockFixture.unlocks = ["throw"]; }, available);
  await page.goto("/test/unlock-ui/index.html");
  await page.getByRole("button", { name: /Mở khóa diễn giải/ }).click();
  await expect(page.getByRole("button", { name: "Kiểm tra trạng thái" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mở khóa|Thử lại/ })).toHaveCount(0);
  await page.evaluate(value => { window.unlockFixture.statuses = [value]; window.unlockFixture.credits = 20; }, refunded);
  await page.getByRole("button", { name: "Kiểm tra trạng thái" }).click();
  await expect(page.getByText("Credit đã được hoàn")).toBeVisible();
  await expect(page.getByRole("button", { name: /Mở khóa diễn giải/ })).toBeVisible();
  expect(await page.evaluate(() => window.unlockFixture.unlockCalls)).toBe(1);
  expect(await page.evaluate(() => window.unlockFixture.creditCalls)).toBeGreaterThanOrEqual(3);
});
test("failed initial status is handled without offering unlock", async ({ page }) => {
  await page.addInitScript(() => { window.unlockFixture.statuses = ["throw"]; });
  await page.goto("/test/unlock-ui/index.html");
  await expect(page.getByRole("button", { name: "Kiểm tra trạng thái" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mở khóa|Thử lại/ })).toHaveCount(0);
});
test("success refreshes credits from server", async ({ page }) => {
  await page.addInitScript(values => { window.unlockFixture.statuses = [values.available]; window.unlockFixture.unlocks = [values.saved]; }, { available, saved });
  await page.goto("/test/unlock-ui/index.html");
  await page.getByRole("button", { name: /Mở khóa diễn giải/ }).click();
  await expect(page.getByText("Bài đã lưu")).toBeVisible();
  expect(await page.evaluate(() => window.unlockFixture.creditCalls)).toBeGreaterThanOrEqual(2);
});

for (const blockedStorage of [false, true]) {
  test(`save retry keeps one operation identity, storage blocked=${blockedStorage}`, async ({ page }) => {
    await page.addInitScript(blocked => {
      window.saveFixture = { fail: true, calls: [] };
      const pending = JSON.stringify({ question: "Khôi phục bài", cards: ["the-fool", "the-magician", "the-high-priestess"].map((cardId, i) => ({ cardId, orientation: "upright", position: ["Bối cảnh", "Hiện tại", "Hướng đi"][i] })) });
      if (!sessionStorage.getItem("tarot:pendingReading")) sessionStorage.setItem("tarot:pendingReading", pending);
      if (blocked) Storage.prototype.setItem = () => { throw new Error("Storage disabled"); };
    }, blockedStorage);
    await page.goto("/test/unlock-ui/index.html?save=1");
    await expect(page.getByText("failed", { exact: true })).toBeVisible();
    const original = await page.evaluate(() => window.saveFixture.calls[0]);
    expect(original).toMatch(/^[0-9a-f-]{36}$/);
    if (!blockedStorage) {
      expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("tarot:pendingReading")!).requestId)).toBe(original);
      await page.reload();
      await expect(page.getByText("failed", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => window.saveFixture.calls[0])).toBe(original);
    }
    await page.evaluate(() => { window.saveFixture.fail = false; });
    await page.getByRole("button", { name: "Retry save" }).click();
    await expect(page.getByText(`Saved: ${original}`)).toBeVisible();
    expect(await page.evaluate(() => window.saveFixture.calls)).toEqual([original, original]);
  });
}

test("uncoded status errors never authorize a paid retry", async ({ page }) => {
  await page.addInitScript(() => { window.unlockFixture.statuses = [{ ok: false, error: "Vui lòng đăng nhập" }]; });
  await page.goto("/test/unlock-ui/index.html");
  await expect(page.getByText("Vui lòng đăng nhập")).toBeVisible();
  await expect(page.getByRole("button", { name: /Mở khóa|Thử lại/ })).toHaveCount(0);
});
test("initial reconciliation finishes before the credit balance is read", async ({ page }) => {
  await page.addInitScript(value => { window.unlockFixture.statuses = [value]; window.unlockFixture.credits = 0; window.unlockFixture.afterStatusCredits = 20; }, refunded);
  await page.goto("/test/unlock-ui/index.html");
  await expect(page.getByText("Credit đã được hoàn")).toBeVisible();
  await expect(page.getByRole("button", { name: /Mở khóa diễn giải/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nạp thêm/ })).toHaveCount(0);
});
test("deferred reveal is one save and cannot restore a reset reading", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => { window.saveFixture = { fail: false, hold: true, calls: [] }; sessionStorage.removeItem("tarot:pendingReading"); });
  await page.goto("/test/unlock-ui/index.html?save=1");
  await page.getByLabel("Câu hỏi của bạn").fill("Một lượt mới");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  for (const i of [0, 1, 2]) await page.getByRole("button", { name: `Pick ${i}` }).click();
  await page.getByRole("button", { name: "Mở lá bài" }).evaluate(element => { (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click(); });
  expect(await page.evaluate(() => window.saveFixture.calls.length)).toBe(1);
  await page.getByRole("button", { name: "Reset reading" }).click();
  await page.evaluate(() => window.saveFixture.release?.());
  await expect(page.getByLabel("Câu hỏi của bạn")).toBeVisible();
  await expect(page.getByText(/^Saved:/)).toHaveCount(0);
});
