import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db/client";
import { user, session, account, verification, twoFactor } from "~/db/schema";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

/**
 * Polar billing is opt-in. It activates as soon as POLAR_ACCESS_TOKEN is set;
 * set POLAR_ENABLED=false to force it off even when a token is present.
 *
 * When disabled the Polar plugin is not mounted at all, so sign-up, checkout,
 * the customer portal and webhooks are simply absent instead of failing with a
 * 401 from the Polar API.
 */
export const isPolarEnabled =
  process.env.POLAR_ENABLED !== "false" &&
  Boolean(process.env.POLAR_ACCESS_TOKEN);

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});

const polarPlugin = polar({
  client: polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      // Map Pro plan product ID to a slug for easy client calls
      products: process.env.POLAR_PRODUCT_PRO_ID
        ? [{ productId: process.env.POLAR_PRODUCT_PRO_ID, slug: "pro" }]
        : undefined,
      successUrl: "/dashboard?checkout_id={CHECKOUT_ID}",
      authenticatedUsersOnly: true,
    }),
    portal(),
    usage(),
    ...(process.env.POLAR_WEBHOOK_SECRET
      ? [
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET!,
            onOrderPaid: async (_payload) => {
              // TODO: grant features/flags based on purchase, if needed
              console.log("Polar onOrderPaid");
            },
            onCustomerStateChanged: async (_payload) => {
              // Example hook for syncing state to your DB
            },
          }),
        ]
      : []),
  ],
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      twoFactor,
    },
  }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: isPolarEnabled ? [polarPlugin] : [],
});

export type Auth = typeof auth;
