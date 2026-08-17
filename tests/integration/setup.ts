import { config } from "dotenv";

import { capabilityServerShape } from "~/lib/env/schema";
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

/**
 * Rocket's central promise is that a clone works with **no optional capability
 * configured**, so the integration suite asserts exactly that state. Clearing
 * every capability variable makes the run independent of whatever happens to
 * sit in the developer's own `.env`.
 *
 * Configured-state behavior is covered by the capability unit tests, which
 * exercise pure config objects instead of the process environment.
 */
for (const key of Object.keys(capabilityServerShape)) {
  delete process.env[key];
}

export { testDatabaseUrl };
