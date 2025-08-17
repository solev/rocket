import { useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth/auth.client";

interface FormState {
  name: string;
  email: string;
  password: string;
  loading: boolean;
  error?: string;
}

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [state, setState] = useState<FormState>({ name: "", email: "", password: "", loading: false });

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      await authClient.signUp.email(
        { email: state.email, password: state.password, name: state.name, callbackURL: "/dashboard" },
        {
          onError(ctx: { error?: any }) {
            const message = typeof ctx.error === "string" ? ctx.error : (ctx.error?.message || "Sign up failed");
            setState((s) => ({ ...s, loading: false, error: message }));
          },
          onSuccess() {
            // Most setups auto-sign-in after sign up; still navigate explicitly
            window.location.href = "/dashboard";
          },
        }
      );
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message || "Sign up failed" }));
    }
  }

  async function handleGoogle() {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      await authClient.signIn.social(
        { provider: "google", newUserCallbackURL: "/dashboard", callbackURL: "/dashboard" },
        {
          onError(ctx: { error?: any }) {
            const message = typeof ctx.error === "string" ? ctx.error : (ctx.error?.message || "Google sign-in failed");
            setState((s) => ({ ...s, loading: false, error: message }));
          },
          onSuccess() {
            window.location.href = "/dashboard";
          },
        }
      );
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message || "Google sign-in failed" }));
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
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={state.loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                {state.loading ? "Continuing…" : "Continue with Google"}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">Or create with email</span>
            </div>
            <form onSubmit={handleEmailSignup} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="yourname"
                  required
                  value={state.name}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
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
                  onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
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
                  onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
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
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
