# Upstreaming to Rocket

How functionality built in a Rocket application makes its way back into Rocket itself.

Rocket applications start by cloning or forking Rocket, so work happens downstream, inside an application that has its own product assumptions. Occasionally that work turns out to belong to every Rocket application. This is the route back.

This is promotion **up**, from one application into Rocket. It is not downstream upgrade automation: Rocket does not propagate changes back down into applications that already forked, and it does not promise to.

## Trigger

When work in a Rocket application produces something with no product-specific assumptions, stop and raise it. Do not decide silently in either direction.

Signals that something belongs upstream:

- it touches no product-owned table, route, or domain concept;
- you would copy it into the next Rocket application unchanged;
- it wires a third-party service that applications of this kind generally need.

Signals that it does not:

- it is merely reusable *within* this application;
- it encodes a product decision — pricing, workflow, or business rules;
- it is plain local code with no configuration and no third-party surface. Keep it.

## The bar

Two questions, in this order.

**1. Would every Rocket application want it?** If only some would, it must be optional, which makes it an Integration. If all would, it may be Core.

**2. Does it require external configuration or a third-party account?** If yes, it is an Integration regardless of how universally wanted it is, and owes the full integration contract below. If no, it can be ordinary Core code and owes only the Quality foundation.

Anything that cannot clear its side of that line stays in the application that wrote it.

## Two routes

Pick by how ready the code is, not by how large it is.

**Route A — file an issue.** Use when the idea is proven but the code is still tangled in the application, or when generalizing it is work you are not doing right now. File against Rocket, describing the need and what the downstream application actually did. This is the default; an unfiled good idea is a lost one.

**Route B — refactor in place, then open a PR.** Use when you have working code you can shape now.

1. Reshape it inside the downstream application into the form it will take in Rocket: its own localized directory, owning its configuration validation, availability check, operations, schema, endpoints, tests, and guide.
2. Strip the product assumptions — application-specific tables, routes, env names, and copy.
3. Confirm the application still works against the reshaped module. If it does not survive being generalized in its own home, it is not ready to leave it.
4. Open a PR against the Rocket repository.

## What an upstream PR must arrive with

An Integration PR is only complete when it carries everything the integration contract requires:

- a localized module that owns its provider-specific configuration and validation;
- absent configuration treated as unavailable, with partial or malformed configuration failing startup;
- a side-effect-free availability check, and `IntegrationUnavailableError` when unavailable behavior is invoked;
- colocated Drizzle schema plus a normal chronological migration;
- tests covering absent, invalid, unavailable, and configured states, using mocks rather than real third-party accounts;
- one guide covering configuration, availability, invocation, application integration, and manual removal.

A Core PR skips the configuration and availability items but still owes tests and documentation.

## Do not

- Copy code between clones without filing anything. That is how two applications silently diverge.
- Ship an Integration PR without its guide or removal instructions. An undocumented integration cannot be removed, and removability is the promise Rocket makes.
- Treat a merged PR as admission to the **supported portfolio**. What Rocket supports, and what it merely contains, is a roadmap decision made on the tracker — not something a PR decides on its own.
