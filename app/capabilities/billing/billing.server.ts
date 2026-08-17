import { Polar } from "@polar-sh/sdk";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";

import { CapabilityUnavailableError } from "~/lib/capability";
import { env } from "~/lib/env/env.server";

import {
  BILLING_CAPABILITY,
  BILLING_GUIDE,
  type BillingConfig,
  areWebhooksAvailable,
  isBillingAvailable as isAvailable,
  isProCheckoutAvailable,
} from "./config";

export const billingConfig: BillingConfig = {
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER ?? "sandbox",
  enabled: env.POLAR_ENABLED,
  proProductId: env.POLAR_PRODUCT_PRO_ID,
  webhookSecret: env.POLAR_WEBHOOK_SECRET,
};

/**
 * Side-effect-free availability check. Never throws merely because billing is
 * unconfigured, so loaders may call it to derive a safe `isBillingAvailable`
 * fact for the browser.
 */
export function isBillingAvailable(): boolean {
  return isAvailable(billingConfig);
}

/**
 * Whether webhook delivery is configured. Separate from `isBillingAvailable`
 * because a webhook payload cannot be verified without the secret, so the
 * endpoint must refuse even when billing itself is on.
 */
export function isBillingWebhookAvailable(): boolean {
  return areWebhooksAvailable(billingConfig);
}

export type PolarCustomerState = Awaited<
  ReturnType<Polar["customers"]["getStateExternal"]>
>;

let cachedClient: Polar | null = null;

/**
 * The Polar SDK client.
 *
 * @throws {CapabilityUnavailableError} when billing is not configured.
 */
export function getPolarClient(): Polar {
  if (!isBillingAvailable()) {
    throw new CapabilityUnavailableError(BILLING_CAPABILITY, BILLING_GUIDE);
  }

  cachedClient ??= new Polar({
    accessToken: billingConfig.accessToken,
    server: billingConfig.server,
  });

  return cachedClient;
}

/**
 * Resolves the caller's subscription state, or `null` when billing is
 * unavailable so callers can render a neutral state without branching on
 * configuration themselves.
 */
export async function getCustomerState(
  userId: string,
): Promise<PolarCustomerState | null> {
  if (!isBillingAvailable()) return null;

  return getPolarClient().customers.getStateExternal({ externalId: userId });
}

/**
 * The Better Auth plugin, or `null` when billing is unavailable.
 *
 * Returning `null` keeps the plugin unmounted entirely, so Polar's routes are
 * absent rather than present and failing.
 */
export function createBillingPlugin() {
  if (!isBillingAvailable()) return null;

  return polar({
    client: getPolarClient(),
    createCustomerOnSignUp: true,
    use: [
      checkout({
        products: isProCheckoutAvailable(billingConfig)
          ? [{ productId: billingConfig.proProductId as string, slug: "pro" }]
          : undefined,
        successUrl: "/dashboard?checkout_id={CHECKOUT_ID}",
        authenticatedUsersOnly: true,
      }),
      portal(),
      usage(),
      ...(areWebhooksAvailable(billingConfig)
        ? [
            webhooks({
              secret: billingConfig.webhookSecret as string,
              onOrderPaid: async () => {
                // Grant product entitlements here.
              },
              onCustomerStateChanged: async () => {
                // Sync subscription state into application tables here.
              },
            }),
          ]
        : []),
    ],
  });
}
