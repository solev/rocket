import { z } from "zod";

import {
  type CapabilityGroup,
  nonEmptyString,
  refineCapabilityGroups,
} from "./capability-group";

const postgresUrl = nonEmptyString.refine(
  (value) =>
    value.startsWith("postgres://") || value.startsWith("postgresql://"),
  { message: "Must be a PostgreSQL connection string (postgres://…)" },
);

/**
 * Variables every Rocket application requires, plus the optional Core
 * variables that Core itself consumes.
 */
export const coreServerShape = {
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: postgresUrl,

  /**
   * Connection string used by database integration tests. Required by the test
   * harness rather than by the application, so it stays optional here.
   */
  TEST_DATABASE_URL: postgresUrl.optional(),

  /** Signing secret for sessions. Required in production. */
  BETTER_AUTH_SECRET: nonEmptyString.optional(),
  /** Absolute origin of the deployed application. Required in production. */
  BETTER_AUTH_URL: nonEmptyString.url().optional(),

  /**
   * The single request header your proxy sets to the real client IP, used to
   * bucket auth rate limits per caller.
   *
   * Without it Better Auth cannot identify the caller and falls back to one
   * shared bucket per path, so a handful of failed sign-ins from anyone locks
   * out everyone. Values are platform-specific: `x-real-ip` for most reverse
   * proxies, `cf-connecting-ip` behind Cloudflare, `fly-client-ip` on Fly.
   *
   * Name a header your proxy always overwrites. A client can forge any header
   * the proxy passes through, and a forged value defeats the rate limit.
   */
  AUTH_IP_ADDRESS_HEADER: nonEmptyString.optional(),

  /**
   * Set automatically by Vercel. Web Analytics only has an endpoint to report
   * to when the app is actually served by Vercel, so this decides whether the
   * client script is worth loading at all.
   */
  VERCEL: nonEmptyString.optional(),
} as const;

/**
 * Provider-specific variables. Each group is owned by the capability it
 * belongs to: absent means unavailable, partial means startup failure.
 */
export const capabilityServerShape = {
  GOOGLE_CLIENT_ID: nonEmptyString.optional(),
  GOOGLE_CLIENT_SECRET: nonEmptyString.optional(),

  AZURE_OPENAI_RESOURCE_NAME: nonEmptyString.optional(),
  AZURE_OPENAI_API_KEY: nonEmptyString.optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: nonEmptyString.optional(),

  POLAR_ACCESS_TOKEN: nonEmptyString.optional(),
  POLAR_SERVER: z.enum(["sandbox", "production"]).optional(),
  POLAR_PRODUCT_PRO_ID: nonEmptyString.optional(),
  POLAR_WEBHOOK_SECRET: nonEmptyString.optional(),
  /** Operational kill switch for a configured Polar integration. */
  POLAR_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
} as const;

export const serverShape = {
  ...coreServerShape,
  ...capabilityServerShape,
} as const;

/**
 * Groups whose members must be supplied together.
 *
 * Polar is deliberately absent: only `POLAR_ACCESS_TOKEN` is required to make
 * billing available, and the remaining Polar variables unlock individual
 * features rather than the capability as a whole.
 */
export const capabilityGroups: readonly CapabilityGroup[] = [
  {
    capability: "Google sign-in",
    keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    capability: "Azure AI Chat",
    keys: ["AZURE_OPENAI_RESOURCE_NAME", "AZURE_OPENAI_API_KEY"],
  },
];

export function refineServerEnv(
  value: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  refineCapabilityGroups(capabilityGroups, value, ctx);

  if (value.NODE_ENV === "production") {
    for (const key of ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const) {
      if (value[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production.`,
        });
      }
    }
  }

  if (
    value.POLAR_WEBHOOK_SECRET !== undefined &&
    value.POLAR_ACCESS_TOKEN === undefined
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["POLAR_ACCESS_TOKEN"],
      message:
        "POLAR_WEBHOOK_SECRET is set without POLAR_ACCESS_TOKEN, so webhooks would be received for an unconfigured integration.",
    });
  }
}

export const serverEnvSchema = z
  .object(serverShape)
  .superRefine(refineServerEnv);

/**
 * Treats an empty variable as absent, matching `emptyStringAsUndefined` in the
 * runtime env. Exported so tests exercise the same normalization the
 * application uses.
 */
export function normalizeRawEnv(
  raw: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[key] = value === "" ? undefined : value;
  }
  return normalized;
}

export function parseServerEnv(raw: Record<string, string | undefined>) {
  return serverEnvSchema.safeParse(normalizeRawEnv(raw));
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;
