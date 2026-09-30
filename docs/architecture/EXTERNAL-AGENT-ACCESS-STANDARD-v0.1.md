# EVO External Agent Access Standard v0.1

**Status:** Architecture baseline / implementation sequencing authority  
**Date:** 2026-09-30  
**Scope:** External Agent access, plugin capability exposure, identity/login dependencies, delegated authority, protocol adapters, product adapters, execution governance and conformance  
**Current runtime status:** INTERNAL FOUNDATIONS IMPLEMENTED THROUGH EA-3A / EXTERNAL NETWORK ACCESS STILL CLOSED  
**Near-term sequencing:** Close the current atomic Enterprise Context Business Definition authority gate, then make External-Agent-first platform validation the next primary foundation track  
**First target validation:** external Agent blind discovery of the current Ledger Runtime template without developer knowledge

> This document defines how EVO becomes safely usable by external Agents such as ChatGPT, Claude, customer-built Agents and future Agent platforms. It does not create a ChatGPT-specific EVO. Product-specific adapters are allowed only as convenience/integration layers over one stable EVO authority and capability model.

## 1. Product objective

EVO is a plugin platform. External Agent access must therefore expose the effective capabilities of installed and active plugins rather than a fixed central API catalog.

Long-term product expectation:

```text
Human
  │
  ├── EVO Personal Agent
  ├── ChatGPT
  ├── Claude
  ├── Customer Agent
  └── Future Agent
          │
          ▼
   standard authentication
   + explicit authorization
          │
          ▼
      EVO Agent Access
          │
          ▼
 authorized effective
 plugin capabilities
```

The core product principle is:

> An external Agent with no EVO implementation knowledge MUST be able to discover, understand and invoke its authorized enterprise capabilities through standard protocols and governed semantic contracts.

Developer knowledge is neither required nor privileged.

## 2. What this standard is — and is not

This standard is an EVO interoperability and governance profile.

It defines:

- identity relationships;
- delegated authority;
- plugin capability publication;
- capability discovery;
- invocation semantics;
- protocol projection;
- product adapters;
- lifecycle visibility;
- approval;
- receipts/audit;
- versioning;
- conformance;
- implementation order.

It is NOT a new replacement for MCP, OpenAPI, OAuth, OIDC or A2A.

Canonical direction:

```text
world standards
    │
    ├── OAuth / OIDC
    ├── MCP
    ├── OpenAPI
    └── A2A
          │
          ▼
EVO semantic + governance profile
          │
          ▼
Principal
Agent Identity
Authority Grant
Enterprise Context
Capability Operation
Authorization
Invocation
Receipt
```

## 3. Standards baseline — 2026-09-30

EVO should adopt established standards where they solve the interoperability problem and define EVO semantics only where enterprise runtime meaning is required.

Current baseline:

| Concern | Baseline |
| --- | --- |
| HTTP API description | OpenAPI 3.2.x |
| AI tool/resource interoperability | MCP 2026-07-28 |
| Agent-to-Agent task interoperability | A2A 1.0 |
| OAuth security posture | OAuth 2.0 family + RFC 9700 Security BCP |
| Human federated identity | OpenID Connect |
| Authorization Server metadata | RFC 8414 |
| Protected Resource discovery | RFC 9728 |
| Resource/audience binding | RFC 8707 |
| Fine-grained authorization requests | RFC 9396 Rich Authorization Requests |
| Sender-constrained token hardening | DPoP RFC 9449 and/or mTLS where justified |

Do not make an unpublished OAuth 2.1 draft the sole normative production security authority. Use published RFCs/BCPs and remain compatible with the OAuth 2.1 direction.

References:

- OpenAPI 3.2.1: https://spec.openapis.org/oas/v3.2.1.html
- MCP specification: https://modelcontextprotocol.io/specification/
- A2A specification: https://a2a-protocol.org/latest/specification/
- RFC 9700: https://www.rfc-editor.org/rfc/rfc9700.html
- RFC 9728: https://www.rfc-editor.org/rfc/rfc9728.html
- RFC 8707: https://www.rfc-editor.org/rfc/rfc8707.html
- RFC 9396: https://www.rfc-editor.org/rfc/rfc9396.html
- RFC 9449: https://www.rfc-editor.org/rfc/rfc9449.html

## 4. Fundamental actor model

External Agent access must distinguish:

```text
Principal
≠ Agent Identity
≠ Client Application
≠ Enterprise Context
≠ Authority Grant
```

### Principal

The Human or workload that ultimately owns the authority.

Examples:

```text
human:wang
workload:procurement-optimizer-prod
```

### Agent Identity

The Agent actor making or participating in a request.

Examples:

```text
agent:chatgpt:<id>
agent:claude:<id>
agent:customer-procurement:<id>
```

### Client Application

The concrete external software/runtime connection.

Examples:

```text
client:chatgpt
client:claude-desktop
client:customer-agent-gateway
```

### Enterprise Context

The governed enterprise context in which the capability is being used.

### Authority Grant

