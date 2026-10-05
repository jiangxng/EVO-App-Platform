# Enterprise Context Creation + Ownership P0.7 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-26  
**World model:** Human → Personal Agent → Personal / Enterprise Context  
**Scope:** request-bound Session, Enterprise Context creation, OWNER relationship, initial access Grant, lifecycle and first Material WRITE authorization

> Product semantics are subordinate to `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`. This document remains authoritative only for the creation/ownership/security protocol slice.

## 1. Core rule

Enterprise Context is a governed platform object, not an Agent.

Creation produces separate facts and governance relationships:

```text
createdBy = immutable historical fact

Principal -- OWNER --> Enterprise Context
          = mutable governance relationship
```

The creator is the initial OWNER, but creator identity and current ownership are not the same field.

## 2. Request-bound identity

P0.7 adds the reference request Session capability:

- capability: `identity.session.request`
- package: `host-bearer-session-provider`
- provider: `host.bearer-session`
- configuration: `APP_PLATFORM_BEARER_SESSIONS_JSON`

The reference Provider resolves a Session from the HTTP Bearer credential.

A bare `sessionId` is never sufficient authentication for this Provider.

If an effective request-bound Session Provider exists and the request cannot resolve a live Session, the request fails closed. Only when no request-bound Provider is effective may the P0.6 static/compatibility Session path be used.

The reference bearer map is a bootstrap/reference transport, not the final OIDC/passkey/login system.

## 3. Host request context

Browser/action values never establish identity or permission.

For an Action request the Host derives:

```text
HTTP credential
  ↓
Request Session Provider
  ↓
IdentitySession
  ↓
Principal
  ↓
Principal-owned Personal Context
  +
granted Enterprise Contexts
  ↓
Host resolves requested Active Context
  ↓
PlatformRequestContextV010
```

The request payload may select a Context already offered by the Host. An unknown or ungranted Context still fails closed.

Request context is passed to Action handlers separately from browser-controlled Action values.

## 4. Enterprise Context lifecycle

P0.7 establishes these lifecycle states:

- `CREATING`
- `ACTIVE`
- `SUSPENDED`
- `ARCHIVED`

The first creation path records two append-only lifecycle events:

```text
∅ → CREATING
CREATING → ACTIVE
```

The resulting Context is ACTIVE only after the Context, initial OWNER relationship and initial access Grant are committed together.

Suspend/archive actions are intentionally deferred.

## 5. Creation command

Platform command:

`enterprise.context.create`

Input P0.7:

- `displayName` — required human-facing name;
- `code` — optional stable business code;
- `attributes` — optional primitive metadata.

The Host generates:

- `enterpriseId`;
- `contextId`;
- OWNER relationship ID;
- initial Grant ID;
- lifecycle event IDs.

The browser does not choose these authority IDs.

## 6. Creation authorization

Enterprise creation is the first explicit P0.7 Material WRITE proof.

Requirements:

1. Host-resolved request context exists;
2. active Context is Personal;
3. current Principal is HUMAN;
4. Action carries explicit confirmation intent;
5. an effective `authorization.check` Provider ALLOWs:
   - action: `enterprise.context.create`;
   - resource type: `enterprise.context`.

Missing authorization policy/provider denies creation.

Example reference static policy:

```json
{
  "contractVersion": "0.1.0",
  "rules": [
    {
      "id": "allow-human-enterprise-create",
      "effect": "ALLOW",
      "actions": ["enterprise.context.create"],
      "actorTypes": ["HUMAN"],
      "resourceTypes": ["enterprise.context"]
    }
  ]
}
```

The confirmation flag expresses explicit action intent; it is not a second authentication factor.

## 7. Atomic creation result

One successful creation atomically persists:

```text
EnterpriseContext
  lifecycleState = ACTIVE
  createdBySubjectId = Principal.subjectId
  createdAt = timestamp

EnterpriseContextRelationship
  Principal -- OWNER --> Context
  state = ACTIVE

EnterpriseContextGrant
  Principal → Context
  relationship = OWNER

LifecycleEvent
  ∅ → CREATING

LifecycleEvent
  CREATING → ACTIVE
```

