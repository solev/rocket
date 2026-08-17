import { describe, expect, it } from "vitest";

import {
  BILLING_CAPABILITY,
  BILLING_GUIDE,
  type BillingConfig,
  areWebhooksAvailable,
  isBillingAvailable,
  isProCheckoutAvailable,
} from "~/capabilities/billing/config";
import {
  AI_CHAT_CAPABILITY,
  AI_CHAT_GUIDE,
  type AiChatConfig,
  DEFAULT_DEPLOYMENT_NAME,
  isAiChatAvailable,
  resolveDeploymentName,
} from "~/capabilities/ai-chat/config";
import {
  CapabilityUnavailableError,
  requireCapability,
} from "~/lib/capability";

/**
 * Every capability must behave identically across four states:
 *
 * 1. absent        — no configuration at all; the app still works
 * 2. partial       — rejected at startup by env validation (see env-schema tests)
 * 3. unavailable   — behavior invoked anyway; throws a named, guiding error
 * 4. configured    — fully available
 */

const NO_BILLING: BillingConfig = { server: "sandbox", enabled: true };
const CONFIGURED_BILLING: BillingConfig = {
  accessToken: "polar_at_test",
  server: "sandbox",
  enabled: true,
  proProductId: "prod_123",
  webhookSecret: "whsec_test",
};

const NO_AI: AiChatConfig = {};
const CONFIGURED_AI: AiChatConfig = {
  resourceName: "my-resource",
  apiKey: "azure-key",
};

describe("capability contract", () => {
  describe("CapabilityUnavailableError", () => {
    it("names the capability and points at its guide", () => {
      const error = new CapabilityUnavailableError(
        BILLING_CAPABILITY,
        BILLING_GUIDE,
      );

      expect(error.name).toBe("CapabilityUnavailableError");
      expect(error.capability).toBe(BILLING_CAPABILITY);
      expect(error.message).toContain(BILLING_CAPABILITY);
      expect(error.message).toContain(BILLING_GUIDE);
    });

    it("still guides the reader when no guide is supplied", () => {
      const error = new CapabilityUnavailableError("Something");

      expect(error.message).toContain("capability guide");
    });

    it("never leaks a configuration value", () => {
      const error = new CapabilityUnavailableError(
        BILLING_CAPABILITY,
        BILLING_GUIDE,
      );

      expect(error.message).not.toContain("polar_at_test");
    });
  });

  describe("requireCapability", () => {
    it("returns the value when the capability is available", () => {
      const client = { id: "client" };

      expect(requireCapability("Billing", client)).toBe(client);
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("throws for %s", (_label, value) => {
      expect(() => requireCapability("Billing", value, BILLING_GUIDE)).toThrow(
        CapabilityUnavailableError,
      );
    });

    it("does not treat falsy-but-present values as absent", () => {
      expect(requireCapability("Billing", 0)).toBe(0);
      expect(requireCapability("Billing", "")).toBe("");
      expect(requireCapability("Billing", false)).toBe(false);
    });
  });

  describe("Polar billing availability", () => {
    it("is unavailable when absent", () => {
      expect(isBillingAvailable(NO_BILLING)).toBe(false);
    });

    it("is available when fully configured", () => {
      expect(isBillingAvailable(CONFIGURED_BILLING)).toBe(true);
    });

    it("honors the kill switch even when fully configured", () => {
      expect(
        isBillingAvailable({ ...CONFIGURED_BILLING, enabled: false }),
      ).toBe(false);
    });

    it("keeps webhooks unavailable without a secret", () => {
      expect(
        areWebhooksAvailable({
          ...CONFIGURED_BILLING,
          webhookSecret: undefined,
        }),
      ).toBe(false);
      expect(areWebhooksAvailable(CONFIGURED_BILLING)).toBe(true);
    });

    it("keeps webhooks unavailable when billing itself is unavailable", () => {
      expect(
        areWebhooksAvailable({ ...NO_BILLING, webhookSecret: "whsec_test" }),
      ).toBe(false);
    });

    it("keeps pro checkout unavailable without a product mapping", () => {
      expect(
        isProCheckoutAvailable({
          ...CONFIGURED_BILLING,
          proProductId: undefined,
        }),
      ).toBe(false);
      expect(isProCheckoutAvailable(CONFIGURED_BILLING)).toBe(true);
    });
  });

  describe("Azure AI chat availability", () => {
    it("is unavailable when absent", () => {
      expect(isAiChatAvailable(NO_AI)).toBe(false);
    });

    it("is available when fully configured", () => {
      expect(isAiChatAvailable(CONFIGURED_AI)).toBe(true);
    });

    it.each([
      ["resource name only", { resourceName: "my-resource" }],
      ["api key only", { apiKey: "azure-key" }],
    ])("is unavailable with %s", (_label, config) => {
      expect(isAiChatAvailable(config as AiChatConfig)).toBe(false);
    });

    it("falls back to the default deployment name", () => {
      expect(resolveDeploymentName(CONFIGURED_AI)).toBe(
        DEFAULT_DEPLOYMENT_NAME,
      );
    });

    it("prefers an explicit deployment name", () => {
      expect(
        resolveDeploymentName({
          ...CONFIGURED_AI,
          deploymentName: "my-deployment",
        }),
      ).toBe("my-deployment");
    });

    it("points at its own guide", () => {
      const error = new CapabilityUnavailableError(
        AI_CHAT_CAPABILITY,
        AI_CHAT_GUIDE,
      );

      expect(error.message).toContain(AI_CHAT_GUIDE);
    });
  });
});
