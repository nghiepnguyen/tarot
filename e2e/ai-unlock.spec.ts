import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-ai-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test("unlocking AI without a configured API key shows a clear error with retry", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Dùng AI");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL("/");

  // Top up credits first so the failure we see is specifically the missing
  // API key, not "not enough credit".
  await page.goto("/profile");
  await page.getByRole("button", { name: /Nạp \d+ credit \(demo\)/ }).click();
  await expect(page.getByText("50", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên tập trung vào điều gì?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  const deckButtons = page.getByRole("button", { name: /^Chọn lá thứ/ });
  await deckButtons.nth(0).click();
  await deckButtons.nth(1).click();
  await deckButtons.nth(2).click();
  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await page.getByRole("button", { name: /Mở khóa diễn giải AI/ }).click();

  await expect(page.getByText("GEMINI_API_KEY chưa được cấu hình.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();

  // The failed generation should have refunded the credit spend.
  await page.goto("/profile");
  await expect(page.getByText("50", { exact: true })).toBeVisible();
});
