import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

/**
 * Fixed-window limiter backed by Postgres, so the counters survive a
 * deploy and stay shared across instances. The whole read-modify-write
 * is one statement: two concurrent requests on the same key can't both
 * read a stale count and let the caller through twice.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);

  const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"
  `;

  // Expired rows are dead weight — IP-keyed ones in particular are never
  // looked up again. Sweeping from a small share of calls keeps the table
  // bounded without a scheduled job.
  if (Math.random() < 0.02) {
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lte: new Date() } } });
  }

  return count <= limit;
}

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}
