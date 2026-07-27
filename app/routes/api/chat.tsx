import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { getModel } from "~/lib/ai/providers";
import { withAuthAction } from "~/utils/guard.server";
import { z } from "zod";

export const action = withAuthAction(async ({ request, user }) => {
  // safe to mutate with authenticated user

  const {
    messages,
    model,
    webSearch,
    tools,
  }: { messages: UIMessage[]; model: string; webSearch: boolean; tools?: any } =
    await request.json();

  // console.log(messages, model, webSearch);

  const result = streamText({
    model: getModel("gpt-5-chat"),
    messages: convertToModelMessages(messages),
    onFinish: (response) => {
      // Handle the response from the model
      console.log(response);
    },
    tools: {
      // Backend tools
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
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
});
