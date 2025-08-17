Short answer: you don’t have to paste the same check everywhere. In Remix you typically centralize auth in **two layers**:

1. a **reusable server helper** (`getUser` / `requireUser`)
2. a **protected parent route** whose `loader` enforces auth for everything nested under it

Then you only add per‑route checks where they truly diverge (e.g., role‑based rules, API-only routes).

---

# The core building blocks

### 1) Session + helpers (one place)

```ts
// app/utils/session.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: { name: "__session", httpOnly: true, path: "/", sameSite: "lax", secure: true }
});

export async function getUser(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("cookie"));
  const user = session.get("user"); // or userId -> lookup in DB
  return user ?? null;
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) throw redirect(`/login?redirectTo=${new URL(request.url).pathname}`);
  return user;
}
```

Use `getUser` when auth is optional, `requireUser` when it’s mandatory.

### 2) Protected parent route (generic guard)

Put all private pages under a parent route (e.g. `/app/*`) and guard **once**:

```ts
// app/routes/app.tsx  (layout route: /app and everything nested)
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request); // <- single check for the whole section
  return { user };
}

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();
  return <Outlet context={{ user }} />;
}
```

All child **loaders** run only after the parent loader succeeds, so they’re effectively protected without repeating the “is logged in?” check.

> Note: **actions are independent**. If a nested route has its own `action`, it won’t inherit the parent’s check automatically. See the next pattern to avoid repetition.

### 3) Higher‑order wrappers for loaders/actions (zero boilerplate)

Create small wrappers that inject the user and enforce auth:

```ts
// app/utils/guard.server.ts
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { requireUser, getUser } from "./session.server";

export function withAuthLoader<L extends LoaderFunction>(fn: (args: Parameters<L>[0] & { user: any }) => ReturnType<L>): LoaderFunction {
  return async (args) => {
    const user = await requireUser(args.request);
    return fn({ ...args, user });
  };
}

export function withOptionalUserLoader<L extends LoaderFunction>(fn: (args: Parameters<L>[0] & { user: any|null }) => ReturnType<L>): LoaderFunction {
  return async (args) => fn({ ...args, user: await getUser(args.request) });
}

export function withAuthAction<A extends ActionFunction>(fn: (args: Parameters<A>[0] & { user: any }) => ReturnType<A>): ActionFunction {
  return async (args) => {
    const user = await requireUser(args.request);
    return fn({ ...args, user });
  };
}
```

Usage:

```ts
// app/routes/app.profile.tsx
export const loader = withAuthLoader(async ({ user }) => {
  return json({ profile: await db.user.get(user.id) });
});

export const action = withAuthAction(async ({ request, user }) => {
  // safe: user guaranteed
});
```

Now every place that needs “must be logged in” can be wrapped, without pasting logic.

### 4) Root loader for “optional user” (navbar, client context)

If you want the current user available everywhere (even public pages), do this in `root.tsx`:

```ts
// app/root.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  return { user: await getUser(request) }; // optional
}
```

---

# Where else can you centralize?

* **Use a parent `action`**: If most mutations happen inside the protected layout, post to the **parent route’s action** (via `<Form method="post">` without an `action` prop). Then the **single** parent `action` can be `withAuthAction(...)`. Child pages don’t need their own actions unless they have unique endpoints.

* **Custom adapters / middleware**: If you self‑host with Express/Cloudflare/Netlify, you can add middleware to decorate the request (e.g., attach `user`), but Remix still calls each route’s `loader`/`action`. Middleware is nice for things like bot denial or header normalization; auth decisions are usually clearer inside the route system with the wrappers above. (Edge middleware on some hosts can pre‑redirect unauthenticated users for UX, but you should still enforce on the server.)

* **Route metadata switches**: Some teams export a `handle = { requiresAuth: true }` per route and build a tiny wrapper that throws if set. It’s syntactic sugar over the wrappers—use if you like the declarative feel.

---

# Practical recommendation

* Put **all private UI under `/app`** (or similar) and guard it in the parent loader.
* Expose **one parent action** for common mutations, or wrap child actions with `withAuthAction`.
* Keep **`getUser`/`requireUser`** as your single source of truth for “who is logged in” and “redirect if not.”

This gives you generic, DRY enforcement without sprinkling duplicate checks everywhere, and with clear escape hatches for routes that need different rules (roles, teams, feature flags).
