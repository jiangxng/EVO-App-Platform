# LLM Context Contract

> **P0 mainline (2026-09-25):** Read `docs/architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md` first for plugin-platform work, then `docs/architecture/INTERNAL-PLUGIN-AND-EXTERNAL-INTEGRATION-v0.1.md` when deciding protocol boundaries. The default integration scope is **EVO App Platform + Eidos only**. Native EVO plugins use EVO Plugin Protocol; MCP/OAuth are external-integration protocols and are not default native-plugin dependencies. Do not load, modify or run EVO Ledger Runtime, Enterprise Agent/EC or unrelated plugin CI unless the task directly owns that dependency or changes Plugin Protocol compatibility.

A fresh LLM must first determine:

1. whether the task belongs to App Manager, Catalog, one specific Plugin, EVO, or Eidos;
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

For ordinary plugin work, also read `docs/architecture/PLUGIN-PROTOCOL-v0.1.md`. Load only that plugin's context plus the public contracts for capabilities it directly consumes. Do not load or test the whole plugin portfolio by default.


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


## MVP Autonomy Rule

When the human has already established the business goal and acceptance outcome, the LLM SHOULD proceed directly with the smallest reversible MVP implementation without asking for another "continue / shall I implement" confirmation.

This rule applies when all are true:

- the business intent is already clear;
- no new human business judgment or authorization is required;
- the change is bounded, reversible, and consistent with existing invariants;
- an MVP implementation can provide concrete evidence faster than further discussion;
- any likely correction remains small because scope is deliberately minimal.

The LLM must still stop for destructive actions that require explicit authorization, material requirement reinterpretation, irreversible data changes, security-sensitive decisions, or choices whose business trade-off belongs to the human.

Default delivery loop:

```text
clear business goal
→ smallest sufficient implementation
→ executable evidence
→ deploy/test when useful
→ human validates the business outcome
```

Do not spend conversation length explaining an obvious next engineering step when the step can be safely executed immediately. Record durable decisions and evidence in repository artifacts instead of relying on chat history.


## MVP Depth Rule

MVP limits **horizontal feature expansion**, not vertical depth, representative data volume, compatibility coverage, or evidence quality inside an already accepted capability boundary.

For a capability that is already in scope:

- use the full representative dataset when it is available;
- do not replace real compatibility coverage with toy fixtures merely to make the MVP smaller;
- pressure/stress-style historical datasets are valid MVP acceptance evidence when they test the capability boundary itself;
- incomplete data migration is not an acceptable shortcut if completeness is necessary to validate the chosen capability.

For the Ledger Runtime Configurator bookkeeping baseline, the current acceptance rule is **912/912 posting rules must compile and be burnable as one configuration**. The 912-rule corpus is treated as in-boundary compatibility/pressure evidence, not as optional horizontal scope.

## Project Validation Constitution

These rules are founder-confirmed acceptance gates and MUST NOT be skipped:

1. **Installation-first** — an installable plugin/package is not product-validated by testing a preinstalled state. Start with the target absent; the system must automatically execute side-effect-free preflight/dependency resolution before installation. Do not require a human to manually inspect a plan for ordinary low-risk installs. Escalate to human review only for blockers or material decisions.
2. **Eidos-first human surface** — all human-facing EVO App/Configurator/business product validation surfaces use Eidos public contracts/capabilities. Handwritten diagnostic HTML/JS is allowed only when explicitly marked non-product and cannot satisfy UX/product acceptance.
3. **No lifecycle bypass** — app-specific APIs and Experience assets are gated by active Feature state. A backdoor/direct endpoint must not make a not-yet-installed plugin appear usable.
4. **Evidence labeling** — component/API tests that intentionally bypass installation remain useful engineering evidence, but must be labeled component evidence rather than end-to-end product acceptance.

Canonical manual validation journey:

```text
Catalog discovery
→ automatic side-effect-free preflight / dependency resolution
→ Package installation
→ Feature activation
→ Contribution + Eidos Experience discovery
→ open Eidos-rendered product surface
→ app configuration
→ compile/validate
→ Burn/activate runtime configuration
→ representative BusinessData
→ runtime result
```


## Continuous System Growth Rule

EVO is a long-lived continuously integrated system, not a sequence of disposable demonstrations.

