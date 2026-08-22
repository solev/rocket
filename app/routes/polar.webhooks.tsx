import type { ActionFunctionArgs } from "react-router";
import { isBillingWebhookAvailable } from "~/integrations/billing/billing.server";
import { auth } from "~/lib/auth/auth.server";

/**
 * Polar's webhook handler is registered by the Better Auth plugin, so this
 * route forwards to it. Without a webhook secret the payload signature cannot
 * be verified, and an unverifiable payload must be refused rather than
 * forwarded.
 */
const UNAVAILABLE = "Polar webhooks are not configured";

export async function action({ request }: ActionFunctionArgs) {
  if (!isBillingWebhookAvailable()) {
    return new Response(UNAVAILABLE, { status: 503 });
  }
  return auth.handler(request);
}

export async function loader() {
  return isBillingWebhookAvailable()
    ? new Response("OK")
    : new Response(UNAVAILABLE, { status: 503 });
}
