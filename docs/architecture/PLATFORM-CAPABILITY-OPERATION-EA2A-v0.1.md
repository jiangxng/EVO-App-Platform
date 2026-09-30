# Platform Capability Operation Contract — EA-2A v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**External exposure:** NONE in EA-2A  
**Plugin Protocol contribution:** `platform.capability-operation`

## 1. Purpose

EA-2A turns the earlier External Agent architecture reservation into a real plugin-platform contract.

A Feature already declares:

```text
providesCapabilities
```

That answers:

> What semantic capability does this active Feature supply?

It does not answer:

> Which stable operations can a Human, Personal Agent, External Agent or automation invoke?

EA-2A introduces the second layer:

```text
Feature
  ├── provides Capability
  └── contributes Capability Operation(s)
```

## 2. Canonical rule

> **One semantic capability operation, many later projections.**

A plugin defines the business operation once.

The same operation may later be projected into:

- Personal Agent tools;
- MCP tools;
- OpenAPI operations;
- Human actions;
- automation;
- future A2A Skills where task semantics justify it.

EA-2A implements only declaration and lifecycle-effective aggregation.

It does not yet expose an external endpoint.

## 3. Contribution

Canonical shape:

```json
{
  "kind": "platform.capability-operation",
  "operation": {
    "contractVersion": "0.1.0",
    "operationId": "ledger.runtime.describe",
    "capability": "ledger.runtime",
    "operationVersion": "1.0.0",
    "title": "Describe Ledger Runtime",
    "description": "Returns the effective Ledger Runtime configuration for the current authorized enterprise context.",
    "effect": "READ",
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {}
    },
    "outputSchema": {
      "type": "object"
    },
    "binding": {
      "type": "ACTION_HOST",
      "commandCode": "ledger-runtime.describe",
      "inputVersion": "1.0.0"
    },
    "exposure": [
      "EXTERNAL_AGENT"
    ]
  }
}
```

The portable Feature JSON Schema publishes the same shape.

## 4. Capability vs operation

These are deliberately different concepts.

```text
Capability
= dependency / availability contract

Capability Operation
= stable callable semantic operation owned by that Capability
```

Example:

```text
Capability:
ledger.runtime

Operations:
ledger.runtime.describe
ledger.runtime.template.read
ledger.runtime.replay.plan
```

One Capability may expose multiple operations.

A Feature may contribute an operation only for a Capability it declares in `providesCapabilities`.

## 5. Operation identity

`operationId` is a stable public machine identity.

Rules:

- lowercase stable id syntax;
- must equal the Capability id or begin with `<capability>.`;
- unique within a Package;
- globally unique among currently effective Features;
- duplicate active ownership fails closed.

Example:

```text
capability = ledger.runtime

valid:
ledger.runtime
ledger.runtime.describe
ledger.runtime.template.read

invalid:
finance.ledger.describe
```

The operation id is not a translated UI label.

## 6. Operation version

`operationVersion` versions the callable semantic contract independently of Package version.

This allows:

```text
Package v3
→ still provides ledger.runtime.describe@1.0.0
```

or later an explicit operation-contract transition.

Package lifecycle and operation semantic compatibility must not be silently conflated.

## 7. Effect classification

Every operation declares:

```text
READ
PLAN
WRITE
```

### READ

Observational. No intended state mutation.

### PLAN

Side-effect-free planning, validation, preview, simulation or preflight.

### WRITE

Material state mutation.

Effect is semantic metadata and does not itself grant authority.

## 8. WRITE safety declaration

A WRITE operation must declare:

```json
{
  "writeSafety": {
    "idempotency": "HOST_REQUIRED",
    "receipt": "HOST_REQUIRED"
  }
}
```

This does not implement WRITE execution in EA-2A.

It freezes the rule that future protocol projection cannot create a write path lacking:

- Host-governed idempotency;
- durable Host-owned execution receipt.

READ/PLAN operations must not declare WRITE safety metadata.

## 9. Input/output schemas

`inputSchema` and `outputSchema` are machine-readable JSON Schema objects.

Their job is semantic interoperability.

They are not permission policy.

