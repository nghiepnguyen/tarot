import { test, expect, passwordResetLinkFor, signUpVerifyAndLogIn, uniqueEmail } from "./fixtures";

const OLD_PASSWORD = "password123";
const NEW_PASSWORD = "password456";

test("a forgotten password can be reset from the login page", async ({ page }) => {
  const email = uniqueEmail("e2e-reset");
  await signUpVerifyAndLogIn(page, { name: "Người Quên Mật Khẩu", email, password: OLD_PASSWORD });

  await page.getByRole("button", { name: "Người Quên Mật Khẩu" }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();

  await page.goto("/login");
  await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
  await expect(page).toHaveURL("/forgot-password");

  // Câu trả lời cố tình mơ hồ: nó không nói địa chỉ này có tài khoản hay không.
  await page.getByLabel("Email đã đăng ký").fill(email);
  await page.getByRole("button", { name: "Gửi link đặt lại" }).click();
  await expect(page.getByRole("status")).toContainText("Nếu địa chỉ này có tài khoản");

  const link = await passwordResetLinkFor(email);
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Đặt mật khẩu mới" })).toBeVisible();

  // Gõ lệch hai ô thì không được đi tiếp.
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu mới").fill("password789");
  await page.getByRole("button", { name: "Đặt mật khẩu mới" }).click();
  await expect(page.getByText("Mật khẩu nhập lại không khớp.")).toBeVisible();

  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu mới").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Đặt mật khẩu mới" }).click();

  await expect(page).toHaveURL(/\/login\?reset=1/);
  await expect(page.getByRole("status")).toContainText("Mật khẩu đã được đổi");

  // Mật khẩu cũ chết theo.
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Người Quên Mật Khẩu" })).toBeVisible();

  // Link dùng một lần: mở lại đưa thẳng vào đường xin link mới.
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Link không dùng được" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gửi link đặt lại" })).toBeVisible();
});
