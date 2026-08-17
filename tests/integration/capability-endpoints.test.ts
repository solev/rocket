import { describe, expect, it } from "vitest";

import {
  isAiChatAvailable,
  getChatModel,
} from "~/capabilities/ai-chat/ai-chat.server";
import {
  isBillingAvailable,
  isBillingWebhookAvailable,
  createBillingPlugin,
  getCustomerState,
  getPolarClient,
} from "~/capabilities/billing/billing.server";
import { CapabilityUnavailableError } from "~/lib/capability";
import {
  action as webhookAction,
  loader as webhookLoader,
} from "~/routes/polar.webhooks";

/**
 * The integration environment configures no optional capability, so this file
 * asserts the guarantee Rocket makes to a fresh clone: unconfigured
 * capabilities are inert, their endpoints refuse, and nothing crashes.
 */

describe("unconfigured capabilities", () => {
  it("reports every optional capability as unavailable", () => {
    expect(isBillingAvailable()).toBe(false);
    expect(isBillingWebhookAvailable()).toBe(false);
    expect(isAiChatAvailable()).toBe(false);
  });

  it("does not mount the billing plugin", () => {
    expect(createBillingPlugin()).toBeNull();
  });

  it("resolves customer state as null instead of throwing", async () => {
    await expect(getCustomerState("any-user")).resolves.toBeNull();
  });

  it.each([
    ["Polar client", () => getPolarClient()],
    ["Azure chat model", () => getChatModel()],
  ])("throws CapabilityUnavailableError for the %s", (_label, invoke) => {
    expect(invoke).toThrow(CapabilityUnavailableError);
  });

  it("refuses webhook deliveries it cannot verify", async () => {
    const response = await webhookAction({
      request: new Request("http://localhost/polar/webhooks", {
        method: "POST",
        body: "{}",
      }),
      params: {},
      context: {} as never,
    });

    expect((response as Response).status).toBe(503);
  });

  it("reports the webhook endpoint as unavailable on GET", async () => {
    const response = await webhookLoader();

    expect((response as Response).status).toBe(503);
  });
});
