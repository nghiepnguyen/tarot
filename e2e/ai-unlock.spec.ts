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

test("history renders both v4 and legacy interpretations without another credit spend", async ({ page }) => {
  const { PrismaClient } = await import("@prisma/client");
  const { TAROT_CARDS } = await import("../lib/tarot/cards");
  const { SPREAD_POSITIONS } = await import("../lib/tarot/draw");
  const email = uniqueEmail("e2e-v4-history");
  await signUpVerifyAndLogIn(page, { name: "Người Xem Lịch Sử", email });
  const db = new PrismaClient();
  try {
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const cards = SPREAD_POSITIONS.map((position, index) => ({ position, cardId: TAROT_CARDS[index].id, orientation: "upright" }));
    for (const version of ["v4-2026-09-30", "v0-legacy"]) {
      const legacy = version === "v0-legacy";
      await db.reading.create({ data: {
        userId: user.id, question: `Lịch sử ${version}`, cards,
        aiInterpretation: { create: {
          model: legacy ? "gemini-3-flash-preview" : "gemini-3.8-flash", promptVersion: version,
          overview: `Tổng quan ${version}`, connections: "Liên kết bài", actionSuggestions: "Hành động cũ",
          reflectiveQuestion: "Bạn muốn thay đổi điều gì?",
          perCard: SPREAD_POSITIONS.map(position => ({ position, text: "Diễn giải lá bài", ...(legacy ? {} : { keyMessage: "Thông điệp" }) })),
          ...(legacy ? {} : { summary: "Tóm tắt v4", themes: ["Khởi đầu", "Cân bằng", "Hướng đi"], actionSuggestionsList: ["Bước một", "Bước hai", "Bước ba"], closingNote: "Lời kết v4" }),
        } },
      } });
    }
    await page.goto("/history");
    for (const version of ["v4-2026-09-30", "v0-legacy"]) {
      const row = page.locator("details").filter({ hasText: `Lịch sử ${version}` });
      await row.locator("summary").click();
      await expect(row.getByText(`Tổng quan ${version}`, { exact: true })).toBeVisible();
    }
    await expect(page.getByText("Tóm tắt v4", { exact: true })).toBeVisible();
    await expect(page.getByText("Hành động cũ", { exact: true })).toBeVisible();
    await page.goto("/profile");
    await expect(page.getByText("2 lượt diễn giải chuyên sâu")).toBeVisible();
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).credits).toBe(user.credits);
  } finally { await db.$disconnect(); }
});
