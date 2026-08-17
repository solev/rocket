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
  name: string;
  email: string;
  password: string;
  loading: boolean;
  error?: string;
}

export function SignupForm({
  isGoogleSignInAvailable = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { isGoogleSignInAvailable?: boolean }) {
  const [state, setState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    loading: false,
  });

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      await authClient.signUp.email(
        {
          email: state.email,
          password: state.password,
          name: state.name,
          callbackURL: "/dashboard",
        },
        {
          onError(ctx: { error?: { message?: string } | string }) {
            const message =
              typeof ctx.error === "string"
                ? ctx.error
                : (ctx.error?.message ?? "Sign up failed");
            setState((s) => ({ ...s, loading: false, error: message }));
          },
          onSuccess() {
            // Most setups auto-sign-in after sign up; still navigate explicitly
            window.location.href = "/dashboard";
          },
        },
      );
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }));
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
              onStart={() =>
                setState((s) => ({ ...s, loading: true, error: undefined }))
              }
              onError={(message) =>
                setState((s) => ({ ...s, loading: false, error: message }))
              }
            />
            <form onSubmit={handleEmailSignup} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="yourname"
                  required
                  value={state.name}
                  onChange={(e) =>
                    setState((s) => ({ ...s, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={state.email}
                  onChange={(e) =>
                    setState((s) => ({ ...s, email: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  required
                  value={state.password}
                  onChange={(e) =>
                    setState((s) => ({ ...s, password: e.target.value }))
                  }
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
