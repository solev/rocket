# Transactional email

**Tier:** Deferred — Rocket ships a seam, not a transport.

Rocket has no email provider. What it has instead is one narrow interface that Core flows depend on, so that a missing transport degrades predictably rather than silently.

This exists because password reset would otherwise be unreachable ([#12](https://github.com/solev/rocket/issues/12)): `emailAndPassword` is enabled, so a user who forgets their password needs a recovery path even in a clone with nothing configured.

## The seam

`app/lib/email/delivery.server.ts`

```ts
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailTransport {
  name: string;
  send(message: EmailMessage): Promise<void>;
}
```

## Behavior with no transport

| Environment | Behavior |
| --- | --- |
| development, test | The message is written to the server console, including the reset link, so the flow is fully exercisable locally. |
| production | `sendEmail` throws `EmailDeliveryUnavailableError`. |

Production refuses rather than logging because a reset link is a bearer credential and must never reach a production log — and a flow that silently drops mail is worse than one that is plainly unavailable.

There is no environment variable. Availability is determined by whether a transport has been registered, not by configuration.

## Making it real

Implement `EmailTransport` against your provider and register it during server start-up, before any request is served:

```ts
import { setEmailTransport } from "~/lib/email/delivery.server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

setEmailTransport({
  name: "resend",
  async send({ to, subject, text }) {
    await resend.emails.send({ from: "no-reply@example.com", to, subject, text });
  },
});
```

If you add provider credentials, add them to `app/lib/env/schema.ts` as an all-or-nothing integration group and mirror them in `.env.example`, exactly as Polar and Azure do. `bun run env:check` enforces that the example file matches the schema.

## What routes through it

- **Password reset** — `sendResetPassword` in `app/lib/auth/auth.server.ts`, reached from `/forgot-password` and completed at `/reset-password/:token`.

Better Auth emits a relative reset URL when no `baseURL` is configured, so Core absolutizes it before sending. `BETTER_AUTH_URL` is required in production, so the local fallback never applies to a deployed application.

Email verification is **not** wired up. `emailAndPassword` does not require verification, so enabling it is a product decision, not a correctness fix.

## Tests

`tests/integration/password-reset.test.ts` covers delivery through an injected transport, the console fallback, absolute-link generation, a full token round-trip, and the fact that the request does not reveal whether an address is registered.

Better Auth's own `forgetPassword` endpoint varies its response body between known and unknown addresses, which leaks account existence. The `/forgot-password` action therefore discards the upstream result and always answers identically — including when delivery itself fails.

## Manual removal

The seam is Core, not an optional integration. Removing it means removing password reset:

1. Delete `app/routes/forgot-password.tsx` and `app/routes/reset-password.tsx` and their entries in `app/routes.ts`.
2. Remove the "Forgot your password?" link from `app/components/login-form.tsx`.
3. Remove `sendResetPassword` from `app/lib/auth/auth.server.ts`.
4. Delete `app/lib/email/` and `tests/integration/password-reset.test.ts`.

Doing this leaves users with no account recovery path. Prefer registering a transport.
