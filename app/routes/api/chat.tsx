import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { getModel, isAiConfigured } from "~/lib/ai/providers";
import { withAuthAction } from "~/utils/guard.server";

export const action = withAuthAction(async ({ request }) => {
  if (!isAiConfigured()) {
    return Response.json(
      {
        error:
          "Azure OpenAI is not configured. Set AZURE_OPENAI_RESOURCE_NAME and AZURE_OPENAI_API_KEY.",
      },
      { status: 503 }
    );
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: getModel(),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      get_current_weather: tool({
        description: "Get the current weather",
        inputSchema: z.object({
          city: z.string(),
        }),
        execute: async ({ city }) => {
          return `The weather in ${city} is sunny`;
        },
      }),
    },
    instructions:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
});
