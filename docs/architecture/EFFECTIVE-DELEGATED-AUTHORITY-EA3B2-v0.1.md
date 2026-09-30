# Effective Delegated Authority Resolver — EA-3B2 v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Prerequisites:** EA-3A delegated governance + EA-3B1 current Human identity directory  
**External network exposure:** NONE

## 1. Purpose

EA-3B2 closes the gap between:

```text
historical delegated Grant
```

and:

```text
authority that is valid right now
```

A durable External Agent Authority Grant is evidence that a Human delegated a bounded set of operations for a bounded time/context.

It is not permanent authorization truth.

Every delegated discovery/invocation decision must recompute current authority.

## 2. Canonical intersection

```text
active Agent
∩ active Client
∩ active, unexpired Grant
∩ current ACTIVE authorizing Human from identity.user-directory
∩ current Enterprise Context membership
∩ current plugin/Feature lifecycle
∩ current Capability Operation contract
∩ current authorization.check
∩ Grant allowedOperationIds
∩ Grant effectConstraints
=
current effective delegated Capability Operations
```

Any missing required authority source fails closed.

## 3. Reuse, do not fork authorization

EA-3B2 does not implement a new policy engine.

It reuses:

- `resolveExternalAgentGrantEffectiveStatusV010`;
- `identity.user-directory`;
- `EnterpriseContextProviderV010`;
- `EnterpriseContextGrantProviderV010`;
- Person-first Context Registry;
- App Manager effective Capability Operations;
- `listAuthorizedCapabilityOperationsV010(... audience: "HUMAN")`;
- `authorization.check`.

The External Agent view is then an additional attenuation of the Human's current authorized catalog.

## 4. Current Human reconstruction

The stored Grant contains:

```text
authorizingPrincipalSubjectId
```

At runtime:

```text
subjectId
→ identity.user-directory
→ current IdentityUserDirectoryRecord
```

Required:

- record exists;
- state = ACTIVE;
- Principal subject matches Grant;
- actorType = HUMAN.

A live browser Session is not required.

An old Session or old OIDC token is not consulted.

## 5. Current Context reconstruction

The Grant stores:

```text
contextId
```

This is not trusted as current membership.

EA-3B2 rebuilds the authorizing Human's current Person-first Context registry from:

```text
current Human Principal
+ Enterprise Context directory
+ current Enterprise Context grants/membership
```

Then it attempts to resolve the stored `contextId`.

If the Context is no longer available to the Human:

```text
GRANT_CONTEXT_NOT_AVAILABLE
```

The historical Grant remains unchanged.

## 6. Current policy reconstruction

After current Principal and Context are rebuilt, EA-3B2 calls the ordinary Human capability authorization catalog.

Therefore changes to:

- authorization policy;
- resource authorization;
- Context;
- data scope;
- plugin lifecycle;
- operation exposure;
- operation contract;

take effect on the next delegated decision.

## 7. External Agent attenuation

Only operations that satisfy all of the following survive:

```text
Human currently authorized
AND operation EXTERNAL_AGENT eligible
AND operation id in Grant.allowedOperationIds
AND effect in Grant.effectConstraints
```

A Human gaining a new permission later does not expand an old Grant.

A Human losing permission immediately removes delegated use.

## 8. Discovery and invocation use the same resolver

EA-3B2 defines two internal functions:

```text
listEffectiveDelegatedCapabilityOperationsV010
resolveEffectiveDelegatedCapabilityOperationV010
```

The second calls the same current-authority catalog logic as the first.

This prevents:

```text
safe discovery
+
unsafe direct invocation
```

A client knowing or guessing an operation id does not bypass current delegation checks.

## 9. Historical Grant remains immutable

Examples:

### Human disabled

```text
Grant.state = ACTIVE
Human directory = DISABLED
→ effective delegated authority = none
```

### Membership removed

```text
Grant.contextId unchanged
Enterprise membership removed
→ context cannot be reconstructed
→ effective delegated authority = none
```

### Policy changes to DENY

```text
Grant allowedOperationIds unchanged
authorization.check = DENY
→ operation disappears immediately
```

### Plugin disabled

```text
Grant still references operation id
Feature inactive
→ operation absent from effective registry
→ no current invocation
```

This preserves audit history without freezing stale authority.

## 10. Resolver result semantics

Catalog result distinguishes:

- Grant/Agent/Client inactive;
- current identity source unavailable;
- Human missing/disabled;
- Context authorities unavailable;
- Grant Context no longer available;
- active Grant with zero currently authorized operations.

An active historical Grant with zero effective operations is valid evidence but has no usable business authority.

## 11. Direct invocation result semantics

Direct resolution distinguishes:

```text
OPERATION_NOT_GRANTED
```

from:

```text
OPERATION_NOT_CURRENTLY_AUTHORIZED
```

This matters for audit/diagnostics while still failing closed.

Protocol adapters may later map these internal reasons to appropriately bounded external errors without disclosing unauthorized catalog details.

## 12. Machine acceptance

EA-3B2 proves:

1. active Agent/Client/Grant + current Human + current membership + ALLOW returns granted READ operation;
2. Human DISABLED removes delegated authority immediately;
3. membership removal invalidates Grant Context immediately;
4. current policy DENY removes operation immediately;
5. Feature disable removes operation immediately;
6. operation outside Grant is denied even when Human can use it;
7. revoked Client fails before Human authorization;
8. expired Grant fails before Human authorization;
9. missing identity directory fails closed;
10. missing membership authority fails closed;
11. discovery and direct invocation share the same current-authority derivation;
12. historical Grant remains unchanged when current authority disappears.

## 13. Not implemented here

EA-3B2 does not add:

- bearer/access tokens;
- OAuth Authorization Server;
- Protected Resource Metadata;
- client authentication;
- MCP transport;
- OpenAPI external endpoint;
- Agent-specific adapters;
- External Agent WRITE.

These are later layers.

## 14. Next

With EA-3B2, the platform has enough internal authority semantics to begin EA-4:

```text
OAuth Protected Resource / Authorization Profile
```

EA-4 credentials must bind to an External Agent Client + Grant, but token possession never replaces EA-3B2 current-authority recomputation.

After EA-4:

```text
Generic MCP READ/PLAN
→ EA-001 Ledger Runtime Blind Enterprise Discovery
→ ChatGPT Adapter
→ second mature Agent portability proof
```
