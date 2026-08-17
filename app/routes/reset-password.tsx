import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { auth } from "~/lib/auth/auth.server";
import { getUser } from "~/lib/auth/require-auth.server";

import type { Route } from "./+types/reset-password";

/**
 * Better Auth issues the reset token as a path segment, so the token arrives
 * as a route param rather than a query string.
 */

const MIN_PASSWORD_LENGTH = 8;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/dashboard");
  return null;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  const token = params.token;

  if (!token) {
    return { error: "This reset link is missing its token." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== confirmation) {
    return { error: "The two passwords do not match." };
  }

  try {
    await auth.api.resetPassword({ body: { newPassword: password, token } });
  } catch {
    return {
      error: "That reset link is invalid or has expired. Request a new one.",
    };
  }

  throw redirect("/login?reset=1");
}

export default function ResetPasswordPage({
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Choose a new password</CardTitle>
            <CardDescription>
              At least {MIN_PASSWORD_LENGTH} characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Set new password"}
              </Button>
              {actionData?.error && (
                <p className="text-sm text-destructive" role="alert">
                  {actionData.error}
                </p>
              )}
            </Form>
            <div className="mt-6 text-center text-sm">
              <Link
                to="/forgot-password"
                className="underline underline-offset-4"
              >
                Request a new link
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
