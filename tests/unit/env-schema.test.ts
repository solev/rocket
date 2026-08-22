import { describe, expect, it } from "vitest";

import { parseServerEnv } from "~/lib/env/schema";

const VALID_DB = "postgres://postgres:postgres@localhost:5432/rocket";

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "test",
    DATABASE_URL: VALID_DB,
    ...overrides,
  };
}

function issuePaths(result: ReturnType<typeof parseServerEnv>) {
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("core environment", () => {
  it("accepts a minimal configuration with every integration absent", () => {
    const result = parseServerEnv(baseEnv());

    expect(result.success).toBe(true);
  });

  it("rejects a missing DATABASE_URL", () => {
    const result = parseServerEnv({ NODE_ENV: "test" });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("DATABASE_URL");
  });

  it("rejects a DATABASE_URL that is not a PostgreSQL connection string", () => {
    const result = parseServerEnv(
      baseEnv({ DATABASE_URL: "mysql://localhost/rocket" }),
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("DATABASE_URL");
  });

  it("treats an empty variable as absent rather than as a valid empty string", () => {
    const result = parseServerEnv(baseEnv({ DATABASE_URL: "" }));

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("DATABASE_URL");
  });

  it("requires signing configuration in production", () => {
    const result = parseServerEnv(baseEnv({ NODE_ENV: "production" }));

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]),
    );
  });

  it("accepts production when signing configuration is present", () => {
    const result = parseServerEnv(
      baseEnv({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "a-secret",
        BETTER_AUTH_URL: "https://example.com",
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("Google sign-in configuration", () => {
  it("is valid when absent", () => {
    const result = parseServerEnv(baseEnv());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.GOOGLE_CLIENT_ID).toBeUndefined();
    }
  });

  it("is valid when fully configured", () => {
    const result = parseServerEnv(
      baseEnv({
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CLIENT_SECRET: "client-secret",
      }),
    );

    expect(result.success).toBe(true);
  });

  it("fails when only the client id is supplied", () => {
    const result = parseServerEnv(baseEnv({ GOOGLE_CLIENT_ID: "client-id" }));

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("GOOGLE_CLIENT_SECRET");
  });

  it("fails when the secret is present but empty", () => {
    const result = parseServerEnv(
      baseEnv({ GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "" }),
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("GOOGLE_CLIENT_SECRET");
  });
});

describe("Azure AI Chat configuration", () => {
  it("is valid when absent", () => {
    expect(parseServerEnv(baseEnv()).success).toBe(true);
  });

  it("fails when only the resource name is supplied", () => {
    const result = parseServerEnv(
      baseEnv({ AZURE_OPENAI_RESOURCE_NAME: "resource" }),
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("AZURE_OPENAI_API_KEY");
  });

  it("allows the deployment name to stay absent when fully configured", () => {
    const result = parseServerEnv(
      baseEnv({
        AZURE_OPENAI_RESOURCE_NAME: "resource",
        AZURE_OPENAI_API_KEY: "key",
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("Polar billing configuration", () => {
  it("is valid when absent", () => {
    expect(parseServerEnv(baseEnv()).success).toBe(true);
  });

  it("is available from the access token alone", () => {
    const result = parseServerEnv(baseEnv({ POLAR_ACCESS_TOKEN: "token" }));

    expect(result.success).toBe(true);
  });

  it("rejects a webhook secret with no access token", () => {
    const result = parseServerEnv(baseEnv({ POLAR_WEBHOOK_SECRET: "secret" }));

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("POLAR_ACCESS_TOKEN");
  });

  it("rejects an unknown Polar server", () => {
    const result = parseServerEnv(
      baseEnv({ POLAR_ACCESS_TOKEN: "token", POLAR_SERVER: "staging" }),
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("POLAR_SERVER");
  });

  it("defaults the kill switch to enabled and honours an explicit false", () => {
    const enabled = parseServerEnv(baseEnv({ POLAR_ACCESS_TOKEN: "token" }));
    const disabled = parseServerEnv(
      baseEnv({ POLAR_ACCESS_TOKEN: "token", POLAR_ENABLED: "false" }),
    );

    expect(enabled.success && enabled.data.POLAR_ENABLED).toBe(true);
    expect(disabled.success && disabled.data.POLAR_ENABLED).toBe(false);
  });
});
