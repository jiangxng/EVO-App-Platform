# Personal Agent Principal + Grants P0.6 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-26  
**Scope:** Minimal executable Principal / Session / Enterprise Context relationship grants  
**World-model authority:** `PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`

## 1. Purpose

P0.6 adds only the identity and relationship layer required to answer two questions:

1. Who is the human/actor for this Personal Agent run?
2. Which Enterprise Contexts may that Principal receive?

It is deliberately not a complete IAM system.

Canonical composition:

```text
Identity Session
      ↓
Principal
      ↓
Enterprise Context Grants
      +
Enterprise Context Directory
      ↓
authorized Enterprise Contexts
      +
Personal Context owned by Principal
      ↓
Active Context
      ↓
Context-bound Tool Catalog
      ↓
Personal Agent
```

Enterprise remains Context, not Agent.

## 2. Identity Session boundary

Public contract:

```ts
IdentitySessionProviderV010 {
  providerId: string
  current(): IdentitySessionV010 | undefined
}
```

Reference implementation:

- Package: `host-static-session-provider`
- Provider: `host.static-session`
- Capability: `identity.session`
- Provider contract: `evo.identity.session@0.1.0`
- Host configuration: `APP_PLATFORM_STATIC_SESSION_JSON`

Example:

```json
{
  "contractVersion": "0.1.0",
  "sessionId": "session:alice",
  "principal": {
    "subjectId": "alice",
    "actorType": "HUMAN",
    "identityProviderId": "customer.idp",
    "displayName": "Alice"
  },
  "issuedAt": "2026-09-26T00:00:00.000Z",
  "expiresAt": "2026-09-27T00:00:00.000Z",
  "assurance": ["REFERENCE"]
}
```

The reference Provider is deployment-scoped. It exists so the platform architecture can execute against a real Session/Principal boundary before interactive login/OIDC/session transport is introduced.

If the configured Session is expired, `current()` returns no Session.

## 3. Compatibility fallback

If no effective `identity.session` Provider exists, P0.6 preserves the current local/dev compatibility path using:

- `EVO_ACTOR_ID`
- `EVO_ACTOR_TYPE`

This produces a compatibility-local Session and Principal.

Important distinction:

```text
no Session Provider installed
  → compatibility fallback allowed

Session Provider is effective but cannot resolve a live Session
  → fail closed
```

The fallback is migration compatibility, not the long-term identity model.

## 4. Enterprise Context Grant boundary

Public contract:

```ts
EnterpriseContextGrantV010 {
  grantId
  subjectId
  contextId
  relationship?
  attributes?
}

EnterpriseContextGrantProviderV010 {
  providerId
  listForPrincipal(principal)
}
```

Reference implementation:

- Package: `host-enterprise-context-grant-provider`
- Provider: `host.enterprise-context-grant`
- Capability: `enterprise.membership`
- Provider contract: `evo.enterprise.context-grant@0.1.0`
- Host configuration: `APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON`

Example:

```json
{
  "contractVersion": "0.1.0",
  "grants": [
    {
      "grantId": "grant:alice:acme",
      "subjectId": "alice",
      "contextId": "enterprise:acme",
      "relationship": "member"
    }
  ]
}
```

A Grant does not create an Enterprise Context. It only permits a Principal to receive a Context that already exists in the Enterprise Context Directory.

## 5. Effective Context calculation

P0.6 computes:

```text
Enterprise Context Directory
INTERSECT
Enterprise Context Grants for current Principal
=
available Enterprise Contexts
```

Rules:

- Personal Context is created from the current Principal.
- Personal Context `ownerSubjectId` equals Principal `subjectId`.
- Personal Context ID is `personal:<subjectId>`.
- Without an Enterprise Context Grant Provider, Enterprise Context availability is empty.
- A Grant referencing an unknown directory Context has no effect.
- A request cannot manufacture either a Context or a Grant.
- An ungranted Enterprise Context selection fails closed.

## 6. Personal Agent Principal propagation

The Host supplies the authoritative Principal to the Personal Agent runtime and model input.

The model receives:

```text
authoritative Principal
authoritative Resolved Context
effective Tool Catalog
authoritative Tool observations
```

The model is not allowed to create or replace these values.

Principal is not automatically copied into the user-visible Agent reply.

## 7. Context-bound Tool filtering

P0.6 adds the first concrete proof of Context-bound tool discovery:

`enterprise.context.profile.get`

Properties:

- READ only;
- owner: App Platform;
- capability: `enterprise.directory`;
- absent in Personal Context;
- present only when:
  - Active Context is Enterprise;
  - a resolved Enterprise Context exists;
  - Personal Context owner equals the current Principal.

The tool returns the already Host-resolved Enterprise Context profile.

This establishes the intended derivation:

```text
Principal
+
granted Active Context
+
installed/effective capabilities
+
Host policy
=
effective Tool Catalog
```

P0.6 does not broadly authorize WRITE tools by Context yet.

## 8. Provider replacement

Both reference Providers are replaceable.

Future implementations may supply:

- OIDC / SSO / passkey / enterprise identity sessions;
- HCM/Directory membership;
- tenant membership;
- customer-specific relationship systems.

Personal Agent must depend on the platform contracts and capabilities, not these Host reference implementations.

## 9. Security invariants

1. Browser values are selectors, never identity or grant authority.
2. Principal comes from a Session Provider or explicit compatibility fallback.
3. Enterprise Contexts come from an Enterprise Context Provider.
4. Enterprise access comes from a Grant Provider.
5. Directory and Grant are intersected by the Host.
6. Unknown/ungranted Context selection fails closed.
7. An effective but unusable Session Provider does not silently downgrade to compatibility identity.
8. No generic Context Memory write is introduced.
9. No Enterprise Agent is introduced.
10. Material WRITE authority remains a later governed layer.

## 10. Deferred

P0.6 does not implement:

- login UI;
- request-bound cookie/bearer session transport;
- token refresh;
- full user/role/group administration;
- SCIM;
- complete RBAC/ABAC;
- enterprise membership editing UI;
- generic Memory writes;
- cross-context Memory promotion;
- autonomous material WRITE authorization.

## 11. Next mainline

The next slice should replace deployment-scoped Session identity with request-bound identity/session transport and apply Principal + Active Context to authorization of material WRITE actions.

After that boundary is executable and observable, Context Memory Providers and Memory Attribution/Governance can advance without conflating identity, access and learning.
