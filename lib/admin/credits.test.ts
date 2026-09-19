import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma } from "@/test/fake-prisma";
import { adjustCredits, MAX_ADJUST } from "./credits";

function setup(credits = 10) {
  const fake = createFakePrisma([], [{ id: "user_1", credits }]);
  return { fake, db: fake.db as unknown as PrismaClient };
}

const BASE = { userId: "user_1", reason: "Bù cho ca hỗ trợ #12", adminUserId: "admin_1" };

describe("adjustCredits", () => {
  it("adds credits, records the ledger row and signs the audit log", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, delta: 30 })).resolves.toEqual({
      ok: true,
      delta: 30,
      balanceAfter: 40,
    });

    expect(fake.user("user_1")?.credits).toBe(40);
    expect(fake.creditTransactions).toEqual([
      { userId: "user_1", type: "ADMIN_ADJUST", amount: 30, balanceAfter: 40 },
    ]);
    expect(fake.auditLogs).toEqual([
      {
        adminUserId: "admin_1",
        action: "credit_adjust",
        targetUserId: "user_1",
        targetOrderId: null,
        amount: 30,
        reason: "Bù cho ca hỗ trợ #12",
      },
    ]);
  });

  it("subtracts credits with a negative delta", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, delta: -4 })).resolves.toEqual({
      ok: true,
      delta: -4,
      balanceAfter: 6,
    });
    expect(fake.user("user_1")?.credits).toBe(6);
  });

  it("allows the balance to go negative, like a refund does", async () => {
    const { fake, db } = setup(5);

    await expect(adjustCredits(db, { ...BASE, delta: -30 })).resolves.toEqual({
      ok: true,
      delta: -30,
      balanceAfter: -25,
    });
    expect(fake.user("user_1")?.credits).toBe(-25);
  });

  it("refuses a zero delta without touching the ledger", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, delta: 0 })).resolves.toEqual({
      ok: false,
      error: "Số credit phải khác 0.",
    });
    expect(fake.user("user_1")?.credits).toBe(10);
    expect(fake.creditTransactions).toHaveLength(0);
    expect(fake.auditLogs).toHaveLength(0);
  });

  it("refuses a delta past the cap — one extra zero is the real failure mode", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, delta: MAX_ADJUST + 1 })).resolves.toEqual({
      ok: false,
      error: `Mỗi lần chỉnh tối đa ${MAX_ADJUST} credit.`,
    });
    expect(fake.creditTransactions).toHaveLength(0);
  });

  it("refuses an empty reason", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, reason: "  ", delta: 5 })).resolves.toEqual({
      ok: false,
      error: "Phải ghi lý do.",
    });
    expect(fake.auditLogs).toHaveLength(0);
  });

  it("reports an unknown account", async () => {
    const { fake, db } = setup();

    await expect(adjustCredits(db, { ...BASE, userId: "user_nope", delta: 5 })).resolves.toEqual({
      ok: false,
      error: "Không tìm thấy tài khoản user_nope.",
    });
    expect(fake.creditTransactions).toHaveLength(0);
  });
});
