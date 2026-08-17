import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import { LoginForm } from "~/components/login-form";
import { isGoogleSignInAvailable } from "~/lib/auth/auth.server";
import { getUser } from "~/lib/auth/require-auth.server";

import type { Route } from "./+types/login";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/dashboard");
  // Integration availability is resolved on the server so the client never
  // renders a provider button that cannot work.
  return { isGoogleSignInAvailable };
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-3 self-center font-medium"
          aria-label="Go to home"
        >
          <img
            src="/rocket-logo.svg"
            alt="Rocket"
            className="h-8 w-8 md:h-9 md:w-9"
          />
          <span className="font-semibold tracking-tight text-lg md:text-xl">
            Rocket
          </span>
        </Link>
        <LoginForm
          isGoogleSignInAvailable={loaderData.isGoogleSignInAvailable}
        />
      </div>
    </div>
  );
}
