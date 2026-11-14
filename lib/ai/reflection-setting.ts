import "server-only";
import { prisma } from "@/lib/db/prisma";
import { reportHandledError } from "@/lib/monitoring/report";

export const REFLECTION_SETTING_KEY = "ai.reflection.enabled";

export async function isReflectionEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: REFLECTION_SETTING_KEY },
      select: { value: true },
    });
    return (setting?.value ?? process.env.TAROT_REFLECTION_ENABLED) === "1";
  } catch (error) {
    reportHandledError(error, { area: "reflection-setting-read" });
    return false;
  }
}
