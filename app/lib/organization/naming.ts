/**
 * Derives an organization name and URL-safe slug for a newly signed-up user.
 *
 * Pure so the naming rules can be tested without a database.
 */

export function organizationNameForUser(user: {
  name?: string | null;
  email: string;
}): string {
  const name = user.name?.trim();
  if (name) return `${name}'s Organization`;

  const localPart = user.email.split("@")[0]?.trim();
  return localPart ? `${localPart}'s Organization` : "Personal Organization";
}

/**
 * Builds a URL-safe slug. Callers must still handle collisions, since slugs
 * are unique across organizations.
 */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Drop apostrophes rather than turning them into separators, so
    // "Ada Lovelace's Organization" slugs as "ada-lovelaces-organization".
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");

  return slug || "organization";
}

/** Appends a numeric suffix to disambiguate a taken slug. */
export function nextSlugCandidate(base: string, attempt: number): string {
  if (attempt === 0) return base;
  const suffix = `-${attempt + 1}`;
  return `${base.slice(0, 48 - suffix.length)}${suffix}`;
}
