import { useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
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
import { SocialSignIn } from "~/components/auth/social-sign-in";
import { authClient } from "~/lib/auth/auth.client";

interface FormState {
  loading: boolean;
  error?: string;
}

export function LoginForm({
  isGoogleSignInAvailable = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { isGoogleSignInAvailable?: boolean }) {
  const [state, setState] = useState<FormState>({ loading: false });

  async function handleEmailPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the DOM rather than component state: input typed before React
    // hydrates never reaches state, and controlled inputs would then wipe it.
    const form = new FormData(e.currentTarget);
    setState({ loading: true });
    try {
      await authClient.signIn.email(
        {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
        {
          onError(ctx: { error?: { message?: string } | string }) {
            const message =
              typeof ctx.error === "string"
                ? ctx.error
                : (ctx.error?.message ?? "Login failed");
            setState({ loading: false, error: message });
          },
          onSuccess() {
            window.location.href = "/";
          },
        },
      );
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <SocialSignIn
              isGoogleSignInAvailable={isGoogleSignInAvailable}
              disabled={state.loading}
              label={state.loading ? "Signing in..." : "Login with Google"}
              dividerLabel="Or continue with"
              onStart={() => setState({ loading: true })}
              onError={(message) =>
                setState({ loading: false, error: message })
              }
            />
            <form onSubmit={handleEmailPassword} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={state.loading}>
                {state.loading ? "Signing in..." : "Login"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              )}
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[span]:hover:text-primary text-center text-xs text-balance *:[span]:underline *:[span]:underline-offset-4">
        By clicking continue, you agree to our <span>Terms of Service</span> and{" "}
        <span>Privacy Policy</span>.
      </div>
    </div>
  );
}
