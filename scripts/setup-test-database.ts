#!/usr/bin/env bun
/**
 * Creates the integration-test database and applies every migration from zero.
 *
 * Refuses to touch the development database: see
 * `app/lib/env/test-database.ts`.
 */
import { execFileSync } from "node:child_process";

import { config } from "dotenv";

import {
  databaseName,
  resolveTestDatabaseUrl,
} from "../app/lib/env/test-database";

config();

const testUrl = resolveTestDatabaseUrl(process.env as Record<string, string>);
const name = databaseName(testUrl);

if (!name) {
  throw new Error(
    `Could not determine a database name from TEST_DATABASE_URL.`,
  );
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";

function psql(url: string, sql: string): string {
  return execFileSync("psql", [url, "-tAc", sql], { encoding: "utf8" }).trim();
}

const exists = psql(
  adminUrl.toString(),
  `SELECT 1 FROM pg_database WHERE datname = '${name}'`,
);

if (exists !== "1") {
  psql(adminUrl.toString(), `CREATE DATABASE "${name}"`);
  console.log(`Created database "${name}".`);
} else {
  console.log(`Database "${name}" already exists.`);
}

execFileSync("bunx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testUrl },
});

console.log(`Migrated "${name}" from zero.`);
