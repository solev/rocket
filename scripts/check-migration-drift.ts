#!/usr/bin/env bun
/**
 * Fails when the Drizzle schema has changed without committed migration
 * output, so a schema edit can never reach main without its migration.
 */
import { execFileSync } from "node:child_process";

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function migrationStatus(): string {
  return git("status", "--porcelain", "--", "drizzle");
}

const dirtyBefore = migrationStatus();
if (dirtyBefore) {
  console.error(
    "Uncommitted changes already exist under drizzle/, so drift cannot be detected:\n" +
      dirtyBefore,
  );
  process.exit(1);
}

try {
  execFileSync("bunx", ["drizzle-kit", "generate"], { stdio: "inherit" });
} catch {
  console.error("drizzle-kit generate failed.");
  process.exit(1);
}

const dirtyAfter = migrationStatus();
if (dirtyAfter) {
  console.error(
    "\nSchema drift detected. `drizzle-kit generate` produced migration output that is not committed:\n" +
      `${dirtyAfter}\n\n` +
      "Run `bun run db:generate` and commit the result alongside the schema change.",
  );
  process.exit(1);
}

console.log("No migration drift: schema and committed migrations agree.");
