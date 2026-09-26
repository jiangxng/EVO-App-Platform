# Enterprise Relationship Lifecycle P0.8 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-27  
**Depends on:** Enterprise Context Creation + Ownership P0.7  
**World model:** Human → Personal Agent → Personal / Enterprise Context

## 1. Purpose

P0.8 turns Enterprise Context access and ownership into explicit governed lifecycles.

It answers:

1. How does one human invite another human into an Enterprise Context?
2. When does the invited human actually gain access?
3. How is membership revoked without deleting history?
4. How can ownership move from one human to another without producing an ownerless ACTIVE Enterprise Context?
5. Which relationship roles are allowed to perform each governance action?

P0.8 remains intentionally smaller than a full IAM system.

## 2. Relationship roles

Current relationship kinds:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `AUDITOR`

Current Host governance matrix:

| Action | OWNER | ADMIN | MEMBER | AUDITOR |
| --- | --- | --- | --- | --- |
| Invite ADMIN | yes | no | no | no |
| Invite MEMBER | yes | yes | no | no |
| Invite AUDITOR | yes | yes | no | no |
| Revoke ADMIN | yes | no | no | no |
| Revoke MEMBER | yes | yes | no | no |
| Revoke AUDITOR | yes | yes | no | no |
| Initiate ownership transfer | yes | no | no | no |
| Directly revoke OWNER | no — transfer required | no | no | no |

This matrix is a Host invariant, not a prompt instruction.

An Authorization Provider ALLOW does not bypass these relationship rules.

## 3. Invitation lifecycle

A membership invitation is a separate governance object:

```text
PENDING
  ├─→ ACCEPTED
  ├─→ DECLINED
  ├─→ REVOKED
  └─→ EXPIRED
```

Invitation fields include:

- stable `invitationId`;
- `contextId`;
- target `subjectId`;
- requested role;
- inviter `subjectId`;
- creation time;
- optional expiry;
- terminal response facts.

The invitation target is a stable Principal subject id. P0.8 does not yet introduce an email/user-directory invitation system.

An invitation to a subject that never authenticates simply remains pending until revoked or expired.

## 4. Invite command

Command:

`enterprise.relationship.invite`

Requirements:

1. request-bound HUMAN Principal;
2. Active Context is the governed Enterprise Context;
3. Enterprise Context is ACTIVE;
4. Principal has the required Host role;
5. explicit Material WRITE confirmation;
6. `authorization.check` returns ALLOW.

Role rule:

- ADMIN invitation requires OWNER;
- MEMBER/AUDITOR invitation requires OWNER or ADMIN.

The invite action does not create a Relationship or Grant.

Therefore:

> invitation is not membership.

## 5. Acceptance

Command:

`enterprise.relationship.invitation.accept`

Acceptance runs from the target human's Personal Context because the target does not yet possess Enterprise Context access.

The Host verifies:

- request-bound HUMAN Principal;
- Personal Context is active;
- invitation exists and is PENDING;
- invitation target subject equals current Principal subject;
- invitation is not expired;
- target does not already have the same active relationship;
- `authorization.check` returns ALLOW.

One successful acceptance atomically writes:

```text
Invitation → ACCEPTED
+
Relationship → ACTIVE
+
Enterprise Context Grant → ACTIVE
+
INVITATION_ACCEPTED event
+
RELATIONSHIP_ACTIVATED event
```

Only after that commit does the Enterprise Context appear in the Principal's effective Context list.

## 6. Decline and revoke

Target Principal may decline a pending invitation from Personal Context:

`enterprise.relationship.invitation.decline`

An OWNER/ADMIN may revoke a pending invitation from its Enterprise Context:

`enterprise.relationship.invitation.revoke`

OWNER-only restrictions still apply to ADMIN invitations.

Terminal invitation states are immutable. A declined/revoked/expired invitation cannot later become accepted.

## 7. Relationship lifecycle

Current Relationship state machine:

```text
ACTIVE → REVOKED
```

Reactivation of the same Relationship record is forbidden.

A new relationship requires a new stable `relationshipId`.

Command:

`enterprise.relationship.revoke`

Rules:

- OWNER relationship cannot be directly revoked;
- OWNER may revoke ADMIN/MEMBER/AUDITOR;
- ADMIN may revoke MEMBER/AUDITOR;
- authorization policy must also ALLOW.

