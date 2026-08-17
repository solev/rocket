import { beforeEach, describe, expect, it } from "vitest";

import { auth } from "~/lib/auth/auth.server";
import { requireAuth } from "~/lib/auth/require-auth.server";

import { resetDatabase } from "./helpers";

const PASSWORD = "correct-horse-battery-staple";

async function signUpAndGetCookie(email: string) {
  const response = await auth.api.signUpEmail({
    body: { email, password: PASSWORD, name: "Test User" },
    asResponse: true,
  });

  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("Sign-up did not return a session cookie");
  return cookie;
}

function requestWithCookie(url: string, cookie: string) {
  return new Request(url, { headers: { cookie } });
}

describe("auth boundaries", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("redirects an unauthenticated request to the login page", async () => {
    const request = new Request("http://localhost/dashboard");

    await expect(requireAuth(request)).rejects.toMatchObject({
      status: 302,
    });

    const redirect = await requireAuth(request).catch((error) => error);
    expect(redirect.headers.get("location")).toBe("/login");
  });

  it("resolves the user for an authenticated request", async () => {
    const cookie = await signUpAndGetCookie("member@example.com");

    const user = await requireAuth(
      requestWithCookie("http://localhost/dashboard", cookie),
    );

    expect(user.email).toBe("member@example.com");
  });

  it("rejects an unauthenticated session lookup", async () => {
    const session = await auth.api.getSession({ headers: new Headers() });

    expect(session).toBeNull();
  });

  it("invalidates the session on sign-out", async () => {
    const cookie = await signUpAndGetCookie("member@example.com");
    const headers = new Headers({ cookie });

    expect(await auth.api.getSession({ headers })).not.toBeNull();

    await auth.api.signOut({ headers });

    const request = requestWithCookie("http://localhost/dashboard", cookie);
    await expect(requireAuth(request)).rejects.toMatchObject({ status: 302 });
  });

  it("clears the session cookie on sign-out, not just the database row", async () => {
    const cookie = await signUpAndGetCookie("member@example.com");

    const { action: logout } = await import("~/routes/logout");
    const response = await logout({
      request: new Request("http://localhost/logout", {
        method: "POST",
        headers: { cookie },
      }),
    });

    // The session cookie cache would keep a "signed out" visitor authenticated
    // until it expired if the clearing headers were dropped here.
    const clearing = (response as Response).headers.getSetCookie();
    expect(clearing.length).toBeGreaterThan(0);
    expect(clearing.join(";")).toMatch(/max-age=0|expires=/i);
  });

  it("refuses a sign-in with the wrong password", async () => {
    await signUpAndGetCookie("member@example.com");

    await expect(
      auth.api.signInEmail({
        body: { email: "member@example.com", password: "wrong-password" },
      }),
    ).rejects.toThrow();
  });
});
