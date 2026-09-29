import { test, expect, pickCards, signUpVerifyAndLogIn, uniqueEmail } from "./fixtures";

test("unlocking AI without a configured API key shows a clear error with retry", async ({
  page,
}) => {
  // Nhánh đang kiểm tra chỉ tồn tại khi không có key. CI không cấu hình key nên
  // test chạy ở đó; máy lập trình viên thường có key thật, và trước đây điều đó
  // làm cả suite đỏ ở local vì lý do không liên quan gì tới lỗi thật.
  test.skip(
    Boolean(process.env.GEMINI_API_KEY),
    "GEMINI_API_KEY đang được cấu hình, nhánh thiếu key không xảy ra.",
  );

  await signUpVerifyAndLogIn(page, { name: "Người Dùng AI", email: uniqueEmail("e2e-ai") });

  // Verified accounts get 2 free unlocks (20 credit), which already covers the
  // one unlock attempt below — no need to top up.
  await page.goto("/profile");
  await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();

  await page.goto("/");
  await page.getByLabel("Câu hỏi của bạn").fill("Tôi nên tập trung vào điều gì?");
  await page.getByRole("button", { name: "Bốc 3 lá bài" }).click();

  await pickCards(page);
  await page.getByRole("button", { name: "Mở lá bài" }).click();

  await page.getByRole("button", { name: /Mở khóa diễn giải chuyên sâu/ }).click();

  await expect(page.getByText("GEMINI_API_KEY chưa được cấu hình.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();

  // The failed generation should have refunded the credit spend.
  await page.goto("/profile");
  await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();
});
