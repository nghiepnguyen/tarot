import type { Page } from "@playwright/test";
import { test, expect, pickCards } from "./fixtures";

async function openWheel(page: Page) {
  await page.goto("/");
  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên tập trung vào điều gì?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  await page.getByRole("button", { name: /Bỏ qua/ }).click();
  await expect(page.getByRole("heading", { name: "Chọn ba lá bài" })).toBeVisible();
  const cards = page.getByRole("button", { name: /^Chọn lá thứ/ });
  await expect(cards.first()).toBeEnabled();
  return cards;
}

// The one card in the ring that Tab lands on: the card on top of the arc,
// or the one last focused with the arrow keys.
function tabbableCard(page: Page) {
  return page.locator('button[aria-label^="Chọn lá thứ"][tabindex="0"]');
}

test("picked cards fill the three positions and can be put back", async ({ page }) => {
  await openWheel(page);
  await pickCards(page);

  for (const name of ["Bối cảnh", "Hiện tại", "Hướng đi"]) {
    await expect(page.getByRole("button", { name: `${name}: đã chọn, bấm để bỏ chọn` })).toBeVisible();
  }
  // Every card left on the ring is locked once three are picked.
  const ringCards = page.getByRole("button", { name: /^Chọn lá thứ/ });
  await expect(ringCards.first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Mở lá bài" })).toBeEnabled();

  // Putting the first card back moves the other two up one position.
  await page.getByRole("button", { name: "Bối cảnh: đã chọn, bấm để bỏ chọn" }).click();
  await expect(page.getByRole("button", { name: "Bối cảnh: đã chọn, bấm để bỏ chọn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hiện tại: đã chọn, bấm để bỏ chọn" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Hướng đi: chưa chọn" })).toBeVisible();
  await expect(page.getByText("Đã chọn 2/3")).toBeVisible();
  await expect(ringCards.first()).toBeEnabled();
});

test("arrow keys move along the ring and Enter picks the focused card", async ({ page }) => {
  await openWheel(page);
  const start = tabbableCard(page);
  const startLabel = await start.getAttribute("aria-label");
  await start.focus();

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("aria-label", /^Chọn lá thứ/);
  const focusedLabel = await focused.getAttribute("aria-label");
  expect(focusedLabel).not.toBe(startLabel);

  await page.keyboard.press("Enter");
  await expect(page.getByText("Đã chọn 1/3")).toBeVisible();
  await expect(page.getByRole("button", { name: focusedLabel! })).toHaveCount(0);
});

test("the turn buttons rotate the ring", async ({ page }) => {
  await openWheel(page);
  const before = await tabbableCard(page).getAttribute("aria-label");
  await page.getByRole("button", { name: "Xoay bài sang phải" }).click();
  await expect(tabbableCard(page)).not.toHaveAttribute("aria-label", before!);
  const afterRight = await tabbableCard(page).getAttribute("aria-label");
  await page.getByRole("button", { name: "Xoay bài sang trái" }).click();
  await expect(tabbableCard(page)).not.toHaveAttribute("aria-label", afterRight!);
});

test("scrolling the mouse wheel over the ring turns it instead of the page", async ({ page }) => {
  await openWheel(page);
  const wheel = page.getByRole("group", { name: /^Vòng bài/ });
  const box = (await wheel.boundingBox())!;
  const before = await tabbableCard(page).getAttribute("aria-label");
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);

  await expect(tabbableCard(page)).not.toHaveAttribute("aria-label", before!);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});
