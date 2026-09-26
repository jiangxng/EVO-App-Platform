# Handoff — Person-first Personal Agent / Context Memory Baseline

**Date:** 2026-09-26  
**Status:** authoritative continuation note  
**Branch target:** EVO-App-Platform main after Person-first MVP freeze

## Why this handoff exists

The conversation that led to the current architecture materially changed EVO's root world model. Future LLM sessions MUST NOT reconstruct this from chat memory.

Read first:

1. `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`
2. `docs/architecture/ENTERPRISE-AGENT-TOOL-SYSTEM-v0.1.md`
3. `LLM.md`
4. `INVARIANTS.md`
5. `project.status.json`
6. `llm.foundation-map.json`

## Frozen interpretation

EVO's first perspective is the human.

```text
Human
  └── Personal Agent
        ├── Personal Context
        │     └── Personal Context Memory
        └── authorized Enterprise Context(s)
              └── Enterprise Context Memory
```

There is no Enterprise Agent in the MVP ontology.

The existing `enterprise-agent` Package, route, command and TypeScript symbols are compatibility implementation assets for the product-facing **Personal Agent**. Do not perform cosmetic repository-wide renames.

## Meaning of Enterprise Context

Enterprise Context is governed working and learning material available to the Personal Agent. It can expose business data, historical events, documents, SOPs, Context Memory and context-bound tools.

Enterprise Context does not own the person's identity.

A person may work across multiple enterprises. Losing one enterprise relationship must not delete the person's Personal Context or Personal Context Memory.

## Context Memory distinction

Two durable memory owners are frozen for the MVP:

- Personal Context Memory;
- Enterprise Context Memory.

Enterprise Context may be used as reasoning material when access is granted.

```text
read/use for reasoning
!=
permission to persist into Personal Context Memory
```

Until a future Memory Attribution boundary exists, cross-context memory promotion is deny-by-default.

Context Memory is durable platform data, not LLM hidden state. Models/providers can be replaced without deleting Context Memory.

## Agent and human responsibility

Personal Agent is an adviser.

```text
observe
→ analyze
→ explain
→ opinion / proposal
→ Human decision
→ governed execution
```

Material final decisions remain human-owned in the MVP. READ and PLAN are the preferred near-term Agent capabilities. WRITE operations remain Host-governed and should not be expanded casually.

## Plugin consequence

Context is the environment in which capabilities/data are available; plugins add capabilities to a Context.

Long-term mental model:

```text
effective EVO view
=
Principal
+ Active Context
+ installed/effective Capabilities
+ relevant Context Memory
+ effective Tools
```

The same Personal Agent remains stable while Active Context changes.

Do not encode enterprise-specific business semantics into Personal Agent core.

## Compatibility / migration strategy

Use **semantic migration first, implementation migration when touched**.

Preserve working assets:

- Plugin Protocol and Package/Feature/Contribution model;
- Provider model;
- Eidos Workbench and design language;
- Secrets Provider;
- Platform Help;
- runtime isolation/storage/events;
- Dynamic Host Tool Discovery;
- existing `enterprise-agent` package machine identifiers.

Known migration debt includes:

- legacy Enterprise Agent names in implementation symbols;
- `PlatformScopeV010` enterprise/company/workspace/user hierarchy;
- Provider binding scopes that predate Person-first Context;
- future authorization assumptions.

Do not solve all migration debt at once.

## Immediate implementation slice

Implement only:

1. `PersonalContextV010`;
2. revised/minimal `EnterpriseContextV010` compatible with existing contract;
3. `ActiveContextRefV010`;
4. Person-first fields in `PlatformRequestContextV010` while retaining legacy `scope`;
5. Host-owned active-context resolution for Personal Agent;
6. active context passed into Host Tool Catalog and model input;
7. a READ-only `context.current.get` tool;
8. Context Memory **read contract only**, no learning engine yet;
9. tests proving the client cannot manufacture an Enterprise Context by merely sending an id.

