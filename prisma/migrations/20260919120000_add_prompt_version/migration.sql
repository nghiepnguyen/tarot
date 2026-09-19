-- AlterTable
ALTER TABLE "AiInterpretation" ADD COLUMN "promptVersion" TEXT;

-- Backfill chỉ những row chứng minh được.
--
-- Bản prompt dài và việc ghi token usage lên cùng một ngày, 13/09/2026, nên
-- "có inputTokens" đồng nghĩa với "sinh bằng bản prompt dài". Row không có
-- token thì không có cách nào biết, và cũng không có số đo nào để so sánh —
-- để NULL, trang /admin/prompts gom chúng vào một dòng "(chưa ghi)" thay vì
-- gán cho chúng một id nghe như sự thật.
UPDATE "AiInterpretation"
SET "promptVersion" = 'v1-2026-09-13'
WHERE "inputTokens" IS NOT NULL;

-- CreateIndex
CREATE INDEX "AiInterpretation_promptVersion_idx" ON "AiInterpretation"("promptVersion");
