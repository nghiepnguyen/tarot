import type { Page } from "@playwright/test";
import {
  test,
  expect,
  grantAdmin,
  seedPaidOrder,
  signUpVerifyAndLogIn,
  uniqueEmail,
} from "./fixtures";

/**
 * Cả file dùng chung một tài khoản, cùng lý do với `topup.spec.ts`:
 * `signupAction` chặn 10 lượt mỗi IP mỗi giờ.
 *
 * Đây là lớp phủ tự động duy nhất cho ranh giới phân quyền: guard, server
 * action và trang đều nằm ngoài tầm Vitest (chỉ quét `lib/**`).
 */
test.describe.configure({ mode: "serial" });

let page: Page;
const email = uniqueEmail("admin");
const NAME = "Người Quản Trị";
const PASSWORD = "password123";

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem("tarot:analyticsConsent", "denied");
  });

  await signUpVerifyAndLogIn(page, { name: NAME, email });
});

test.afterAll(async () => {
  await page.close();
});

async function logInAgain() {
  await page.goto("/");
  await page.getByRole("button", { name: NAME }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
}

test("an ordinary logged-in account cannot even tell that /admin exists", async () => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);

  const users = await page.goto("/admin/users");
  expect(users?.status()).toBe(404);
});

/**
 * Quyền cấp sau khi đăng nhập không có trong token đang cầm. Vòng đối chiếu
 * database trong `auth.ts` đóng khoảng đó trong vòng năm phút; đăng nhập lại
 * thì có hiệu lực ngay. Test này vừa kiểm tra quyền, vừa là tài liệu chạy được
 * cho hành vi trễ đó.
 */
test("granting the role and logging back in opens the admin area", async () => {
  await grantAdmin(email);
  await logInAgain();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Tổng quan", level: 1 })).toBeVisible();

  // Dashboard phải nói rõ số của nó không phải số của GA4, nếu không sẽ có
  // người đối chiếu hai bên rồi mở bug.
  await expect(page.getByText(/không lấy từ GA4/)).toBeVisible();
});

test("the user menu carries a link into the admin area", async () => {
  await page.goto("/");
  await page.getByRole("button", { name: NAME }).click();
  await page.getByRole("link", { name: "Quản trị" }).click();
  await expect(page).toHaveURL("/admin");
});

test("adjusting credits by hand moves the balance, the ledger and the audit log together", async () => {
  await page.goto("/admin/users");
  await page.getByPlaceholder("Tìm theo email...").fill(email);
  await page.getByPlaceholder("Tìm theo email...").press("Enter");
  await page.getByRole("link", { name: email }).click();

  await expect(page.getByRole("heading", { name: email, level: 1 })).toBeVisible();

  await page.getByLabel("Số credit (số âm để trừ)").fill("30");
  await page.getByLabel("Lý do").fill("Bù cho ca hỗ trợ e2e");
  await page.getByRole("button", { name: "Chỉnh credit" }).click();

  // 20 credit tặng lúc xác nhận email, cộng thêm 30.
  await expect(page.getByText("Số dư mới: 50")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("cell", { name: "Chỉnh tay" }).first()).toBeVisible();

  // Nhật ký xếp mới nhất trước, và database local có thể còn dòng của lần chạy
  // trước, nên lấy dòng đầu.
  await page.goto("/admin/audit");
  const latest = page.getByRole("row").nth(1);
  await expect(latest).toContainText("Bù cho ca hỗ trợ e2e");
  await expect(latest).toContainText("Chỉnh credit");
  await expect(latest).toContainText(email);
});

/**
 * E2E không bao giờ đi qua PayOS, nên đơn PAID được nạp thẳng vào database.
 * Phần được kiểm ở đây là nửa sổ sách — đúng nửa mà nút trên web động tới.
 */
test("refunding an order from the UI reverses credits and says the money leg is still manual", async () => {
  await seedPaidOrder(email, { amountVnd: 19_000, creditsGranted: 50 });

  await page.goto("/admin/orders?status=PAID");
  // Database local có thể còn đơn của những lần chạy trước, nên bám vào đúng
  // dòng của tài khoản này thay vì dòng đầu bảng.
  const row = page.getByRole("row").filter({ hasText: email }).first();
  await row.locator("summary").click();

  await expect(row.getByText(/Tiền phải hoàn tay trên dashboard PayOS/)).toBeVisible();

  await row.getByPlaceholder("Lý do hoàn").fill("Khách báo trùng đơn");
  await row.getByRole("button", { name: "Xác nhận hoàn" }).click();

  // Thông báo sau khi hoàn phải nhắc lại chân tiền thủ công, đúng câu mà
  // `scripts/refund-order.ts` vẫn in ra.
  await expect(page.getByText(/Đã thu hồi 50 credit.*dashboard PayOS/)).toBeVisible();

  await page.goto("/admin/orders?status=REFUNDED");
  await expect(page.getByRole("cell", { name: email }).first()).toBeVisible();
});

test("the admin area stays out of the sitemap and inside robots' disallow list", async () => {
  const sitemap = await page.goto("/sitemap.xml");
  expect(await sitemap?.text()).not.toContain("/admin");

  const robots = await page.goto("/robots.txt");
  expect(await robots?.text()).toContain("Disallow: /admin");
});
