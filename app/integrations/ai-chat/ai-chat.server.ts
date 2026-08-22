import { createAzure } from "@ai-sdk/azure";

import { IntegrationUnavailableError } from "~/lib/integration";
import { env } from "~/lib/env/env.server";

import {
  AI_CHAT_INTEGRATION,
  AI_CHAT_GUIDE,
  type AiChatConfig,
  isAiChatAvailable as isAvailable,
  resolveDeploymentName,
} from "./config";

export const aiChatConfig: AiChatConfig = {
  resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: env.AZURE_OPENAI_API_KEY,
  deploymentName: env.AZURE_OPENAI_DEPLOYMENT_NAME,
};

/** Side-effect-free availability check; safe to call from a loader. */
export function isAiChatAvailable(): boolean {
  return isAvailable(aiChatConfig);
}

/**
 * The configured Azure chat model.
 *
 * AI SDK 6+ defaults to Azure's Responses API; `.chat()` keeps the existing
 * Chat Completions behavior so current deployments continue to work.
 *
 * @throws {IntegrationUnavailableError} when Azure AI Chat is not configured.
 */
export function getChatModel() {
  if (!isAiChatAvailable()) {
    throw new IntegrationUnavailableError(AI_CHAT_INTEGRATION, AI_CHAT_GUIDE);
  }

  const azure = createAzure({
    resourceName: aiChatConfig.resourceName,
    apiKey: aiChatConfig.apiKey,
  });

  return azure.chat(resolveDeploymentName(aiChatConfig));
}
