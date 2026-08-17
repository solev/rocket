# Rocket Roadmap

What Rocket is, and what remains to be built. Decided across [Chart a modular starter roadmap](https://github.com/solev/rocket/issues/1) and its tickets; this document is the readable form of those decisions.

## What Rocket is

Rocket is one foundation for **authenticated interactive web applications** — B2B tools, internal applications, SaaS products, and portals. It does not ship product-category presets; applications differ by which capabilities they select and by their own product code.

Rocket applications start by **cloning or forking**. There is no generator, no capability add/remove command, and no downstream upgrade automation. Rocket's promise is documented **manual removal**, nothing more.

### Core

Present in every Rocket application:

- personal accounts and authentication
- protected route and API boundaries
- account settings
- a neutral authenticated dashboard shell
- organization-aware data ownership, running in single-organization mode
- the Quality foundation

### Capabilities

| Capability | Tier |
| --- | --- |
| Polar Billing | Production-supported |
| Azure AI Chat | Experimental — outside the support guarantee |

Deferred to a later portfolio: transactional email, file storage, background jobs, hosted observability, enterprise SSO and audit logging, deployment runbooks.

Organization management and platform admin were **dropped** ([#9](https://github.com/solev/rocket/issues/9)). Core keeps organization-aware ownership; the optional management experience — lifecycle, switching, invitations, roles, admin UI — is not on this roadmap. Reviving it starts a fresh effort.

## The capability contract

A capability is ordinary localized TypeScript, not a manifest or plugin registration. It owns its configuration validation, availability check, operations, schema, technical endpoints, tests, and guide.

Runtime rules:

- absent configuration is valid and means **unavailable**
- partial, malformed, or contradictory configuration **fails startup** with a clear error
- the availability check is side-effect-free and never throws merely because configuration is absent
- invoking unavailable behavior throws `CapabilityUnavailableError`, naming the capability and linking its guide, never exposing secrets
- configuration stays server-only; loaders expose only safe facts such as `isBillingAvailable`
- valid configuration means available — no separate enable flag unless the provider needs a real kill switch
- mounted capabilities must protect their endpoints when unavailable

Pages and navigation are **application-owned**. Capabilities report availability and enforce backend safety; they never auto-register or hide UI.

Schema lives with its capability, but Rocket keeps one normal chronological migration history. Migrations are never conditional. Removing a capability from an established application needs a developer-authored removal migration.

Every production-supported capability tests four states — absent, invalid, unavailable-invocation, and configured — using mocks, never real third-party accounts. Each has one guide covering configuration, availability, invocation, integration, and manual removal.

## Build status

Sections 1-3 below were implemented on `feat/roadmap-implementation`. Each item records what shipped, so the remaining work is visible without re-reading the tickets.

### 1. Quality foundation — done

1. **Environment validation** — `app/lib/env/schema.ts` is the single source of truth, validated once at startup with `@t3-oss/env-core` and Zod. Empty strings are coerced to absent, so `|| ""` fallbacks cannot reappear. Capability variables are validated as all-or-nothing groups. `bun run env:check` fails when `.env.example` and the schema disagree. `resolveTestDatabaseUrl` refuses to run when `TEST_DATABASE_URL` is absent, equals `DATABASE_URL`, or names a database without `test` in it.
2. **Biome and one gate** — `biome.json` plus `bun run check`: format, lint, typecheck, env check, unit and DOM tests, integration tests, schema drift, production build. CI runs the same command. Tailwind v4 CSS is excluded from Biome, which cannot parse its at-rules.
3. **Vitest** — three projects (`unit`, `dom`, `integration`). Integration tests run against a real PostgreSQL database with `fileParallelism` off, and the harness clears every capability variable so the suite always asserts the unconfigured state.
4. **Playwright smoke journey** — `tests/e2e/smoke.spec.ts`: public page, protected redirect, signup, dashboard render, capability disabled state, logout, login. The web server starts with every optional provider explicitly blank.
5. **Migration and drift checks** — `bun run db:drift` regenerates against the committed schema and fails on any difference; it also refuses to report while `drizzle/` has uncommitted changes. `bun run db:test:setup` builds the isolated test database from zero.
6. **GitHub Actions** — four parallel jobs (static, test, e2e/build, security with CodeQL) plus grouped Dependabot updates.

### 2. Core correctness — done

- **Password reset now works** ([#12](https://github.com/solev/rocket/issues/12)). `/forgot-password` and `/reset-password/:token` exist and are linked from the login form. Delivery routes through `app/lib/email/delivery.server.ts`, which logs the link in development and refuses in production rather than dropping mail silently.
- **Google provider is honestly gated.** Absent credentials mean the provider is never registered and its button never renders; partial credentials fail startup. Availability is resolved server-side and passed to the browser as a boolean.
- **Dead `two_factor` table dropped.** The plugin was never mounted, so the table was removed rather than kept as a promise. Shipping real 2FA is a new feature decision, not a correctness fix.
- **Organization-aware ownership exists.** `organization` and `member` tables, `session.activeOrganizationId`, and provisioning through Better Auth database hooks. The Better Auth organization plugin is deliberately **not** mounted — management was dropped in [#9](https://github.com/solev/rocket/issues/9), and mounting it would expose create/invite/add-member endpoints nobody has decided how to lock down.

### 3. Capability retrofit — done

Both capabilities are localized under `app/capabilities/`, split into a pure `config.ts` and a `*.server.ts` that binds it to the environment. Each has an availability check that never throws, throws `CapabilityUnavailableError` on unavailable invocation, protects its endpoints, and has a guide covering configuration, availability, invocation, integration, and manual removal.

### Still open

- **Better Auth is pinned at 1.3.7** against a much newer stable line. Deliberately deferred: the upgrade needed a test safety net before it was worth attempting, and that net now exists. Later versions add `organizationHooks` and dynamic access control that an audit trail would need.
- **Polar webhook routing is unverified.** `/polar/webhooks` forwards to `auth.handler`, but whether the Better Auth Polar plugin matches that path outside `/api/auth/*` has not been proven, and proving it needs a live Polar account — which the contract forbids in tests. The endpoint correctly refuses when the webhook secret is absent.
- **Email verification is not wired up.** `emailAndPassword` does not require it, so enabling it is a product decision.
- **The deferred capability backlog** — transactional email transport, file storage, background jobs, hosted observability, enterprise SSO and audit logging, deployment runbooks.

## Related documents

- `CONTEXT.md` — glossary
- `docs/agents/upstreaming.md` — how functionality built in a Rocket application is promoted into Rocket
- `docs/protected-routes.md`
- `docs/capabilities/billing.md`, `docs/capabilities/ai-chat.md`, `docs/capabilities/email.md`
