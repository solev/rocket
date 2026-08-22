import { defineConfig, devices } from "@playwright/test";

/**
 * The smoke journey runs against a real server and the integration-test
 * database, with **every optional integration unconfigured** — that is the
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
  // One retry absorbs genuine infrastructure flake. It does not make a flaky
  // test acceptable: the journey is meant to be deterministic, so a retry that
  // turns red into green is a bug to fix, not a result to keep.
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
    // The production build, not the dev server. The dev server's dependency
    // optimizer force-reloads the page the first time it discovers a new
    // import, which on a cold clone can wipe a half-filled form and made this
    // journey flaky. The built artifact is also what actually gets deployed,
    // so this is the more faithful target.
    command: `bun run build && bunx react-router-serve ./build/server/index.js`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PORT: String(PORT),
      HOST: "127.0.0.1",
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-smoke-secret-not-for-production",
      BETTER_AUTH_URL: BASE_URL,
      // Production builds have rate limiting on. Naming a trusted header lets
      // Better Auth bucket per caller instead of lumping every request into
      // one shared bucket, which is both the correct deployment setting and
      // what keeps these tests independent of each other.
      AUTH_IP_ADDRESS_HEADER: "x-real-ip",
      // Deliberately empty: the smoke journey proves Rocket runs with no
      // optional integration configured.
      POLAR_ACCESS_TOKEN: "",
      AZURE_OPENAI_RESOURCE_NAME: "",
      AZURE_OPENAI_API_KEY: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  },
});
