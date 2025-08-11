import { redirect } from "react-router";
import { auth } from "~/lib/auth/auth.server";

/** Get the current session (or null) directly via Better Auth server API */
export async function getSession(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers
    })
    return session;
}

/** Optional helper: returns user or null */
export async function getUser(request: Request) {
    const session = await getSession(request);
    return session?.user;
}

/** Require an authenticated user or redirect to /login */
export async function requireAuth(request: Request) {
    const user = await getUser(request);
    console.log(user);
    if (!user) throw redirect("/login");
    return user;
}
