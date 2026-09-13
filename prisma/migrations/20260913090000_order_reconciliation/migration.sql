-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "providerPaymentLinkId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "reconciledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
