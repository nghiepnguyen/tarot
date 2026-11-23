import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./test/release", testMatch: "release.spec.ts", workers: 1, timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3008", contextOptions: { reducedMotion: "reduce" }, trace: "retain-on-failure" },
  webServer: { command: "node test/release/server.mjs", url: "http://127.0.0.1:3008/login", reuseExistingServer: false, timeout: 60_000 },
});
