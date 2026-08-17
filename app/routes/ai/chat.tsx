import type { Route } from "./+types/chat";
import { isAiChatAvailable } from "~/integrations/ai-chat/ai-chat.server";
import Chat from "./components/chat";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  // Only a safe boolean crosses to the browser, never the configuration.
  return { isAiConfigured: isAiChatAvailable(), searchParams };
}

export default function ChatBotDemo({ loaderData }: Route.ComponentProps) {
  return <Chat isConfigured={loaderData.isAiConfigured} />;
}
