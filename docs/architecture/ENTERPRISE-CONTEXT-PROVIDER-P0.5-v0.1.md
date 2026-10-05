# Enterprise Context Provider P0.5 — First Real Context Source

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-26  
**Authority:** Directory/provider protocol baseline only. Product semantics are governed by `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`.

> **Architecture correction — 2026-10-05:** Enterprise Context is now a **thin generic enterprise Resource Container**, not a definition-first domain repository. The P0.5 directory/provider security boundary remains valid. Domain definitions are stored as typed resources and interpreted by independent plugins. See `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`.

## Purpose

P0.5 replaces test-only Enterprise Context registration with the first real Host-owned Enterprise Context source.

The model remains:

```text
Human
  └─ Personal Agent
       ├─ Personal Context
       └─ authorized Enterprise Context(s)
```

Enterprise Context is not an Agent.

## Provider boundary

The public runtime contract is:

```text
EnterpriseContextProviderV010
  providerId
  list() -> EnterpriseContextV010[]
```

Reference implementation:

- Package: `host-enterprise-context-provider`
- Provider: `host.enterprise-context`
- Capability: `enterprise.directory`
- Provider contract: `evo.enterprise.context-directory@0.1.0`

The Host resolves this through the existing Provider runtime/binding mechanism. Personal Agent and business Apps do not import the concrete Provider.

## Reference Host configuration

The first reference source is Host-owned configuration:

`APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON`

Example:

```json
{
  "contractVersion": "0.1.0",
  "contexts": [
    {
      "contextId": "enterprise:acme",
      "enterpriseId": "acme",
      "displayName": "Acme",
      "companyId": "acme-hq",
      "attributes": {
        "region": "global"
      }
    }
  ]
}
```

When valid configuration is present, the Host registers the Provider runtime and activates the reference Provider Package. Without configuration, the production default remains Personal Context only.

Future directory/identity/HCM/SSO implementations may replace this reference Provider without changing Personal Agent contracts.

## Host resolution and security

Browser/request data may only select a Context reference already offered by the Host.

```text
Host Enterprise Context Provider
        ↓
Host Context Registry
        ↓
available Context refs
        ↓
Eidos Context selector
        ↓
request selects one ref
        ↓
Host resolves again
        ├─ known → use
        └─ unknown/forged → fail closed
```

The UI is never the authorization boundary.

Duplicate Context IDs or malformed Provider configuration fail validation.

## Personal Agent read-only use

P0.5 adds:

- generic Eidos Chat Context selector;
- `context.available.list` READ tool;
- existing `context.current.get` READ tool;
- selected `ResolvedContextSetV010` in model input;
- Enterprise Context label in Chat evidence/context presentation.

No new generic WRITE tool is added.

## Eidos boundary

Eidos owns the generic selector interaction and knows nothing about Enterprise semantics.

The selector submits an opaque JSON value under a declared key. App Platform uses `activeContext` with an `ActiveContextRefV010` value.

Machine Context IDs are not localized. Human-facing selector chrome supports:

- `en`
- `zh-CN`
- `ja`
- `zh-TW`

Enterprise display names are enterprise data, not translation keys.

## Memory boundary

P0.5 does not add Context Memory mutation.

```text
Enterprise Context read/use for reasoning
!=
permission to persist into Personal Context Memory
```

Cross-context Memory promotion remains deny-by-default.

## Deferred

P0.5 deliberately does not implement:

- full Identity/Session;
- enterprise membership administration;
- Relationship/Grant evaluation;
- generic Context Memory writes;
- Enterprise Agent;
- multi-Agent delegation.

## Next slice

After P0.5, add the minimum executable Principal/Session + Relationship/Grant layer needed to decide which Enterprise Contexts a person may receive from a Provider. Then filter the effective Tool Catalog by Principal + Active Context before expanding material WRITE capabilities.

## Superseded definition-first expansion

The former definition-first expansion is superseded.

Current direction:

```text
Enterprise Context
  -> generic Resource Library / Collections
  -> domain resources stored under namespaces
  -> independent plugins interpret/edit/publish those resources
```

Enterprise Context Core does not own Draft/Published/Effective semantics for every
resource kind. Those semantics belong to the relevant domain plugin.