The server-side record that states what authority has been delegated to an Agent/client combination and under what constraints.

Audit should therefore be able to answer:

```text
Which Principal?
Which Agent?
Which Client?
Which Enterprise Context?
Which Grant?
Which Capability?
Which result?
```

## 5. External Agent is not Personal Agent

The existing Person-first product ontology remains unchanged.

```text
Human
  └── Personal Agent
```

The Personal Agent is EVO's product Agent serving the Human over time.

An External Agent is an authenticated and authorized external caller.

```text
Personal Agent
= EVO product actor

External Agent
= external delegated actor
```

An external Agent does not become the Personal Agent merely because it is trusted or frequently used.

## 6. One semantic capability, many projections

The central interoperability rule is:

> ONE SEMANTIC CAPABILITY — MANY EXTERNAL PROJECTIONS.

Example:

```text
ledger.runtime.describe
        │
        ├── compile/project → MCP Tool
        ├── compile/project → OpenAPI operation
        ├── compile/project → future A2A Skill
        ├── expose          → Personal Agent Tool
        └── bind            → Human/Eidos Action where useful
```

Do not create:

```text
chatgpt.ledger.runtime.describe
claude.ledger.runtime.describe
gemini.ledger.runtime.describe
```

Product-specific convenience is allowed.

Product-specific business semantics are forbidden.

## 7. Plugin-first capability ownership

EVO is a plugin platform. Therefore the plugin that owns a business/platform capability must also own the semantic operation definition required to expose that capability.

The Host must not invent plugin business meaning.

Current Package model remains:

```text
Package
  ↓
Feature
  ↓
provides Capability
  ↓
Contribution
```

A Feature's current `providesCapabilities` remains the dependency/availability declaration.

That is not sufficient by itself to describe a callable operation.

The standard now uses the implemented generic callable Contribution:

```text
platform.capability-operation
```

EA-2A froze its portable Plugin Protocol contract; EA-2C added mandatory
data-scope and authorization semantics plus authorization-aware discovery and
direct invocation enforcement.

Authorities:

- `PLATFORM-CAPABILITY-OPERATION-EA2A-v0.1.md`
- `AUTHORIZED-CAPABILITY-OPERATION-CATALOG-EA2C-v0.1.md`

## 8. Capability Operation Descriptor

A future Capability Operation Descriptor should be Agent-neutral and client-neutral.

Conceptual shape:

```text
CapabilityOperationDescriptor

operationId
contractVersion
capabilityId
operationVersion

title
description

effect:
  READ | PLAN | WRITE

inputSchema
outputSchema

ownerPackageId
ownerFeatureId

executionBinding
preconditions

authorizationProfile
approvalProfile
idempotencyProfile

resourceSemantics
evidenceSemantics
helpRef?

exposurePolicy:
  HUMAN
  PERSONAL_AGENT
  EXTERNAL_AGENT
  AUTOMATION
```

This is an architecture contract shape, not a frozen JSON schema.

### Dependency Capability vs Callable Operation

Important distinction:

```text
providesCapabilities
= "this active Feature supplies capability X"

Capability Operation
= "this is a stable callable operation exposed by capability X"
```

One capability may expose multiple operations.

Example:

```text
capability: ledger.runtime

operations:
  ledger.runtime.describe
  ledger.runtime.template.read
  ledger.balance.read
  ledger.runtime.replay.plan
```

## 9. Plugin responsibilities

A plugin that exposes an operation is responsible for:

- stable operation identity;
- business meaning;
- input/output semantic schema;
- effect classification;
- execution binding;
- domain validation;
- source-of-truth ownership;
- domain-specific errors;
- Help/documentation for introduced semantics;
- compatibility/versioning of the operation;
- its own plugin CI.

A plugin MUST NOT:

- issue its own External Agent bearer credentials;
- self-authorize callers;
- bypass Host lifecycle;
- bypass Host Context resolution;
- expose secret plaintext;
- invent ChatGPT-only business operations;
- create a second WRITE path around governed Actions/Commands;
- publish operations while its owning Feature is inactive.

## 10. App Platform / Host responsibilities

The Host owns the control plane.

It must eventually provide:

- Package/Feature lifecycle resolution;
- effective Capability Registry;
- effective Capability Operation Registry;
- Identity/Session resolution;
- Principal resolution;
- Enterprise Context resolution;
- External Agent registration/trust;
- Authority Grant resolution;
- `authorization.check`;
- capability visibility filtering;
- protocol adapters;
- product adapters;
- invocation dispatch;
- approval routing;
- receipt/audit;
- rate/abuse controls;
- version negotiation;
- observability.

The Host may hide or further restrict a plugin operation.

The Host MUST NOT upgrade a plugin/authorization DENY into ALLOW.

## 11. Effective Capability calculation

External Agent availability is not equal to installation.

Target derivation:

```text
installed Package
∩ active Feature
∩ contributed callable operation
∩ current Principal
∩ granted Enterprise Context
∩ Agent Authority Grant
∩ Host policy
∩ operation exposure policy
∩ current runtime availability
=
effective externally visible capability operation
```

