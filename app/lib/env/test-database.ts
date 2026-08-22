/**
 * Guards database integration tests against destroying development data.
 *
 * Tests truncate and re-migrate whatever they connect to, so pointing them at
 * the development database is unrecoverable. This refuses to hand back a
 * connection string unless it is explicitly a test database and demonstrably
 * not the development one.
 */
export function resolveTestDatabaseUrl(
  raw: Record<string, string | undefined>,
): string {
  const testUrl = raw.TEST_DATABASE_URL?.trim();
  const devUrl = raw.DATABASE_URL?.trim();

  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Database integration tests require a dedicated database; " +
        "they will not fall back to DATABASE_URL. See .env.example.",
    );
  }

  if (devUrl && normalize(testUrl) === normalize(devUrl)) {
    throw new Error(
      "TEST_DATABASE_URL matches DATABASE_URL. Tests truncate and re-migrate the database they " +
        "connect to, so they refuse to run against the development database.",
    );
  }

  const name = databaseName(testUrl);
  if (name && !/test/i.test(name)) {
    throw new Error(
      `TEST_DATABASE_URL points at a database named "${name}", which does not look like a test database. ` +
        'Include "test" in the database name to confirm it is disposable.',
    );
  }

  return testUrl;
}

function normalize(url: string): string {
  return url.replace(/\/+$/, "").toLowerCase();
}

export function databaseName(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname.replace(/^\//, "");
    return pathname === "" ? undefined : decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
}
