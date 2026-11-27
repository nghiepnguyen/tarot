-- Additive financial protocol; legacy ledger keys remain NULL.
CREATE TYPE "UnlockOperationStatus" AS ENUM ('PROCESSING', 'REFUND_PENDING', 'RECONCILE_REQUIRED', 'SUCCEEDED', 'REFUNDED');
ALTER TABLE "CreditTransaction" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");
CREATE TABLE "UnlockOperation" (
  "id" TEXT NOT NULL,
  "readingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "attemptToken" TEXT NOT NULL,
  "status" "UnlockOperationStatus" NOT NULL,
  "cost" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "interpretationId" TEXT,
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UnlockOperation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UnlockOperation_readingId_key" ON "UnlockOperation"("readingId");
CREATE UNIQUE INDEX "UnlockOperation_attemptToken_key" ON "UnlockOperation"("attemptToken");
CREATE INDEX "UnlockOperation_status_expiresAt_idx" ON "UnlockOperation"("status", "expiresAt");
ALTER TABLE "UnlockOperation" ADD CONSTRAINT "UnlockOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
