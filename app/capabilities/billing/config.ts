/**
 * Pure configuration logic for the Polar billing capability.
 *
 * Kept free of environment access and side effects so the availability
 * contract can be tested directly, without a live process environment.
 */

export const BILLING_CAPABILITY = "Polar billing";
export const BILLING_GUIDE = "docs/capabilities/billing.md";

export interface BillingConfig {
  accessToken?: string;
  server: "sandbox" | "production";
  /** Operational kill switch: false disables a fully configured integration. */
  enabled: boolean;
  proProductId?: string;
  webhookSecret?: string;
}

/**
 * Billing is available when an access token is present and the kill switch has
 * not been thrown. Absent configuration is valid and simply means unavailable.
 */
export function isBillingAvailable(config: BillingConfig): boolean {
  return Boolean(config.accessToken) && config.enabled;
}

/** Whether webhook delivery is configured on top of an available integration. */
export function areWebhooksAvailable(config: BillingConfig): boolean {
  return isBillingAvailable(config) && Boolean(config.webhookSecret);
}

/** Whether a purchasable product is mapped to the `pro` checkout slug. */
export function isProCheckoutAvailable(config: BillingConfig): boolean {
  return isBillingAvailable(config) && Boolean(config.proProductId);
}
