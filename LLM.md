# LLM Context Contract

A fresh LLM must first determine:

1. whether the task belongs to App Manager, Catalog, an App, EVO, or Eidos;
2. which public contracts are authoritative;
3. manifest/version/dependency impact;
4. lifecycle safety and rollback implications;
5. certification required.

Human + LLM operability:

- apps/configurators must expose business-readable concepts, not only IDs/AST/internal contracts;
- human developers are not an assumed system role; LLMs are the default engineers for ordinary implementation and extension work;
- ordinary configuration must be possible without human developer intervention;
- UI should guide novice users while allowing advanced detail through progressive disclosure;
- LLM-facing schemas and human-facing forms must describe the same semantics;
- validation/error messages explain business consequences first.

Authority: `docs/architecture/HUMAN-LLM-OPERABILITY-v0.1.md`.

Default rules:

- Prefer existing App and public contract composition over creating new platform code.
- EVO is a lightweight runtime plugin, not the enterprise platform Core.
- Do not solve an App requirement by expanding EVO runtime unless generic BusinessData → PostingRule → Ledger → Balance genuinely requires it.
- Identity, permissions, rich Application/Package lifecycle, capability discovery and PostingRule lifecycle belong to App Platform/Host or other plugins. EVO runtime still owns a minimal ApplicationAnchor/applicationId used to route BusinessData to current PostingRules.
- Do not import private EVO/Eidos implementation.
- Do not let App Manager know app-specific business semantics.
- Record confirmed architectural decisions in repository artifacts.


Before changing package/application architecture, always distinguish:

- Package lifecycle vs Feature lifecycle;
- Package dependency vs Feature/capability dependency;
- installation scope vs Feature activation scope;
- Feature vs Capability vs Contribution;
- package topology vs repository topology.

Canonical mental model:

```text
Package = what enters the system
Feature = what becomes active
Contribution = what the Feature adds
```

Read `docs/architecture/PACKAGE-FEATURE-CONTRIBUTION-MODEL-v0.1.md` before modifying manifests or lifecycle behavior.


## Current handoff — 2026-09-23

Before continuing the current short-term mainline, read:

`docs/roadmap/HANDOFF-2026-09-23-PROOF-C-IMPLEMENTATION-READY.md`

It records the user-confirmed local Proof A/Proof B, the CI-verified Proof C real EVO public-command integration, the remaining local browser proof, and the next public query/result slice.

When `project.status.json` contains a `handoff` field, treat that referenced document as required continuation context.


## EVO application routing invariant

For any App using EVO:

```text
ApplicationAnchor.applicationId
= PostingRule.applicationId
= BusinessData.applicationId
```

Do not treat `applicationId` as optional provenance. It is the first PostingRule routing key.