Do not build:

- full IAM;
- enterprise membership workflows;
- role hierarchy;
- memory learning/write engine;
- multi-Agent architecture;
- automatic cross-context memory transfer.

## Security posture before full permissions

Before authorization is mature:

- default context is Personal Context;
- Enterprise Context must come from a Host-owned resolver/source;
- request/browser input may select among Host-offered Context refs but may not create one;
- missing/unknown enterprise context fails closed;
- Context Memory is read-only at this slice;
- existing privileged platform WRITE protections remain unchanged.

## Next after this slice

Once active Context is real and observable:

1. attach minimal Session/Principal;
2. add Relationship/Grant only when a real Enterprise Context needs access control;
3. filter Tool Catalog by Principal + Active Context;
4. route material WRITE through authorization + human confirmation;
5. then add real Personal/Enterprise Context Memory providers and Memory Attribution.

This document exists specifically so a fresh LLM can continue without needing the original conversation.


## Personal Agent product experience follow-up

After the P0.3 Context plumbing was deployed and exercised in production, the Personal Agent UI was reviewed against Eidos Productive Design Language.

Authority:

- `docs/architecture/PERSONAL-AGENT-PRODUCT-EXPERIENCE-v0.1.md`
- Eidos RFC: `docs/product/ASSISTANT-AND-SETUP-EXPERIENCE-PATTERNS-v0.1.md` in the Eidos repository.

Key finding:

Using an Eidos renderer is necessary but not sufficient. The current `chat@0.1.0` and Extension Manager contracts are too thin for a mature Personal Agent installation/setup/chat experience.

Do not fix this with Personal Agent CSS or custom controls.

Implementation order:

1. Eidos Chat/Assistant v0.2;
2. Eidos Setup Flow v0.1;
3. Eidos Extension Manager readiness + progressive disclosure;
4. optionally Settings Editor v0.2 grouping;
5. update App Platform Eidos pin;
6. add Host-computed Personal Agent readiness and setup orchestration;
7. keep Provider/model/API Key configuration owned by Provider + Secrets surfaces;
8. then improve Personal Agent structured activity/evidence/proposal UX.

Installation principle:

```text
Installed != Ready
```

Do not silently choose an LLM Provider when multiple candidates exist. Provider/vendor choice can carry cost, privacy and credential consequences and therefore belongs to an explicit setup step.

Personal Agent remains zero ordinary configuration: it consumes the selected/resolved `llm.inference` Provider rather than owning vendor-specific settings.


## Four-locale product requirement

From Personal Agent P0.4 forward, new plugin/product UI is designed for four first-class user locales from the start:

- `en` — English;
- `zh-CN` — 简体中文;
- `ja` — 日本語;
- `zh-TW` — 繁體中文.

Personal Agent chat chrome, readiness/setup, Provider-selection/configuration orchestration, errors/notices and proposal/confirmation actions must ship with all four locale bundles.

Existing Help may continue using per-document English fallback while Japanese and Traditional Chinese Help translations are filled incrementally. Missing Help translation must never hide the document.

Machine identifiers and business data are not translated. Do not postpone ja/zh-TW support until after UI implementation; localization and text-expansion behavior are part of P0.4 design and CI.


## P0.4 implementation checkpoint

Personal Agent P0.4 has now been implemented on stacked integration branches.

Implemented:

- App Platform vendored Eidos advanced to `12f61d5a02011a5f974beac8e0fda8c34f81e142`;
- Chat Experience upgraded to `chat@0.2.0`;
- Host-computed Personal Agent readiness distinguishes Installed from Ready;
- Setup Flow v0.1 routes Provider install/selection/configuration through platform-owned surfaces;
- multiple usable `llm.inference` Providers require explicit human selection;
- Provider credentials/settings remain owned by Provider + Host Secrets;
- Extension Manager exposes `Needs setup / Ready / Degraded / Unavailable`;
- Agent replies can render structured text/activity/evidence/proposal parts;
- Personal Agent, Setup, llm.inference Provider selection and OpenAI Provider settings cover `en / zh-CN / ja / zh-TW`.

