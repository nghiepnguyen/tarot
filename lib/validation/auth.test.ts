import { describe, expect, it } from "vitest";
import { LoginSchema, SignupSchema } from "./auth";

describe("SignupSchema", () => {
  const valid = { name: "Người Dùng", email: "user@example.com", password: "password123" };

  it("accepts well-formed signup data", () => {
    expect(SignupSchema.safeParse(valid).success).toBe(true);
  });

  it("trims and lowercases an email padded with whitespace and mixed case", () => {
    const result = SignupSchema.safeParse({ ...valid, email: "  USER@Example.com  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(SignupSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    expect(SignupSchema.safeParse({ ...valid, name: "A".repeat(61) }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(SignupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(SignupSchema.safeParse({ ...valid, password: "abc123" }).success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    expect(SignupSchema.safeParse({ ...valid, password: "12345678" }).success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    expect(SignupSchema.safeParse({ ...valid, password: "abcdefgh" }).success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts well-formed login data", () => {
    expect(LoginSchema.safeParse({ email: "user@example.com", password: "anything" }).success).toBe(
      true,
    );
  });

  it("trims and lowercases an email padded with whitespace and mixed case", () => {
    const result = LoginSchema.safeParse({ email: "  USER@Example.com  ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects a malformed email", () => {
    expect(LoginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(LoginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });
});
