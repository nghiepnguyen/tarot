import { test, expect, pickCards } from "./fixtures";

test("full reading flow: question -> pick three cards -> reveal", async ({ page, isMobile }) => {
  if (isMobile) await page.emulateMedia({ reducedMotion: "reduce" });
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

  const reflection = page.getByRole("region", { name: "Phản tư ngắn" });
  if (process.env.TAROT_REFLECTION_ENABLED === "1" && process.env.PLAYWRIGHT_REFLECTION_DEV === "1") {
    await expect(reflection.getByRole("button", { name: "Tạo câu hỏi phản tư" })).toBeVisible();
  } else {
    await expect(reflection).toHaveCount(0);
  }
});

test("keeps reflection prompts hidden for a question that triggers reading support", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Câu hỏi của bạn").fill("Tôi đang định tự làm hại mình ngay hôm nay.");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  await pickCards(page);
  await page.getByRole("button", { name: "Mở lá bài" }).click();
  await expect(page.getByRole("button", { name: "Trải bài mới" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Phản tư ngắn" })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Ưu tiên an toàn lúc này" })).toBeVisible();
});

test("drawing with an empty question stays on the form and focuses it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  await expect(page.getByText("Vui lòng nhập câu hỏi trước khi bốc bài.")).toBeVisible();
  await expect(page.getByLabel("Câu hỏi của bạn")).toBeFocused();
});

test("the optional context hint describes the question field without changing its limit", async ({ page }) => {
  await page.goto("/");
  const questionBox = page.getByRole("textbox", { name: "Câu hỏi của bạn" });
  const hint = "Nếu muốn, hãy thêm một việc cụ thể khiến bạn đặt câu hỏi này.";
  await expect(page.getByText(hint, { exact: true })).toBeVisible();
  await expect(questionBox).toHaveAccessibleDescription(hint);
  await expect(questionBox).toHaveAttribute("maxlength", "300");

  const question = "Tôi nên chuẩn bị gì để chuyển nhóm? Tuần trước quản lý đề nghị tôi thử một vai trò mới.";
  const atLimit = question.padEnd(300, ".");
  await questionBox.fill(atLimit);
  await questionBox.press("End");
  await questionBox.press("A");
  await expect(questionBox).toHaveValue(atLimit);
  await expect(page.getByText("300/300", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();
  await expect(page.getByRole("heading", { name: "Chọn ba lá bài" })).toBeVisible();
});
