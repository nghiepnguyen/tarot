import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recoverStaleUnlocks } from "@/lib/ai/unlock-recovery";
import { UnlockDeadline, withTimeout } from "@/lib/ai/unlock-deadline";
import { reportHandledError } from "@/lib/monitoring/report";

export const maxDuration = 60;
// Not scheduled in vercel.json until production cutover and recovery ownership are approved.
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Chưa cấu hình CRON_SECRET." }, { status: 503, headers });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "Không có quyền." }, { status: 401, headers });
  const deadline = new UnlockDeadline(45_000);
  try {
    const result = await withTimeout(deadline.remainingMs(), () => recoverStaleUnlocks(prisma, deadline));
    const ok = result.failed === 0 && result.deferred === 0;
    return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 503, headers });
  } catch {
    try { reportHandledError(new Error("Unlock recovery batch failed"), { area: "ai-unlock-recovery" }); } catch { /* Recovery must fail closed even if reporting fails. */ }
    return NextResponse.json({ ok: false, error: "Chưa thể hoàn tất đối soát unlock." }, { status: 503, headers });
  }
}
