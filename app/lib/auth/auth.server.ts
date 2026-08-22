import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";

import { createBillingPlugin } from "~/integrations/billing/billing.server";
import { db } from "~/db/client";
import {
  account,
  member,
  organization,
  session,
  user,
  verification,
} from "~/db/schema";
import { sendEmail } from "~/lib/email/delivery.server";
import { env } from "~/lib/env/env.server";
import { resolveOrganizationIdForUser } from "~/lib/organization/organization.server";

/**
 * Google sign-in is optional. Absent credentials mean the provider is
 * unavailable and is not registered at all; partial credentials fail env
 * validation at start-up rather than producing a button that cannot work.
 */
export const isGoogleSignInAvailable = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

const billingPlugin = createBillingPlugin();

export const auth = betterAuth({
  ...(env.BETTER_AUTH_SECRET ? { secret: env.BETTER_AUTH_SECRET } : {}),
  ...(env.BETTER_AUTH_URL ? { baseURL: env.BETTER_AUTH_URL } : {}),

  /**
   * Rate limits are only as good as the identity they are keyed on. Better
   * Auth will not trust a comma-separated `x-forwarded-for` chain, because
   * behind an appending proxy the leftmost entry is client-controlled — so
   * unless a single trusted header is named, it cannot tell callers apart and
   * buckets everyone together. Naming the header keeps one abusive caller from
   * exhausting the limit for every other user.
   */
  ...(env.AUTH_IP_ADDRESS_HEADER
    ? {
        advanced: {
          ipAddress: { ipAddressHeaders: [env.AUTH_IP_ADDRESS_HEADER] },
        },
      }
    : {}),

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      organization,
      member,
    },
  }),

  emailAndPassword: {
    enabled: true,
    /**
     * Routed through Core's email seam. With no transport configured this
     * prints the link to the console in development and refuses in
     * production — never a silent no-op. See docs/integrations/email.md.
     */
    sendResetPassword: async ({ user: recipient, url }) => {
      // Better Auth emits a relative URL when no baseURL is configured, which
      // is unusable in a message. BETTER_AUTH_URL is required in production,
      // so this fallback only ever applies locally.
      const absoluteUrl = new URL(
        url,
        env.BETTER_AUTH_URL ?? "http://localhost:5173",
      ).toString();

      await sendEmail(
        {
          to: recipient.email,
          subject: "Reset your password",
          text: [
            `A password reset was requested for ${recipient.email}.`,
            "",
            `Reset it here: ${absoluteUrl}`,
            "",
            "If you did not request this, you can ignore this message.",
          ].join("\n"),
        },
        { sensitive: true, nodeEnv: env.NODE_ENV },
      );
    },
  },

  socialProviders: isGoogleSignInAvailable
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},

  session: {
    // Better Auth strips fields it does not know about, so the ownership
    // column must be declared for the hook below to persist it.
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
        input: false,
      },
    },
    // Serve the session from a signed cookie to avoid a database round-trip on
    // every authenticated request.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            await resolveOrganizationIdForUser({
              id: createdUser.id,
              name: createdUser.name,
              email: createdUser.email,
            });
          } catch (error) {
            // Better Auth has already committed the user row by the time this
            // runs and does not roll it back when the hook throws. Left alone,
            // the row reserves the address forever: no account row is ever
            // written, so the person can neither sign in nor sign up again.
            // Removing it makes a failed signup leave no trace, so retrying
            // once the cause is fixed works.
            await db
              .delete(user)
              .where(eq(user.id, createdUser.id))
              .catch(() => {
                // Surfacing the original cause matters more than this cleanup.
              });

            throw error;
          }
        },
      },
    },
    session: {
      create: {
        before: async (newSession) => {
          // Better Auth never populates the active organization itself, so
          // Core resolves it here — otherwise every session would start
          // without an ownership boundary.
          const [owner] = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
            })
            .from(user)
            .where(eq(user.id, newSession.userId))
            .limit(1);

          if (!owner) return;

          const activeOrganizationId =
            await resolveOrganizationIdForUser(owner);

          return { data: { ...newSession, activeOrganizationId } };
        },
      },
    },
  },

  plugins: billingPlugin ? [billingPlugin] : [],
});

export type Auth = typeof auth;