Current integration stack:

1. PR #59 — Eidos P0.4A vendor sync;
2. PR #60 — Personal Agent readiness + Setup Flow;
3. PR #61 — structured Chat v0.2;
4. finalization branch — four-locale Provider configuration and authority/status updates.

Do not restart Eidos P0.4A or redesign Personal Agent setup.

CI validation is now complete after the repositories were made public and GitHub-hosted runners resumed. Platform CI, Enterprise Agent CI, OpenAI Provider CI and Host Secrets Provider CI all pass on the final P0.4 integration branch.

After P0.4 merge, resume the Person-first roadmap at the first real Enterprise Context source and read-only Agent use. Do not expand to multi-Agent or generic Memory writes.


## P0.5 — first real Enterprise Context source

P0.5 advances the frozen Person-first model from test-only Enterprise Context registration to a real replaceable Provider boundary.

Implemented:

- `EnterpriseContextProviderV010`;
- reference Package `host-enterprise-context-provider`;
- Provider `host.enterprise-context`;
- capability `enterprise.directory`;
- Host configuration source `APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON`;
- dynamic Host Context Registry consumption;
- generic Eidos Chat Context selector from Eidos commit `ff4b720d863f51a2121ef22178c6e54b5bdb8e9f`;
- Personal Agent selection of Host-offered Personal/Enterprise Contexts;
- Host re-validation of the selected Context before Agent execution;
- `context.available.list` READ tool;
- existing `context.current.get` remains the authoritative current Context read;
- en / zh-CN / ja / zh-TW selector chrome;
- tests proving registered Enterprise Context selection succeeds and forged Context selection still fails closed.

Authority:

- `docs/architecture/ENTERPRISE-CONTEXT-PROVIDER-P0.5-v0.1.md`

P0.5 does not add an Enterprise Agent, generic Context Memory writes, automatic cross-context Memory promotion, or broad WRITE autonomy.

P0.5 is CI-verified across Platform CI, Enterprise Agent CI, Host Enterprise Context Provider CI, Host Authorization Provider CI, OpenAI Provider CI and Host Secrets Provider CI.

After P0.5, the next mainline is the minimum executable Principal/Session + Relationship/Grant layer needed to determine which Enterprise Contexts a human is entitled to receive and which Context-bound tools are effective.


## P0.6 — Principal, Session and Enterprise Context Grants

P0.6 implements the minimum executable identity/relationship layer required by the frozen Person-first model.

Implemented:

- `IdentitySessionProviderV010`;
- reference `host-static-session-provider` / `host.static-session`;
- capability `identity.session`;
- `APP_PLATFORM_STATIC_SESSION_JSON` reference configuration;
- compatibility-local Session only when no effective Session Provider exists;
- effective-but-unusable Session Provider fails closed;
- `EnterpriseContextGrantV010` and `EnterpriseContextGrantProviderV010`;
- reference `host-enterprise-context-grant-provider`;
- capability `enterprise.membership`;
- `APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON`;
- Personal Context identity derived from current Principal;
- available Enterprise Contexts = Enterprise Directory ∩ current Principal grants;
- unknown/ungranted Context selection fails closed;
- authoritative Principal supplied to Personal Agent model input;
- `enterprise.context.profile.get` READ tool appears only in a Principal-consistent Enterprise Context;
- isolated CI for Session and Grant Providers.

Authority:

- `docs/architecture/PERSONAL-AGENT-PRINCIPAL-GRANTS-P0.6-v0.1.md`

P0.6 deliberately does not implement full IAM, interactive login, request-bound bearer/cookie sessions, generic Memory writes or broad material WRITE authorization.

The next mainline is request-bound identity/session transport plus Principal + Active Context authorization for material WRITE actions. Context Memory Providers and Memory Attribution/Governance follow after that security boundary is executable.
