import { beforeEach, describe, expect, it } from "vitest";

import { auth } from "~/lib/auth/auth.server";
import { db } from "~/db/client";
import { member, organization } from "~/db/schema";
import { findActiveOrganizationId } from "~/lib/organization/organization.server";

import { resetDatabase } from "./helpers";

/**
 * Organization-aware ownership is Core, so every user must end up inside
 * exactly one organization without any management surface being involved.
 */

async function signUp(email: string, name = "Test User") {
  return auth.api.signUpEmail({
    body: { email, password: "correct-horse-battery-staple", name },
  });
}

describe("single-organization mode", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("provisions exactly one organization when a user signs up", async () => {
    const result = await signUp("owner@example.com", "Ada Lovelace");
    expect(result.user).toBeDefined();

    const organizations = await db.select().from(organization);
    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toBe("Ada Lovelace's Organization");
    expect(organizations[0].slug).toBe("ada-lovelaces-organization");
  });

  it("makes the signing-up user the owner of their organization", async () => {
    const result = await signUp("owner@example.com");

    const members = await db.select().from(member);
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(result.user.id);
    expect(members[0].role).toBe("owner");
  });

  it("gives each user their own separate organization", async () => {
    const first = await signUp("first@example.com", "First User");
    const second = await signUp("second@example.com", "Second User");

    const firstOrg = await findActiveOrganizationId(first.user.id);
    const secondOrg = await findActiveOrganizationId(second.user.id);

    expect(firstOrg).toBeTruthy();
    expect(secondOrg).toBeTruthy();
    expect(firstOrg).not.toBe(secondOrg);
    expect(await db.select().from(organization)).toHaveLength(2);
  });

  it("keeps organization slugs unique when names collide", async () => {
    await signUp("first@example.com", "Same Name");
    await signUp("second@example.com", "Same Name");

    const organizations = await db.select().from(organization);
    const slugs = organizations.map((row) => row.slug);

    expect(organizations).toHaveLength(2);
    expect(new Set(slugs).size).toBe(2);
  });

  it("records the active organization on the session", async () => {
    const result = await signUp("owner@example.com");
    const expected = await findActiveOrganizationId(result.user.id);

    const sessions = await db.query.session.findMany();
    expect(sessions.length).toBeGreaterThan(0);
    for (const row of sessions) {
      expect(row.activeOrganizationId).toBe(expected);
    }
  });

  it("exposes no organization management endpoints", async () => {
    // Management was deliberately dropped, so the Better Auth organization
    // plugin must not be mounted. Its routes should not exist.
    const response = await auth.handler(
      new Request("http://localhost/api/auth/organization/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Sneaky", slug: "sneaky" }),
      }),
    );

    expect(response.status).toBe(404);
    expect(await db.select().from(organization)).toHaveLength(0);
  });

  /**
   * Regression test. Slugs used to be disambiguated by counting upwards with a
   * hard cap, so once enough people shared a display name the allocator ran
   * out of candidates and signup failed outright with a server error.
   */
  it("lets many users with the same display name all sign up", async () => {
    const count = 15;

    for (let i = 0; i < count; i++) {
      const result = await signUp(`namesake-${i}@example.com`, "John Smith");
      expect(result.user).toBeDefined();
    }

    const organizations = await db.select().from(organization);
    expect(organizations).toHaveLength(count);

    const slugs = new Set(organizations.map((o) => o.slug));
    expect(slugs.size).toBe(count);

    const members = await db.select().from(member);
    expect(members).toHaveLength(count);
  });
});
