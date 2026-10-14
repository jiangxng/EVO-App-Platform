# Project Orientation — EVO App Platform (v0.1)

**Status:** CURRENT_AUTHORITY
**Date:** 2026-10-14
**Document class:** CURRENT_AUTHORITY (see `docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md`)
**Purpose:** a short, link-first orientation for a fresh Human/LLM session.

This document answers *where things are* and *which rules apply*. It does **not** restate the
authoritative rules, and it is **not** a source of project state or history. Read the linked
authorities; when this file and an authority disagree, the authority wins.

## 1. What this project is

EVO App Platform is the **application/plugin control plane** of the EVO ecosystem. It manages
installable Packages, activatable Features, their Contributions, capability/Provider resolution,
identity/session integration, authorization orchestration, Enterprise Context governance and
External Agent governance through public contracts.

It owns `App Manager`, `App Catalog` and official `Apps`; it does **not** own EVO Core or Eidos Core.

Evidence: `README.md`, `architecture.manifest.json` (`owns` / `doesNotOwn`).

## 2. Who it serves and what problem it solves

The platform exists so business capability is delivered as installable, composable Packages that
business users and LLMs can understand and operate without SQL or source-code changes, while
`Human → Personal Agent → personal/authorized enterprise context` stays the product model.

Evidence: `PHILOSOPHY.md` (items 9–10), `README.md` ("Human + LLM operability"),
`AI-BOOTSTRAP.md` ("Current product model").

## 3. Ecosystem position

Four current owner projects cooperate only through public contracts:

| Project | Canonical ownership |
| --- | --- |
| **EVO-App-Platform** | Package/Feature lifecycle, capability/Provider resolution, identity/session, authorization orchestration, Enterprise Context governance, External Agent governance |
| **EVO** | Deterministic business runtime: BusinessData → PostingRule → Posting/LedgerEntry → Balance |
| **Eidos** | Deterministic Human Experience framework: Experience/UIDL, renderers/runtime, Workbench/App Host, design language |
| **Experience-Compiler** | Persistent advisory intelligence: knowledge, memory, learning, research, recommendation |

Authority: `docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md`.

Rule of thumb before implementing anything:

```text
reuse an existing owner
→ PLATFORM_PROVIDER if replaceable / independent
→ Integration Adapter if external-product compatibility only
→ Eidos Experience if Human-facing
→ APPLICATION if domain/business composition
→ App Platform Core only for the smallest generic host mechanism
```

Authority: `docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md`,
`architecture.boundary-policy.json`.

## 4. Module map (repository)

| Path | Role |
| --- | --- |
| `manager/` | Host: App Manager, lifecycle, action routing, request context/authorization, provider resolution, Agent run/durability, Workbench/settings/login/Help pages, server entry (`manager/server.ts`) |
| `contracts/` | Public contracts: `package.ts` (Package/Feature/Contribution), `platform-services.ts` (principal/scope/context/authorization), `plugin-protocol.ts`, `agent-*`, `conversation-*`, `enterprise-*`, `foundation-object/`, `evo-business-data.ts`, `definition-projection.ts` |
| `catalog/` | `catalog.ts` (catalog + capability provider lookup) and catalog seed wiring (see `manager/server.ts`) |
| `apps/` | Official APPLICATION / Experience packages (Trading, Counterparty, Item, Warehouse, Ledger, EOG 2D/3D, Template Store, Data Import, External Agent Access, …) |
| `providers/` | Replaceable PLATFORM_PROVIDER packages (authorization, session, identity/OIDC, secrets, LLM, context-memory, enterprise-context, EOG, trading finance owner, …) |
| `agents/` | Personal Agent (package name `enterprise-agent` is compatibility debt): runtime, model port, Host tool catalog, durability |
| `actions/` | Action contracts, router, lazy handler, material-write authorization |
| `vendor/eidos/` | Pinned Eidos snapshot consumed through public Experience contracts |
| `help/` | Multilingual Help content (`en`, `zh-CN`) |
| `certification/` | Installation/compatibility certification |
| `tools/` | Validators and CLIs (boundary, continuity, help, design-language, manifest, …) |
| `docs/` | Architecture authorities, ADRs, roadmap/handoffs, runbooks, governance |
| `tests/` | Protocol / manager / integration / app-host / plugin suites |

## 5. Constraints every change must respect (pointers, not restatement)

- **Lifecycle:** install ≠ activate; install planning is side-effect-free; disabled/uninstalled
  Features must not be reachable. `INVARIANTS.md` (APP-17, APP-05, APP-23, APP-25).
- **Boundaries:** no private cross-owner implementation imports; classify before implementing.
  `INVARIANTS.md` (APP-01…APP-03, APP-208…APP-213).
- **Validation:** installation-first journey, Eidos-first Human surfaces, evidence labeling.
  `VALIDATION-CONSTITUTION.md`.
- **Documentation:** history is preserved by class, current authority may evolve.
  `docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md`, `documentation.policy.json`.
- **Dependencies:** `package-lock.json` authoritative, `npm ci`, Node `22.22.2`.
  `docs/architecture/DEPENDENCY-REPRODUCIBILITY-v0.1.md`.
- **Authorization:** deny-by-default, fail-closed, scope derived by the Host, not the client.
  `contracts/platform-services.ts`, `manager/request-context.ts`,
  `manager/capability-operation-access.ts`.

## 6. Reading order for a new task

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. `docs/roadmap/HANDOFF-LATEST.md` (generated)
4. `LLM.md`
5. `llm.foundation-map.json`
6. this orientation + `docs/architecture/PROJECT-ARCHITECTURE-AND-DEVELOPMENT-INDEX-v0.1.md`
7. the task-specific authority documents linked from `LLM.md`

## 7. Delivery workflow

One bounded task → one active branch → one PR with successive commits; merge after the relevant
CI passes; retire the temporary branch; continue from the latest `main`.

Authority: `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`,
`docs/governance/BRANCH-HYGIENE.md`.

## 8. What this document is not

- not authoritative for project progress (that is `project.status.json`);
- not historical evidence;
- not a parallel knowledge system replacing the architecture authorities.

