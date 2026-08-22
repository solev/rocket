import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { refineServerEnv, serverShape } from "./schema";

/**
 * Validated server environment.
 *
 * This module is server-only: importing it from a client module is a build
 * error via the `.server.ts` suffix, and `createEnv` throws on client access
 * as a second line of defence. Loaders may expose derived, non-secret facts
 * (`isBillingAvailable`) but never these values.
 */
export const env = createEnv({
  server: serverShape,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  createFinalSchema: (shape) => z.object(shape).superRefine(refineServerEnv),
  onValidationError: (issues) => {
    const details = issues
      .map((issue) => {
        const path = issue.path?.join(".") ?? "(root)";
        return `  • ${path}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        "See .env.example for every supported variable. Absent optional variables are fine — partial ones are not.",
    );
  },
});

export type Env = typeof env;
