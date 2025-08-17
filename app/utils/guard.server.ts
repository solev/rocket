// Higher-order wrappers for React Router loaders/actions to inject auth user
// Keep this file server-only (".server.ts") so it never ships to the client.

// 1) React Router core types
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

// 2) Application-specific auth helpers
import { getUser, requireAuth } from "~/lib/auth/require-auth.server";

// Type helpers derived from our auth helpers (no `any`)
export type RequireUser = Awaited<ReturnType<typeof requireAuth>>;
export type OptionalUser = Awaited<ReturnType<typeof getUser>>;

/**
 * withAuthLoader: wraps a loader so it runs only for authenticated users
 * and injects a guaranteed `user` property.
 */
export function withAuthLoader<
  L extends (args: LoaderFunctionArgs & { user: RequireUser }) => unknown
>(
  fn: L
): (args: LoaderFunctionArgs) => Promise<Awaited<ReturnType<L>>> {
  return async (args: LoaderFunctionArgs): Promise<Awaited<ReturnType<L>>> => {
    const user = await requireAuth(args.request);
    return (await fn({ ...args, user } as Parameters<L>[0])) as Awaited<ReturnType<L>>;
  };
}

/**
 * withOptionalUserLoader: wraps a loader and injects `user` that may be null.
 * Useful for public pages that are user-aware (e.g., navbar state).
 */
export function withOptionalUserLoader<
  L extends (args: LoaderFunctionArgs & { user: OptionalUser }) => unknown
>(
  fn: L
): (args: LoaderFunctionArgs) => Promise<Awaited<ReturnType<L>>> {
  return async (args: LoaderFunctionArgs): Promise<Awaited<ReturnType<L>>> => {
    const user = await getUser(args.request);
    return (await fn({ ...args, user } as Parameters<L>[0])) as Awaited<ReturnType<L>>;
  };
}

/**
 * withAuthAction: wraps an action so it requires a logged-in user
 * and injects a guaranteed `user` property.
 */
export function withAuthAction<
  A extends (args: ActionFunctionArgs & { user: RequireUser }) => unknown
>(
  fn: A
): (args: ActionFunctionArgs) => Promise<Awaited<ReturnType<A>>> {
  return async (args: ActionFunctionArgs): Promise<Awaited<ReturnType<A>>> => {
    const user = await requireAuth(args.request);
    return (await fn({ ...args, user } as Parameters<A>[0])) as Awaited<ReturnType<A>>;
  };
}
