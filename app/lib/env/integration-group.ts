import { z } from "zod";

/**
 * A non-empty string. Combined with `emptyStringAsUndefined`, an empty
 * variable (`FOO=`) becomes absent rather than a silently valid `""`.
 */
export const nonEmptyString = z.string().min(1);

/**
 * Declares that a group of variables must be supplied together.
 *
 * Absent configuration is valid and means the integration is unavailable;
 * partial configuration is an error rather than a degraded state.
 */
export interface IntegrationGroup {
  integration: string;
  keys: readonly string[];
}

export function refineIntegrationGroups(
  groups: readonly IntegrationGroup[],
  value: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  for (const group of groups) {
    const present = group.keys.filter((key) => value[key] !== undefined);
    if (present.length === 0 || present.length === group.keys.length) continue;

    const missing = group.keys.filter((key) => value[key] === undefined);
    for (const key of missing) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message:
          `The "${group.integration}" integration is partially configured. ` +
          `Set all of ${group.keys.join(", ")} to enable it, or none of them to leave it unavailable. ` +
          `Missing: ${missing.join(", ")}.`,
      });
    }
  }
}
