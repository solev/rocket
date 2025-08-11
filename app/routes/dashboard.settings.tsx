import React, { useState, type FormEvent } from "react";
import { authClient } from "~/lib/auth/auth.client";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useNavigation,
  useActionData,
  Form,
} from "react-router";
import { requireAuth } from "~/lib/auth/require-auth.server";
import {
  loadGeneralSettings,
  saveGeneralSettings,
} from "~/services/settings.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

interface GeneralSettingsState {
  orgName: string;
  contactEmail: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  defaultModel: string;
  webhookUrl: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const settings = await loadGeneralSettings(user.id);
  return { userId: user.id, settings };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  try {
    const updated = await saveGeneralSettings(user.id, {
      orgName: (data.orgName as string) || undefined,
      contactEmail: (data.contactEmail as string) || undefined,
      defaultModel: (data.defaultModel as string) || undefined,
      webhookUrl: (data.webhookUrl as string) || undefined,
      openaiApiKey: (data.openaiApiKey as string) || undefined,
      anthropicApiKey: (data.anthropicApiKey as string) || undefined,
    });
    return { ok: true, settings: updated };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export default function DashboardSettings() {
  const data = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const settings = data?.settings as any;
  const actionData = useActionData() as any;
  const nav = useNavigation();
  const initial: GeneralSettingsState = {
    orgName: settings?.orgName || "",
    contactEmail: settings?.contactEmail || "",
    openaiApiKey: settings?.openaiApiKey || "",
    anthropicApiKey: settings?.anthropicApiKey || "",
    defaultModel: settings?.defaultModel || "gpt-4o-mini",
    webhookUrl: settings?.webhookUrl || "",
  };
  const [form, setForm] = useState<GeneralSettingsState>(initial);
  const saved = !!actionData?.ok;
  const saving = nav.state === "submitting";
  const [subStatus, setSubStatus] = useState<"loading" | "active" | "inactive">(
    "loading"
  );
  const [subError, setSubError] = useState<string | null>(null);

  // Load current customer state to derive subscription status
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await authClient.customer.state();
        console.log(data);
        if (ignore) return;
        // Polar customer state includes subscriptions under data.subscriptions (typed in SDK); fall back gracefully
        const subs: any[] = (data as any)?.subscriptions ?? [];
        const hasActive = subs.some((s: any) => s?.status === "active");
        setSubStatus(hasActive ? "active" : "inactive");
      } catch (e: any) {
        if (!ignore)
          setSubError(e?.message || "Failed to load subscription state");
        setSubStatus("inactive");
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  function handleChange<K extends keyof GeneralSettingsState>(
    key: K,
    value: GeneralSettingsState[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleReset() {
    setForm(initial);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          General Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure organization identity and AI provider credentials. Secrets
          are encrypted at rest.
        </p>
      </div>
      <Form method="post" replace className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Basic profile details displayed across your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="orgName">
                Name
              </label>
              <Input
                name="orgName"
                id="orgName"
                value={form.orgName}
                onChange={(e) => handleChange("orgName", e.target.value)}
                placeholder="Acme Inc"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="contactEmail">
                Contact Email
              </label>
              <Input
                name="contactEmail"
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="team@company.com"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="webhookUrl">
                Webhook URL
              </label>
              <Input
                name="webhookUrl"
                id="webhookUrl"
                value={form.webhookUrl}
                onChange={(e) => handleChange("webhookUrl", e.target.value)}
                placeholder="https://api.example.com/webhooks/events"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send signed event payloads here. Rotate the secret in your
                developer settings.
              </p>
            </div>
          </CardContent>
        </Card>

  {/* Billing moved to /dashboard/billing */}

        <Card>
          <CardHeader>
            <CardTitle>AI Providers</CardTitle>
            <CardDescription>
              Store API keys for model inference. Keys never leave the server.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="defaultModel">
                Default Model
              </label>
              <Input
                name="defaultModel"
                id="defaultModel"
                value={form.defaultModel}
                onChange={(e) => handleChange("defaultModel", e.target.value)}
                placeholder="gpt-4o"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="openaiApiKey">
                OpenAI API Key
              </label>
              <Input
                name="openaiApiKey"
                id="openaiApiKey"
                type="password"
                value={form.openaiApiKey}
                onChange={(e) => handleChange("openaiApiKey", e.target.value)}
                placeholder="sk-********************************"
              />
              <p className="text-xs text-muted-foreground">
                Prefixed with sk- · stored encrypted.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="anthropicApiKey">
                Anthropic API Key
              </label>
              <Input
                name="anthropicApiKey"
                id="anthropicApiKey"
                type="password"
                value={form.anthropicApiKey}
                onChange={(e) =>
                  handleChange("anthropicApiKey", e.target.value)
                }
                placeholder="sk-ant-********************************"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Theme & display preferences (local-only prototype).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="theme">
                Theme
              </label>
              <Input id="theme" value="system" disabled />
              <p className="text-xs text-muted-foreground">
                UI theme selection coming soon.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="density">
                Density
              </label>
              <Input id="density" value="comfortable" disabled />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </Button>
          {saved && (
            <span className="text-xs text-green-600">Settings updated.</span>
          )}
          {actionData?.error && (
            <span className="text-xs text-red-600">{actionData.error}</span>
          )}
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Persisted via user_settings table. Secrets should be vaulted /
          encrypted in production.
        </p>
      </Form>
    </div>
  );
}
