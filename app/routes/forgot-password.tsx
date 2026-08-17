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

import type { Route } from "./+types/forgot-password";

/**
 * The response is deliberately identical whether or not the address is
 * registered. Better Auth's own endpoint varies its body between the two
 * cases, which leaks account existence, so this action discards the upstream
 * result and always answers the same way.
 */
const ACKNOWLEDGEMENT =
  "If an account exists for that address, a reset link is on its way.";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter the email address you signed up with." };
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  } catch (error) {
    // A delivery failure must not become an account-existence oracle either.
    // It is logged for the operator and hidden from the visitor.
    console.error("Password reset request failed", error);
  }

  return { sent: ACKNOWLEDGEMENT };
}

export default function ForgotPasswordPage({
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
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>
              We&apos;ll email you a link to choose a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actionData && "sent" in actionData ? (
              <p className="text-sm" role="status">
                {actionData.sent}
              </p>
            ) : (
              <Form method="post" className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
                {actionData && "error" in actionData && (
                  <p className="text-sm text-destructive" role="alert">
                    {actionData.error}
                  </p>
                )}
              </Form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
