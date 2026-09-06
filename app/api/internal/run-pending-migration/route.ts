import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// TEMPORARY: applies the 20260906073305_add_credit_ledger_and_orders
// migration against a database the build step can't reach (its
// DATABASE_URL is a Sensitive Vercel env var, hidden from build and from
// the dashboard/CLI, but still available at runtime). Delete this route
// once the migration has been applied in production.

export const runtime = "nodejs";

const MIGRATION_NAME = "20260906073305_add_credit_ledger_and_orders";
const MIGRATION_CHECKSUM =
  "22b4599bbd0e027d83bebc2236d1e9bb0b911ed6fe9ba7c92f72f4b7d0c1aaa7";

const STATEMENTS = [
  `CREATE TYPE "CreditTransactionType" AS ENUM ('FREE_GRANT', 'PURCHASE', 'UNLOCK_SPEND', 'REFUND', 'ADMIN_ADJUST')`,
  `CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED')`,
  `ALTER TABLE "User" ADD COLUMN "freeCreditsGrantedAt" TIMESTAMP(3)`,
  `CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedReadingId" TEXT,
    "relatedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE "CreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "creditsGranted" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt")`,
  `CREATE UNIQUE INDEX "Order_providerOrderId_key" ON "Order"("providerOrderId")`,
  `CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt")`,
  `ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CreditPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
];

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-migrate-token");
  if (!token || !process.env.MIGRATE_TOKEN || token !== process.env.MIGRATE_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const already = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
    `select migration_name from _prisma_migrations where migration_name = $1`,
    MIGRATION_NAME,
  );
  if (already.length > 0) {
    return NextResponse.json({ status: "already-applied" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const statement of STATEMENTS) {
        await tx.$executeRawUnsafe(statement);
      }
      await tx.$executeRawUnsafe(
        `insert into _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count) values ($1, $2, $3, now(), now(), 1)`,
        randomUUID(),
        MIGRATION_CHECKSUM,
        MIGRATION_NAME,
      );
    });
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }

  return NextResponse.json({ status: "applied" });
}
