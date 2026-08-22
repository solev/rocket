import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Signup writes the user row and provisions its organization in two separate
 * steps. Better Auth commits the user first and does not roll it back when a
 * `create.after` hook throws, so a failure between the two used to strand a
 * user row with no credentials behind it.
 *
 * That is worse than a plain error: the address is taken, so the person can
 * neither sign in (no account row exists) nor sign up again. It is reachable
 * whenever organization provisioning fails — an unapplied migration, a
 * connectivity blip — so a failed signup must leave nothing behind.
 */

const provisioning = vi.hoisted(() => ({ shouldFail: false }));

vi.mock("~/lib/organization/organization.server", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("~/lib/organization/organization.server")
    >();

  return {
    ...actual,
    resolveOrganizationIdForUser: async (
      owner: Parameters<typeof actual.resolveOrganizationIdForUser>[0],
    ) => {
      if (provisioning.shouldFail) {
        throw new Error("simulated organization provisioning outage");
      }
      return actual.resolveOrganizationIdForUser(owner);
    },
  };
});

import { db } from "~/db/client";
import { account, user } from "~/db/schema";
import { auth } from "~/lib/auth/auth.server";

import { resetDatabase } from "./helpers";

const PASSWORD = "correct-horse-battery-staple";

async function signUp(email: string, name = "Test User") {
  return auth.api.signUpEmail({ body: { email, password: PASSWORD, name } });
}

describe("signup when organization provisioning fails", () => {
  beforeEach(async () => {
    provisioning.shouldFail = false;
    await resetDatabase();
  });

  it("reports the failure to the caller", async () => {
    provisioning.shouldFail = true;

    await expect(signUp("outage@example.com")).rejects.toThrow();
  });

  it("leaves no user row behind", async () => {
    provisioning.shouldFail = true;

    await expect(signUp("outage@example.com")).rejects.toThrow();

    expect(await db.select().from(user)).toHaveLength(0);
    expect(await db.select().from(account)).toHaveLength(0);
  });

  it("keeps the address usable once provisioning recovers", async () => {
    provisioning.shouldFail = true;
    await expect(signUp("outage@example.com")).rejects.toThrow();

    provisioning.shouldFail = false;
    const result = await signUp("outage@example.com", "Recovered User");

    expect(result.user.email).toBe("outage@example.com");
    expect(await db.select().from(user)).toHaveLength(1);
  });
});
