-- AlterTable
ALTER TABLE "AiInterpretation" ADD COLUMN     "actionSuggestionsList" JSONB,
ADD COLUMN     "closingNote" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "themes" JSONB;
