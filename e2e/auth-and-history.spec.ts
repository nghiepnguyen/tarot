import { test, expect, pickCards, signUpVerifyAndLogIn, uniqueEmail, verificationLinkFor } from "./fixtures";

test("signup requires email verification before the account can be used", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Chờ Xác Nhận");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();

  // Đăng ký không còn tạo phiên đăng nhập: tài khoản tồn tại nhưng chưa dùng được.
  // Địa chỉ e2e là @example.com nên Resend từ chối gửi; trang có hai đầu ra
  // ("kiểm tra hộp thư" và "chưa gửi được"), cả hai đều đưa ra nút gửi lại.
  await expect(page).toHaveURL(/\/verify-email\/sent/);
  await expect(page.getByRole("button", { name: "Gửi lại email xác nhận" })).toBeVisible();

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Tài khoản chưa được xác nhận.", { exact: false })).toBeVisible();

  // Bấm link trong email mới là bước hoàn tất.
  await page.goto(await verificationLinkFor(email));
  await expect(page.getByRole("status")).toContainText("Email đã được xác nhận");

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Người Chờ Xác Nhận" }).click();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
});

test("an expired or replaced link offers a way to get a new one", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill("Người Link Hỏng");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await expect(page).toHaveURL(/\/verify-email\/sent/);

  const stale = await verificationLinkFor(email);
  // Cấp link thứ hai; link đầu phải chết theo, nếu không thì một email cũ rò
  // rỉ vẫn kích hoạt được tài khoản.
  await verificationLinkFor(email);

  await page.goto(stale);
  await expect(page.getByRole("heading", { name: "Link không dùng được" })).toBeVisible();

  await page.getByLabel("Email đã đăng ký").fill(email);
  await page.getByRole("button", { name: "Gửi lại email xác nhận" }).click();
  // Cùng lý do: không khẳng định thư tới nơi, chỉ khẳng định action đã chạy
  // hết và trả về một trong hai kết cục của nó.
  await expect(
    page.getByText(/Đã gửi lại email xác nhận|Chưa gửi được email lúc này/),
  ).toBeVisible();
});

test("a verified account can reveal a reading and find it in history", async ({ page }) => {
  await signUpVerifyAndLogIn(page, { name: "Người Dùng Thử", email: uniqueEmail() });

  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên tập trung vào điều gì?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  await pickCards(page);
  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await expect(page.getByRole("button", { name: "Trải bài mới" })).toBeVisible();

  await page.goto("/history");
  await expect(page.getByText("Tôi nên tập trung vào điều gì?").first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Xóa toàn bộ lịch sử" }).click();
  await expect(
    page.getByText("Bạn chưa có lần trải bài nào được lưu."),
  ).toBeVisible();
});

test("wrong password on login shows an error", async ({ page }) => {
  const email = uniqueEmail();
  await signUpVerifyAndLogIn(page, { name: "Người Dùng Thử 2", email });

  await page.getByRole("button", { name: "Người Dùng Thử 2" }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(
    page.locator("header").getByRole("link", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
});
