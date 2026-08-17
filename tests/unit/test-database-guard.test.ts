import { describe, expect, it } from "vitest";

import { resolveTestDatabaseUrl } from "~/lib/env/test-database";

const DEV = "postgres://postgres:postgres@localhost:5432/rocket";
const TEST = "postgres://postgres:postgres@localhost:5432/rocket_test";

describe("test database guard", () => {
  it("returns the test connection string when it is safe", () => {
    expect(
      resolveTestDatabaseUrl({ DATABASE_URL: DEV, TEST_DATABASE_URL: TEST }),
    ).toBe(TEST);
  });

  it("refuses to fall back to DATABASE_URL", () => {
    expect(() => resolveTestDatabaseUrl({ DATABASE_URL: DEV })).toThrow(
      /TEST_DATABASE_URL is not set/,
    );
  });

  it("refuses when the test database is the development database", () => {
    expect(() =>
      resolveTestDatabaseUrl({ DATABASE_URL: DEV, TEST_DATABASE_URL: DEV }),
    ).toThrow(/matches DATABASE_URL/);
  });

  it("ignores trailing slashes and case when comparing", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL: DEV,
        TEST_DATABASE_URL: `${DEV.toUpperCase()}/`,
      }),
    ).toThrow(/matches DATABASE_URL/);
  });

  it("refuses a database whose name does not look disposable", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL: DEV,
        TEST_DATABASE_URL: "postgres://postgres@localhost:5432/production",
      }),
    ).toThrow(/does not look like a test database/);
  });

  it("allows a test database when no development database is configured", () => {
    expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: TEST })).toBe(TEST);
  });
});