Therefore:

```text
installed
≠ active
≠ discoverable
≠ authorized
≠ executable
```

These states must remain distinguishable.

## 12. Capability visibility follows authority

Discovery is part of the security model.

An Agent should not receive the complete platform operation catalog and then rely only on execution-time denial.

Canonical rule:

> Capability visibility follows effective authority.

Conceptual levels:

```text
Unauthenticated discovery
→ platform/protocol metadata only

Authenticated discovery
→ caller identity established

Authorized discovery
→ only operations currently visible under Principal + Context + Grant
```

Direct invocation of a hidden operation must still fail authorization.

Visibility is defense-in-depth, not the sole authorization control.

## 13. Adapter architecture

External Agent integration has three layers:

```text
EVO Agent Access Core
        ↓
Protocol Adapter
        ↓
Product Adapter
```

### Agent Access Core

Stable EVO semantics:

- Principal;
- Agent Identity;
- Client;
- Context;
- Authority Grant;
- capability discovery;
- authorization;
- invocation;
- approval;
- receipt/audit.

### Protocol Adapters

Examples:

- MCP;
- HTTP/OpenAPI;
- A2A;
- future standard protocols.

Protocol adapters translate EVO semantic operations into wire protocol concepts.

### Product Adapters

Examples:

- ChatGPT Adapter;
- Claude Adapter;
- Gemini Adapter;
- Copilot Adapter;
- customer-specific Agent Adapter.

Product adapters reduce setup/integration friction.

They may implement product-specific:

- registration metadata;
- discovery conventions;
- connector packaging;
- authentication handshake compatibility;
- schema/message adaptation;
- product-specific diagnostics;
- product-specific setup UX.

They MUST NOT own:

- enterprise authorization;
- business rules;
- capability truth;
- approval decisions;
- Command execution;
- Enterprise Context truth;
- EC knowledge truth.

Canonical invariant:

```text
Adapter ≠ Authority
Adapter ≠ Business Logic
Adapter ≠ Source of Truth
```

## 14. Generic adapter first

The first protocol implementation should be generic.

Recommended order:

```text
Generic MCP
        ↓
ChatGPT Adapter convenience
        ↓
Claude Adapter convenience
```

The second product adapter is an architecture test.

If adding Claude requires changing business capability semantics created for ChatGPT, the abstraction has leaked.

## 15. Authentication, authorization and delegation are separate

Do not collapse:

```text
Authentication
Authorization
Delegation
Enterprise membership
```

### Authentication

Answers:

> Who is this Human/workload/client?

Current foundation:

- `identity.session`;
- `IdentitySessionProviderV010`;
- Host static session Provider for development/reference.

### Enterprise membership/context grant

Answers:

> Which Enterprise Context may this Principal receive?

Current foundation:

- `EnterpriseContextGrantProviderV010`;
- `enterprise.membership`.

### Authorization

Answers:

> May this Principal perform this platform/domain action now?

Current foundation:

- generic `authorization.check` Provider.

### Delegation / External Agent Authority Grant

Answers:

> What subset of the Principal's authority has been delegated to this external Agent/client?

This is a new layer.

It MUST NOT be conflated with Enterprise Context membership.

## 16. Authority Grant

EA-3A now implements the minimum durable registration/client/delegation
contracts. Authority:

`docs/architecture/EXTERNAL-AGENT-DELEGATED-AUTHORITY-EA3A-v0.1.md`

Current durable objects are:

```text
ExternalAgentRegistrationV010
ExternalAgentClientRegistrationV010
ExternalAgentAuthorityGrantV010
```

The broader target remains extensible for later policy/approval/resource
constraints.

Target conceptual object:

```text
ExternalAgentAuthorityGrant

grantId

subjectAgentId
clientId
authorizingPrincipalId

enterpriseContextId

allowedOperations
resourceConstraints
effectConstraints
conditions

approvalPolicy

validFrom
validUntil
status

delegationAllowed
delegationConstraints

createdBy
revokedBy
provenance
```

The exact storage/schema is deferred until the implementation slice.

### Authority attenuation

Permanent invariant:

```text
Effective External Agent Authority
⊆
Authorizing Principal Authority
```

Delegation can attenuate authority; it cannot expand it.

If sub-delegation is ever introduced:

```text
Human authority
    ⊇ Agent A grant
          ⊇ Agent B sub-grant
```

No downstream delegation may regain removed authority.

### EA-3A executable attenuation

EA-3A grant creation currently permits only operations that are simultaneously:

```text
active
+ HUMAN eligible
+ currently allowed to the authorizing Human
+ EXTERNAL_AGENT eligible
+ explicitly requested
```

WRITE delegation remains blocked in EA-3A.

Every Grant has an explicit `validUntil`, is bound to the Host-resolved active
Context, and becomes effectively unusable when the Agent/Client is revoked or
the Grant expires.

Grant creation-time validation is not sufficient for runtime use. EA-3B must
re-evaluate the authorizing Principal's current identity/context/authorization
on every delegated discovery/invocation decision.

