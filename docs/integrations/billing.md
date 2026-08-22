# Polar Billing

**Tier:** Production-supported

Subscription billing, checkout, and a customer portal through [Polar](https://polar.sh). Rocket mounts Polar as a Better Auth plugin, so checkout and portal endpoints live under the auth API rather than in application routes.

## Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `POLAR_ACCESS_TOKEN` | to enable | Organization access token. Its presence is what makes billing available. |
| `POLAR_SERVER` | no | `sandbox` (default) or `production`. |
| `POLAR_ENABLED` | no | Operational kill switch. Defaults to true; set `false` to disable a fully configured integration without removing credentials. |
| `POLAR_PRODUCT_PRO_ID` | no | Product mapped to the `pro` checkout slug. Without it, checkout mounts with no products. |
| `POLAR_WEBHOOK_SECRET` | no | Enables webhook handling. Required whenever `POLAR_SERVER=production`. |

All of these are server-only. None is ever sent to the browser.

`POLAR_WEBHOOK_SECRET` is enforced at startup for production servers: a production Polar integration without a verified webhook endpoint silently misses entitlement changes, so Rocket refuses to start rather than run in that state.

## Availability

```ts
import { isBillingAvailable } from "~/integrations/billing/billing.server";
```

Side-effect-free and never throws. Billing is available when an access token is present **and** the kill switch has not been thrown.

Loaders may pass the boolean result to the browser; they must never pass configuration itself:

```ts
export const loader = withAuthLoader(async ({ customerState }) => {
  if (!isBillingAvailable() || !customerState) {
    return { active: false, billingEnabled: false };
  }
  return { active: Boolean(customerState.activeSubscriptions?.length), billingEnabled: true };
});
```

## Invocation

| Function | Behavior when unavailable |
| --- | --- |
| `getPolarClient()` | throws `IntegrationUnavailableError` |
| `getCustomerState(userId)` | returns `null` |
| `createBillingPlugin()` | returns `null`, so the plugin is never mounted |

`getCustomerState` returning `null` rather than throwing is deliberate: it lets every authenticated loader resolve subscription state without branching on configuration. `getPolarClient` throws because reaching for the client is an unambiguous programming error when billing is off.

Because `createBillingPlugin()` returns `null`, Polar's endpoints are **absent** when billing is unconfigured, not present and failing.

## Wiring

- **Better Auth plugin** — `app/lib/auth/auth.server.ts` mounts the plugin only when it exists.
- **Loader helper** — `withAuthLoader` in `app/utils/guard.server.ts` injects `customerState`.
- **Webhook route** — `app/routes/polar.webhooks.tsx`, mounted at `/polar/webhooks`. It must reject requests when webhooks are unavailable rather than accepting unverified payloads.
- **UI** — `app/routes/dashboard/dashboard.billing.tsx` renders an explicit "Billing is not configured" state. Pages are application-owned; the integration never hides or registers navigation itself.

Entitlement grants belong in the `onOrderPaid` and `onCustomerStateChanged` handlers in `billing.server.ts`. They are intentionally empty — Rocket does not presume what a subscription entitles.

## Tests

`tests/unit/availability-contract.test.ts` covers the four required states against the pure `config.ts`: absent, partial (rejected by env validation — see `tests/unit/env-schema.test.ts`), unavailable invocation, and configured. No test contacts a real Polar account.

## Manual removal

1. Delete `app/integrations/billing/`.
2. Delete `app/routes/polar.webhooks.tsx` and its entry in `app/routes.ts`.
3. Delete `app/routes/dashboard/dashboard.billing.tsx`, its route entry, and any navigation pointing at it (`app/components/nav-user.tsx`, `app/components/app-sidebar.tsx`).
4. In `app/utils/guard.server.ts`, drop the `customerState` injection and the `PolarCustomerState` re-export, then fix the loaders that consumed it.
5. In `app/lib/auth/auth.server.ts`, remove `createBillingPlugin` and the `plugins` entry.
6. In `app/lib/env/schema.ts`, remove the `POLAR_*` variables and the `polar` integration group; mirror the change in `.env.example` and re-run `bun run env:check`.
7. Remove `@polar-sh/sdk` and `@polar-sh/better-auth` from `package.json`.
8. Delete the billing cases from `tests/unit/availability-contract.test.ts` and the billing assertions from `tests/e2e/smoke.spec.ts`.

Billing adds no tables, so no removal migration is needed.
