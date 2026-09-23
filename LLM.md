# LLM Context Contract

A fresh LLM must first determine:

1. whether the task belongs to App Manager, Catalog, an App, EVO, or Eidos;
2. which public contracts are authoritative;
3. manifest/version/dependency impact;
4. lifecycle safety and rollback implications;
5. certification required.

Default rules:

- Prefer existing App and public contract composition over creating new platform code.
- Do not solve an App requirement by modifying EVO Core or Eidos Core unless a genuine reusable capability gap is proven.
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

`docs/roadmap/HANDOFF-2026-09-23-PROOF-B-DEPENDENCY-GRAPH.md`

It records the user-confirmed local Proof A, the CI-verified Proof B dependency-graph core, current limitations, and the exact next end-to-end validation steps.

When `project.status.json` contains a `handoff` field, treat that referenced document as required continuation context.
