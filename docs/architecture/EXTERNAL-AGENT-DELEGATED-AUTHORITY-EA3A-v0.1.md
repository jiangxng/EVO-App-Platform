# External Agent Registration + Delegated Authority Grants — EA-3A v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent:** EA-2C Authorized Capability Operation Catalog  
**External network exposure:** NONE  
**OAuth credentials/tokens:** NOT IMPLEMENTED IN EA-3A

## 1. Purpose

EA-3A introduces the first durable Host-owned governance facts required to
delegate a bounded subset of Human authority to an external Agent.

It answers:

1. Which external Agent is known to EVO?
2. Which concrete client/runtime belongs to that Agent?
3. Which Human delegated which operations?
4. In which Host-resolved Context?
5. For what validity window?
6. Is the Agent, Client and Grant still active?

It deliberately does not yet answer:

> How does an external network caller cryptographically prove that it is this
> Agent/client?

That is an OAuth/client-authentication concern for EA-4.

## 2. Actor separation

EA-3A freezes three independent objects:

~~~text
External Agent Registration
≠ External Agent Client Registration
≠ External Agent Authority Grant
~~~

Example:

~~~text
Agent:
ChatGPT

Client:
one concrete ChatGPT/EVO connection

Grant:
Human Wang delegates READ operations
to that Agent + Client
inside enterprise:acme
until a specific expiration
~~~

Registration is not authority.

Trust is not authority.

A known Agent with no active Grant has zero delegated EVO business authority.

## 3. External Agent Registration

Contract:

~~~text
agentId
displayName
publisherId?
trustLevel
state
createdAt
createdBySubjectId
revokedAt?
revokedBySubjectId?
metadata?
~~~

Current Human-created registrations receive:

~~~text
trustLevel = REGISTERED
~~~

They cannot self-declare VERIFIED, ENTERPRISE_APPROVED or FIRST_PARTY.

Those higher trust postures require a later Host/admin verification path.

Trust never grants business authority.

## 4. External Agent Client Registration

Contract:

~~~text
clientId
agentId
displayName
kind:
  PUBLIC
  CONFIDENTIAL
  WORKLOAD

protocols:
  MCP
  OPENAPI
  A2A

state
createdAt
createdBySubjectId
revokedAt?
revokedBySubjectId?
metadata?
~~~

A Client must reference a registered Agent.

Protocols describe interoperability support only.

They do not grant permissions.

EA-3A stores no client secret, bearer token, OAuth authorization code or refresh
token.

## 5. Delegated Authority Grant

Contract:

~~~text
grantId

agentId
clientId

authorizingPrincipalSubjectId
contextId

allowedOperationIds[]
effectConstraints[]

state:
  ACTIVE
  REVOKED

validFrom
validUntil

createdAt
createdBySubjectId

revokedAt?
revokedBySubjectId?
description?
~~~

The Grant is Host-owned authority evidence.

It is not encoded only inside a token.

## 6. Context binding

The Human does not type an arbitrary Context id into the Grant.

EA-3A takes:

~~~text
contextId
=
current Host-resolved activeContext.contextId
~~~

at grant creation.

This preserves the platform invariant:

> Client values may select from Host-authorized Contexts but do not manufacture
> Context authority.

The Grant creation path therefore cannot use an arbitrary caller-provided
enterprise id to create access.

## 7. Authority attenuation at grant creation

Grant creation computes:

~~~text
current active Capability Operations
∩ HUMAN exposure eligibility
∩ current Human authorization.check
∩ EXTERNAL_AGENT exposure eligibility
∩ requested operation ids
=
grantable operations
~~~

If one requested operation is not in that intersection, Grant creation fails.

This is the first executable proof of:

~~~text
External Agent delegated authority
⊆ current authorizing Human authority
~~~

EA-3A uses the Human-authorized catalog from EA-2C rather than duplicating
plugin/business permission logic.

## 8. WRITE remains closed

The Grant contract can represent READ / PLAN / WRITE effects because it is a
long-lived public semantic object.

EA-3A creation policy permits:

~~~text
READ
PLAN
~~~

and rejects:

~~~text
WRITE
~~~

with:

~~~text
EXTERNAL_AGENT_WRITE_NOT_ENABLED
~~~

even when the Human authorization provider would otherwise allow the WRITE
operation.

This is intentional platform restriction.

External Agent WRITE remains deferred until the later governed WRITE phase has:

- approval semantics;
- idempotency;
- durable Action Receipt;
- ambiguous-outcome handling;
- readback/verification;
- explicit product acceptance.

## 9. Explicit expiration

Every EA-3A Grant requires an explicit:

~~~text
validUntil
~~~

that is in the future.

There is no implicit forever Grant in v0.1.

The Grant also records:

~~~text
validFrom
~~~

at creation.

A later Host policy may impose maximum durations or require re-consent. EA-3A
does not hard-code an arbitrary global maximum duration into the core contract.

## 10. Revocation and immutable history

Registration/Grant history is not rewritten.

Creation facts are immutable.

Revocation changes only terminal lifecycle fields:

~~~text
state = REVOKED
revokedAt
revokedBySubjectId
~~~

A revoked Agent, Client or Grant cannot be reactivated in place.

A new authorization relationship requires a new durable object.

This makes audit history deterministic.

## 11. Agent/Client revocation without Grant mutation

Suppose:

~~~text
Grant.state = ACTIVE
~~~

and later:

~~~text
Client.state = REVOKED
~~~

EA-3A does NOT rewrite the historical Grant to pretend it was revoked at the
same moment.

Instead effective status becomes:

~~~text
historical Grant record:
ACTIVE

