# MCP Capability Operation Projection — EA-5C v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Requires:** EA-2 Capability Operations, EA-3 delegated authority, EA-4 OAuth, EA-5A/B MCP transport/protected resource  
**MCP effects enabled:** READ, PLAN  
**WRITE:** NOT ENABLED

## 1. Purpose

EA-5C completes the first end-to-end Agent-neutral plugin access path:

```text
External Agent OAuth Access
        ↓
current delegated authority
        ↓
current effective Capability Operations
        ↓
MCP tools/list
        ↓
MCP tools/call
        ↓
ACTION_HOST
        ↓
owning plugin
```

No plugin adds an MCP-specific business implementation.

## 2. Identity model during execution

The Host preserves two different identities:

```text
principal
= current authorizing Human

delegatedActor
= External Agent + Client + Grant
```

Request context now supports:

```text
delegatedActor:
  kind: EXTERNAL_AGENT
  agentId
  clientId
  grantId
```

This is intentional.

The Human remains the authority source whose current permission is checked.

The External Agent remains the actor through which that bounded authority is exercised.

Therefore:

```text
Human Principal ≠ External Agent actor
```

and External Agent is not represented as Personal Agent / generic AI.

## 3. ActionHost exposure semantics

Ordinary request contexts derive exposure from Principal actor type:

```text
HUMAN → HUMAN
AI → PERSONAL_AGENT
AUTOMATION/SERVICE → AUTOMATION
```

A request context carrying:

```text
delegatedActor.kind = EXTERNAL_AGENT
```

uses:

```text
EXTERNAL_AGENT
```

for Capability Operation exposure eligibility.

Authorization still evaluates the Human Principal and Host-resolved Context.

This gives the required intersection:

```text
Human current authorization
∩ External Agent exposure
∩ delegated Grant
∩ token operation ceiling
=
callable MCP tool
```

## 4. Delegated resolver returns current request context

EA-3B2 now returns the current Host-built Human request context together with the effective delegated catalog/resolution.

That context is reconstructed from current:

- identity.user-directory;
- Enterprise Context directory;
- Enterprise Context membership/grants;
- authorization policy;
- plugin lifecycle.

MCP does not reconstruct Context from caller-supplied ids.

## 5. tools/list

The MCP projection calls the current delegated catalog every time.

It then intersects with the Access Token operation ceiling.

Only effects:

```text
READ
PLAN
```

are projected.

WRITE remains absent even when:

- plugin declares WRITE;
- Human can WRITE;
- Grant contains WRITE;
- token operationIds contain WRITE.

MCP WRITE is a later governed slice.

Tool metadata comes from the bounded public Capability Operation projection:

- operationId → MCP tool name;
- title;
- description;
- inputSchema;
- outputSchema.

It does not expose:

- ACTION_HOST commandCode;
- policy action/resource internals;
- Provider ids;
- Grant details;
- Human subject id;
- plugin source paths.

## 6. tools/call

A tool call does not trust a previously returned tools/list result.

For every call:

```text
tool name
→ resolveEffectiveDelegatedCapabilityOperationV010
→ current Human/Context/policy/plugin/Grant check
→ token operation ceiling
→ READ/PLAN check
→ ACTION_HOST binding
→ AppActionRouter.execute()
```

Therefore cached tools become unusable immediately when authority changes.

Examples:

- Human disabled;
- enterprise membership removed;
- policy DENY;
- Grant revoked/expired;
- Agent/Client revoked;
- Feature disabled;
- operation removed;
- token ceiling excludes the operation.

## 7. Host Action request

The projection translates a valid MCP tool call into:

```text
AppActionRequestV010
```

using the plugin-owned Capability Operation binding.

MCP arguments become Action values.

The Host assigns:

```text
sourceInteractionId = mcp:<correlationId>
actionId = <operationId>
```

The request context carries:

- current Human Principal;
- Host-resolved Context;
- External Agent delegated actor;
- correlation id.

The ordinary ActionRouter and Capability Operation pre-execution governance still run.

MCP never invokes the plugin service directly.

## 8. Double authorization is intentional

The delegated resolver authorizes before ActionHost execution.

ActionHost then re-runs ordinary Capability Operation authorization.

This protects against a race such as:

```text
delegated resolution ALLOW
→ policy changes
→ ActionHost check DENY
```

The second check is not redundant authority duplication; it is a final execution-boundary revalidation.

## 9. Bounded external errors

A guessed, removed, revoked or unauthorized operation returns the same bounded MCP tool result:

```text
MCP_TOOL_NOT_AVAILABLE
```

The caller is not told whether:

- the operation exists;
- the Grant omitted it;
- policy denied it;
- the Feature is inactive;
- membership disappeared.

ActionHost execution failures are similarly projected as:

```text
MCP_TOOL_EXECUTION_FAILED
```

Internal policy-provider or routing details are not exposed.

## 10. Token operationIds are an upper bound

The token records the operations available when it was issued.

EA-5C treats that set only as a ceiling.

Current delegated authority may shrink below the token.

It may not expand beyond the token merely because the Human or Grant later gains new operations.

A new/rotated credential is required for newly delegated operations to enter the token ceiling.

## 11. First real tools

The first production-reference plugin operations are Ledger Runtime Configurator reads:

```text
ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
```

They already use bounded semantic description + digest-bound pagination.

These are the first EA-001 MCP tools.

## 12. WRITE remains closed

EA-5C MUST NOT expose WRITE operations.

Future WRITE requires an additional slice covering:

- explicit approval policy;
- Host idempotency;
- durable Action Receipt;
- external Agent actor audit;
- indeterminate-write recovery;
- readback verification;
- selected reversible reference vertical.

The existing Capability Operation WRITE declaration is only a prerequisite.

## 13. Machine acceptance

EA-5C proves:

1. current delegated READ/PLAN operations become MCP tools;
2. WRITE does not;
3. tool names use stable operationId;
4. public metadata does not leak Host binding;
5. call re-resolves current delegated authority;
6. cached tool fails after policy revocation;
7. guessed operation gets bounded not-available result;
8. token operationIds remain an upper bound;
9. Host Action receives Human Principal;
10. Host Action separately receives External Agent/Client/Grant actor evidence;
11. Host-resolved Enterprise Context reaches the Action;
12. ActionRouter pre-execution governance still runs;
13. plugin handler is invoked only after all checks;
14. Host authorization details are not leaked in MCP results.

## 14. Next

After EA-5C is merged:

```text
production-like reference bootstrap
→ register External Agent + MCP Client
→ create explicit READ Grant
→ issue OAuth credential
→ enable protected MCP in controlled environment
→ EA-001 through Generic MCP
→ ChatGPT Product Adapter / connector proof
→ second mature Agent portability proof
```

Production Railway remains disabled until real Human OIDC login is browser-proven.
