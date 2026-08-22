# Rocket

A foundation for **authenticated interactive web applications** — B2B tools, internal applications, SaaS products, and portals.

Rocket applications start by cloning or forking. There is no generator and no upgrade automation: what Rocket promises is a Core that works, a capability contract, and documented manual removal.

- **Stack** — React Router 7 (SSR), PostgreSQL, Drizzle ORM, Better Auth, Tailwind CSS 4, shadcn/ui, Bun
- **Roadmap and decisions** — [`docs/roadmap.md`](docs/roadmap.md)
- **Glossary** — [`CONTEXT.md`](CONTEXT.md)

## Quick start

```bash
bun install
cp .env.example .env         # then set DATABASE_URL and BETTER_AUTH_SECRET
bun run db:up                # postgres:16-alpine on localhost:5432
bun run db:migrate
bun run dev                  # http://localhost:5173
```

Rocket runs with **every optional capability unconfigured**. Billing, AI chat, Google sign-in, and email are all absent by default, and the application is fully usable in that state.

## What is in Core

Present in every Rocket application:

- personal accounts, email/password authentication, and password reset
- protected route and API boundaries
- account settings and a neutral authenticated dashboard shell
- organization-aware data ownership, running in single-organization mode
- the Quality foundation below

## Capabilities

| Capability | Tier | Guide |
| --- | --- | --- |
| Polar Billing | Production-supported | [`docs/capabilities/billing.md`](docs/capabilities/billing.md) |
| Azure AI Chat | Experimental | [`docs/capabilities/ai-chat.md`](docs/capabilities/ai-chat.md) |
| Transactional email | Deferred — seam only | [`docs/capabilities/email.md`](docs/capabilities/email.md) |

Absent configuration is valid and means **unavailable**. Partial configuration **fails at startup** rather than producing a half-working integration. Invoking unavailable behavior throws `CapabilityUnavailableError`, naming the capability and linking its guide without exposing secrets.

Pages and navigation are application-owned: capabilities report availability and protect their endpoints, but never auto-register or hide UI.

## Environment

`app/lib/env/schema.ts` is the single source of truth. It is validated once at startup with `@t3-oss/env-core` and Zod.

- empty strings are treated as absent, so there are no silent `|| ""` fallbacks
- capability variables are validated as all-or-nothing groups
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are required in production
- `bun run env:check` fails if `.env.example` and the schema disagree

### Set `AUTH_IP_ADDRESS_HEADER` before you deploy

Auth rate limits are keyed on the caller's IP, and Better Auth will only take
that from a single header you name — it will not trust a forwarded chain,
because behind an appending proxy the client controls the first entry.

Leave it unset and it cannot tell callers apart, so everyone shares one bucket
per path. Sign-in allows three attempts per ten seconds, so three failed
sign-ins from any one person would lock out every user.

Set it to a header your proxy **always overwrites** — `x-real-ip` for most
reverse proxies, `cf-connecting-ip` behind Cloudflare, `fly-client-ip` on Fly.
A header a client can forge is worse than none.

## Quality foundation

`bun run check` is the single gate, locally and in CI:

```bash
bun run check    # format:check, lint, typecheck, env:check, test, test:integration, db:drift, build
```

`check` includes the integration suite, so it needs `TEST_DATABASE_URL` set — see
[Integration and end-to-end tests](#integration-and-end-to-end-tests). Without it the
run stops partway with a message about the missing variable, which reads like a broken
test rather than an unset environment.

| Command | Purpose |
| --- | --- |
| `bun run format` / `format:check` | Biome formatting |
| `bun run lint` / `lint:fix` | Biome linting |
| `bun run typecheck` | React Router typegen, then `tsc` |
| `bun run test` | Vitest unit and DOM projects |
| `bun run test:integration` | Vitest against a real PostgreSQL database |
| `bun run test:e2e` | Playwright smoke journey |
| `bun run db:drift` | Fails when the schema and migrations disagree |

CI runs the same work in four parallel jobs — static, test, e2e/build, and security (CodeQL) — in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### Integration and end-to-end tests

Both need a database that is **not** your development one. `TEST_DATABASE_URL` is guarded: the suite refuses to run if it is absent, equal to `DATABASE_URL`, or names a database without `test` in it.

```bash
bun run db:test:setup        # creates the database named by TEST_DATABASE_URL
DATABASE_URL="$TEST_DATABASE_URL" bun run db:migrate
bun run test:integration
bun run test:e2e
```

`bun run db:up` provisions both `rocket` and `rocket_test` on first start.

The Playwright journey covers the public page, the protected redirect, signup, dashboard render, logout, login, and one capability's disabled state — all with nothing configured.

It runs against the **production build**, not the dev server: that is the artifact you deploy, and the dev server's dependency optimizer reloads the page the first time it meets a new import, which silently wiped half-filled forms. It also asserts the pages hydrate without browser errors, since a page whose hydration threw still screenshots perfectly while its buttons do nothing.

## Local PostgreSQL

### Docker (recommended)

```bash
bun run db:up      # start
bun run db:psql    # psql inside the container
bun run db:logs    # follow logs
bun run db:down    # stop
```

### Native

Install PostgreSQL 16, start its service, then create the databases:

```sql
CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
CREATE DATABASE rocket OWNER postgres;
CREATE DATABASE rocket_test OWNER postgres;
```

| Platform | Install | Start |
| --- | --- | --- |
| macOS (Homebrew) | `brew install postgresql@16` | `brew services start postgresql@16` |
| Ubuntu / Debian | `sudo apt install postgresql-16` | `sudo systemctl start postgresql` |
| Windows | postgresql.org installer | `Start-Service postgresql-x64-16` |

## Migrations

Rocket keeps one normal chronological migration history. Migrations are never conditional, and schema lives with the capability that owns it.

```bash
bun run db:generate    # after editing app/db/schema.ts
bun run db:migrate
bun run db:drift       # verifies no ungenerated schema changes remain
```

A migration that drops a table or column is destructive and gets explicit human review before it merges.

Run `bun run db:migrate` after pulling or switching to a branch that adds migrations. An unmigrated database fails at the point the missing table is first queried, which surfaces as an unrelated-looking runtime error rather than a startup failure — a missing `organization` table, for example, shows up as a failed signup.

## Building for production

```bash
bun run build
bun run start
```

The server build is a standard Node application (`build/server/index.js`) with static assets in `build/client/`. A `Dockerfile` is included; the image runs anywhere containers do.

## Contributing back

Functionality first built in a Rocket application that proves generally useful is promoted into Rocket as a capability or Core code. The process is in [`docs/agents/upstreaming.md`](docs/agents/upstreaming.md).
