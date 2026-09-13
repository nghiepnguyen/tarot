import { test, expect } from "./fixtures";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page) {
  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Mua Thử");
  await page.getByPlaceholder("Email").fill(uniqueEmail());
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL("/");
}

/**
 * Khu vực nạp tiền từng chỉ là một lưới nút trần: không nói credit dùng để làm
 * gì, không nói bấm vào thì chuyện gì xảy ra, và nếu database không có gói nào
 * thì render ra một khoảng trống im lặng. Test này giữ cho nó không quay lại
 * như cũ.
 */
test("the profile page explains how topping up works before asking for money", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Nạp thêm credit" })).toBeVisible();
  await expect(page.getByText("Mỗi lượt diễn giải chuyên sâu tốn 10 credit")).toBeVisible();

  // Ba bước phải có mặt: người dùng cần biết mình sắp bị đưa sang PayOS.
  await expect(page.getByText("Trang thanh toán PayOS mở ra")).toBeVisible();
  await expect(page.getByText("credit cộng vào trong vòng vài giây")).toBeVisible();

  // Lối thoát khi tiền đã trừ mà credit chưa về.
  await expect(
    page.getByRole("link", { name: "thanhnghiep.top@gmail.com" }).first(),
  ).toBeVisible();
});

test("each package shows what it costs per unlock, not just a total price", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/profile");

  const starter = page.getByRole("button", { name: /Khởi động/ });
  await expect(starter).toBeVisible();
  // 19.000đ cho 50 credit = 5 lượt, tức 3.800đ mỗi lượt. Con số này là thứ duy
  // nhất cho phép so sánh bốn gói với nhau.
  await expect(starter).toContainText("5 lượt · 50 credit");
  await expect(starter).toContainText("19.000đ");
  await expect(starter).toContainText("3.800đ/lượt");

  // Gói lớn nhất phải khoe phần tiết kiệm, nếu không thì không ai có lý do mua nó.
  await expect(page.getByRole("button", { name: /Sâu sắc/ })).toContainText("tiết kiệm");
});

test("a new account starts with its free trial credits", async ({ page }) => {
  await signUp(page);
  await page.goto("/profile");

  await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();
  await expect(page.getByText("(20 credit)")).toBeVisible();
});
