import { config } from "dotenv";

import { integrationServerShape } from "~/lib/env/schema";
import { resolveTestDatabaseUrl } from "~/lib/env/test-database";

config();

/**
 * Points the process at the integration-test database before any module reads
 * the environment, and refuses to run against the development database.
 */
const testDatabaseUrl = resolveTestDatabaseUrl(
  process.env as Record<string, string | undefined>,
);

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
// Better Auth derives the origin from the incoming request without this, which
// makes callback and reset URLs depend on whichever request built them.
process.env.BETTER_AUTH_URL ??= "http://localhost:5173";

/**
 * Rocket's central promise is that a clone works with **no optional integration
 * configured**, so the integration suite asserts exactly that state. Clearing
 * every integration variable makes the run independent of whatever happens to
 * sit in the developer's own `.env`.
 *
 * Configured-state behavior is covered by the integration unit tests, which
 * exercise pure config objects instead of the process environment.
 */
for (const key of Object.keys(integrationServerShape)) {
  delete process.env[key];
}

export { testDatabaseUrl };
