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

function uniqueEmail() {
  return `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Typing into a server-rendered form before React hydrates lets the first
 * client render overwrite the value. Re-filling until the value sticks makes
 * the journey independent of hydration timing.
 */
async function fillStable(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

async function submitCredentials(
  page: Page,
  { name, email }: { name?: string; email: string },
) {
  if (name !== undefined) {
    await fillStable(page.getByLabel(/username/i), name);
  }
  await fillStable(page.getByLabel(/email/i), email);
  await fillStable(page.getByLabel("Password", { exact: true }), PASSWORD);
}

test.describe("smoke journey", () => {
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
    await page.getByRole("button", { name: /smoke test/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();

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
});
