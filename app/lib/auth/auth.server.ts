import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db/client";
import { user, session, account, verification, twoFactor } from "~/db/schema";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
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
  plugins: [
    polar({
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
    }),
  ],
});

export type Auth = typeof auth;
