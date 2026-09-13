-- AlterTable
ALTER TABLE "AiInterpretation" ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "latencyMs" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "thinkingTokens" INTEGER;