## 17. Token is not the authority database

OAuth tokens are transport/security credentials and may carry bounded authorization information.

They are not the canonical EVO authorization store.

A token may reference:

- subject;
- client;
- resource/audience;
- scopes;
- grant id;
- granted authorization details.

Final execution must remain able to apply current Host authority.

This allows:

- immediate grant revocation;
- emergency disable;
- context removal;
- Feature deactivation;
- policy changes;
- account/session termination.

A still-unexpired token must not resurrect revoked platform authority.

## 18. Human login is a prerequisite for delegated Human Agent access

The current P0.6 static Session Provider proves the boundary but is not production login.

External Agent delegated authorization requires a real Human authentication path.

Therefore:

> Do not expose a production External Agent authorization endpoint before request-bound production Identity/Session is complete.

The login system remains a replaceable Provider architecture.

External Agent Access MUST NOT own login.

## 19. Login / Identity target

The next production identity foundation should provide:

- request-bound Session transport;
- secure session cookie and/or appropriate bearer session semantics;
- login;
- logout;
- session expiration;
- session revocation;
- session rotation;
- CSRF protection where browser cookies are used;
- current Principal;
- authentication assurance metadata;
- Eidos login/session Experience;
- fail-closed behavior;
- provider-independent contracts.

### First production Identity Provider

Recommended first production implementation:

```text
generic OIDC Identity Provider Package
```

Reasons:

- minimizes custom credential/password security surface;
- fits enterprise SSO;
- keeps identity replaceable;
- can support multiple external IdPs through configuration;
- is aligned with the existing Provider model.

The existing Host static Session Provider remains development/test evidence only.

A standalone local identity/password/passkey Provider may be added later as a separate Provider Package when product need justifies owning that lifecycle.

## 20. External Agent authorization server boundary

After real request-bound Human identity exists, EVO may add the external authorization boundary.

Target responsibilities:

- OAuth Authorization Server profile or an admitted replaceable Authorization Server Provider;
- client registration/recognition;
- Human consent/authorization UX;
- Resource Indicators;
- Protected Resource Metadata;
- Authorization Server Metadata;
- short-lived access tokens;
- refresh/re-authorization policy;
- revocation;
- explicit grant binding;
- fine-grained authorization request mapping;
- audit.

This boundary authenticates/authorizes external access.

It does not own business capability semantics.

## 21. External Agent registration and trust

Known Agent/client registration is not authority.

Conceptual:

```text
ExternalAgentRegistration

agentId
clientId
name
publisher
agentType
supportedProtocols
metadata
trustLevel
status
createdAt
revokedAt?
```

Possible trust levels:

```text
UNVERIFIED
REGISTERED
VERIFIED
ENTERPRISE_APPROVED
FIRST_PARTY
```

Trust means how much the platform trusts the Agent/client identity or publisher.

Authority means what that Agent/client may do.

```text
Trust ≠ Authority
```

## 22. Human-delegated and machine/workload Agents

The standard supports two different authorization patterns.

### Human-delegated Agent

Example:

```text
Human
  ↓ login
ChatGPT / Claude
  ↓ consented Grant
EVO
```

Suitable for interactive external Agents.

### Workload / enterprise Agent

Example:

```text
workload principal
  ↓ enterprise-admin governed registration/grant
procurement-optimizer.prod
  ↓ bounded machine credential
EVO
```

Suitable for long-running enterprise automation.

Do not force machine workloads through a fake Human browser session.

## 23. Protocol profile

### MCP

MCP is the preferred first AI-native interoperability protocol.

Use it for:

- tool discovery;
- tool invocation;
- resources where appropriate;
- Agent client interoperability.

MCP does not own EVO authorization semantics.

### HTTP / OpenAPI

Maintain a protocol-neutral HTTP/OpenAPI projection for:

- conventional integrations;
- customer-built Agents;
- SDK generation;
- diagnostics;
- environments that do not use MCP.

### A2A

A2A is reserved for later Agent-to-Agent task collaboration.

Do not use A2A merely to expose ordinary EVO domain operations.

```text
MCP/OpenAPI
= use EVO capabilities

A2A
= collaborate/delegate tasks between Agent systems
```

## 24. Invocation path

All external protocols converge before business execution.

```text
MCP / OpenAPI / future A2A
        ↓
Protocol Adapter
        ↓
Agent Access Core
        ↓
resolve Principal + Agent + Client + Context + Grant
        ↓
effective Capability Operation
        ↓
authorization.check
        ↓
approval policy
        ↓
Host Action / Query / governed Command boundary
        ↓
owning plugin / EVO runtime / other authoritative owner
        ↓
Receipt + Audit
```

Protocol does not create a second business execution path.

## 25. READ / PLAN / WRITE

Reuse the existing Personal Agent effect vocabulary:

```text
READ
PLAN
WRITE
```

Do not create a second effect model for external Agents.

### READ

Observational.

### PLAN

