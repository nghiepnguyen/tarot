import { describe, expect, it } from "vitest";
import { InterpretationReviewSchema } from "./review";

const valid = {
  interpretationId: "int_1",
  accuracy: 5,
  clarity: 4,
  actionability: 3,
};

describe("InterpretationReviewSchema", () => {
  it("accepts a full rating", () => {
    const parsed = InterpretationReviewSchema.parse({ ...valid, comment: "Đọc rất đúng." });

    expect(parsed.accuracy).toBe(5);
    expect(parsed.comment).toBe("Đọc rất đúng.");
  });

  it("refuses scores outside 1-5, which Postgres would happily store", () => {
    // Server action là một POST ai cũng gọi được. Không chặn ở đây thì một
    // request tay ghi được 9.999 sao và mọi trung bình trên /admin thành rác.
    for (const bad of [0, 6, -3, 9_999]) {
      expect(InterpretationReviewSchema.safeParse({ ...valid, accuracy: bad }).success).toBe(false);
    }
  });

  it("refuses a fractional score", () => {
    expect(InterpretationReviewSchema.safeParse({ ...valid, clarity: 4.5 }).success).toBe(false);
  });

  it("requires all three criteria", () => {
    expect(
      InterpretationReviewSchema.safeParse({
        interpretationId: valid.interpretationId,
        accuracy: valid.accuracy,
        clarity: valid.clarity,
      }).success,
    ).toBe(false);
  });

  it("turns a blank comment into null instead of storing whitespace", () => {
    expect(InterpretationReviewSchema.parse({ ...valid, comment: "   " }).comment).toBeNull();
  });

  it("trims a comment and caps its length", () => {
    expect(InterpretationReviewSchema.parse({ ...valid, comment: "  ừ  " }).comment).toBe("ừ");
    expect(
      InterpretationReviewSchema.safeParse({ ...valid, comment: "a".repeat(2_001) }).success,
    ).toBe(false);
  });
});
