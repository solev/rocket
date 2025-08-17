import { lazyClient } from "~/lib/lazy-client";
import { CenteredLoader } from "~/components/centered-loader";
import type { Route } from "./+types/chat";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  return { searchParams };
}

// SSR-safe lazy import, with optional chunk preloading
const Chat = lazyClient(() => import("./components/chat"), {
  ssrFallback: null,
  fallback: <CenteredLoader />,
});

export default function ChatBotDemo() {
  return <Chat />;
}