Relationship revocation atomically revokes matching effective access Grants.

Revoked relationship and grant records remain stored for history.

## 8. Grant lifecycle

Dynamic Enterprise Context Grants now support:

```text
ACTIVE → REVOKED
```

The effective Grant Provider ignores REVOKED Grants.

This means Context availability is automatically removed when the last active access Grant for that Principal/Context is revoked.

A revoked Grant cannot be reactivated. Future access requires a new Grant record.

## 9. Ownership transfer lifecycle

Ownership transfer is deliberately separate from membership invitation:

```text
PENDING
  ├─→ ACCEPTED
  ├─→ DECLINED
  ├─→ CANCELLED
  └─→ EXPIRED
```

Commands:

- `enterprise.ownership.transfer.initiate`
- `enterprise.ownership.transfer.accept`
- `enterprise.ownership.transfer.decline`
- `enterprise.ownership.transfer.cancel`

Only an ACTIVE OWNER may initiate a transfer.

The target accepts or declines from Personal Context.

The initiating OWNER may cancel while the transfer remains PENDING.

## 10. Atomic ownership acceptance

On acceptance, one governance-store commit performs:

```text
new target OWNER Relationship → ACTIVE
new target OWNER Grant        → ACTIVE

outgoing owner Relationship(s) → REVOKED
outgoing OWNER Grant(s)        → REVOKED

Ownership Transfer → ACCEPTED

append governance events
```

The store validates the final snapshot before commit.

Therefore there is no intermediate persisted state in which the ACTIVE Enterprise Context has zero OWNERs.

Other pre-existing OWNERs, if any, remain active.

## 11. Creator is not current owner

Ownership transfer never changes:

- `enterpriseId`;
- `createdBySubjectId`;
- `createdAt`.

Example:

```text
Alice creates ACME
createdBy = Alice

Alice transfers ownership to Bob
current OWNER = Bob
createdBy = Alice
```

Creator identity is immutable audit history.

OWNER is a current governance relationship.

## 12. Append-only governance evidence

P0.8 introduces append-only Relationship lifecycle events including:

- invitation created/accepted/declined/revoked/expired;
- relationship activated/revoked;
- ownership transfer created/accepted/declined/cancelled/expired.

Previously recorded lifecycle events cannot be removed by a later governance-store save.

Current-state records may move only through defined monotonic transitions while their creation facts remain immutable.

## 13. Pending governance reads

`GET /v1/contexts/effective` now returns, for the authenticated Principal:

- active Enterprise relationships;
- non-expired PENDING invitations addressed to that Principal;
- non-expired PENDING ownership transfers addressed to that Principal.

These are Host-derived reads.

The browser cannot manufacture them by submitting ids.

## 14. Dual authorization boundary

Enterprise governance WRITE requires both:

```text
Host relationship/context invariant
AND
authorization.check ALLOW
```

Examples:

- a MEMBER remains unable to invite even if a permissive policy Provider returns ALLOW;
- an ADMIN cannot grant ADMIN because OWNER is required by Host invariant;
- an OWNER still cannot perform a write if the Authorization Provider denies it.

This keeps stable structural rules out of configurable policy while leaving deployment-specific authorization replaceable.

## 15. Compatibility

Existing P0.7 `enterprise-governance.json` files remain readable.

Missing P0.8 arrays are normalized to empty collections:

- `invitations`;
- `ownershipTransfers`;
- `relationshipEvents`.

No manual persistence migration is required for P0.7 state.

## 16. Deferred

P0.8 does not yet implement:

- user directory / people search;
- email invitation delivery;
- invite links or anonymous onboarding;
- adding a co-owner without transfer;
- role editing in place;
- groups/teams;
- full RBAC/ABAC;
- enterprise legal verification;
- Enterprise Context suspend/archive commands;
- dedicated Eidos membership administration UI;
- generic Context Memory writes;
- cross-context Memory promotion.

## 17. Next mainline

With Human → Principal → Enterprise Context → Relationship → Grant → Material WRITE governance executable, the next major slice can begin Context Memory safely.

Recommended next mainline:

1. Context Memory Provider read/write boundary;
2. immutable provenance / attribution;
3. separate Personal and Enterprise Memory authority;
4. governed cross-context promotion, denied by default;
5. Personal Agent memory tools through the existing Principal + Context + Authorization boundary.

Do not introduce an Enterprise Agent.
