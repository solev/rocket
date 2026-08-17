# Folder-naming prior art: `app/capabilities/`

**Question:** what do widely-copied repositories call the folder holding optional,
self-contained third-party integrations, and does `capabilities/` fit?

**Outcome:** acted on — `app/capabilities/` was renamed to `app/integrations/`,
and the domain term with it. See the recommendation below for the reasoning and
the honest argument against.

Every path below was verified against the live GitHub contents API, not a
write-up. GitHub code search was unavailable with this token, so claims of
*absence* are scoped to the repositories actually inspected and are stated that
way.

## What is being named

`app/capabilities/` currently holds `billing/` (Polar) and `ai-chat/`. The
defining traits, from `docs/roadmap.md` and `CONTEXT.md`:

- **optional** — absent configuration is a valid, supported state
- **externally backed** — a third-party provider sits behind it
- **env-configured** — pure `config.ts` plus a `*.server.ts` binding it to `env`
- **self-contained** — owns its validation, availability check, schema,
  endpoints, tests, and guide
- **hand-removable** — no registry, no manifest, no add/remove command

## Evidence

| Name | Verified path | What it holds there | Optional? | Fit |
| --- | --- | --- | --- | --- |
| `integrations/` | `withastro/astro` → `packages/integrations/` | `react`, `mdx`, `tailwind`, `netlify`, `cloudflare`, `partytown`, `sitemap`… | Yes — opt-in per project | **Strong.** The canonical use of the word for "optional external binding". |
| `integrations/` | `dubinc/dub` → `apps/web/lib/integrations/` | `stripe`, `slack`, `shopify`, `hubspot`, `segment`, `intercom`, `bitly` | Yes, but via an `install.ts` registry | **Strong on content**, heavier on mechanism than Rocket wants. |
| `integrations/` | `better-auth/better-auth` → `packages/better-auth/src/integrations/` | `next-js.ts`, `svelte-kit.ts`, `node.ts`, `tanstack-start.ts` | Yes — one per host | Good match for Rocket's *mounted* sub-kind. |
| `providers/` | `medusajs/medusa` → `packages/modules/providers/` | `payment-stripe`, `notification-sendgrid`, `file-s3`, `analytics-posthog`, `auth-google`, plus `*-local` fallbacks | Yes — swap per deployment | **Closest analogue found**, with a caveat below. |
| `modules/` | `medusajs/medusa` → `packages/modules/` | `cart`, `customer`, `currency`, `api-key`, `cache-redis` | No — mostly the product | Too broad. |
| `modules/` | `twentyhq/twenty` → `packages/twenty-server/src/modules/` | `messaging`, `calendar`, `workflow` | No — domain objects | Wrong. |
| `modules/` | `formbricks/formbricks` → `apps/web/modules/` | `auth`, `billing`, `survey`, `email`, `entitlements`, `ee` | No — all vertical slices | Wrong. |
| `features/` | `calcom/cal.com` → `packages/features/` | `bookings`, `availability`, `auth`, `apps`, `blocklist` | No — product slices | Wrong; `CONTEXT.md` already rejects "feature". |
| `lib/` | `nextjs/saas-starter` → `lib/` | `auth`, `db`, `payments`, `utils.ts` | No — payments is mandatory | No optionality signal. |

### The Medusa caveat

`packages/modules/providers/` is the nearest match in shape — optional,
externally backed, env-configured, one folder each. But a Medusa provider
**implements a Medusa-defined interface** (`payment-stripe` is one implementation
of the payment interface, swappable for another).

Rocket's billing capability is not an implementation of a billing interface; it
*is* the billing concern, Polar-shaped throughout. Nothing is meant to be swapped
in behind it. So `providers/` would misdescribe billing and ai-chat.

Where Rocket *does* match Medusa exactly is the **email seam**: Medusa's
`notification-local` and `file-local` are no-op local fallbacks shipped beside
the real ones, which is precisely what `app/lib/email/delivery.server.ts` does
(console in development, refuse in production). That is a point in favour of the
current seam design, and worth revisiting if a second seam appears.

### Starters mostly dodge the question

`nextjs/saas-starter` (`lib/payments/`) and similar starters treat their
third-party choices as mandatory and give them no optionality signal at all.
Rocket is deliberately doing something they don't, so there is little prior art
to copy from the starter category specifically. Astro remains the best model.

## Does `capabilities/` have precedent?

**Not in any repository inspected here.** No project examined uses
`capabilities/` as a folder of optional external integrations.

Where the word does appear nearby, it means something else:

- `dubinc/dub` → `apps/web/lib/plan-capabilities.ts` — **billing-plan
  entitlements** ("what does this tier unlock"), verified present. This is the
  in-domain collision and it points the opposite way from Rocket's meaning:
  entitlements are about what a *customer* may do, not what the *application* has
  been configured with.
