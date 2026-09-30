# Authorized Capability Operation Catalog — EA-2C v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent:** EA-2A Capability Operation Contract + EA-2B Ledger reference operations  
**External Agent delegated access:** NOT YET ENABLED

## 1. Purpose

EA-2A answers:

> Which operations are currently effective because their owning Features are active?

EA-2C answers the next question:

> Which of those operations may this current Principal, in this Host-resolved scope/context, actually discover and invoke?

The canonical chain becomes:

~~~text
installed Package
∩ active Feature
∩ Capability Operation
∩ consumer exposure eligibility
∩ data-scope compatibility
∩ authorization.check
=
authorized operation
~~~

For EXTERNAL_AGENT, one more term is intentionally still missing:

~~~text
∩ delegated External Agent Authority Grant
~~~

Therefore external Agent discovery remains closed in EA-2C.

## 2. New operation metadata

Each Capability Operation now declares two additional semantic controls.

### dataScope

~~~text
SYSTEM
INSTALLATION
ENTERPRISE
COMPANY
WORKSPACE
USER
~~~

This means:

> At which platform data-ownership scope does this operation's underlying data live?

It is not a UI route and is not permission by itself.

Examples:

~~~text
installation-wide Ledger configuration baseline
→ INSTALLATION

enterprise-specific Business Definition
→ ENTERPRISE

user-owned Personal Context item
→ USER
~~~

### authorization

~~~text
authorization:
  action: <stable policy action>
  resource:
    type: <stable resource type>
    idSource:
      NONE
      DATA_SCOPE
      INPUT
    inputKey?: <required only for INPUT>
~~~

Example:

~~~text
action:
ledger.runtime.configuration.read

resource type:
ledger.runtime.configuration

idSource:
NONE
~~~

## 3. dataScope is not caller authority

A caller never acquires scope by supplying an id.

Host resolves Principal and Context first.

Authorization uses:

~~~text
Host-resolved Principal
+
Host-resolved scope
+
operation authorization action
+
operation resource semantics
+
Host-resolved context metadata
~~~

Caller values remain selectors only.

This preserves the existing rule:

> Enterprise Context is Host-resolved; caller-provided ids do not manufacture membership.

## 4. Resource id sources

### NONE

The authorization resource is identified by type only.

Appropriate for resources such as an installation-wide configuration.

### DATA_SCOPE

Resource id is derived from the Host-resolved data scope.

Examples:

~~~text
ENTERPRISE → enterpriseId
COMPANY    → companyId
WORKSPACE  → workspaceId
USER       → userId
~~~

SYSTEM and INSTALLATION do not have a request-scoped id and therefore cannot use DATA_SCOPE in v0.1.

### INPUT

The concrete resource id comes from one declared operation input field.

Example:

~~~text
resource:
  type: sales.order
  idSource: INPUT
  inputKey: orderId
~~~

During discovery the concrete id may not yet exist, so policy can only make a coarse action/resource-type decision.

Invocation MUST re-run authorization with the actual resource id.

## 5. Discovery and invocation are both protected

Hiding an operation from discovery is not sufficient.

A caller may already know or guess:

~~~text
operationId
commandCode
~~~

EA-2C therefore protects both paths.

### Discovery

~~~text
effective operations
→ exposure filter
→ data-scope check
→ authorization.check
→ authorized catalog
~~~

### Invocation

~~~text
Host Action request
→ Feature active?
→ Capability Operation binding?
→ input version?
→ actor exposure eligibility?
→ data-scope check
→ authorization.check
→ handler execution
~~~

Direct guessed invocation cannot bypass authorization.

## 6. ActionRouter pre-execution governance hook

ActionRouter now accepts an optional pre-execution Host governance hook.

The generic router remains unaware of Ledger, MCP, ChatGPT or policy rules.

The Capability Operation access controller supplies the hook.

Existing ordinary Actions remain unchanged when they are not bound by an effective Capability Operation.

This keeps dependency direction:

~~~text
ActionRouter
= generic execution router

Capability Operation Access Controller
= platform governance

Plugin handler
= domain execution
~~~

## 7. Effective binding uniqueness

EA-2A already requires active operationId uniqueness.

EA-2C additionally requires active ACTION_HOST command binding uniqueness.

Forbidden:

~~~text
operation A
→ shared.command

operation B
→ shared.command
~~~

while both Features are active.

Host fails closed with:

~~~text
CAPABILITY_OPERATION_BINDING_CONFLICT
~~~

The platform never chooses a business meaning by install order.

## 8. Authorized catalog

Internal API:

~~~text
listAuthorizedCapabilityOperationsV010
~~~

