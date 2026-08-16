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

## To be built

Nothing below is implemented yet. Ordered by dependency: each step makes the next verifiable.

### 1. Quality foundation

The gate everything else is checked by, so it comes first.

1. Centralized environment validation (`@t3-oss/env-core` + Zod), server/client split, no silent empty-string fallbacks, `.env.example` checked against the schema — plus a test-database safety guard that refuses to run against the development database.
2. Biome for formatting and linting, and `bun run check` as the single local and CI entry point.
3. Vitest, with React Router route/loader/action integration tests and PostgreSQL integration tests against a dedicated `TEST_DATABASE_URL`.
4. A minimum Playwright smoke journey: public page, protected redirect, signup, login, logout, dashboard render, and one capability's disabled state.
5. Migration and schema-drift checks — a fresh database must migrate from zero before tests run.
6. GitHub Actions in four parallel jobs (static, test, e2e/build, security), plus dependency updates and CodeQL.

**Done when** a fresh clone can install, validate configuration, migrate an isolated test database, exercise auth and route boundaries, build production assets, and pass the same `bun run check` locally and in CI — with **every** optional provider unconfigured.

### 2. Core correctness

Existing code that does not yet meet the contract above.

- **[#12](https://github.com/solev/rocket/issues/12) Password reset is unreachable.** `emailAndPassword` is enabled with no mail transport and no `sendResetPassword` handler, so a user who forgets their password has no recovery path.
- **Google provider is always "configured".** `clientId: process.env.GOOGLE_CLIENT_ID || ""` makes the provider appear available with empty credentials — exactly the silent empty-string fallback the environment contract forbids. Absent should mean unavailable; partial should fail startup.
- **Dead `two_factor` table.** The table is defined in `app/db/schema.ts` and passed to the Drizzle adapter, but the `twoFactor()` plugin is never mounted. Either mount it or drop the table.
- **Better Auth is pinned well behind.** `bun.lock` holds 1.3.7 against a much newer stable line; later versions add hook surfaces that any future audit trail would need.
- **Organization-aware ownership needs to actually exist.** It is Core by decision, but no organization table, membership, or ownership scoping is implemented yet.

### 3. Retrofit the capabilities

Polar Billing and Azure AI Chat both predate the contract and neither satisfies it. Polar is closest — it already gates on configuration and mounts conditionally.

Each needs: a localized module, availability checks, `CapabilityUnavailableError` on unavailable invocation, the four-state tests, and one guide including manual removal. Azure AI Chat must additionally document its experimental coverage gaps.

### 4. Later

Revisit the deferred backlog only once the contract is proven by the capabilities above. Admission is governed by `docs/agents/upstreaming.md`; support tier remains a roadmap decision.

## Related documents

- `CONTEXT.md` — glossary
- `docs/agents/upstreaming.md` — how functionality built in a Rocket application is promoted into Rocket
- `docs/protected-routes.md`
