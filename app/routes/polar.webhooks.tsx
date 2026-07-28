import type { ActionFunctionArgs } from "react-router";
import { auth, isPolarEnabled } from "~/lib/auth/auth.server";

// This route is hit by Polar webhooks; the Better Auth webhooks plugin registers a handler.
export async function action({ request }: ActionFunctionArgs) {
  if (!isPolarEnabled) {
    return new Response("Polar billing is disabled", { status: 503 });
  }
  // Forward to Better Auth handler; plugin is mounted by the Better Auth handler
  return auth.handler(request);
}

export async function loader() {
  return isPolarEnabled
    ? new Response("OK")
    : new Response("Polar billing is disabled", { status: 503 });
}
