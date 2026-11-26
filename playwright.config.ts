import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH,
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    env: {
      API_PORT: "3101",
      // Django's SQLite :memory: DB is per-connection, so e2e runs use a
      // throwaway file that scripts/dev.mjs wipes (WBOOKS_FRESH_DB=1) after
      // running migrations before each run.
      WBOOKS_DB_PATH: "django/e2e-test.sqlite3",
      WBOOKS_FRESH_DB: "1",
      WBOOKS_REGISTER_LIMIT: "200",
      // Process env wins over --env-file, so a local .env cannot change tests.
      GOOGLE_CLIENT_ID: "",
    },
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
