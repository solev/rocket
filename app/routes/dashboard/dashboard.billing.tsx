import * as React from "react";
import type { Route } from "./+types/dashboard.billing";
import { requireAuth } from "~/lib/auth/require-auth.server";
import { authClient } from "~/lib/auth/auth.client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return null;
}

type BillingClientData = { active: boolean; error?: string };

export async function clientLoader({}: Route.ClientLoaderArgs): Promise<BillingClientData> {
  try {
    const { data } = await authClient.customer.state();
    const subs: any[] = (data as any)?.subscriptions ?? [];
    const active = subs.some((s: any) => s?.status === "active");
    return { active };
  } catch (e: any) {
    return { active: false, error: e?.message || "Failed to load billing state" };
  }
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Loading…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your plan</CardTitle>
          <CardDescription>Your current subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading plan…</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardBilling({ loaderData }: Route.ComponentProps & { loaderData: BillingClientData }) {
  const [annual, setAnnual] = React.useState<boolean>(false);
  const { active, error } = loaderData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and customer portal.</p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle>Your plan</CardTitle>
          <CardDescription>Your current subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="font-medium">{active ? "Pro" : "Free"}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                {active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans card */}
      <Card>
        <CardHeader>
          <CardTitle>Change your plan</CardTitle>
          <CardDescription>Choose a plan to subscribe to.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pricing cadence toggle (same switch as landing) */}
          <div className="mb-6 flex items-center justify-start gap-3 text-xs">
            <span className={!annual ? "font-medium" : "text-muted-foreground"}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle annual pricing"
              type="button"
            >
              <span
                className={
                  "inline-block h-4 w-4 transform rounded-full bg-primary shadow transition-transform " +
                  (annual ? "translate-x-6" : "translate-x-1")
                }
              />
            </button>
            <span className={annual ? "font-medium" : "text-muted-foreground"}>Annual (save ~30%)</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Pro */}
            <div className="rounded-2xl border p-6 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-400/20">
              <div className="mb-4 inline-flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Pro</span>
                <span className="rounded-full border px-2 py-0.5 text-xs">Recommended</span>
              </div>
              <ul className="mb-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">✓ Another amazing feature</li>
                <li className="flex items-center gap-2">✓ Full support</li>
                <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400">◎ 7 days free trial</li>
              </ul>
              <div className="mb-4 text-3xl font-semibold">
                {annual ? "$290.00" : "$29.00"}
                <span className="text-sm font-normal text-muted-foreground">{" "}{annual ? "/ year" : "/ month"}</span>
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  try { await authClient.checkout({ slug: "pro" }) } catch (e) { console.error(e) }
                }}
              >
                Choose plan →
              </Button>
            </div>

            {/* Lifetime */}
            <div className="rounded-2xl border p-6 shadow-sm">
              <div className="mb-4 text-sm font-semibold">Lifetime</div>
              <ul className="mb-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">✓ No recurring costs</li>
                <li className="flex items-center gap-2">✓ Extended support</li>
              </ul>
              <div className="mb-4 text-3xl font-semibold">$799.00</div>
              <Button className="w-full" variant="outline" disabled>Choose plan →</Button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border p-6 shadow-sm">
              <div className="mb-2 text-sm font-semibold">Enterprise</div>
              <ul className="mb-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">✓ Unlimited projects</li>
                <li className="flex items-center gap-2">✓ Enterprise support</li>
              </ul>
              <Button className="w-full" variant="outline" disabled>Contact sales</Button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => { try { await authClient.customer.portal() } catch (e) { console.error(e) } }}
            >
              Open Customer Portal
            </Button>
            {active && (
              <Button
                type="button"
                onClick={async () => { try { await authClient.checkout({ slug: "pro" }) } catch (e) { console.error(e) } }}
              >
                Manage Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