Side-effect-free planning/preflight/simulation where the owning domain supports it.

### WRITE

State-changing.

WRITE requires the strongest governance path.

Future approval/admin semantics should be modeled through authorization/approval policy rather than casually multiplying effect values.

## 26. WRITE invariant

External Agent WRITE must converge on the same governed domain write path used by the platform.

Forbidden:

```text
External Agent
→ special Agent database mutation
```

Required:

```text
External Agent
→ Capability Operation
→ authorization
→ Host Action / governed Command
→ authoritative owner
```

For EVO Runtime business writes:

```text
External Agent
→ Capability
→ Command
→ EVO Runtime
```

No second authoritative write path is created.

## 27. Approval

A Grant may permit an operation but still require Human approval under conditions.

Example:

```text
purchase.order.create
amount <= 20,000
→ execute if otherwise authorized

20,000 < amount <= 50,000
→ APPROVAL_REQUIRED

amount > 50,000
→ DENY
```

Approval belongs to EVO governance.

Do not delegate approval semantics to ChatGPT/Claude prompt behavior.

The Agent may explain the pending decision; the Host owns whether execution is permitted.

## 28. Action Receipt and audit

The existing durable Agent Action Receipt foundation should be generalized/reused rather than duplicated.

External Agent material actions should preserve:

- receipt id;
- invocation id;
- Principal;
- Agent Identity;
- Client;
- Enterprise Context;
- Authority Grant;
- operation id;
- owning Package;
- effect;
- request/input digest where appropriate;
- authorization outcome;
- approval state;
- execution outcome;
- correlation id;
- bounded business entity references;
- timestamps.

A receipt is execution evidence, not the domain source of truth.

## 29. Idempotency and retries

External Agents retry.

Network and model behavior make retries normal.

For WRITE:

- idempotency key must be Host-controlled or strongly governed;
- ambiguous prior execution must fail closed;
- an Agent retry must not duplicate a material side effect;
- protocol adapters must preserve the same idempotency semantics;
- product adapters cannot weaken retry safety.

The P1.5B receipt semantics are the reference direction.

## 30. Context and data isolation

External Agent access must use Host-resolved Context.

Caller values are selectors, never authority.

Requirements:

- unknown Enterprise Context fails closed;
- ungranted Context fails closed;
- cross-enterprise data leakage is forbidden;
- one Agent/client cannot infer another Principal's Context catalog without authority;
- browser/client-provided context ids cannot manufacture access;
- field/resource filtering may further reduce a permitted operation result.

## 31. Secrets

External Agent adapters and plugin capability descriptors MUST NOT expose stored Secret plaintext.

Secret resolution remains behind the Host `secrets.resolve` Provider boundary.

Examples of forbidden exposure:

- API keys in MCP tool descriptors;
- bearer credentials in OpenAPI examples;
- secrets in Agent observations;
- secrets embedded in Package manifests;
- secrets in receipts/audit.

## 32. Sensitive data and least disclosure

Capability-level authorization may still be too broad for some data.

The architecture must allow future:

- resource-level constraints;
- row/object constraints;
- field-level redaction;
- purpose constraints;
- time bounds;
- result-size limits;
- export restrictions.

Do not assume `customer.read` means unrestricted export of every customer field.

## 33. Rate, cost and abuse governance

External Agents can operate at machine speed.

Agent Access Core should eventually support:

- per-client rate limits;
- per-Agent rate limits;
- per-Principal limits;
- per-enterprise limits;
- concurrency limits;
- result-size limits;
- expensive-operation budgets;
- LLM/remote-operation cost visibility where relevant;
- abuse/anomaly signals;
- emergency kill switch.

These are Host controls, not plugin-specific reinventions.

## 34. Observability

The Host should eventually distinguish:

```text
authentication failure
authorization denial
capability hidden
capability unavailable
approval pending
plugin inactive
domain validation failure
runtime failure
rate limit
adapter/protocol failure
```

Do not collapse all of these into generic HTTP 500 or "tool failed".

Correlation should connect:

```text
external request
→ Agent/client
→ Grant
→ capability invocation
→ Action/Command
→ Receipt
→ domain result
```

## 35. Contract versioning

Capability operation contracts are long-lived public contracts.

They need:

- stable operation ids;
- explicit versions;
- compatible additive evolution;
- explicit incompatible version transition;
- deprecation metadata;
- deterministic discovery;
- adapter compatibility tests.

A Product Adapter must not silently change operation semantics to accommodate one external Agent.

## 36. Lifecycle semantics

Because EVO is plugin-first:

```text
Package uninstall
or Feature deactivate
        ↓
operation no longer effective
        ↓
external discovery updates
        ↓
direct invocation fails closed
```

External Agent Access MUST NOT keep "ghost APIs" for inactive Features.

A Grant referring to a no-longer-effective operation remains non-executable.

Reactivation may restore eligibility subject to current authorization and compatibility.

## 37. Help and semantic self-description

External Agent integration depends on high-quality machine-readable semantics.

Each exposed operation should eventually have:

