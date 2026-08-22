/**
 * Pure configuration logic for the Azure AI Chat integration.
 *
 * Experimental: this integration is outside Rocket's production-support
 * guarantee. See `docs/integrations/ai-chat.md` for its coverage gaps.
 */

export const AI_CHAT_INTEGRATION = "Azure AI Chat";
export const AI_CHAT_GUIDE = "docs/integrations/ai-chat.md";

export const DEFAULT_DEPLOYMENT_NAME = "gpt-5-chat";

export interface AiChatConfig {
  resourceName?: string;
  apiKey?: string;
  deploymentName?: string;
}

/**
 * Available only when both the resource name and the API key are present.
 * Partial configuration never reaches this check: it fails env validation at
 * startup instead.
 */
export function isAiChatAvailable(config: AiChatConfig): boolean {
  return Boolean(config.resourceName) && Boolean(config.apiKey);
}

/** The deployment to call, falling back to Rocket's default model name. */
export function resolveDeploymentName(config: AiChatConfig): string {
  return config.deploymentName ?? DEFAULT_DEPLOYMENT_NAME;
}
