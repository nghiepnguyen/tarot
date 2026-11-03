import { test, expect, pickCards } from "./fixtures";

test("full reading flow: question -> pick three cards -> reveal", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Bốc ba lá bài/i })).toBeVisible();

  const questionBox = page.getByLabel("Câu hỏi của bạn");
  await questionBox.fill("Tôi nên tập trung vào điều gì lúc này?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  await expect(page.getByRole("heading", { name: "Chọn ba lá bài" })).toBeVisible();

  await pickCards(page);

  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await expect(page.getByText("Bối cảnh", { exact: true })).toBeVisible();
  await expect(page.getByText("Hiện tại", { exact: true })).toBeVisible();
  await expect(page.getByText("Hướng đi", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trải bài mới" })).toBeVisible();
});

test("drawing with an empty question stays on the form and focuses it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  await expect(page.getByText("Vui lòng nhập câu hỏi trước khi bốc bài.")).toBeVisible();
  await expect(page.getByLabel("Câu hỏi của bạn")).toBeFocused();
});
