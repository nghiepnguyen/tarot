import { test, expect } from "@playwright/test";

test("full reading flow: question -> pick three cards -> reveal", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Bốc ba lá bài/i })).toBeVisible();

  const questionBox = page.getByLabel("Câu hỏi của bạn");
  await questionBox.fill("Tôi nên tập trung vào điều gì lúc này?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  await expect(page.getByRole("heading", { name: "Chọn ba lá bài" })).toBeVisible();

  const deckButtons = page.getByRole("button", { name: /^Chọn lá thứ/ });
  await deckButtons.nth(0).click();
  await deckButtons.nth(1).click();
  await deckButtons.nth(2).click();

  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await expect(page.getByText("Bối cảnh", { exact: true })).toBeVisible();
  await expect(page.getByText("Hiện tại", { exact: true })).toBeVisible();
  await expect(page.getByText("Hướng đi", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trải bài mới" })).toBeVisible();
});

test("disables the draw button until a question is entered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Bốc 3 lá bài" })).toBeDisabled();
  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên làm gì?");
  await expect(page.getByRole("button", { name: "Bốc 3 lá bài" })).toBeEnabled();
});
