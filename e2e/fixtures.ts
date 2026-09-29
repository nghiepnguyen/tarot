import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { test as base, expect, type Page } from "@playwright/test";
import { loadTestEnv } from "./env";

loadTestEnv();

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

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

/**
 * Cấp một link xác nhận dùng được, đi thẳng vào database.
 *
 * Link thật chỉ tồn tại trong email đã gửi đi, và bảng chỉ lưu bản băm nên
 * không đọc ngược ra được. Test tự phát token rồi ghi băm của nó vào — đường
 * `/verify-email` vẫn được đi qua đúng như người dùng thật, chỉ có bước hộp
 * thư là bị cắt.
 */
export async function verificationLinkFor(email: string): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`e2e: chưa có tài khoản ${email} để xác nhận.`);

    const token = randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return `/verify-email?token=${token}`;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cấp một link đặt lại mật khẩu dùng được, đi thẳng vào database. Cùng lý do
 * với `verificationLinkFor`: bảng chỉ lưu bản băm nên không đọc ngược ra được,
 * test tự phát token rồi ghi băm của nó vào.
 */
export async function passwordResetLinkFor(email: string): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`e2e: chưa có tài khoản ${email} để đặt lại mật khẩu.`);

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return `/reset-password?token=${token}`;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cấp quyền quản trị, đi thẳng vào database — đúng như `pnpm grant-admin` làm.
 * Không có đường nào trong giao diện nâng quyền, nên đây cũng là đường duy
 * nhất test có.
 */
export async function grantAdmin(email: string): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  } finally {
    await prisma.$disconnect();
  }
}

/** Nạp một đơn đã PAID thẳng vào database: e2e không bao giờ chạm PayOS. */
export async function seedPaidOrder(
  email: string,
  input: { amountVnd: number; creditsGranted: number },
): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`e2e: chưa có tài khoản ${email} để tạo đơn.`);

    const pkg = await prisma.creditPackage.findFirst({ orderBy: { sortOrder: "asc" } });
    if (!pkg) throw new Error("e2e: database chưa có gói credit nào, chạy seed trước.");

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        packageId: pkg.id,
        provider: "payos",
        providerOrderId: `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amountVnd: input.amountVnd,
        creditsGranted: input.creditsGranted,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: input.creditsGranted } },
    });
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        amount: input.creditsGranted,
        balanceAfter: user.credits + input.creditsGranted,
        relatedOrderId: order.id,
      },
    });

    return order.id;
  } finally {
    await prisma.$disconnect();
  }
}

export interface SignUpInput {
  name: string;
  email: string;
  password?: string;
}

/**
 * Đăng ký, xác nhận email, rồi đăng nhập — trạng thái khởi đầu của gần như mọi
 * test khác. Đăng ký một mình không còn tạo ra phiên đăng nhập nào.
 */
export async function signUpVerifyAndLogIn(page: Page, input: SignUpInput) {
  const password = input.password ?? "password123";

  await page.goto("/signup");
  await page.getByPlaceholder("Tên hiển thị").fill(input.name);
  await page.getByPlaceholder("Email").fill(input.email);
  await page.getByPlaceholder("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/verify-email\/sent/);

  await page.goto(await verificationLinkFor(input.email));
  await expect(page).toHaveURL(/\/login\?/);

  await page.getByPlaceholder("Email").fill(input.email);
  await page.getByPlaceholder("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  // AuthSuccessTracker xoá `?auth=login` khỏi thanh địa chỉ ngay sau khi về.
  await expect(page).toHaveURL("/");
}

/**
 * Bốc `count` lá bằng cách chạm vào lá đang nằm ở đỉnh vòng bài, như người
 * dùng thật. Không click theo thứ tự DOM được: vòng chỉ render các lá quanh
 * đỉnh cung, và lá đầu tiên trong DOM có thể đang ở mép vòng, bị lá bên cạnh
 * đè lên hoặc nằm dưới mép cắt của khung.
 */
export async function pickCards(page: Page, count = 3) {
  const cards = page.getByRole("button", { name: /^Chọn lá thứ/ });
  // Lá bị khoá trong lúc trải bài; chờ trải xong mới chạm.
  await expect(cards.first()).toBeEnabled();
  const wheel = page.getByRole("group", { name: /^Vòng bài/ });
  const box = await wheel.boundingBox();
  if (!box) throw new Error("Không thấy vòng bài");
  const point = { x: box.x + box.width / 2, y: box.y + 60 };
  for (let i = 1; i <= count; i += 1) {
    // Lá vừa bốc để lại một khoảng trống ở đỉnh cho tới khi vòng khép lại.
    await page.waitForFunction(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.closest('button[aria-label^="Chọn lá thứ"]:not([disabled])') != null,
      point,
    );
    await page.mouse.click(point.x, point.y);
    await expect(page.getByText(new RegExp(i === 3 ? "Đã chọn đủ 3 lá" : `Đã chọn ${i}/3`))).toBeVisible();
  }
}
