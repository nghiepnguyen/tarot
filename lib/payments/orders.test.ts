import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePrisma, makeOrder } from "@/test/fake-prisma";

const getPaymentLink = vi.hoisted(() => vi.fn());
const prismaRef = vi.hoisted(() => ({ current: null as unknown }));

const alertAmountMismatch = vi.hoisted(() => vi.fn());

vi.mock("./payos", () => ({ getPaymentLink }));
// alerts.ts kéo theo next/headers qua rate-limit; ngoài Next thì không nạp được,
// và các test ở đây quan tâm tới sổ credit chứ không phải email.
vi.mock("./alerts", () => ({ alertAmountMismatch, alertStuckOrders: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  get prisma() {
    return prismaRef.current;
  },
}));

const {
  closeUnpaidOrder,
  creditPaidOrder,
  reconcileOrder,
  reconcileStaleOrders,
  reconcileUserPendingOrders,
} = await import("./orders");

const MINUTE = 60 * 1000;

function setup(orderOverrides: Parameters<typeof makeOrder>[0], credits = 0) {
  const order = makeOrder(orderOverrides);
  const fake = createFakePrisma([order], [{ id: order.userId, credits }]);
  prismaRef.current = fake.db;
  return { fake, order };
}

const BASE = {
  id: "order_1",
  userId: "user_1",
  providerOrderId: "1700000000001",
  amountVnd: 19_000,
  creditsGranted: 50,
};

beforeEach(() => {
  getPaymentLink.mockReset();
  alertAmountMismatch.mockReset();
});

describe("creditPaidOrder", () => {
  it("credits the user and writes a PURCHASE ledger row", async () => {
    const { fake } = setup(BASE, 10);

    await expect(creditPaidOrder(BASE.providerOrderId, 19_000)).resolves.toBe("credited");

    expect(fake.user("user_1")?.credits).toBe(60);
    expect(fake.order("order_1")?.status).toBe("PAID");
    expect(fake.order("order_1")?.paidAt).toBeInstanceOf(Date);
    expect(fake.creditTransactions).toEqual([
      {
        userId: "user_1",
        type: "PURCHASE",
        amount: 50,
        balanceAfter: 60,
        relatedOrderId: "order_1",
      },
    ]);
  });

  it("credits only once when the webhook is delivered twice", async () => {
    const { fake } = setup(BASE, 0);

    await creditPaidOrder(BASE.providerOrderId, 19_000);
    await expect(creditPaidOrder(BASE.providerOrderId, 19_000)).resolves.toBe("already_paid");

    expect(fake.user("user_1")?.credits).toBe(50);
    expect(fake.creditTransactions).toHaveLength(1);
  });

  it("refuses to credit when the paid amount does not match the order", async () => {
    const { fake } = setup(BASE, 0);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(creditPaidOrder(BASE.providerOrderId, 1_000)).resolves.toBe("amount_mismatch");

    expect(fake.user("user_1")?.credits).toBe(0);
    expect(fake.order("order_1")?.status).toBe("PENDING");
    expect(fake.creditTransactions).toHaveLength(0);
    // Không đường tự động nào gỡ được tình huống này, nên phải có người biết.
    expect(alertAmountMismatch).toHaveBeenCalledWith({
      orderId: "order_1",
      providerOrderId: BASE.providerOrderId,
      expectedVnd: 19_000,
      paidVnd: 1_000,
    });
    consoleError.mockRestore();
  });

  it("does not alert when the amount matches", async () => {
    setup(BASE, 0);
    await creditPaidOrder(BASE.providerOrderId, 19_000);
    expect(alertAmountMismatch).not.toHaveBeenCalled();
  });

  it("does not resurrect an order that was already closed", async () => {
    const { fake } = setup({ ...BASE, status: "EXPIRED" }, 0);

    await expect(creditPaidOrder(BASE.providerOrderId, 19_000)).resolves.toBe("not_pending");
    expect(fake.user("user_1")?.credits).toBe(0);
  });

  it("reports not_found for an orderCode we never issued", async () => {
    setup(BASE, 0);
    await expect(creditPaidOrder("9999999999999", 19_000)).resolves.toBe("not_found");
  });
});

describe("closeUnpaidOrder", () => {
  it("closes a pending order", async () => {
    const { fake } = setup(BASE);
    await expect(closeUnpaidOrder(BASE.providerOrderId, "FAILED")).resolves.toBe(true);
    expect(fake.order("order_1")?.status).toBe("FAILED");
  });

  it("leaves a paid order untouched, so a late failure webhook cannot undo a payment", async () => {
    const { fake } = setup({ ...BASE, status: "PAID" });
    await expect(closeUnpaidOrder(BASE.providerOrderId, "FAILED")).resolves.toBe(false);
    expect(fake.order("order_1")?.status).toBe("PAID");
  });
});