- `formbricks/formbricks` → `apps/web/modules/entitlements/` — same idea under a
  different name, confirming that this neighbourhood of vocabulary is already
  spoken for by billing tiers.

Established meanings elsewhere in computing: capability-based security
(seL4, CHERI, Capsicum), Linux `CAP_*` privileges, WASI capabilities, Kubernetes
`securityContext.capabilities`, WebDriver/Playwright `capabilities` config, and
"agent capabilities" in LLM tooling. The word is heavily loaded, and several of
those meanings are common in exactly the DevOps/AI neighbourhoods Rocket sits in.

## Assessment

### The case for keeping `capabilities/`

The internal vocabulary is genuinely coherent, and it survives every compound
position it is used in: `CapabilityUnavailableError`, `requireCapability`,
`CapabilityGroup`, "present / active / mounted / invoked service capability".
That is not nothing — a word that stays readable under that much modification is
doing real work.

It is also broader than "third-party", which matters for the deferred backlog.
Background jobs and audit logging could plausibly be implemented **in-house**, at
which point they would be optional concerns with an availability contract but not
integrations with anyone.

Giving a common word a precise local meaning is normal domain modelling, and
`CONTEXT.md` exists precisely to hold that definition.

### The case against

The collision is not hypothetical — a verified neighbour in the same
category (`dub`) uses "capabilities" for plan entitlements. Rocket is a **starter
read cold**, by newcomers and by coding agents, and first-read legibility is
worth more here than in a product codebase nobody clones. Someone hunting for the
Polar code scans for `integrations`, `billing`, or `payments`, not `capabilities`.

### On one argument that does not hold

`CONTEXT.md` lists "integration" under _Avoid_ for this term. That cannot be used
to defend the current name: it is a record of the same decision now under review,
so citing it is circular. It should be re-argued on the merits or changed.

### On the test-name collision

Renaming to `integrations/` would put `tests/integration/` (methodology) next to
`app/integrations/` (subject), making `tests/integration/integration-endpoints.test.ts`
ambiguous. Real, but small and avoidable — it touches two files, and both read
better when named after what they assert:

- `tests/unit/capability-contract.test.ts` → `tests/unit/availability-contract.test.ts`
- `tests/integration/capability-endpoints.test.ts` → `tests/integration/webhook-endpoints.test.ts`

This is not a decisive objection to the rename.

## Recommendation

**Rename the folder to `app/integrations/`, and the concept with it.**

It is the best-attested name for exactly this thing (Astro, Dub, Better Auth all
verified), it carries no competing meaning in TypeScript application code, and
every item in the folder today — and every item on the deferred backlog that has
a named provider — is literally an integration with an external service.

Rocket's audience is people reading it cold. That tips a close call toward the
word the ecosystem already uses.

Knock-on renames, all of which read cleanly:

| Now | Becomes |
| --- | --- |
| `app/capabilities/` | `app/integrations/` |
| `docs/capabilities/` | `docs/integrations/` |
| `app/lib/capability.ts` | `app/lib/integration.ts` |
| `CapabilityUnavailableError` | `IntegrationUnavailableError` |
| `requireCapability()` | `requireIntegration()` |
| `CapabilityGroup` / `refineCapabilityGroups` | `IntegrationGroup` / `refineIntegrationGroups` |
| `BILLING_CAPABILITY` | `BILLING_INTEGRATION` |
| `app/lib/env/capability-group.ts` | `app/lib/env/integration-group.ts` |
| "mounted / active / present capability" | "mounted / active / present integration" |

Scope: roughly 199 occurrences across 33 files, plus the `CONTEXT.md` entries.
Mechanical, but it touches the domain glossary, so it is a deliberate decision
rather than a tidy-up.

### The strongest argument against this recommendation

"Integration" describes *where the code points* (outward, at a vendor), while
"capability" describes *what the application gains*. If Rocket ever ships an
optional concern with no vendor behind it — in-house audit logging, a pg-boss job
runner — it would be an integration with nothing, and the folder name would have
to stretch or the item would need a second home. `capabilities/` never has that
problem.

If that future feels likely, keeping `capabilities/` is defensible; the word is
imprecise to outsiders but never *wrong*. If Rocket's optional surface stays
vendor-backed, `integrations/` is the clearer name.

### Either way: fix the glossary

`CONTEXT.md` currently defines Capability as "a cohesive product or operational
concern with explicit ownership of every artifact it contributes." That
definition does not mention **optionality**, which is the trait the whole
contract is built on — absent configuration being valid is the entire point.
Optionality is currently implied only by contrast with the separate **Core**
entry.

Whichever name wins, the definition should name the trait outright: *selectable,
not universal; may be absent, and absence is valid.* That gap is independent of
the rename and is worth closing regardless.