- concise title;
- description;
- business consequences;
- input descriptions;
- output descriptions;
- error semantics;
- effect;
- approval behavior;
- examples where safe;
- Help reference.

Human Help and Agent Help should derive from the same canonical plugin-owned meaning where possible.

Do not make chat history the only place that explains a public capability.

## 38. First real conformance use case

### EA-001 — Blind Enterprise Discovery

Initial information available to External Agent:

```text
EVO base URL
+
normal authorization opportunity
```

Forbidden prior knowledge:

- GitHub;
- source code;
- database;
- private internal endpoints;
- hard-coded EVO implementation paths.

Human question:

> Tell me the current Ledger Runtime template content for this enterprise.

Expected flow:

```text
discover protected resource
→ authenticate/authorize
→ resolve Enterprise Context
→ discover effective capability operations
→ find ledger.runtime.describe / equivalent
→ retrieve current effective template
→ interpret documented business semantics
→ answer Human
```

PASS requires no developer path.

## 39. Additional conformance cases

### EA-002 — Plugin Lifecycle Visibility

Deactivate owning Feature.

Expected:

- operation disappears from authorized discovery;
- direct invocation fails closed.

### EA-003 — Authority Attenuation

Agent receives a strict subset of Human authority.

Expected:

- Agent cannot expand itself.

### EA-004 — Hidden Capability Direct Invocation

Agent attempts a known but unauthorized operation id.

Expected:

- fail closed even if the Agent guessed the name.

### EA-005 — Enterprise Context Isolation

Use valid Agent/client with an ungranted Context id.

Expected:

- fail closed;
- no information leakage.

### EA-006 — WRITE Convergence

External Agent performs permitted WRITE.

Expected:

- same governed Action/Command path as other clients;
- no special Agent mutation path.

### EA-007 — Durable Receipt

Material WRITE returns durable execution evidence scoped to Principal/Context/Agent.

### EA-008 — Grant Revocation

Revoke Grant while a transport credential remains otherwise unexpired.

Expected:

- later invocation is denied.

### EA-009 — Adapter Parity

Invoke same READ capability through Generic MCP and ChatGPT Adapter.

Expected:

- equivalent EVO business semantics.

### EA-010 — Second Product Adapter

Add Claude Adapter.

Expected:

- no change to plugin business operation definition.

### EA-011 — No Developer Knowledge

A fresh external Agent can use authorized capabilities without source/repository knowledge.

### EA-012 — Model Independence

Changing the external Agent's model/vendor does not change EVO authorization truth.

## 40. Development sequencing

External Agent Access becomes the next primary platform-validation track after the current atomic Enterprise Context Business Definition authority gate is safely closed.

This is a strategic sequencing change:

- do not continue EOG upper-layer feature expansion after that atomic gate merely because EOG has more possible product scope;
- preserve existing EOG/SOP/Observatory assets and boundaries;
- pause major Personal Agent feature expansion while External Agent access validates plugin contracts independently;
- keep Personal Agent regression/security/compatibility work active;
- return to Personal Agent after the shared plugin capability boundary has been proven by mature external clients.

Authority for this sequencing decision:

`docs/roadmap/EXTERNAL-AGENT-FIRST-PLATFORM-VALIDATION.md`

The implementation sequence should be:

### Phase EA-0 — Standard freeze — NOW

Documentation and sequencing authority.

Freeze:

- actor model;
- plugin capability-operation model;
- Adapter layering;
- authority principles;
- login dependency;
- conformance tests;
- protocol direction.

No public External Agent endpoint.

### Phase EA-0.5 — Close current atomic definition-authority gate

Finish only the in-flight Enterprise Context Business Definition authority convergence needed to avoid leaving a split source of truth.

Then freeze new EOG upper-layer expansion while the External Agent foundation is built.

### Phase EA-1 — Production Human Identity / Login

Implement request-bound production identity before public delegated access.

Deliver:

- generic request-bound Session contract usage;
- login/logout;
- secure session transport;
- session expiration/revocation/rotation;
- Eidos login Experience;
- generic OIDC Identity Provider Package as first production provider;
- retain static Session Provider for tests/dev only.

Acceptance:

```text
browser/request identity cannot be forged by request values
session is revocable
Principal is observable
login/logout is Human-usable
authorization receives authoritative Principal
```

### Phase EA-2 — Generic Capability Operation Contract + Registry

Freeze and implement the callable operation Contribution/schema.

Deliver:

- `platform.capability-operation` or final equivalent;
- semantic validator;
- effective operation registry;
- lifecycle filtering;
- operation versioning;
- READ/PLAN/WRITE;
- input/output schemas;
- execution binding.

This phase remains internal/no public external invocation until authorization is ready.

### Phase EA-3 — External Agent Identity + Delegation Grants

#### EA-3A — durable governance facts — implemented internally

Delivered:

- External Agent registration;
- External Agent Client registration;
- trust metadata with Human-created registrations defaulting to REGISTERED;
- durable ExternalAgentAuthorityGrant;
- explicit validity windows;
- revocation;
- creation-time attenuation checks;
- append-only governance events;
- effective Agent/Client/Grant status.

