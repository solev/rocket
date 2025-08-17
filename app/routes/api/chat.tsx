import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getModel } from "~/lib/ai/providers";
import { withAuthAction } from "~/utils/guard.server";

export const action = withAuthAction(async ({ request, user }) => {
  // safe to mutate with authenticated user

  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await request.json();
  console.log(messages, model, webSearch);
  const result = streamText({
    model: getModel("gpt-4o-2"),
    messages: convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
});
