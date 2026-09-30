import type { PrismaClient } from "@prisma/client";

export interface QualitySummary {
  promptVersion: string; model: string; attempts: number; successes: number;
  schemaErrors: number; positionErrors: number; providerErrors: number;
  lengthWarnings: number; duplicateWarnings: number;
}

export async function fetchQualitySummary(db: PrismaClient): Promise<QualitySummary[]> {
  return db.$queryRaw<QualitySummary[]>`
    SELECT "promptVersion", "model", count(*)::int AS "attempts",
      count(*) FILTER (WHERE "outcome" = 'success')::int AS "successes",
      count(*) FILTER (WHERE "outcome" IN ('invalid_schema', 'invalid_json'))::int AS "schemaErrors",
      count(*) FILTER (WHERE "outcome" = 'position_mismatch')::int AS "positionErrors",
      count(*) FILTER (WHERE "outcome" = 'provider_error')::int AS "providerErrors",
      count(*) FILTER (WHERE "overLengthFields" > 0 OR "underLengthFields" > 0)::int AS "lengthWarnings",
      count(*) FILTER (WHERE "duplicateItems" > 0 OR "repeatedSentences" > 0)::int AS "duplicateWarnings"
    FROM "AiGenerationMetric" GROUP BY "promptVersion", "model" ORDER BY "promptVersion" DESC, "model"
  `;
}