describe("reconcileOrder", () => {
  it("credits an order PayOS reports as paid when the webhook never arrived", async () => {
    const { fake, order } = setup(BASE, 0);
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PAID",
      amount: 19_000,
      amountPaid: 19_000,
    });

    await expect(reconcileOrder(order)).resolves.toBe("PAID");
    expect(fake.user("user_1")?.credits).toBe(50);
    expect(getPaymentLink).toHaveBeenCalledWith("link_1");
  });

  it("falls back to the orderCode when no payment link id was stored", async () => {
    const { order } = setup({ ...BASE, providerPaymentLinkId: null }, 0);
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PAID",
      amount: 19_000,
      amountPaid: 19_000,
    });

    await reconcileOrder(order);
    expect(getPaymentLink).toHaveBeenCalledWith(BASE.providerOrderId);
  });

  it("marks a cancelled payment link as CANCELLED", async () => {
    const { fake, order } = setup(BASE);
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "CANCELLED",
      amount: 19_000,
      amountPaid: 0,
    });

    await expect(reconcileOrder(order)).resolves.toBe("CANCELLED");
    expect(fake.order("order_1")?.status).toBe("CANCELLED");
  });

  it("leaves a fresh pending order alone", async () => {
    const { fake, order } = setup(BASE);
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PENDING",
      amount: 19_000,
      amountPaid: 0,
    });

    await expect(reconcileOrder(order)).resolves.toBe("PENDING");
    expect(fake.order("order_1")?.status).toBe("PENDING");
    expect(fake.order("order_1")?.reconciledAt).toBeInstanceOf(Date);
  });

  it("expires a pending order once its payment link deadline has passed", async () => {
    const { fake, order } = setup({ ...BASE, expiresAt: new Date(Date.now() - MINUTE) });
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PENDING",
      amount: 19_000,
      amountPaid: 0,
    });

    await expect(reconcileOrder(order)).resolves.toBe("EXPIRED");
    expect(fake.order("order_1")?.status).toBe("EXPIRED");
  });

  it("expires a stale order even when PayOS itself is failing", async () => {
    const { fake, order } = setup({ ...BASE, expiresAt: new Date(Date.now() - MINUTE) });
    getPaymentLink.mockRejectedValue(new Error("PayOS down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(reconcileOrder(order)).resolves.toBe("EXPIRED");
    expect(fake.order("order_1")?.status).toBe("EXPIRED");
    consoleError.mockRestore();
  });

  it("keeps a fresh order pending when PayOS is failing, rather than closing it wrongly", async () => {
    const { fake, order } = setup({ ...BASE, expiresAt: new Date(Date.now() + 10 * MINUTE) });
    getPaymentLink.mockRejectedValue(new Error("PayOS down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(reconcileOrder(order)).resolves.toBe("PENDING");
    expect(fake.order("order_1")?.status).toBe("PENDING");
    consoleError.mockRestore();
  });

  it("does not re-check an order that is already settled", async () => {
    const { order } = setup({ ...BASE, status: "PAID" });
    await expect(reconcileOrder(order)).resolves.toBe("PAID");
    expect(getPaymentLink).not.toHaveBeenCalled();
  });

  it("keeps the order pending when PayOS reports a paid amount that does not match", async () => {
    const { fake, order } = setup(BASE, 0);
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PAID",
      amount: 19_000,
      amountPaid: 5_000,
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(reconcileOrder(order)).resolves.toBe("PENDING");
    expect(fake.user("user_1")?.credits).toBe(0);
    consoleError.mockRestore();
  });
});

describe("reconcileStaleOrders", () => {
  it("skips orders inside the grace window so it does not race the webhook", async () => {
    const fresh = makeOrder({ ...BASE, id: "order_fresh", createdAt: new Date() });
    const stale = makeOrder({
      ...BASE,
      id: "order_stale",
      providerOrderId: "1700000000002",
      createdAt: new Date(Date.now() - 30 * MINUTE),
      expiresAt: new Date(Date.now() - 5 * MINUTE),
    });
    const fake = createFakePrisma([fresh, stale], [{ id: "user_1", credits: 0 }]);
    prismaRef.current = fake.db;
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000002,
      status: "EXPIRED",
      amount: 19_000,
      amountPaid: 0,
    });

    await expect(reconcileStaleOrders(25, 5 * MINUTE)).resolves.toEqual({
      checked: 1,
      paid: 0,
      closed: 1,
      stillPending: 0,
      stoppedEarly: false,
    });
    expect(fake.order("order_fresh")?.status).toBe("PENDING");
    expect(fake.order("order_stale")?.status).toBe("EXPIRED");
  });

  it("counts a recovered payment", async () => {
    const stale = makeOrder({ ...BASE, createdAt: new Date(Date.now() - 30 * MINUTE) });
    const fake = createFakePrisma([stale], [{ id: "user_1", credits: 0 }]);
    prismaRef.current = fake.db;
    getPaymentLink.mockResolvedValue({
      orderCode: 1700000000001,
      status: "PAID",
      amount: 19_000,
      amountPaid: 19_000,
    });

    await expect(reconcileStaleOrders()).resolves.toEqual({
      checked: 1,
      paid: 1,
      closed: 0,
      stillPending: 0,
      stoppedEarly: false,
    });
    expect(fake.user("user_1")?.credits).toBe(50);
  });

  it("stops before the function times out instead of being killed mid-sweep", async () => {
    const orders = [0, 1, 2].map((i) =>
      makeOrder({
        ...BASE,
        id: `order_slow_${i}`,
        providerOrderId: `170000000010${i}`,
        createdAt: new Date(Date.now() - 30 * MINUTE),
        expiresAt: new Date(Date.now() + 5 * MINUTE),
      }),
    );
    const fake = createFakePrisma(orders, [{ id: "user_1", credits: 0 }]);
    prismaRef.current = fake.db;
    // Mỗi lượt hỏi PayOS ăn 20ms đồng hồ thật; ngân sách 10ms nên chỉ đủ đơn đầu.
    getPaymentLink.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { orderCode: 1700000000100, status: "PENDING", amount: 19_000, amountPaid: 0 };
    });

    await expect(reconcileStaleOrders(25, 5 * MINUTE, 10)).resolves.toEqual({
      checked: 1,
      paid: 0,
      closed: 0,
      stillPending: 1,
      stoppedEarly: true,
    });
    expect(getPaymentLink).toHaveBeenCalledTimes(1);
  });
});

