#!/usr/bin/env bun
/**
 * Keeps `.env.example` and the environment schema in step, so documented keys
 * cannot drift from validated ones.
 */
import { readFileSync } from "node:fs";

import { serverShape } from "../app/lib/env/schema";

const EXAMPLE_PATH = ".env.example";

const declared = new Set(Object.keys(serverShape));

const documented = new Set(
  readFileSync(EXAMPLE_PATH, "utf8")
    .split("\n")
    .map((line) => line.replace(/^#\s*/, "").trim())
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter((key): key is string => Boolean(key)),
);

// NODE_ENV is supplied by the runtime rather than by an operator.
declared.delete("NODE_ENV");

const missing = [...declared].filter((key) => !documented.has(key)).sort();
const extra = [...documented].filter((key) => !declared.has(key)).sort();

if (missing.length === 0 && extra.length === 0) {
  console.log(`${EXAMPLE_PATH} matches the environment schema.`);
  process.exit(0);
}

if (missing.length > 0) {
  console.error(
    `Declared in the environment schema but absent from ${EXAMPLE_PATH}:\n` +
      missing.map((key) => `  • ${key}`).join("\n"),
  );
}

if (extra.length > 0) {
  console.error(
    `Documented in ${EXAMPLE_PATH} but not declared in the environment schema:\n` +
      extra.map((key) => `  • ${key}`).join("\n"),
  );
}

process.exit(1);
