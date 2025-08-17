import { createAzure } from "@ai-sdk/azure"

// Azure OpenAI configuration using AI SDK
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME, // Azure resource name
  apiKey: process.env.AZURE_OPENAI_API_KEY, // Azure API key
});

// Get the configured model
export function getModel(modelName: string) {
 
  return azure(modelName);
}