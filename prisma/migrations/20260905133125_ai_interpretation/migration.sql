-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AiInterpretation" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "perCard" JSONB NOT NULL,
    "connections" TEXT NOT NULL,
    "actionSuggestions" TEXT NOT NULL,
    "reflectiveQuestion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInterpretation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiInterpretation_readingId_key" ON "AiInterpretation"("readingId");

-- AddForeignKey
ALTER TABLE "AiInterpretation" ADD CONSTRAINT "AiInterpretation_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "Reading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