describe("reconcileUserPendingOrders", () => {
  const PAID_INFO = {
    orderCode: 1700000000001,
    status: "PAID" as const,
    amount: 19_000,
    amountPaid: 19_000,
  };

  it("only touches the caller's own orders", async () => {
    const mine = makeOrder({
      ...BASE,
      id: "order_mine",
      createdAt: new Date(Date.now() - 30 * MINUTE),
    });
    const theirs = makeOrder({
      ...BASE,
      id: "order_theirs",
      userId: "user_2",
      providerOrderId: "1700000000002",
      createdAt: new Date(Date.now() - 30 * MINUTE),
    });
    const fake = createFakePrisma(
      [mine, theirs],
      [
        { id: "user_1", credits: 0 },
        { id: "user_2", credits: 0 },
      ],
    );
    prismaRef.current = fake.db;
    getPaymentLink.mockResolvedValue(PAID_INFO);

    await expect(reconcileUserPendingOrders("user_1")).resolves.toBe(1);

    expect(fake.order("order_mine")?.status).toBe("PAID");
    expect(fake.order("order_theirs")?.status).toBe("PENDING");
    expect(fake.user("user_1")?.credits).toBe(50);
    expect(fake.user("user_2")?.credits).toBe(0);
  });

  it("skips orders still inside the grace window", async () => {
    const { fake } = setup({ ...BASE, createdAt: new Date() }, 0);
    getPaymentLink.mockResolvedValue(PAID_INFO);

    await expect(reconcileUserPendingOrders("user_1")).resolves.toBe(0);
    expect(getPaymentLink).not.toHaveBeenCalled();
    expect(fake.order("order_1")?.status).toBe("PENDING");
  });

  it("checks at most `limit` orders, leaving the rest to the cron sweep", async () => {
    const orders = [1, 2, 3, 4, 5].map((n) =>
      makeOrder({
        ...BASE,
        id: `order_${n}`,
        providerOrderId: `170000000000${n}`,
        createdAt: new Date(Date.now() - n * MINUTE - 30 * MINUTE),
      }),
    );
    const fake = createFakePrisma(orders, [{ id: "user_1", credits: 0 }]);
    prismaRef.current = fake.db;
    getPaymentLink.mockResolvedValue({ ...PAID_INFO, status: "CANCELLED", amountPaid: 0 });

    await expect(reconcileUserPendingOrders("user_1", 2)).resolves.toBe(2);
    expect(getPaymentLink).toHaveBeenCalledTimes(2);
  });

  it("reports nothing settled when PayOS leaves the order pending", async () => {
    const { fake } = setup(
      { ...BASE, createdAt: new Date(Date.now() - 10 * MINUTE), expiresAt: new Date(Date.now() + MINUTE) },
      0,
    );
    getPaymentLink.mockResolvedValue({ ...PAID_INFO, status: "PENDING", amountPaid: 0 });

    await expect(reconcileUserPendingOrders("user_1")).resolves.toBe(0);
    expect(fake.order("order_1")?.status).toBe("PENDING");
  });
});
