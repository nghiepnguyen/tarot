import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test("signup logs the user in, and reveals a reading saves it to history", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Dùng Thử");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();

  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên tập trung vào điều gì?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  const deckButtons = page.getByRole("button", { name: /^Chọn lá thứ/ });
  await deckButtons.nth(0).click();
  await deckButtons.nth(1).click();
  await deckButtons.nth(2).click();
  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await expect(page.getByRole("button", { name: "Trải bài mới" })).toBeVisible();

  await page.goto("/history");
  await expect(page.getByText("Tôi nên tập trung vào điều gì?")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Xóa toàn bộ lịch sử" }).click();
  await expect(
    page.getByText("Bạn chưa có lần trải bài nào được lưu."),
  ).toBeVisible();
});

test("wrong password on login shows an error", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Dùng Thử 2");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
});