Every accepted MVP slice MUST converge into the existing architecture and leave durable project capital:

- reusable implementation in the correct owner repository;
- stable public contracts or explicit versioned changes;
- automated regression/acceptance tests;
- CI coverage;
- architecture/status documentation sufficient for a fresh LLM;
- deployment/validation paths that exercise the same production boundaries.

Existing implementation assets must be discovered and reused/converged before creating replacements. A proof/demo is evidence only; it must not become a parallel product architecture.

For frontend growth:

```text
App Platform lifecycle + business packages
        ↓ effective Experience Contributions
Eidos App Host (single production shell)
        ↓
Eidos public capabilities/renderers
        ↓
Human
```

Plugin Store is a system Experience hosted by App Host. Installed plugins add/remove effective Experience Contributions; they do not create independent application shells.

## Closed-loop Completeness Rule

For common platform capabilities, do not wait for the human to enumerate standard lifecycle operations one by one.

Before declaring a capability complete, identify its conventional state machine and implement the normal forward, inverse and recovery transitions that belong to the accepted boundary. If a transition is unsafe or intentionally excluded, encode a deterministic blocker and document why.

For App Platform Package lifecycle, the minimum normal closure is:

```text
not installed
→ install
→ enabled
↔ disabled
→ uninstall
→ not installed
```

Dependencies must be checked before disable/uninstall. Disabling/uninstalling an App removes its effective Contributions/Experience from App Host but must not silently delete authoritative business history.

Product acceptance also requires **human visibility**: an installed + enabled Experience must be discoverable in App Host navigation/store, loadable through the Experience source, and renderable through Eidos.

### Production lifecycle durability

Package installation/activation state is durable product state. Production deployments MUST use a persistent `LifecycleStore` adapter; process-local memory is only for tests/development. A CI/CD deploy must not silently turn an installed App back into an uninstalled App.

Current Railway single-replica adapter may use a mounted durable state file behind `LifecycleStore`. Storage topology remains replaceable; a future PostgreSQL-backed adapter must preserve the same lifecycle contracts and state semantics.


## Lifecycle Completeness Rule

Do not wait for the human to enumerate ordinary lifecycle closure. For an installable Package, default completeness includes discovery, side-effect-free plan, dependency resolution, install, enable, disable, uninstall, dependency-safe blocking, persistent lifecycle state, and upgrade when a newer compatible catalog version exists. Each transition must update effective Capabilities/Contributions/Experiences consistently and be regression-tested through the canonical App Host path.


## Plugin-First Extension Rule

For every new EVO App Platform requirement, the first architectural question is:

> Can this be implemented as a Package / Feature / Capability / Contribution plugin?

Default answer should be **yes** unless the requirement is itself part of the minimal generic plugin-hosting mechanism.

Decision order:

```text
new requirement
→ existing plugin/capability can satisfy? reuse it
→ new reusable plugin can satisfy? create Package/Feature/Contribution
→ Eidos capability missing? extend Eidos, then consume from plugin
→ only if plugin hosting itself is insufficient: extend App Platform Core minimally
```

Examples:

- localization rendering/runtime → Eidos/App Host; each Package owns its own localization bundles; do not create a central translation Package;
- reporting → plugin;
- workflow/SOP → plugin;
- permissions policy → plugin/service behind public contracts;
- industry semantics → plugin;
- Configurator → plugin;
- App Host lifecycle resolution itself → App Platform Core.

Core growth requires explicit justification that the capability cannot live behind the existing plugin model.


Before designing LLM/model access, login/identity, enterprise/organization or similar replaceable platform services, read:

`docs/architecture/PLATFORM-PROVIDER-PLUGIN-MODEL-v0.1.md`

These replaceable services are Provider plugins by default. Localization is different: Eidos/App Host owns the localization standard/runtime and each Package owns its own language resources. Read `docs/architecture/APP-OWNED-LOCALIZATION-v0.1.md` before changing localization.


## Enterprise-first architecture

EVO-family systems ultimately serve enterprises. Before designing cross-cutting enterprise capabilities, read:

- `docs/architecture/ENTERPRISE-SOFTWARE-FOUNDATION-v0.1.md`
- `docs/architecture/PLATFORM-PROVIDER-PLUGIN-MODEL-v0.1.md`

