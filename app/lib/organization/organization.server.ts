import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db/client";
import { member, organization } from "~/db/schema";

import { nextSlugCandidate, organizationNameForUser, slugify } from "./naming";

/**
 * Organization-aware ownership, Core's universal data boundary.
 *
 * Rocket runs in **single-organization mode**: exactly one organization is
 * provisioned per user behind the scenes and no management surface is exposed.
 * Application data should still be scoped by organization id, so that adding a
 * management experience later never requires a data migration.
 */

const MAX_SLUG_ATTEMPTS = 10;

/** Creates the organization a new user owns, and returns its id. */
export async function provisionOrganizationForUser(user: {
  id: string;
  name?: string | null;
  email: string;
}): Promise<string> {
  const name = organizationNameForUser(user);
  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = nextSlugCandidate(baseSlug, attempt);

    const [created] = await db
      .insert(organization)
      .values({ id: nanoid(), name, slug })
      .onConflictDoNothing({ target: organization.slug })
      .returning({ id: organization.id });

    if (!created) continue;

    await db.insert(member).values({
      id: nanoid(),
      organizationId: created.id,
      userId: user.id,
      role: "owner",
    });

    return created.id;
  }

  throw new Error(
    `Could not allocate a unique organization slug for user ${user.id} after ${MAX_SLUG_ATTEMPTS} attempts.`,
  );
}

/** The organization a user acts within, or `null` if they have none yet. */
export async function findActiveOrganizationId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .orderBy(member.createdAt)
    .limit(1);

  return row?.organizationId ?? null;
}

/**
 * Resolves the caller's organization, provisioning one if it is missing.
 *
 * Users created before organization ownership existed have no membership, so
 * this heals them on next sign-in rather than failing.
 */
export async function resolveOrganizationIdForUser(user: {
  id: string;
  name?: string | null;
  email: string;
}): Promise<string> {
  const existing = await findActiveOrganizationId(user.id);
  if (existing) return existing;

  return provisionOrganizationForUser(user);
}

/** Whether a user belongs to an organization. Use before scoping any query. */
export async function isMemberOfOrganization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return Boolean(row);
}
