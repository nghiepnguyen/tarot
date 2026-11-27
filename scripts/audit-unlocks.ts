/** Explicit opt-in local/test read-only dry run; never loads .env or falls back to DATABASE_URL. */
import { PrismaClient } from "@prisma/client";
import { collectUnlockAudit, validateUnlockAuditTarget } from "../lib/ai/unlock-audit";
async function main() {
  let db: PrismaClient | undefined;
  try {
    const args = process.argv.slice(2);
    if (!args.includes("--dry-run")) throw new Error("Explicit dry run required");
    const options: { after?: string; readingId?: string; limit?: number } = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--dry-run") continue;
      const flag = args[i], value = args[++i];
      if (!value || !["--after", "--reading", "--limit"].includes(flag)) throw new Error("Invalid arguments");
      if (flag === "--limit") options.limit = Number(value);
      else if (flag === "--after") options.after = value;
      else options.readingId = value;
    }
    const url = process.env.UNLOCK_AUDIT_DATABASE_URL;
    if (!url) throw new Error("Missing audit URL");
    validateUnlockAuditTarget(url);
    db = new PrismaClient({ datasources: { db: { url } } });
    console.log(JSON.stringify(await collectUnlockAudit(db, options), null, 2));
  } catch {
    console.error("Unlock audit failed. Use --dry-run [--reading ID] [--after ID] [--limit 1..100] with explicit UNLOCK_AUDIT_DATABASE_URL pointing to the isolated localhost credit_test/tarot_credit_task3 test database. No automatic adjustments are available.");
    process.exitCode = 1;
  } finally { await db?.$disconnect().catch(() => {}); }
}
void main();
