import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Cả file dùng chung một tài khoản. `signupAction` chặn 5 lượt mỗi IP mỗi giờ,
 * và toàn bộ e2e chạy từ cùng một IP, nên mỗi test tự đăng ký một tài khoản là
 * cách chắc chắn làm suite tự chặn chính nó khi database không được dựng lại.
 */
test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  // Banner cookie neo ở đáy màn hình và che mất nút; fixture lo việc này cho
  // page mặc định, nhưng page ở đây do chính test tạo ra.
  await page.addInitScript(() => {
    window.localStorage.setItem("tarot:analyticsConsent", "denied");
  });

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Mua Thử");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL("/");
});

test.afterAll(async () => {
  await page.close();
});

test.beforeEach(async () => {
  await page.goto("/credits");
});

/**
 * Thẻ gói, tức cái label người dùng thật sự bấm vào. Input radio nằm dưới
 * `sr-only` để trình đọc màn hình và bàn phím dùng, nhưng nó bị cắt còn 1px
 * nên bấm thẳng vào đó không phải hành vi của người dùng.
 */
function packageCard(name: string) {
  return page.locator('label[for^="credit-package-"]').filter({ hasText: name });
}

/**
 * Khu vực nạp tiền từng chỉ là một lưới nút trần: không nói credit dùng để làm
 * gì, không nói bấm vào thì chuyện gì xảy ra, và nếu database không có gói nào
 * thì render ra một khoảng trống im lặng. Test này giữ cho nó không quay lại
 * như cũ.
 */
test("the credits page explains how topping up works before asking for money", async () => {
  await expect(page.getByRole("heading", { name: "Nạp credit", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chọn gói" })).toBeVisible();
  await expect(page.getByText("Mỗi lượt diễn giải chuyên sâu tốn 10 credit")).toBeVisible();

  // Ba bước phải có mặt: người dùng cần biết mình sắp bị đưa sang PayOS.
  await expect(page.getByText("Trang thanh toán PayOS mở ra")).toBeVisible();
  await expect(page.getByText("credit cộng vào trong vòng vài giây")).toBeVisible();

  // Lối thoát khi tiền đã trừ mà credit chưa về.
  await expect(
    page.getByRole("link", { name: "thanhnghiep.top@gmail.com" }).first(),
  ).toBeVisible();
});

test("each package shows what it costs per unlock, not just a total price", async () => {
  const starter = page.getByRole("radio", { name: /Khởi động/ });
  await expect(starter).toBeVisible();
  // 19.000đ cho 50 credit = 5 lượt, tức 3.800đ mỗi lượt. Con số này là thứ duy
  // nhất cho phép so sánh bốn gói với nhau.
  const starterCard = packageCard("Khởi động");
  await expect(starterCard).toContainText("5 lượt · 50 credit");
  await expect(starterCard).toContainText("19.000đ");
  await expect(starterCard).toContainText("3.800đ/lượt");

  // Gói lớn nhất phải khoe phần tiết kiệm, nếu không thì không ai có lý do mua nó.
  await expect(packageCard("Sâu sắc")).toContainText("tiết kiệm");
});

/**
 * Chọn gói và rời khỏi site để trả tiền là hai việc khác nhau. Trước đây một cú
 * bấm làm cả hai, nên chạm nhầm trên điện thoại là mất trang, và không ai kịp
 * so sánh bốn gói. Test này giữ cho bước chọn không bị gộp lại.
 */
test("picking a package does not immediately send you to the payment gateway", async () => {
  const checkout = page.getByRole("button", { name: /Chọn một gói để tiếp tục/ });
  await expect(checkout).toBeDisabled();

  await packageCard("Khởi động").click();

  await expect(page).toHaveURL("/credits");
  await expect(page.getByRole("radio", { name: /Khởi động/ })).toBeChecked();
  // Nút thanh toán giờ nói rõ sắp trừ bao nhiêu tiền.
  await expect(page.getByRole("button", { name: "Thanh toán 19.000đ" })).toBeEnabled();

  // Đổi ý được: chỉ một gói được chọn tại một thời điểm.
  await packageCard("Sâu sắc").click();
  await expect(page.getByRole("radio", { name: /Khởi động/ })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Thanh toán 149.000đ" })).toBeEnabled();
});

test("the package group is reachable and operable by keyboard alone", async () => {
  const first = page.getByRole("radio", { name: /Khởi động/ });
  await first.focus();
  await expect(first).toBeFocused();

  // Nhóm radio đi bằng phím mũi tên, không phải Tab từng cái một.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Phổ biến/ })).toBeChecked();
});

// Tài khoản dùng chung cả file này chưa mở khóa gì, nên số dư vẫn là phần tặng
// lúc đăng ký.
test("an account that has spent nothing still shows its free trial credits", async () => {
  await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();
  await expect(page.getByText("(20 credit)")).toBeVisible();
});

/**
 * Trang nạp tiền không nằm trong luồng nào cả nếu không có lối vào. Badge credit
 * ở header là lối ngắn nhất: người đang nhìn số dư chính là người sắp nghĩ tới
 * chuyện nạp thêm.
 */
test("the credit badge in the header opens the credits page", async () => {
  await page.goto("/");
  await page.getByRole("link", { name: /Nạp credit\. Bạn đang có \d+ credit/ }).click();
  await expect(page).toHaveURL("/credits");
  await expect(page.getByRole("heading", { name: "Nạp credit", level: 1 })).toBeVisible();
});

test("the user menu also reaches the credits page", async () => {
  await page.goto("/");
  await page.getByRole("button", { name: "Người Mua Thử" }).click();
  // `exact` là bắt buộc: badge ở header có nhãn "Nạp credit. Bạn đang có N
  // credit.", và mặc định Playwright khớp kiểu chứa nên trúng cả hai.
  await page.getByRole("link", { name: "Nạp credit", exact: true }).click();
  await expect(page).toHaveURL("/credits");
});

/**
 * Hồ sơ không còn khu vực chọn gói, nhưng vẫn phải cho người dùng đi tiếp —
 * nếu không thì tách trang chỉ làm họ mất đường.
 */
test("the profile page keeps the balance and a way through to topping up", async () => {
  await page.goto("/profile");
  await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Khởi động/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Nạp thêm credit" }).click();
  await expect(page).toHaveURL("/credits");
});
