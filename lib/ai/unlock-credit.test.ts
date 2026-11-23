import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { readUnlockState } from "./unlock-credit";
import { UnlockDeadline } from "./unlock-deadline";

describe("financial transaction deadline", () => {
  it("does not begin a transaction after the request deadline", async () => {
    const transaction = vi.fn(); const db = { $transaction: transaction } as unknown as PrismaClient;
    await expect(readUnlockState(db, "user", "reading", new UnlockDeadline(0))).rejects.toMatchObject({ name: "TimeoutError" });
    expect(transaction).not.toHaveBeenCalled();
  });
  it("bounds pool wait, transaction time and SQL statements", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>, _options?: unknown) => { void _options; return fn({ $queryRaw: query, reading: { findUnique: async () => null } }); });
    const db = { $transaction: transaction } as unknown as PrismaClient;
    expect(await readUnlockState(db, "user", "reading", new UnlockDeadline())).toEqual({ status: "denied" });
    expect(transaction.mock.calls[0][1]).toMatchObject({ isolationLevel: "Serializable", maxWait: 1000, timeout: 3000 });
    expect(String(query.mock.calls[0][0])).toContain("statement_timeout");
  });
});
