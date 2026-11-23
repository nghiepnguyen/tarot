interface RecoveryEnv {
  RECOVERY_URL: string;
  RECOVERY_SECRET: string;
}

// Scheduled-only: no public fetch handler or retries that could hide an unknown settlement.
const worker = {
  async scheduled(event: { noRetry(): void }, env: RecoveryEnv): Promise<void> {
    try {
      event.noRetry();
      const url = new URL(env.RECOVERY_URL);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.port
        || url.pathname !== "/api/cron/recover-unlocks" || url.hostname.endsWith(".invalid")
        || !/^[A-Za-z0-9_-]{32,}$/.test(env.RECOVERY_SECRET ?? "")) throw new Error("Invalid recovery configuration");
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("Recovery request timeout")); }, 55_000);
      });
      try {
        await Promise.race([
          (async () => {
            const response = await fetch(url.href, {
              method: "GET", headers: { Authorization: `Bearer ${env.RECOVERY_SECRET}` },
              redirect: "error", signal: controller.signal,
            });
            if (!response.ok) throw new Error("Recovery HTTP failure");
            const result = await response.json() as { ok?: boolean } | null;
            if (result?.ok !== true) throw new Error("Recovery not confirmed");
          })(), timeout,
        ]);
      } finally { clearTimeout(timer); }
    } catch {
      throw new Error("Unlock recovery scheduler failed");
    }
  },
};

export default worker;
