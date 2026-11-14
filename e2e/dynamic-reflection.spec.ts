import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { SPREAD_POSITIONS } from "../lib/tarot/draw";
import { test, expect, pickCards, uniqueEmail } from "./fixtures";

const question = "Tôi nên chuẩn bị gì cho buổi trao đổi về vai trò mới?";
const supportQuestion = "Tôi đang định tự làm hại mình ngay hôm nay.";
const cards = ["death", "the-tower", "the-star"].map((cardId, index) => ({
  cardId, position: SPREAD_POSITIONS[index], orientation: "upright",
}));

test("signed-in reflection restores, skips, falls back and ignores a delayed request", async ({ page, isMobile }) => {
  test.skip(process.env.TAROT_REFLECTION_ENABLED !== "1" || Boolean(process.env.GEMINI_API_KEY), "Cần bật phản tư và tắt Gemini trong Next dev.");
  const db = new PrismaClient();
  const password = "password123";
  const user = await db.user.create({
    data: { email: uniqueEmail("reflection"), passwordHash: await hash(password, 4), emailVerifiedAt: new Date() },
  });
  try {
    if (isMobile) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL("/");

    async function draw(prompt: string) {
      await page.getByLabel("Câu hỏi của bạn").fill(prompt);
      await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
      await pickCards(page);
      await page.getByRole("button", { name: "Mở lá bài" }).click();
      await expect(reset).toBeVisible();
    }

    const reflection = page.getByRole("region", { name: "Phản tư ngắn" });
    const create = reflection.getByRole("button", { name: "Tạo câu hỏi phản tư" });
    const next = reflection.getByRole("button", { name: "Tiếp tục xem bài" });
    const reset = page.getByRole("button", { name: "Trải bài mới" });
    const note = reflection.getByRole("textbox", { name: "Ghi chú phản tư (tùy chọn)" });
    let intercepted = 0;

    await page.evaluate(pending => sessionStorage.setItem("tarot:pendingReading", JSON.stringify(pending)), { question, cards });
    await page.reload();
    await expect(create).toBeVisible();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("tarot:pendingReading"))).toBeNull();
    let posts = 0;
    page.on("request", req => { if (req.headers()["next-action"]) posts++; });
    if (isMobile) await next.tap();
    else await next.press("Enter");
    await expect(page.locator("#reading-interpretation")).toBeFocused();
    expect(posts).toBe(0);
    await reset.click();

    await draw(question);
    // With the test server's empty API key, the real action returns fallback.
    const fallback = page.waitForResponse(async response =>
      Boolean(response.request().headers()["next-action"]) && (await response.text()).includes('"status":"fallback"'),
    );
    await create.click();
    const actionId = (await fallback).request().headers()["next-action"];
    expect(actionId).toBeTruthy();
    await expect(reflection.getByRole("status")).toContainText("Chưa tạo được");
    await reset.click();

    let release!: () => void;
    const delayed = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/*", async route => {
      if (route.request().method() !== "POST" || route.request().headers()["next-action"] !== actionId) return route.continue();
      intercepted++;
      await delayed;
      await route.continue();
    });

    try {
      await draw(question);
      await expect(note).toHaveAttribute("maxlength", "300");
      await note.fill("  Ghi chú của lượt trước  ");
      await note.press("Tab");
      await expect(note).toHaveValue("Ghi chú của lượt trước");
      await create.click();
      await expect.poll(() => intercepted).toBe(1);
      await expect(reflection.getByRole("button", { name: "Đang tạo câu hỏi…" })).toBeDisabled();
      await next.click();
      await expect(page.locator("#reading-interpretation")).toBeFocused();
      await reset.click();
      const response = page.waitForResponse(res => res.request().headers()["next-action"] === actionId);
      release();
      await response;
      await draw(question);
      await expect(note).toHaveValue("");
      await expect(create).toBeEnabled();
      await expect(reflection.getByRole("status")).toHaveCount(0);
    } finally {
      release();
    }

    await reset.click();
    await draw(supportQuestion);
    await expect(page.getByRole("status").filter({ hasText: "Ưu tiên an toàn lúc này" })).toBeVisible();
    await expect(reflection).toHaveCount(0);
    expect(intercepted).toBe(1);
    expect(await db.creditTransaction.count({ where: { userId: user.id } })).toBe(0);
  } finally {
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
