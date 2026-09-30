CREATE TABLE "AiGenerationMetric" (
    "id" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "thinkingTokens" INTEGER,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "overLengthFields" INTEGER NOT NULL DEFAULT 0,
    "underLengthFields" INTEGER NOT NULL DEFAULT 0,
    "duplicateItems" INTEGER NOT NULL DEFAULT 0,
    "repeatedSentences" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiGenerationMetric_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiGenerationMetric_promptVersion_model_createdAt_idx" ON "AiGenerationMetric"("promptVersion", "model", "createdAt");
