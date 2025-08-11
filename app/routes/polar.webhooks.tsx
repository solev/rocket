import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/auth.server";

// This route is hit by Polar webhooks; the Better Auth webhooks plugin registers a handler.
export async function action({ request }: ActionFunctionArgs) {
  // Forward to Better Auth handler; plugin is mounted by the Better Auth handler
  return auth.handler(request);
}

export async function loader() {
  return new Response("OK");
}