No public network endpoint is opened.

#### EA-3B1 — current Human identity directory — implemented foundation

Authority:

`docs/architecture/HOST-IDENTITY-USER-DIRECTORY-EA3B1-v0.1.md`

EA-3B1 provides:

```text
identity.user-directory
```

so delegated authority can reconstruct the current authorizing Human Principal
without requiring a live browser Session or persisting an old OIDC token.

Authentication ordering is:

```text
identity.authenticate
→ identity.user-directory record/refresh
→ managed Session issuance
```

A Human directory entry in `DISABLED` state cannot self-reactivate through a
later successful login.

#### EA-3B — current-authority delegation resolution — next

Must add:

- current authorizing Principal identity/status resolution without requiring a live browser Session;
- current Enterprise Context membership/grant resolution;
- current Capability Operation lifecycle/policy intersection;
- effective delegated catalog/invocation checks.

Reuse `authorization.check`; do not replace it.

Human grant-management Experience may be added when the OAuth consent/product
flow needs it; EA-3A does not add speculative UI.

### Phase EA-4 — OAuth Protected Resource / Authorization Profile

Deliver:

- Protected Resource Metadata;
- Authorization Server Metadata;
- resource/audience binding;
- authorization-code + PKCE for interactive public clients;
- short-lived access tokens;
- grant binding;
- revocation;
- scopes;
- RAR mapping where fine-grained requests are required.

No business operations are made public until this layer passes security acceptance.

### Phase EA-5 — Generic MCP READ/PLAN Adapter

Deliver:

- MCP Server projection from effective Capability Operations;
- authorization-aware discovery;
- generic tool schema projection;
- READ first;
- PLAN where side-effect free;
- no broad WRITE yet.

First real vertical:

```text
ledger.runtime.describe
and/or
ledger.runtime.template.read
```

Run EA-001 against production-like EVO without GitHub/source knowledge.

### Phase EA-6 — ChatGPT Product Adapter

Build only the product-specific convenience needed to make ChatGPT connection simple.

It reuses:

- same OAuth profile;
- same MCP adapter where supported;
- same Capability Registry;
- same Grant;
- same invocation path.

Run EA-001 through ChatGPT.

### Phase EA-7 — Claude Product Adapter

Use Claude as the second product adapter portability test.

Any ChatGPT-specific semantics found in Core must be removed/refactored.

### Phase EA-8 — Governed WRITE + Approval

After READ/PLAN is production-proven:

- expose selected WRITE operations;
- enforce authorization;
- approval gates;
- durable receipts;
- idempotency;
- indeterminate-write safety;
- entity references/readback verification.

Start with a low-risk, reversible vertical.

Do not begin with payment or broad financial administration.

### Phase EA-9 — Workload / Machine Agent Access

Add non-Human workload/service Principal patterns:

- machine credentials;
- enterprise-admin governed grants;
- rotation/revocation;
- no fake Human session.

### Phase EA-10 — A2A

Only after there is a real Agent-to-Agent task collaboration use case.

Do not introduce A2A as a duplicate tool-call mechanism.

## 41. Why login precedes public External Agent access

Human delegated Agent authorization requires a trustworthy answer to:

> Who is authorizing this Agent?

The existing static Session Provider answers this only for controlled development/reference deployments.

Opening an OAuth/MCP external surface first would cause one of two bad outcomes:

1. external Agent auth becomes its own shadow identity system; or
2. development bootstrap identity accidentally becomes production authority.

Both are prohibited.

Therefore:

```text
real login/session
→ delegation
→ external authorization
→ external capability exposure
```

is the production sequence.

Capability-operation semantics may be designed before login because they are protocol-neutral and do not themselves grant access.

## 42. CI strategy

Preserve plugin CI isolation.

### App Platform CI

Tests:

- Capability Operation schema/registry;
- lifecycle filtering;
- generic authorization/delegation logic;
- protocol adapter core;
- synthetic fixture plugins.

### Plugin CI

Tests only the plugin's:

- operation descriptors;
- schemas;
- execution bindings;
- Help;
- domain behavior;
- lifecycle closure.

A plugin must not run ChatGPT/Claude integration suites as ordinary CI.

### Adapter CI

Each Product Adapter validates:

- mapping/conformance;
- auth handshake integration;
- schema compatibility;
- no semantic mutation.

### Ecosystem certification

Cross-product certification runs separately:

- Generic MCP;
- ChatGPT;
- Claude;
- selected reference plugins.

Do not make external vendors ordinary dependencies of every plugin PR.

## 43. Security acceptance before public exposure

Before the first public External Agent endpoint is considered production-ready, require evidence for:

- request-bound Human identity;
- session revocation;
- explicit Agent/client identity;
- Enterprise Context isolation;
- Grant attenuation;
- authorization on every invocation;
- hidden-capability direct-call denial;
- resource/audience-bound tokens;
- secure redirect/PKCE behavior;
- Secret non-exposure;
- rate limits;
- audit correlation;
- plugin lifecycle removal;
- revoke/kill behavior;
- no WRITE path bypass.

