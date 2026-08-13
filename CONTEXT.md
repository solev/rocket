# Rocket Starter

Rocket is a reusable foundation for producing independently owned full-stack
React Router applications with deliberate, supportable capability choices.

## Language

**Rocket**:
The source starter and composition system from which downstream applications are created.
_Avoid_: App, product

**Rocket application**:
An independently owned application started by cloning or forking Rocket and subsequently customized for its own product.
_Avoid_: Generated application, Rocket instance

**Capability**:
A cohesive product or operational concern with explicit ownership of every artifact it contributes.
_Avoid_: Feature, integration

**Upstream promotion**:
The route by which functionality first built in one Rocket application is added to Rocket itself.
_Avoid_: Backport, syncing, merging down

**Core**:
The universal foundation included in every Rocket application regardless of its profile.
_Avoid_: Default module, base feature

**Organization**:
The universal ownership boundary for users and application data in every Rocket application.
_Avoid_: Optional tenant

**Single-organization mode**:
The Core experience in which one organization exists behind the scenes and organization-management controls are not exposed.
_Avoid_: Organization-free mode

**Quality foundation**:
The vendor-neutral checks and test infrastructure included in Core that every Rocket application must pass without third-party service accounts.
_Avoid_: CI setup, developer tooling

**Authenticated application**:
An interactive Rocket application whose primary experience is user-specific and protected by sign-in.
_Avoid_: SaaS app, internal tool, portal

**Present capability**:
A capability whose code and owned artifacts exist in a Rocket application, whether configured or not.
_Avoid_: Enabled feature

**Active capability**:
A present capability whose required runtime configuration is valid and whose behavior is available.
_Avoid_: Installed feature

**Mounted capability**:
A capability integrated into shared runtime composition, such as framework plugins or technical endpoints, that must protect its owned behavior when inactive.
_Avoid_: Always-on capability

**Invoked service capability**:
A capability whose behavior occurs only when application code explicitly calls it and which must report missing configuration clearly when called while inactive.
_Avoid_: Utility integration
