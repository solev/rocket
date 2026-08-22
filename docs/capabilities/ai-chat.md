# Azure AI Chat

**Tier:** Experimental — outside Rocket's production-support guarantee.

A streaming chat interface backed by Azure OpenAI, using the Vercel AI SDK.

## Coverage gaps

This capability is experimental because it does not meet the bar Rocket holds production-supported capabilities to. Before shipping it, you own each of these:

- **No conversation persistence.** Threads live in browser memory and vanish on reload. There is no schema, no ownership scoping, and therefore no organization-aware isolation of chat history.
- **No rate limiting or spend control.** Any authenticated user can issue unbounded requests against your Azure deployment. Cost is your responsibility.
- **No content moderation.** Rocket applies no input or output filtering beyond whatever Azure Content Safety your deployment already enforces.
- **No abuse or audit trail.** Prompts and completions are not recorded, so there is nothing to review after an incident.
- **Provider-locked.** The module targets Azure OpenAI specifically, not a provider-neutral abstraction.
- **Thin test coverage.** Only the availability contract is tested; streaming behavior is not.

## Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `AZURE_OPENAI_RESOURCE_NAME` | to enable | Azure resource name. |
| `AZURE_OPENAI_API_KEY` | to enable | API key for that resource. |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | no | Deployment to call. Defaults to `gpt-5-chat`. |

Resource name and API key form an all-or-nothing group: supplying one without the other fails startup rather than producing a half-configured client.

## Availability

```ts
import { isAiChatAvailable } from "~/capabilities/ai-chat/ai-chat.server";
```

Side-effect-free and never throws. Available when both the resource name and the API key are present.

## Invocation

`getChatModel()` throws `CapabilityUnavailableError` when the capability is unavailable, naming the capability and linking this guide without exposing the key.

The model is created through `azure.chat(...)` rather than the AI SDK's default. AI SDK 6+ defaults Azure to the Responses API; `.chat()` pins Chat Completions so existing deployments keep working.

## Integration

- **API route** — `app/routes/api/chat.tsx` streams completions. It must refuse requests when the capability is unavailable rather than throwing an unhandled error.
- **UI route** — `app/routes/ai/chat.tsx`, mounted at `/dashboard/ai`.
- **Components** — `app/routes/ai/components/` and `app/components/ai-elements/`.

Both routes require authentication through the standard Core guards.

## Tests

`tests/unit/capability-contract.test.ts` covers absent, unavailable-invocation, and configured states plus deployment-name resolution against the pure `config.ts`. Partial configuration is covered by `tests/unit/env-schema.test.ts`. No test contacts Azure.

## Manual removal

1. Delete `app/capabilities/ai-chat/`.
2. Delete `app/routes/ai/`, `app/routes/api/chat.tsx`, and `app/components/ai-elements/`.
3. Remove the `ai` and `api/chat` entries from `app/routes.ts`.
4. Remove any navigation pointing at `/dashboard/ai` in `app/components/app-sidebar.tsx`.
5. In `app/lib/env/schema.ts`, remove the `AZURE_OPENAI_*` variables and the `azureOpenAi` capability group; mirror the change in `.env.example` and re-run `bun run env:check`.
6. Remove `@ai-sdk/azure`, `@ai-sdk/react`, `ai`, `streamdown`, and the `@streamdown/*` packages from `package.json` if nothing else uses them.
7. Delete the AI cases from `tests/unit/capability-contract.test.ts`.

AI Chat adds no tables, so no removal migration is needed.
