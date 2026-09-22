-- CreateTable
CREATE TABLE "InterpretationReview" (
    "id" TEXT NOT NULL,
    "interpretationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "actionability" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationReview_interpretationId_key" ON "InterpretationReview"("interpretationId");

-- CreateIndex
CREATE INDEX "InterpretationReview_createdAt_idx" ON "InterpretationReview"("createdAt");

-- AddForeignKey
ALTER TABLE "InterpretationReview" ADD CONSTRAINT "InterpretationReview_interpretationId_fkey" FOREIGN KEY ("interpretationId") REFERENCES "AiInterpretation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