## 44. First implementation target

The first product target is intentionally narrow:

```text
Human logs into EVO
→ connects external Agent
→ grants READ access to one Enterprise Context
→ Agent discovers allowed Ledger capability
→ Agent asks EVO for current Ledger Runtime template
→ Agent explains it
→ no GitHub
→ no source code
→ no database
→ no private endpoint knowledge
```

This target validates:

- login;
- identity;
- delegation;
- Context;
- plugin capability publication;
- lifecycle-aware discovery;
- MCP;
- product adapter;
- READ authorization;
- business semantic self-description.

It does not require WRITE.

## 45. Current non-goals

Do not implement now solely because this standard exists:

- broad external WRITE;
- payment execution;
- autonomous enterprise administration;
- automatic Agent-to-Agent delegation;
- A2A before a real collaboration case;
- every product adapter;
- a custom EVO-only network protocol;
- a second identity system inside Agent Gateway;
- a second permission database inside MCP;
- plugin-specific OAuth servers;
- ChatGPT-specific business contracts;
- unrestricted capability catalog exposure;
- automatic EC knowledge exposure;
- Personal Context Memory exposure to external Agents.

## 46. Relationship to EC and Personal Memory

External Agent authorization does not imply intelligence/memory authorization.

Separate future capabilities may govern:

```text
EC enterprise experience query
Personal Context Memory read
Enterprise Context definitions
EVO Runtime facts
```

These MUST remain individually authorized.

An external Agent connected to Ledger Runtime does not automatically receive:

- Personal Context Memory;
- all EC enterprise knowledge;
- all Enterprise Context definitions;
- unrelated plugin capabilities.

## 47. Architectural invariants

### EAA-01 — External Agent is a distinct actor

External Agent Identity MUST remain distinguishable from the authorizing Principal and client application.

### EAA-02 — Plugin owns capability semantics

The owning plugin defines its callable business operation semantics; the Host governs exposure and execution.

### EAA-03 — One semantic operation, many projections

Product/protocol adapters MUST NOT create divergent business semantics.

### EAA-04 — Lifecycle controls exposure

Inactive/uninstalled plugin Features MUST NOT remain externally callable.

### EAA-05 — Discovery is authority-aware

Unauthorized operations SHOULD NOT be exposed through effective discovery and MUST fail closed on direct invocation.

### EAA-06 — Authentication is not authorization

Authenticated callers are not automatically allowed.

### EAA-07 — Delegation only attenuates

External Agent authority MUST NOT exceed current authorizing Principal authority.

### EAA-08 — Enterprise Context is Host-resolved

Caller-supplied context identifiers never create or authorize access.

### EAA-09 — Adapter is not authority

Protocol and Product Adapters cannot grant permission.

### EAA-10 — Protocol is not business authority

MCP/OpenAPI/A2A representation does not change EVO semantic or authorization truth.

### EAA-11 — WRITE has one governed path

External Agent WRITE MUST converge on existing governed Host Action/domain Command authority.

### EAA-12 — Material action has durable evidence

Material External Agent WRITE MUST produce durable Host-owned execution evidence.

### EAA-13 — Token is not the source of truth

Revoked/grant-ineligible authority remains denied even if a transport token has not naturally expired.

### EAA-14 — Secrets never become Agent context by default

Stored secret plaintext MUST NOT appear in discovery, prompts, observations, receipts or public schemas.

### EAA-15 — Product adapters are optional

Generic standard-protocol clients remain supported without a product-specific adapter.

### EAA-16 — No developer knowledge requirement

Public Agent use MUST NOT require repository/source/database/internal implementation knowledge.

### EAA-17 — Real login before delegated production access

Production Human-delegated External Agent access MUST NOT rely on the static/dev Session fallback.

### EAA-18 — CI remains owner-scoped

External Agent support MUST NOT collapse plugin CI isolation into whole-ecosystem CI.

## 48. Architectural summary

```text
Plugin
  │
  ├── Feature lifecycle
  │
  ├── provides Capability
  │
  └── Capability Operation Descriptor
              │
              ▼
     App Platform Capability Registry
              │
      lifecycle + Context + policy
              │
              ▼
       Effective Operation Set
              │
              ▼
        Agent Access Core
   Principal / Agent / Client / Grant
              │
              ▼
        authorization.check
              │
              ▼
     Protocol Projection Layer
     ├── MCP
     ├── OpenAPI
     └── future A2A
              │
              ▼
      Product Adapter Layer
     ├── ChatGPT
     ├── Claude
     └── future Agents
              │
              ▼
          External World
```

The platform strategy is:

> Plugins define capability semantics once. App Platform governs which operations are effective. Identity determines who is present. Delegation determines what authority is lent to an external Agent. Protocol adapters project the same semantics into open standards. Product adapters reduce integration friction without owning business truth.

That is the External Agent Access standard baseline.
