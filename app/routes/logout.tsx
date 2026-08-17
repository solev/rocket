import { redirect } from "react-router";
import { auth } from "~/lib/auth/auth.server";

/**
 * Signing out must both delete the server-side session and clear the browser's
 * cookies. Better Auth returns the clearing `Set-Cookie` headers on its own
 * response, so they are forwarded onto the redirect — dropping them would
 * leave the signed session cookie in place, and with the session cookie cache
 * enabled the visitor would stay authenticated until the cache expired.
 */
export async function action({ request }: { request: Request }) {
  const signOutResponse = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  const headers = new Headers();
  for (const cookie of signOutResponse.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  return redirect("/login", { headers });
}

export async function loader() {
  // Sign-out is a state change, so it must not be reachable by GET.
  throw redirect("/dashboard");
}
