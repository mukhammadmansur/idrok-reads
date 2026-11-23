import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    env: {
      API_PORT: "3101",
      WBOOKS_DB_PATH: ":memory:",
      WBOOKS_REGISTER_LIMIT: "200",
      // Process env wins over --env-file, so a local .env cannot change tests.
      GOOGLE_CLIENT_ID: "",
    },
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
