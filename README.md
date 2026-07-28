# Welcome to React Router

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Local Postgres

#### Option A: Docker (recommended)

Docker Compose is the default because it provides the same Postgres 16 setup on
macOS, Linux and Windows without changing the host machine.

```bash
npm run db:up        # start postgres:16-alpine on localhost:5432
npm run db:migrate   # apply migrations from drizzle/
npm run db:psql      # open psql inside the container
npm run db:logs      # follow container logs
npm run db:down      # stop the stack
```

The explicit `db:docker:*` variants are aliases for the same commands.

#### Option B: Native PostgreSQL

If Docker is unavailable, install PostgreSQL 16 and start its service using the
native tools for your operating system:

| Platform | Install | Start / stop |
| --- | --- | --- |
| macOS (Homebrew) | `brew install postgresql@16` | `brew services start postgresql@16` / `brew services stop postgresql@16` |
| Ubuntu / Debian | `sudo apt install postgresql-16` | `sudo systemctl start postgresql` / `sudo systemctl stop postgresql` |
| Windows | Install PostgreSQL 16 from postgresql.org | Use the PostgreSQL service in Windows Services or `Start-Service postgresql-x64-16` in an elevated PowerShell |

Once the server is running, create the project database:

```bash
npm run db:local:create
npm run db:migrate
npm run db:local:psql
```

Those scripts only use PostgreSQL's cross-platform `createdb` and `psql`
clients; they do not assume Homebrew, systemd or Windows Services. If the
`postgres` role does not exist, create it with your platform's admin account:

```sql
CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
CREATE DATABASE rr7_test OWNER postgres;
```

Run the SQL through pgAdmin, a platform-provided SQL shell, or `psql` connected
as the existing administrator. If `rr7_test` already exists, skip
`db:local:create`.

Connection details:

```text
host: localhost
port: 5432
user: postgres
password: postgres
database: rr7_test
```

Ensure `.env` contains the matching `DATABASE_URL` (see `.env.example`).

### Billing (Polar) — optional

Polar billing is **opt-in**. It turns on as soon as `POLAR_ACCESS_TOKEN` is set;
`POLAR_ENABLED=false` forces it off even when a token is present.

| `POLAR_ACCESS_TOKEN` | `POLAR_ENABLED` | Result                                    |
| -------------------- | --------------- | ----------------------------------------- |
| unset                | anything        | disabled (default for local dev)          |
| set                  | unset / `true`  | enabled                                   |
| set                  | `false`         | disabled (kill switch)                    |

When disabled, the Better Auth Polar plugin is not mounted at all:

- sign-up and sign-in work normally,
- `/dashboard/billing` renders a "Billing is not configured" notice and the
  checkout / customer-portal buttons are disabled,
- `withAuthLoader` injects `customerState: null` instead of calling the Polar API,
- `/polar/webhooks` responds `503`.

This matters locally: with the plugin mounted but no valid token, Polar rejects
customer creation with a 401 and sign-up fails *after* the user row is written,
leaving an account that can never log in.

> **Homebrew troubleshooting — service shows `error` and nothing listens on
> 5432.** Check `$(brew --prefix)/var/log/postgresql@16.log`. If it reports a
> stale `postmaster.pid`, confirm the referenced PID is not actually Postgres
> (`ps -p <PID>`) before removing the lock and restarting:
>
> ```bash
> rm "$(brew --prefix)/var/postgresql@16/postmaster.pid"
> brew services restart postgresql@16
> ```

### AI chat (Azure OpenAI)

The `/dashboard/ai` route uses AI SDK 7 with the latest AI Elements components.
Configure an Azure OpenAI deployment in `.env`:

```bash
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5-chat
```

`AZURE_OPENAI_DEPLOYMENT_NAME` defaults to `gpt-5-chat`. The page remains
available without these values, but disables its composer and shows the missing
configuration.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```text
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
