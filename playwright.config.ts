import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 1,
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  webServer: [
    { command: "pnpm --filter @qida/api dev", port: 3000, reuseExistingServer: true },
    { command: "pnpm --filter @qida/web dev --host 127.0.0.1", port: 5173, reuseExistingServer: true },
  ],
});

