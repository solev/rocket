import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { action as forgotPasswordAction } from "~/routes/forgot-password";
import { action as resetPasswordAction } from "~/routes/reset-password";
import { auth } from "~/lib/auth/auth.server";
import {
  type EmailMessage,
  setEmailTransport,
} from "~/lib/email/delivery.server";

import { resetDatabase } from "./helpers";

/**
 * Password reset must be reachable with no transactional email capability
 * present. See https://github.com/solev/rocket/issues/12.
 */

const EMAIL = "member@example.com";
const ORIGINAL_PASSWORD = "correct-horse-battery-staple";

async function signUp() {
  await auth.api.signUpEmail({
    body: { email: EMAIL, password: ORIGINAL_PASSWORD, name: "Test User" },
  });
}

function postForm(url: string, fields: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new Request(url, { method: "POST", body });
}

function captureResetLink() {
  const captured: { url: string } = { url: "" };
  setEmailTransport({
    name: "capture",
    async send(message: EmailMessage) {
      captured.url = /https?:\/\/\S+/.exec(message.text)?.[0] ?? "";
    },
  });
  return captured;
}

/** Better Auth issues the token as a path segment, not a query parameter. */
function tokenFromResetLink(url: string) {
  const path = new URL(url).pathname;
  return path.slice(path.lastIndexOf("/") + 1);
}

describe("password reset without an email capability", () => {
  beforeEach(async () => {
    await resetDatabase();
    setEmailTransport(null);
  });

  afterEach(() => {
    setEmailTransport(null);
    vi.restoreAllMocks();
  });

  it("delivers the reset link through an application-provided transport", async () => {
    await signUp();

    const sent: EmailMessage[] = [];
    setEmailTransport({
      name: "test",
      async send(message) {
        sent.push(message);
      },
    });

    await auth.api.forgetPassword({
      body: { email: EMAIL, redirectTo: "/reset-password" },
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(EMAIL);
    expect(sent[0].text).toContain("/reset-password");
  });

  it("emits an absolute link even with no BETTER_AUTH_URL configured", async () => {
    await signUp();
    const captured = captureResetLink();

    await auth.api.forgetPassword({
      body: { email: EMAIL, redirectTo: "/reset-password" },
    });

    expect(() => new URL(captured.url)).not.toThrow();
    expect(captured.url).toMatch(/^https?:\/\//);
  });

  it("falls back to the console in development instead of failing", async () => {
    await signUp();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      auth.api.forgetPassword({
        body: { email: EMAIL, redirectTo: "/reset-password" },
      }),
    ).resolves.toBeDefined();

    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain("No email transport configured");
  });

  it("does not reveal whether an address is registered", async () => {
    await signUp();
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const known = await forgotPasswordAction({
      request: postForm("http://localhost/forgot-password", { email: EMAIL }),
      params: {},
      context: {} as never,
    });
    const unknown = await forgotPasswordAction({
      request: postForm("http://localhost/forgot-password", {
        email: "nobody@example.com",
      }),
      params: {},
      context: {} as never,
    });

    expect(unknown).toEqual(known);
    expect(known).not.toHaveProperty("error");
  });

  it("completes a full reset with the delivered token", async () => {
    await signUp();
    const captured = captureResetLink();

    await auth.api.forgetPassword({
      body: { email: EMAIL, redirectTo: "/reset-password" },
    });

    const token = tokenFromResetLink(captured.url);
    expect(token).toBeTruthy();

    const redirectResponse = await resetPasswordAction({
      request: postForm("http://localhost/reset-password", {
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      }),
      params: { token },
      context: {} as never,
    }).catch((thrown) => thrown);

    expect(redirectResponse).toBeInstanceOf(Response);
    expect((redirectResponse as Response).status).toBe(302);

    const session = await auth.api.signInEmail({
      body: { email: EMAIL, password: "a-brand-new-password" },
    });
    expect(session.user.email).toBe(EMAIL);

    await expect(
      auth.api.signInEmail({
        body: { email: EMAIL, password: ORIGINAL_PASSWORD },
      }),
    ).rejects.toThrow();
  });

  it("refuses a reset when the confirmation does not match", async () => {
    const result = await resetPasswordAction({
      request: postForm("http://localhost/reset-password", {
        password: "a-brand-new-password",
        confirmPassword: "something-else-entirely",
      }),
      params: { token: "irrelevant" },
      context: {} as never,
    });

    expect(result).toEqual({ error: "The two passwords do not match." });
  });

  it("rejects an expired or forged token", async () => {
    const result = await resetPasswordAction({
      request: postForm("http://localhost/reset-password", {
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      }),
      params: { token: "not-a-real-token" },
      context: {} as never,
    });

    expect(result).toMatchObject({
      error: expect.stringContaining("invalid or has expired"),
    });
  });
});
