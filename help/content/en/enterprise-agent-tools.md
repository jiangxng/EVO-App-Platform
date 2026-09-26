---
{
  "helpVersion": "0.1.0",
  "id": "evo.enterprise-agent.tools",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "en",
  "kind": "concept",
  "title": "Personal Agent tools",
  "summary": "Understand how Personal Agent discovers and invokes Host-authorized platform tools.",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["enterprise-agent", "tools", "tool-discovery", "agent"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal.tool-discovery", "agent.enterprise.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.authorization.authentication-vs-authorization", "evo.provider.model", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
Personal Agent does not contain a fixed list of platform tools. The App Platform Host supplies the effective tool catalog for each Agent run.

## Tool effects

- READ tools inspect authoritative state without intended mutation.
- PLAN tools perform side-effect-free preflight or planning.
- WRITE tools change platform state.

A tool being visible to the Agent is not the same as authorization to execute it.

## Current observation tools

Personal Agent can inspect its Host-resolved current Context, the platform snapshot, effective Capabilities, Package catalog, Providers, Provider health, Provider bindings and authoritative Platform Help.

The current Context is available through `context.current.get`. `context.available.list` returns only the Context references currently offered by the Host.

When a Host Enterprise Context Provider is configured, Personal Agent can switch between Personal Context and the available Enterprise Contexts from the Chat Context selector. The selected reference is validated again by the Host before use. Request data cannot create an Enterprise Context by supplying arbitrary ids.

## Installation tools

Package installation keeps a Host-enforced safety sequence:

1. Run app.install.plan for the Package.
2. Confirm the plan is side-effect-free and has no blockers.
3. Run app.install.execute for the same Package.

> [!WARNING] The model is not the security boundary
> Unknown tools fail closed. Safety checks and future authorization are enforced by the Host, not by prompt instructions.

## Credentials

Personal Agent never receives saved API Key plaintext. LLM credentials stay inside the Host Secrets Provider and LLM Provider runtime boundary.


## Host Enterprise Context Provider

The first reference Enterprise Context source is the Host Enterprise Context Provider (`enterprise.directory`). Operators can supply Host-owned context definitions through `APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON`.

This reference source is replaceable. Future directory, identity, HCM or customer-specific providers can implement the same platform boundary without changing Personal Agent.

Enterprise Context use in P0.5 is read-only reasoning context. It does not create an Enterprise Agent and does not permit automatic copying into Personal Context Memory.


## Principal, Session and Enterprise grants

P0.6 resolves an authoritative Principal before Personal Agent resolves Context or builds its Tool Catalog.

The reference `identity.session` Provider can be configured with `APP_PLATFORM_STATIC_SESSION_JSON`. It is a deployment-scoped reference implementation, not the final login/session system.

Enterprise Context visibility is no longer based on directory presence alone. The Host intersects the Enterprise Context Directory with `enterprise.membership` grants for the current Principal. The reference Grant Provider reads `APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON`.

A Context that exists in the directory but is not granted to the current Principal is not shown in the Context selector, is not returned by `context.available.list`, and cannot be selected by submitting its id manually.

In an authorized Enterprise Context, Personal Agent gains the READ-only `enterprise.context.profile.get` tool. That tool is absent in Personal Context.

> [!IMPORTANT] Session and grants are Host authority
> Browser values select among Host-authorized Contexts. They do not establish identity, membership or permission.

P0.6 still does not introduce generic Context Memory writes or broad autonomous WRITE authority.


## Request-bound Session and Enterprise Context creation

P0.7 adds a request-bound reference Session Provider through `identity.session.request`. The reference Host Bearer Session Provider reads `APP_PLATFORM_BEARER_SESSIONS_JSON` and resolves the Principal from the HTTP Bearer credential.

A bare session ID is not accepted as authentication by the reference bearer Provider.

Enterprise Context creation is a governed Material WRITE through:

`enterprise.context.create`

The Host requires:

1. a Host-resolved request Session and Principal;
2. Personal Context as the active Context;
3. a HUMAN Principal;
4. explicit confirmation intent on the Action;
5. an `authorization.check` decision that ALLOWs `enterprise.context.create`.

A successful create operation atomically creates the Enterprise Context, an ACTIVE OWNER relationship for the creator, an initial access Grant, and append-only lifecycle events from CREATING to ACTIVE.

The creator is historical audit data. OWNER is a separate governance relationship. Changing ownership in the future must not rewrite `createdBySubjectId`.

An ACTIVE dynamically created Enterprise Context must always have at least one ACTIVE OWNER.

Personal Agent WRITE tools now pass through the same Host Material WRITE authorization boundary before execution. READ and PLAN tools remain unaffected.


## Enterprise relationship lifecycle

P0.8 adds governed membership and ownership lifecycles.

Enterprise membership begins with `enterprise.relationship.invite`. An invitation does not grant access. The target human must accept it from Personal Context through `enterprise.relationship.invitation.accept`. Only then does the Host atomically create an ACTIVE Relationship and ACTIVE Enterprise Context Grant.

OWNER may invite ADMIN, MEMBER or AUDITOR. ADMIN may invite MEMBER or AUDITOR but cannot appoint another ADMIN. MEMBER and AUDITOR cannot invite.

A non-owner relationship can be revoked through `enterprise.relationship.revoke`. The matching access Grant is revoked in the same governance update. OWNER relationships cannot be directly revoked; ownership transfer is required.

Ownership transfer uses a two-party lifecycle:

`enterprise.ownership.transfer.initiate → accept / decline / cancel / expire`

Acceptance atomically activates the new OWNER and revokes the outgoing owner's OWNER relationship and OWNER Grant, so an ACTIVE Enterprise Context never passes through an ownerless persisted state.

The effective Context response includes pending non-expired invitations and ownership transfers addressed to the current Principal.

> [!IMPORTANT] Governance WRITE has two gates
> Host relationship rules and `authorization.check` must both allow the operation. A permissive policy Provider cannot override structural OWNER/ADMIN rules.


## Governed Context Memory

P0.9 adds durable Context Memory through the replaceable `context.memory.read` and `context.memory.write` Provider capabilities.

Every Memory belongs to exactly one Personal or Enterprise Context and carries immutable provenance plus attribution. Existing Memory records are append-only: corrections create a new record with `supersedesMemoryId` rather than rewriting history.

`context.memory.record` records a confirmed Memory in the current Context. Personal Memory requires the current Principal to own that Personal Context. Enterprise Memory requires an ACTIVE OWNER, ADMIN or MEMBER relationship; AUDITOR is read-only. `authorization.check` must also ALLOW the write.

`context.memory.promote` creates a new Memory in another Host-authorized Context while preserving the source Context and `sourceMemoryId`. Promotion requires explicit confirmation, write authority on both source and target Contexts, and an explicit authorization ALLOW. It is deny-by-default.

Personal Agent receives the READ-only `context.memory.search` tool. The Host binds that tool to the current resolved Active Context; the model cannot supply another Context id to read arbitrary Memory.

> [!IMPORTANT] Memory is not automatic chat history
> P0.9 does not silently persist model conversations or automatically synchronize Personal and Enterprise Memory. Durable writes are governed Human-confirmed Actions.


## Memory Proposal review

P1.0 separates candidate learning from durable Context Memory.

Personal Agent may stage a candidate through `context.memory.proposal.create`. This creates a **PENDING Proposal**, not a Memory record. The Proposal is always bound to the Host-resolved current Context; the model cannot choose another Context to gain authority.

Open **Memory review** to inspect the proposal's Context, proposed confidence, evidence references and review signals. You may edit the Memory kind or summary before making a decision. Editing appends a new Human-authored Proposal revision; it does not rewrite the Agent's original revision.

Review signals can identify potential duplicates, explicitly referenced potential contradictions and supersession candidates. They are review assistance only and do not determine truth automatically. Likewise, proposed confidence is supporting metadata, not Host truth or an automatic acceptance threshold.

Accepting requires explicit confirmation, current Memory write authority, authorization for Proposal acceptance, and normal `context.memory.record` authorization. Only then is one immutable Context Memory record created. Acceptance is retry-safe and will not create duplicate Memory for the same Proposal.

Rejecting is terminal and creates no Memory.

> [!IMPORTANT] Evidence quality is conservative
> `REFERENCED` means evidence references are present. It does not mean the Host verified that those references are true or authoritative.
