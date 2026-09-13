import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, makeOrder } from "@/test/fake-prisma";
import { refundOrder } from "./refund";

const BASE = {
  id: "order_1",
  userId: "user_1",
  providerOrderId: "1700000000001",
  amountVnd: 19_000,
  creditsGranted: 50,
  status: "PAID" as const,
};

function setup(overrides: Partial<typeof BASE> = {}, credits = 50) {
  const fake = createFakePrisma(
    [makeOrder({ ...BASE, ...overrides })],
    [{ id: "user_1", credits }],
  );
  return { fake, db: fake.db as unknown as PrismaClient };
}

describe("refundOrder", () => {
  it("reverses the granted credits and records a negative ledger row", async () => {
    const { fake, db } = setup();

    await expect(refundOrder(db, "order_1")).resolves.toEqual({
      ok: true,
      creditsReversed: 50,
      balanceAfter: 0,
    });

    expect(fake.order("order_1")?.status).toBe("REFUNDED");
    expect(fake.creditTransactions).toEqual([
      {
        userId: "user_1",
        type: "REFUND",
        amount: -50,
        balanceAfter: 0,
        relatedOrderId: "order_1",
      },
    ]);
  });

  it("goes negative when the customer already spent the credits", async () => {
    const { fake, db } = setup({}, 20);

    await expect(refundOrder(db, "order_1")).resolves.toEqual({
      ok: true,
      creditsReversed: 50,
      balanceAfter: -30,
    });
    expect(fake.user("user_1")?.credits).toBe(-30);
  });

  it("refuses to refund the same order twice", async () => {
    const { fake, db } = setup();

    await refundOrder(db, "order_1");
    const second = await refundOrder(db, "order_1");

    expect(second).toEqual({ ok: false, error: "Đơn order_1 đã được hoàn." });
    expect(fake.user("user_1")?.credits).toBe(0);
    expect(fake.creditTransactions).toHaveLength(1);
  });

  it("refuses to refund an order that was never paid", async () => {
    const { fake, db } = setup({ status: "PENDING" as never }, 0);

    await expect(refundOrder(db, "order_1")).resolves.toEqual({
      ok: false,
      error: "Đơn order_1 đang ở trạng thái PENDING, chưa thanh toán.",
    });
    expect(fake.creditTransactions).toHaveLength(0);
  });

  it("reports a missing order", async () => {
    const { db } = setup();
    await expect(refundOrder(db, "order_nope")).resolves.toEqual({
      ok: false,
      error: "Không tìm thấy đơn order_nope.",
    });
  });
});
