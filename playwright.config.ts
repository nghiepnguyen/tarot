import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Vòng bài có bố cục và thao tác riêng cho điện thoại; chạy lại luồng
      // bốc bài trên một máy Chromium cỡ điện thoại, không nhân đôi cả suite.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: ["card-wheel.spec.ts", "reading-flow.spec.ts"],
    },
  ],
});