effective authority:
INACTIVE because Client is revoked
~~~

The same applies when the Agent registration is revoked.

This preserves both historical fact and current effective authority.

## 12. Effective Grant status

The internal effective-status resolver evaluates:

~~~text
Grant exists?
Agent id matches?
Client id matches?
Agent active?
Client active?
Client belongs to Agent?
Grant active?
not before validFrom?
before validUntil?
~~~

Possible reasons include:

~~~text
ACTIVE
GRANT_NOT_FOUND
GRANT_AGENT_MISMATCH
GRANT_CLIENT_MISMATCH
AGENT_NOT_ACTIVE
CLIENT_NOT_ACTIVE
CLIENT_AGENT_MISMATCH
GRANT_REVOKED
GRANT_NOT_YET_VALID
GRANT_EXPIRED
~~~

This still does NOT mean the operation is executable.

EA-3B must additionally re-evaluate the authorizing Principal's CURRENT
authority.

## 13. Why grant creation validation is not enough

A dangerous implementation would be:

~~~text
Human allowed at grant creation
→ store Grant
→ forever trust stored allowedOperationIds
~~~

That is forbidden.

After Grant creation any of these can change:

- Human loses Enterprise membership;
- Enterprise Context is suspended/archived;
- Authorization policy changes;
- Package is disabled;
- Feature is deactivated;
- operation is removed/versioned;
- operation exposure changes;
- Agent or Client is revoked;
- Grant expires.

Therefore EA-3A is only the durable delegation evidence layer.

EA-3B must derive:

~~~text
active Grant
∩ current plugin lifecycle
∩ current authorizing Principal authority
∩ current Context authority
∩ current operation policy
=
effective delegated operation
~~~

on every discovery/invocation decision.

## 14. Current Principal reconstruction gap

A delegated Agent may operate while the Human is not actively signed into the
browser.

Therefore EA-3B cannot depend on a live Human browser Session as the only source
of the authorizing Principal's current authority.

The platform currently has request-bound Session identity, but no production
`identity.user-directory` implementation that can reconstruct the current
Human Principal/claims by subject id independently of a live Session.

EA-3B must solve this explicitly.

Acceptable direction:

~~~text
authorizingPrincipalSubjectId
→ current Principal/identity status from a governed identity directory/provider
→ current Enterprise Context membership/grants
→ current authorization.check
~~~

Do NOT freeze the whole Human Principal or old token claims into the delegated
Grant and treat them as permanently current.

## 15. Governance authorization

Creating/revoking Agent governance objects is itself privileged.

EA-3A uses existing `authorization.check` with actions:

~~~text
external.agent.register
external.agent.revoke
external.agent.client.register
external.agent.client.revoke
external.agent.grant.create
external.agent.grant.revoke
external.agent.governance.read
~~~

Authentication success alone is not permission.

Missing or errored Authorization Provider fails closed.

## 16. Governance events

EA-3A records append-only bounded events:

~~~text
AGENT_REGISTERED
AGENT_REVOKED
CLIENT_REGISTERED
CLIENT_REVOKED
GRANT_CREATED
GRANT_REVOKED
~~~

Each event records:

- event id;
- time;
- actor subject;
- relevant Agent/Client/Grant ids;
- Context id where applicable.

Events do not contain:

- client secrets;
- bearer tokens;
- authorization codes;
- refresh tokens;
- stored secret plaintext.

## 17. Persistence

Contracts:

~~~text
ExternalAgentGovernanceSnapshotV010
ExternalAgentGovernanceStoreV010
~~~

Reference implementations:

~~~text
memory store
file-backed store
~~~

File-backed persistence uses atomic temp-file replacement.

Production Host wiring is intentionally deferred until the EA-3B identity/current
authority model is complete; merely persisting grants must not accidentally
open an external authorization surface.

## 18. No OAuth yet

EA-3A does not implement:

- OAuth client registration;
- client credentials;
- authorization endpoint;
- consent screen;
- access tokens;
- refresh tokens;
- Protected Resource Metadata;
- Authorization Server Metadata;
- DPoP;
- MCP server;
- public capability endpoint.

Those belong to later slices.

This separation allows delegation semantics to be tested independently from
transport/security protocol implementation.

## 19. Machine acceptance

EA-3A must prove:

1. Agent registration is separate from Client registration and Grant;
2. registration alone produces zero grants;
3. Human-created Agent trust defaults to REGISTERED;
4. Client references an existing active Agent;
5. Grant context comes from Host-resolved active Context;
6. Grant requires explicit future expiration;
7. requested operations must be currently Human-authorized;
8. requested operations must declare EXTERNAL_AGENT eligibility;
9. WRITE grant creation is rejected;
10. Agent/client/grant creation facts are immutable;
11. revocation is terminal;
12. governance events are append-only;
13. revoked Client makes historical ACTIVE Grant ineffective without rewriting it;
14. expired Grant is ineffective;
15. Agent/client identity mismatch fails closed;
16. governance reads include the current Human's registrations even before a Grant exists.

## 20. Next slice — EA-3B

EA-3B should add current-authority resolution for delegated callers.

Required result:

~~~text
External Agent identity
+ Client identity
+ active Grant
+ current authorizing Human identity status
+ current Context grant/membership
+ current Capability Operation lifecycle
+ current authorization.check
=
effective delegated Capability Operation catalog
~~~

Only after that intersection is machine-proven should EA-4 bind OAuth tokens to
the Agent/Client/Grant model.

## 21. Architectural statement

> A delegated Grant is durable evidence of permission offered by a Human; it is
> never a frozen copy of permanent authority.

Current authority is always re-derived.
