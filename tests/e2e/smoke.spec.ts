import { type Locator, type Page, expect, test } from "@playwright/test";

/**
 * The minimum journey a Rocket clone must survive with **no optional
 * capability configured**: public page, protected redirect, signup, dashboard,
 * logout, login, and one capability's disabled state.
 *
 * Each run signs up a fresh account so the journey is independent of database
 * state and safe to retry.
 */

const PASSWORD = "correct-horse-battery-staple";

/**
 * Auth rate limits are keyed on the client IP, so tests sharing one address
 * would fail each other. Each test presents its own address from the
 * documentation range (RFC 5737); the per-run base keeps consecutive runs
 * against a reused server from colliding inside a rate-limit window.
 */
const ipBase = Math.floor(Math.random() * 200);
let ipOffset = 0;

function uniqueIp() {
  ipOffset += 1;
  return `203.0.113.${((ipBase + ipOffset) % 254) + 1}`;
}

function uniqueEmail() {
  return `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * A dropdown trigger does nothing until React hydrates, and the click still
 * "succeeds" because the button is already in the server-rendered HTML. Only
 * the menu appearing proves hydration happened, so retry until it does.
 *
 * Re-clicking cannot toggle an open menu shut, because a retry only runs while
 * the item is still missing.
 */
async function openMenu(trigger: Locator, item: Locator) {
  await expect(async () => {
    await trigger.click();
    await expect(item).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

async function submitCredentials(
  page: Page,
  { name, email }: { name?: string; email: string },
) {
  if (name !== undefined) {
    await page.getByLabel(/username/i).fill(name);
  }
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
}

test.describe("smoke journey", () => {
  test.beforeEach(async ({ page }) => {
    // Scoped to the app's own origin: sending the header everywhere would add
    // it to cross-origin font requests too, which then fail CORS preflight.
    const ip = uniqueIp();
    await page.route("/**", async (route) => {
      await route.continue({
        headers: { ...route.request().headers(), "x-real-ip": ip },
      });
    });
  });

  test("public landing page renders", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });

  test("protected route redirects an anonymous visitor to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("password reset is reachable from the login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot your password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByText(/reset your password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send reset link/i }),
    ).toBeVisible();
  });

  test("google sign-in is hidden when the provider is unconfigured", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0);
  });

  test("signup, dashboard, logout, and login round-trip", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/signup");
    await submitCredentials(page, { name: "Smoke Test", email });
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByText(email).first()).toBeVisible();

    // Billing is unconfigured, so the capability must announce itself as
    // unavailable rather than erroring or vanishing.
    await page.goto("/dashboard/billing");
    await expect(page.getByText(/billing is not configured/i)).toBeVisible();

    // Logging out goes through the real control: /logout is POST-only, and a
    // GET must not be able to end a session.
    const getLogout = await page.request.get("/logout", {
      maxRedirects: 0,
    });
    expect(getLogout.status()).toBe(302);

    await page.goto("/dashboard");
    const logOut = page.getByRole("menuitem", { name: /log out/i });
    await openMenu(page.getByRole("button", { name: /smoke test/i }), logOut);
    await logOut.click();

    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);

    await submitCredentials(page, { email });
    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0, {
      timeout: 30_000,
    });

    await page.goto("/dashboard");
    await expect(page.getByText(email).first()).toBeVisible();
  });

  /**
   * Regression test. The auth forms used to be controlled by React state, so
   * anything typed before hydration was discarded by the first state update
   * and the user submitted an empty form. Throttling the CPU makes hydration
   * reliably slow enough to type ahead of it.
   */
  test("credentials typed before hydration are not discarded", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 20 });

    await page.goto("/signup", { waitUntil: "commit" });
    await submitCredentials(page, { name: "Hydration Race", email });
    await page.getByRole("button", { name: /create account/i }).click();

    await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByText(email).first()).toBeVisible();
  });

  /**
   * A page that throws during hydration still looks fine in a screenshot while
   * its event handlers are dead, so the journey would pass over a broken app.
   * Vercel Web Analytics used to do exactly this off-Vercel: its script 404'd
   * and hydration failed with React error #418.
   */
  test("public pages hydrate without browser errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });

    for (const path of ["/", "/login", "/signup", "/forgot-password"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
    }

    expect(errors).toEqual([]);
  });
});