A schema saying a field exists does not imply the caller may read/write that field.

Future authorization/result filtering may further restrict effective input/output.

## 10. Binding

EA-2A intentionally supports one execution binding:

```text
ACTION_HOST
```

Fields:

```text
commandCode
inputVersion
```

This reuses the existing governed Host Action boundary rather than inventing an External-Agent execution path.

Supporting another binding later requires an explicit contract extension.

The binding is internal execution metadata.

External protocols should project semantic operation identity, not expose private routing mechanics as authority.

## 11. Exposure eligibility

Each operation explicitly lists one or more candidate audiences:

```text
HUMAN
PERSONAL_AGENT
EXTERNAL_AGENT
AUTOMATION
```

Exposure means:

> This operation is semantically eligible for this consumer class.

It does NOT mean:

> Every caller of this class is authorized.

Target later derivation:

```text
operation exposure eligibility
∩ Principal
∩ Enterprise Context
∩ delegated Grant
∩ authorization.check
∩ runtime policy
=
effective visible operation
```

EA-2A does not yet perform this authorization filtering.

## 12. Lifecycle-effective registry

App Manager now derives operations only from currently active Features.

```text
Package installed
+ Feature active
+ valid Contribution
=
effective Capability Operation
```

Therefore:

```text
not installed
→ not effective

installed but Feature disabled
→ not effective

Feature enabled
→ effective

Feature disabled/uninstalled
→ immediately removed
```

No ghost API remains after Feature deactivation.

## 13. Global collision behavior

If two active Features contribute the same `operationId`:

```text
CAPABILITY_OPERATION_ID_CONFLICT
```

The Host fails closed.

It does not:

- choose lexical Package order;
- choose first installed;
- choose newest version;
- merge schemas;
- silently alias one operation.

Public semantic ownership must be explicit.

## 14. Plugin ownership

The owning plugin owns:

- business meaning;
- operation id/version;
- schemas;
- effect;
- Action binding;
- exposure eligibility;
- Help semantics;
- domain validation.

App Platform owns:

- lifecycle-effective aggregation;
- conflict detection;
- future Principal/Context filtering;
- future delegated authority filtering;
- protocol projection;
- invocation governance;
- audit/receipts.

## 15. What EA-2A does not implement

EA-2A does NOT yet implement:

- External Agent identity;
- Authority Grants;
- authorization-aware operation filtering;
- MCP;
- OpenAPI projection;
- public operation-discovery endpoint;
- operation invocation API;
- Agent-specific adapters;
- Ledger Runtime operation contributions;
- external WRITE.

This is deliberate.

The contract is made executable internally before network exposure.

## 16. Machine acceptance

EA-2A is complete when:

1. TypeScript public contract exists;
2. portable Feature JSON Schema includes the Contribution;
3. canonical Plugin Protocol validator validates semantics;
4. operation must belong to a provided Capability;
5. operation id is capability-namespaced;
6. WRITE requires Host idempotency + receipt declaration;
7. READ/PLAN reject WRITE safety metadata;
8. package-local duplicate operation id is rejected;
9. App Manager lists only active-Feature operations;
10. Feature disable removes operations;
11. capability filtering is deterministic;
12. active cross-plugin operation collision fails closed;
13. existing Plugin Protocol and Platform CI remain green.

## 17. First real consumer

After the production login live gate and delegated External Agent authorization foundation, the first real business operation should be Ledger Runtime READ:

```text
ledger.runtime.describe
```

or a semantically equivalent final Ledger-owned id.

It will be used for EA-001:

> Tell me the current Ledger Runtime template content for this enterprise.

That plugin contribution must live with the Ledger Runtime / Configurator business owner, not in External Agent adapter code.

## 18. Next slices

```text
EA-2A
Capability Operation declaration + effective registry
        ↓
EA-2B
Principal/Context-aware effective operation selection
        ↓
EA-3
External Agent identity + delegated Authority Grant
        ↓
EA-4
OAuth protected-resource authorization
        ↓
EA-5
Generic MCP READ/PLAN projection
```

The production Human login live gate remains a prerequisite before actual external delegated access is opened.
