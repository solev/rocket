import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  AI_CHAT_CAPABILITY,
  AI_CHAT_GUIDE,
} from "~/capabilities/ai-chat/config";
import {
  getChatModel,
  isAiChatAvailable,
} from "~/capabilities/ai-chat/ai-chat.server";
import { withAuthAction } from "~/utils/guard.server";

export const action = withAuthAction(async ({ request }) => {
  if (!isAiChatAvailable()) {
    return Response.json(
      {
        error: `The "${AI_CHAT_CAPABILITY}" capability is not configured. See ${AI_CHAT_GUIDE}.`,
      },
      { status: 503 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: getChatModel(),
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