The initial Grant makes the new Context immediately visible in that Principal's effective Context list.

## 8. Ownership invariant

For every governance-store Enterprise Context in ACTIVE state:

> at least one ACTIVE OWNER relationship MUST exist.

The store rejects transitions that would leave an ACTIVE Context ownerless.

This provides the base invariant required for future ownership transfer:

```text
Alice OWNER
  ↓ add/accept Bob OWNER
Alice + Bob OWNER
  ↓ remove Alice OWNER
Bob OWNER
```

P0.7 does not yet implement the transfer workflow.

## 9. Immutable creation facts

For an existing Context the following creation facts are immutable:

- `enterpriseId`;
- `createdBySubjectId`;
- `createdAt`.

Ownership is changed through Relationship records, never by rewriting `createdBy`.

## 10. Governance persistence

Dynamic enterprise governance state is stored through:

`EnterpriseContextGovernanceStoreV010`

It contains:

- dynamic Contexts;
- Relationships;
- Grants;
- lifecycle events.

Host storage:

- `APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE`, or
- `enterprise-governance.json` beside the normal App Platform lifecycle state file,
- in-memory fallback for non-durable/dev operation.

Enterprise Directory and Grant Providers overlay this dynamic state with optional static seed configuration.

## 11. Enterprise relationships

P0.7 introduces:

- capability: `enterprise.relationship`;
- Provider contract: `EnterpriseContextRelationshipProviderV010`;
- reference Provider: `host.enterprise-relationship`.

Relationship kinds reserved in P0.7:

- OWNER
- ADMIN
- MEMBER
- AUDITOR

Only OWNER is created automatically today.

The effective Context endpoint also exposes the current Principal's active Enterprise relationships.

## 12. Material WRITE boundary for Personal Agent

The Host Tool Catalog now has an explicit authorization gate for every tool whose descriptor effect is `WRITE`.

Before execution:

```text
Personal Agent tool call
  ↓
descriptor.effect == WRITE
  ↓
Host request context
  ↓
authorization.check
  ↓
ALLOW → execute
DENY / missing Provider → do not execute
```

The authorization action is the stable tool ID, for example `app.install.execute`.

READ and PLAN tools do not pass through this Material WRITE gate.

This is the first reusable Agent WRITE authorization boundary. It does not claim that every legacy direct platform mutation endpoint has already migrated to this boundary.

## 13. Security invariants

1. Request payload cannot establish Principal.
2. Request payload cannot manufacture Enterprise membership.
3. Request payload cannot manufacture Enterprise Context.
4. Bearer reference Provider requires the bearer secret; session ID alone does not authenticate.
5. Enterprise creation requires Personal Context + HUMAN Principal.
6. Enterprise creation requires Authorization Provider ALLOW.
7. ACTIVE dynamic Enterprise Context requires at least one OWNER.
8. Creation facts are immutable.
9. OWNER is a relationship, not a field on the human or a rewrite of creator history.
10. Personal Agent WRITE tools fail closed without Host authorization.
11. No generic Context Memory write is introduced.
12. Enterprise Context remains a Context, not an Agent.

## 14. Deferred

P0.7 deliberately does not yet implement:

- interactive login UI;
- OIDC/OAuth/passkeys;
- rotating/refreshing bearer sessions;
- ownership transfer/acceptance;
- member invitation;
- ADMIN/MEMBER/AUDITOR management UI;
- SUSPEND/ARCHIVE commands;
- legal-entity verification;
- full RBAC/ABAC;
- migration of every legacy direct platform mutation endpoint;
- generic Context Memory writes;
- cross-context Memory promotion.

## 15. Next mainline

The next slice should extend governance from creation into:

1. ownership transfer with no-owner prevention;
2. member invitation/acceptance and relationship lifecycle;
3. Context-aware authorization for additional material business/platform WRITE actions;
4. then Context Memory Provider + provenance/attribution/governed promotion.

Do not introduce an Enterprise Agent.
