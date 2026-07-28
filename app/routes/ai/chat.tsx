import type { Route } from "./+types/chat";
import Chat from "./components/chat";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const isAiConfigured = Boolean(
    process.env.AZURE_OPENAI_RESOURCE_NAME &&
      process.env.AZURE_OPENAI_API_KEY
  );
  return { isAiConfigured, searchParams };
}

export default function ChatBotDemo({ loaderData }: Route.ComponentProps) {
  return <Chat isConfigured={loaderData.isAiConfigured} />;
}
