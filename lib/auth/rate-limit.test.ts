import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "./rate-limit";

// The limiter is a single Postgres statement now, so there is nothing to
// assert without a database. The unit CI job runs without one and skips.
const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("checkRateLimit", () => {
  const keys: string[] = [];
  const uniqueKey = () => {
    const key = `test:${Math.random()}`;
    keys.push(key);
    return key;
  };

  afterAll(async () => {
    await prisma.rateLimit.deleteMany({ where: { key: { in: keys } } });
    await prisma.$disconnect();
  });

  it("allows requests up to the limit, then blocks", async () => {
    const key = uniqueKey();
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("resets after the window elapses", async () => {
    const key = uniqueKey();
    expect(await checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 1, 60_000)).toBe(false);

    await prisma.rateLimit.update({
      where: { key },
      data: { resetAt: new Date(Date.now() - 1000) },
    });

    expect(await checkRateLimit(key, 1, 60_000)).toBe(true);
  });

  it("tracks independent keys separately", async () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();
    expect(await checkRateLimit(keyA, 1, 60_000)).toBe(true);
    expect(await checkRateLimit(keyB, 1, 60_000)).toBe(true);
    expect(await checkRateLimit(keyA, 1, 60_000)).toBe(false);
  });

  it("counts concurrent calls on one key exactly once each", async () => {
    const key = uniqueKey();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => checkRateLimit(key, 3, 60_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(3);
  });
});
