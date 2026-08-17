import { describe, expect, it } from "vitest";

import {
  nextSlugCandidate,
  organizationNameForUser,
  slugify,
  tokenSlugCandidate,
} from "~/lib/organization/naming";

describe("organization naming", () => {
  describe("organizationNameForUser", () => {
    it("uses the display name when present", () => {
      expect(
        organizationNameForUser({
          name: "Ada Lovelace",
          email: "ada@example.com",
        }),
      ).toBe("Ada Lovelace's Organization");
    });

    it("falls back to the email local part when the name is blank", () => {
      expect(
        organizationNameForUser({ name: "   ", email: "ada@example.com" }),
      ).toBe("ada's Organization");
    });

    it("falls back to a generic name when nothing is usable", () => {
      expect(organizationNameForUser({ name: "", email: "" })).toBe(
        "Personal Organization",
      );
    });
  });

  describe("slugify", () => {
    it.each([
      ["Ada Lovelace's Organization", "ada-lovelaces-organization"],
      ["Ada Lovelace’s Organization", "ada-lovelaces-organization"],
      ["  Spaced   Out  ", "spaced-out"],
      ["Ünicode Ãccents", "unicode-accents"],
      ["!!!", "organization"],
      ["", "organization"],
    ])("slugs %j as %j", (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });

    it("never produces a trailing separator after truncation", () => {
      const slug = slugify(`${"a".repeat(40)} ${"b".repeat(40)}`);

      expect(slug.length).toBeLessThanOrEqual(48);
      expect(slug.endsWith("-")).toBe(false);
    });
  });

  describe("nextSlugCandidate", () => {
    it("returns the base slug on the first attempt", () => {
      expect(nextSlugCandidate("acme", 0)).toBe("acme");
    });

    it("suffixes subsequent attempts so collisions resolve", () => {
      expect(nextSlugCandidate("acme", 1)).toBe("acme-2");
      expect(nextSlugCandidate("acme", 2)).toBe("acme-3");
    });

    it("keeps suffixed candidates within the length budget", () => {
      const candidate = nextSlugCandidate("a".repeat(48), 9);

      expect(candidate.length).toBeLessThanOrEqual(48);
      expect(candidate.endsWith("-10")).toBe(true);
    });
  });

  describe("tokenSlugCandidate", () => {
    it("appends the token", () => {
      expect(tokenSlugCandidate("acme", "V1StGXR8")).toBe("acme-V1StGXR8");
    });

    it("keeps the result within the slug length limit", () => {
      const base = "a".repeat(48);

      const slug = tokenSlugCandidate(base, "V1StGXR8Z5");

      expect(slug.length).toBeLessThanOrEqual(48);
      expect(slug.endsWith("-V1StGXR8Z5")).toBe(true);
    });
  });
});
