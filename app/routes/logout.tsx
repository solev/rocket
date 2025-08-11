import { redirect } from "react-router";
import { auth } from "~/lib/auth/auth.server";

export async function action({ request }: { request: Request }) {
  // Use Better Auth API to sign out so session + cookies are cleared properly
  await auth.api.signOut({
    headers: request.headers,
  });
  throw redirect("/login");
}

export async function loader() {
  // Avoid GET usage; send to dashboard.
  throw redirect("/dashboard");
}

export default function Logout() {
  return null;
}