Inputs:

- App Manager;
- Authorization Provider;
- Host-resolved request context;
- requested consumer audience;
- optional Capability filter.

Output contains:

- allowed operations;
- internal evaluation evidence.

Protocol adapters must project only approved public metadata and must not expose internal Host bindings or authorization implementation metadata.

## 9. Public metadata projection

EA-2C introduces a bounded public projection helper.

Public capability metadata includes:

- operationId;
- Capability;
- operation version;
- title;
- description;
- effect;
- dataScope;
- input schema;
- output schema.

It intentionally omits:

- ACTION_HOST commandCode;
- authorization implementation details;
- policy provider details;
- Host routing internals.

External protocols consume the public semantic contract, not internal execution wiring.

## 10. External Agent remains closed

Even when:

- operation exposure contains EXTERNAL_AGENT;
- current Human Principal is allowed by authorization.check;

EA-2C returns no External Agent operations.

Reason:

~~~text
EXTERNAL_AGENT_DELEGATED_AUTHORITY_REQUIRED
~~~

This is deliberate.

Human authority is not automatically transferred to ChatGPT, Claude or any other external client.

EA-3 must add:

~~~text
External Agent Identity
+
Client identity
+
Delegated Authority Grant
+
attenuation
+
revocation
~~~

before EXTERNAL_AGENT discovery can become non-empty.

## 11. Actor-class exposure on direct Host Actions

For direct Host Action invocation, actor classes map to exposure eligibility:

~~~text
HUMAN
→ HUMAN

AI
→ PERSONAL_AGENT

AUTOMATION / SERVICE
→ AUTOMATION
~~~

External Agent is intentionally not inferred from actor type.

It requires the separate external Agent/client/delegation model.

This prevents a generic AI actor label from silently gaining external delegated authority.

## 12. Authorization Provider failure

Fail-closed rules:

~~~text
missing Authorization Provider
→ deny

Authorization Provider throws
→ deny

required data scope unavailable
→ deny

required INPUT resource id unavailable at invocation
→ deny
~~~

No protocol adapter may upgrade these outcomes to allow.

## 13. Ledger reference semantics

The current Ledger Runtime Configurator operations declare:

~~~text
dataScope:
INSTALLATION

authorization action:
ledger.runtime.configuration.read

resource type:
ledger.runtime.configuration

resource id source:
NONE
~~~

This accurately reflects the current implementation.

It does NOT yet claim that each Enterprise Context owns a separate Ledger template.

That enterprise-specific binding is a later domain capability.

Until then, an Agent must distinguish:

~~~text
installation Ledger configuration
≠ enterprise-selected/effective Ledger template
~~~

This distinction is important for EA-001 correctness.

## 14. Enterprise Ledger template binding gap

The original EA-001 question is enterprise-oriented:

> What Ledger Runtime template is this enterprise using?

The current Configurator can answer:

> What Ledger Runtime configuration is installed/current at this App Host?

To answer the enterprise-specific question correctly, a later Ledger/domain slice must make one of these semantics explicit:

~~~text
Enterprise Context
→ explicit Ledger Template binding

or

Enterprise Context
→ inherits installation default Ledger Template
~~~

The inheritance/binding must be queryable and auditable.

Do not infer it from deployment variables or hidden Host knowledge in an External Agent adapter.

## 15. Conformance

EA-2C CI must prove:

1. dataScope + authorization are mandatory protocol semantics;
2. malformed authorization metadata returns validation issues rather than validator crashes;
3. INPUT resource id source requires inputKey;
4. SYSTEM/INSTALLATION cannot claim DATA_SCOPE resource id;
5. active command binding collisions fail closed;
6. allowed policy exposes an operation;
7. denied policy hides it;
8. missing Authorization Provider hides it;
9. unavailable Enterprise scope hides ENTERPRISE data;
10. DATA_SCOPE resource id comes from Host-resolved scope;
11. EXTERNAL_AGENT discovery remains empty without delegated authority;
12. direct Host Action invocation cannot bypass denial;
13. input-version mismatch fails before handler execution;
14. non-Capability Actions remain unaffected;
15. public metadata strips Host binding and authorization internals.

## 16. Next step

After EA-2C:

~~~text
EA-3
External Agent + Client identity
+ delegated Authority Grant
+ attenuation + revocation
        ↓
EA-4
OAuth protected-resource profile
        ↓
EA-5
Generic MCP READ/PLAN projection
        ↓
EA-001
External Agent reads the effective Ledger configuration/template semantics
~~~

The production Human OIDC live-login proof remains a required gate before real Human-delegated external access is opened.
