import { defineConfig, devices } from "@playwright/test";

/**
 * The smoke journey runs against a real server and the integration-test
 * database, with **every optional capability unconfigured** — that is the
 * configuration Rocket promises a fresh clone can run.
 */

const PORT = Number(process.env.E2E_PORT ?? 5273);
const BASE_URL = `http://127.0.0.1:${PORT}`;

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/rocket_test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `bunx react-router dev --port ${PORT} --host 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-smoke-secret-not-for-production",
      BETTER_AUTH_URL: BASE_URL,
      // Deliberately empty: the smoke journey proves Rocket runs with no
      // optional capability configured.
      POLAR_ACCESS_TOKEN: "",
      AZURE_OPENAI_RESOURCE_NAME: "",
      AZURE_OPENAI_API_KEY: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  },
});