Architecture priority:

```text
Enterprise-first
→ Plugin-first
→ Eidos-first human experience
→ public provider/capability contracts
→ EVO Ledger Runtime only for ledger/business-fact execution
```

Reserve stable boundaries early, but freeze detailed provider/protocol contracts only one layer before implementation. Do not prebuild speculative subsystems.


## Progressive Installation UX Rule

Installation planning is a system safety mechanism, not a user ritual.

Default UX:

```text
Install
→ automatic preflight
→ no blockers/material decision
   → install automatically
→ blocker/risk/permission/migration/charge/destructive effect
   → surface concise reason + details
   → request only the decision that genuinely belongs to the human
```

"Installation details" may expose the plan for inspection, diagnostics and audit, but ordinary installation MUST NOT require a separate "generate/review plan" click.


## Enterprise Agent / Experience Compiler convergence

Before changing the Enterprise Agent package or migrating EC assets, read:

`docs/architecture/ENTERPRISE-AGENT-EC-CONVERGENCE-v0.1.md`

Do not rewrite or bulk-copy the Experience-Compiler repository into App Platform. Preserve the EC repository as the durable intelligence asset/runtime source and converge it through public contracts behind the installable `enterprise-agent` AGENT Package. The existing `agents/enterprise-agent` implementation is retained as host/runtime/tool integration capital.

The direct OpenAI adapter is migration evidence only. Target model access is `llm.inference` through Provider Plugin resolution.


## Localization Ownership Rule

Do not introduce a central translation Package merely to satisfy Plugin-First architecture.

Canonical ownership:

```text
Eidos/App Host
→ locale context + resolver + renderer semantics

Package/Experience
→ its own localization namespace + language bundles

optional future enterprise locale policy service
→ only if a concrete independent lifecycle exists
```

The experimental `evo-localization` Package is retired. Machine identifiers, command codes, field keys, semantic types and business data are never localized. Literal UI strings remain deterministic fallbacks.


## Agent-first Workspace Rule

The canonical EVO App Host is an Agent-first enterprise workspace:

```text
desktop:
  Activity Bar = context switcher
  Side Panel   = current contextual View Container (Apps, Agent, future Search...)
  Workspace    = primary Eidos application / configurator / browser surface
  Status Bar   = lightweight runtime/workspace context

mobile:
  Activity Bar remains available
  one main surface (Side Panel or Workspace) is shown at a time, preserving state
```

Read `docs/architecture/AGENT-FIRST-APP-HOST-WORKSPACE-v0.1.md` before changing App Host layout or Enterprise Agent UX.

Enterprise Agent itself should be zero-config for ordinary users. Resolve LLM Provider, identity/session, enterprise scope, locale and authorized tools through platform contracts. Do not add provider/model/vendor settings to the Agent page.

LLM-first does not mean UI-only automation. The Agent must use the same public Action/Query/Package contracts available to other clients. Human-facing configuration pages remain available in the right workspace for inspection, confirmation and direct override.


## Workbench + Settings Rule

Before changing the canonical EVO App Host shell or plugin configuration UX, read:

`docs/architecture/EVO-WORKBENCH-v0.1.md`

Default interaction model:

```text
Activity Bar
→ Side Panel / View Container (toggleable + resizable)
⇆
Main Workspace
→ Eidos Apps / Configurators / Browser
+
Status Bar
```

Activity Bar entries select contexts; they are not a compressed duplicate of application navigation.

For plugin configuration:

```text
simple typed non-secret configuration
→ eidos.settings Contribution
→ standard Settings Experience

complex domain configuration
→ dedicated Eidos Experience

credentials / API keys / passwords
→ secure Secrets boundary
→ never ordinary Settings
```

Plugin Store exposes Configure only when a Package actually declares configuration.


## Plugin CI Isolation Rule

The default LLM development unit is one owner boundary.

```text
platform task -> platform protocol/core context + platform CI
plugin task   -> plugin context + Plugin Protocol + direct public contracts + plugin CI
protocol task -> protocol context + protocol CI + explicit ecosystem certification
```

Do not use full-ecosystem CI as a substitute for defining stable contracts. Unrelated plugins are not ordinary regression dependencies.
