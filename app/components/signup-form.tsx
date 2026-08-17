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

export function SignupForm({
  isGoogleSignInAvailable = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { isGoogleSignInAvailable?: boolean }) {
  const [state, setState] = useState<FormState>({ loading: false });

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the DOM rather than component state: input typed before React
    // hydrates never reaches state, and controlled inputs would then wipe it.
    const form = new FormData(e.currentTarget);
    setState({ loading: true });
    try {
      await authClient.signUp.email(
        {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          name: String(form.get("name") ?? ""),
          callbackURL: "/dashboard",
        },
        {
          onError(ctx: { error?: { message?: string } | string }) {
            const message =
              typeof ctx.error === "string"
                ? ctx.error
                : (ctx.error?.message ?? "Sign up failed");
            setState({ loading: false, error: message });
          },
          onSuccess() {
            // Most setups auto-sign-in after sign up; still navigate explicitly
            window.location.href = "/dashboard";
          },
        },
      );
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      });
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Sign up with Google or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <SocialSignIn
              isGoogleSignInAvailable={isGoogleSignInAvailable}
              disabled={state.loading}
              label={state.loading ? "Continuing…" : "Continue with Google"}
              dividerLabel="Or create with email"
              onStart={() => setState({ loading: true })}
              onError={(message) =>
                setState({ loading: false, error: message })
              }
            />
            <form onSubmit={handleEmailSignup} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="yourname"
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={state.loading}>
                {state.loading ? "Creating account…" : "Create account"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              )}
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[span]:hover:text-primary text-center text-xs text-balance *:[span]:underline *:[span]:underline-offset-4">
        By signing up, you agree to our <span>Terms of Service</span> and{" "}
        <span>Privacy Policy</span>.
      </div>
    </div>
  );
}
