import { describe, expect, it } from "vitest";
import { buildReviewEmail, REVIEW_RECIPIENT } from "./reviews";

const base = {
  reader: "Minh Trí",
  model: "gemini-3-flash-preview",
  promptVersion: "v1-2026-09-13",
  question: "Tôi có nên nhận lời mời công việc mới không?",
  readingId: "rdg_123",
  accuracy: 5,
  clarity: 4,
  actionability: 3,
  comment: "Phần hành động hơi chung chung.",
  isUpdate: false,
};

describe("buildReviewEmail", () => {
  it("carries both the persona and the real model", () => {
    // Người đọc chỉ thấy bút danh — đó là điều làm điểm số có giá trị. Nhưng
    // thư này đọc để quyết định giữ model nào, nên nó phải gọi đúng tên.
    const { subject, text } = buildReviewEmail(base);

    expect(subject).toContain("Minh Trí");
    expect(text).toContain("Tarot Reader: Minh Trí");
    expect(text).toContain("Model: gemini-3-flash-preview");
  });

  it("totals the three criteria in the subject", () => {
    expect(buildReviewEmail(base).subject).toContain("12/15");
  });

  it("marks an edited review so two mails for one reading are not read as two ratings", () => {
    expect(buildReviewEmail({ ...base, isUpdate: true }).subject).toMatch(/^\[Sửa\]/);
    expect(buildReviewEmail(base).subject).not.toContain("[Sửa]");
  });

  it("names all three criteria in Vietnamese and English", () => {
    const { text } = buildReviewEmail(base);

    expect(text).toContain("Độ chính xác (Accuracy): ★★★★★ 5/5");
    expect(text).toContain("Độ rõ ràng & Dễ hiểu (Clarity): ★★★★☆ 4/5");
    expect(text).toContain("Tính hữu ích & Giải pháp (Actionability): ★★★☆☆ 3/5");
  });

  it("keeps the reading traceable, because a 2-star score alone says nothing", () => {
    const { text } = buildReviewEmail(base);

    expect(text).toContain("Reading: rdg_123");
    expect(text).toContain(base.question);
    expect(text).toContain("Prompt: v1-2026-09-13");
  });

  it("says so plainly when there is no comment and no persona", () => {
    const { subject, text } = buildReviewEmail({
      ...base,
      reader: null,
      comment: null,
      model: "claude-haiku-4-5-20251001",
    });

    expect(text).toContain("Nhận xét: (không có)");
    expect(text).toContain("Tarot Reader: (model đã gỡ)");
    // Không còn bút danh thì tiêu đề lùi về tên model, chứ không để trống.
    expect(subject).toContain("claude-haiku-4-5-20251001");
  });

  it("sends to the address the reviews are meant for", () => {
    expect(REVIEW_RECIPIENT).toBe("thanhnghiep.top@gmail.com");
  });
});
