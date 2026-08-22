import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth/auth.client";

/**
 * Social sign-in is capability-gated: a provider whose credentials are absent
 * is not registered on the server, so rendering its button would produce a
 * control that can only fail. Availability is resolved server-side and passed
 * down; when nothing is available this renders nothing at all, divider
 * included.
 */
interface SocialSignInProps {
  isGoogleSignInAvailable: boolean;
  disabled: boolean;
  label: string;
  dividerLabel: string;
  onError: (message: string) => void;
  onStart: () => void;
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="mr-2 h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SocialSignIn({
  isGoogleSignInAvailable,
  disabled,
  label,
  dividerLabel,
  onError,
  onStart,
}: SocialSignInProps) {
  if (!isGoogleSignInAvailable) return null;

  async function handleGoogle() {
    onStart();
    try {
      await authClient.signIn.social(
        { provider: "google" },
        {
          onError(ctx: { error?: { message?: string } | string }) {
            const message =
              typeof ctx.error === "string"
                ? ctx.error
                : (ctx.error?.message ?? "Google sign-in failed");
            onError(message);
          },
          onSuccess() {
            window.location.href = "/dashboard";
          },
        },
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Google sign-in failed");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={disabled}
        >
          <GoogleIcon />
          {label}
        </Button>
      </div>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          {dividerLabel}
        </span>
      </div>
    </>
  );
}
