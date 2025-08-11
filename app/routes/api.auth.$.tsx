import { auth } from "~/lib/auth/auth.server";

// Using untyped args fallback until route type generation covers this pattern.
export async function loader({ request }: { request: Request }) {
  return auth.handler(request);
}

export async function action({ request }: { request: Request }) {
  return auth.handler(request);
}
