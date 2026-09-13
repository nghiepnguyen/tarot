import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn());
const checkRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/email/resend", () => ({ sendEmail }));
// rate-limit kéo theo next/headers, không nạp được ngoài Next. Ở đây nó chỉ
// đóng vai khoá chống lặp, nên thay hẳn bằng mock.
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit }));

const { alertAmountMismatch, alertStuckOrders } = await import("./alerts");

const MISMATCH = {
  orderId: "order_1",
  providerOrderId: "1700000000001",
  expectedVnd: 19_000,
  paidVnd: 5_000,
};

beforeEach(() => {
  sendEmail.mockReset().mockResolvedValue(true);
  checkRateLimit.mockReset().mockResolvedValue(true);
});

describe("alertAmountMismatch", () => {
  it("emails the support address with both amounts and the order ids", async () => {
    await alertAmountMismatch(MISMATCH);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = sendEmail.mock.calls[0][0];
    expect(sent.to).toBe("thanhnghiep.top@gmail.com");
    expect(sent.subject).toContain("order_1");
    expect(sent.text).toContain("1700000000001");
    expect(sent.text).toContain("19.000đ");
    expect(sent.text).toContain("5.000đ");
    expect(sent.text).toContain("CHƯA được cộng");
  });

  it("keys the dedupe window on the order, so webhook retries send one email", async () => {
    await alertAmountMismatch(MISMATCH);

    expect(checkRateLimit).toHaveBeenCalledWith(
      "alert:mismatch:order_1",
      1,
      24 * 60 * 60 * 1000,
    );
  });

  it("stays silent once the dedupe window has already been used", async () => {
    checkRateLimit.mockResolvedValue(false);
    await alertAmountMismatch(MISMATCH);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("alertStuckOrders", () => {
  it("reports the count of orders left pending", async () => {
    await alertStuckOrders(3);

    const sent = sendEmail.mock.calls[0][0];
    expect(sent.subject).toContain("3 đơn");
    expect(sent.text).toContain("còn 3 đơn");
  });

  it("says nothing when the sweep left nothing pending", async () => {
    await alertStuckOrders(0);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("does not re-send within the dedupe window", async () => {
    checkRateLimit.mockResolvedValue(false);
    await alertStuckOrders(3);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
