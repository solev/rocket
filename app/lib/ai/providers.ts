import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

export function isAiConfigured() {
  return Boolean(
    process.env.AZURE_OPENAI_RESOURCE_NAME &&
      process.env.AZURE_OPENAI_API_KEY
  );
}

export function getModel() {
  const deploymentName =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-5-chat";

  // AI SDK 6+ defaults to Azure's Responses API. Keep the existing Chat
  // Completions behavior so current Azure deployments continue to work.
  return azure.chat(deploymentName);
}