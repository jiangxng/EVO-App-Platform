# Personal Agent Tool System v0.1

**Status:** P0.2 implementation baseline  
**Date:** 2026-09-26  
**Scope:** Personal Agent Host tool discovery and execution; legacy `enterprise-agent` identifiers remain compatible

## 0. Person-first ownership

The product ontology is defined by `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`.

There is one Agent in the MVP: **Personal Agent**. Enterprise Context contributes governed data, memory and tools to the human's Personal Agent; it does not create an Enterprise Agent.

The file path and implementation symbols retain `enterprise-agent` naming temporarily for compatibility.

## 1. Decision

Enterprise Agent MUST NOT own a hard-coded list of App Platform or business tools.

The Host supplies the effective tool catalog at runtime.

```text
installed/active platform state
+ Provider state
+ Help corpus
+ future Package tool contributions
+ future Principal / Scope / authorization context
                  │
                  ▼
EnterpriseAgentHostToolCatalogV010
                  │
                  ▼
AgentToolDescriptorV010[]
                  │
                  ▼
AgentModel
                  │
                  ▼
LLM Provider tool schema
                  │
                  ▼
requested tool call
                  │
                  ▼
Host catalog invoke
                  │
                  ▼
authoritative observation
```

The Agent model may choose among tools supplied by the Host. It does not define which tools exist.

## 2. Descriptor contract

P0.2 uses:

```text
AgentToolDescriptorV010
├─ id
├─ modelName
├─ title
├─ description
├─ inputSchema
├─ effect: READ | PLAN | WRITE
├─ ownerPackageId
└─ capability?
```

### Stable id

The stable tool id is a platform/plugin machine identifier such as:

```text
help.search
provider.health.get
app.install.plan
```

It is never translated.

### modelName

`modelName` is the LLM-provider-safe function/tool identifier.

The Provider adapter receives only the model names from the effective Host catalog and maps a returned model tool call back to the stable tool id.

The mapping is created from the effective catalog for that turn; there is no global hard-coded model-name map inside Enterprise Agent.

### effect

`effect` is mandatory metadata:

- `READ`: observational, no intended state mutation;
- `PLAN`: side-effect-free preflight/planning;
- `WRITE`: state-changing action.

Effect metadata informs policy and model behavior. It does not itself grant authorization.

## 3. P0.2 effective Host tools

The initial Host catalog supplies:

### Context / platform observation

- `context.current.get`
- `platform.snapshot.get`
- `capability.list`

### Package lifecycle

- `app.catalog.list`
- `app.install.plan`
- `app.install.execute`

### Provider observation

- `provider.list`
- `provider.health.get`
- `provider.binding.list`

### Product knowledge

- `help.search`

These tools are App Platform-owned registrations. Personal Agent core only sees their descriptors.

## 4. Safety boundary

### 4.1 Unknown tools fail closed

If the model requests a tool that is not present in the current effective catalog, execution returns:

```text
AGENT_TOOL_UNAVAILABLE
```

The Agent cannot invent a tool name and gain execution.

### 4.2 Install preflight remains Host-owned

The previous safety invariant is retained:

```text
app.install.plan(packageId)
        ↓ successful / no blockers
app.install.execute(packageId)
```

`app.install.execute` rejects the call unless the same Agent run already contains a successful side-effect-free plan observation for the same Package.

This rule lives in the Host tool executor, not in the LLM prompt and not in the Agent model.

### 4.3 Tool discovery is not authorization

A tool being discoverable does not mean every Principal may execute it.

P0.2 preserves the existing installation behavior for compatibility. The next security slice will introduce Principal/Scope-aware catalog filtering and authorization for privileged WRITE tools.

Target:

```text
Principal + Scope + PlatformRequestContext
        ↓
tool availability filter
        ↓
effective catalog
        ↓
model selection
        ↓
authorization.check for privileged invocation
        ↓
execute / deny
```

The model can never upgrade a Host deny into allow.

### 4.4 Context is Host-resolved

`context.current.get` returns the Host-resolved Context for the current Personal Agent run.

A caller may request selection of a known Context, but arbitrary request values cannot create an Enterprise Context. Unknown Context selection fails closed before LLM resolution or tool execution.

The effective Tool Catalog is constructed after Context resolution. Future Context-specific tools must therefore be filtered/registered from Host-owned Context state rather than trusting tool/context ids supplied by the model or browser.

## 5. Dynamic registration

P0.2 supports Host registration through `EnterpriseAgentToolRegistrationV010`.

This proves that a new tool can be added without modifying:

- Personal Agent runtime;
- Personal Agent model contract;
- Provider-backed model mapping.

The current registration source is the Host.

The next protocol maturity should add a declarative Package contribution, conceptually:

```text
kind: agent.tool
```

The exact Plugin Protocol contract is intentionally deferred until at least one real business Package becomes a second tool owner.

Do not prematurely encode arbitrary plugin execution into prompts.

## 6. Provider and Help tools

Provider tools observe only Host-effective Providers.

`provider.health.get` reads recorded health; it does not run an active probe. Active probing remains a privileged Host administration action.

`provider.binding.list` reads binding policy. Future enterprise authorization may restrict which binding details a Principal can inspect.

`help.search` searches the authoritative Platform Help corpus. Locale is supplied by the Agent chat context where available; P0.2 uses the request locale when provided and falls back to message-language inference until PlatformRequestContext is complete.

## 7. Secrets

Agent tools MUST NOT expose saved secret plaintext.

Personal Agent does not receive OpenAI/API credentials as tool arguments, observations or prompt context.

LLM Provider credentials remain resolved by the Host Secrets Provider inside the Provider runtime boundary.

Future connector/tool credentials must follow the same rule.

## 8. Tool observations

Every invocation returns an `AgentToolObservation`:

```text
tool
ok
result?
error { code, message }?
```

Observations are authoritative for the current Agent run.

The model must not claim that a state-changing operation succeeded unless the corresponding Host observation reports success.

## 9. Model independence

Enterprise Agent depends on `AgentModel`, not OpenAI function-calling details.

The Provider-backed model translates the effective Host descriptors into generic `LlmToolV010` definitions.

Different LLM Provider Packages may implement their own transport/tool-call encoding while preserving the same public `llm.inference` contract.

## 10. Relationship to EC

Experience Compiler / Enterprise Intelligence tools are not copied into the Agent core.

Future EC-facing tools enter through an explicit adapter/registration boundary, for example:

```text
ec.context.compile
ec.knowledge.search
ec.provenance.get
```

Their implementation remains owned by the EC intelligence runtime.

## 11. Workbench / Eidos

Tool Discovery P0.2 does not introduce new visual controls.

Personal Agent remains an Eidos `chat` Experience in the Workbench.

When tool execution/evidence/pending decisions require richer UI, reusable presentation must be added to Eidos first and consumed through Eidos contracts and Productive Design Language.

## 12. P0.2 acceptance

P0.2 is complete when:

1. Personal Agent runtime has no fixed App Platform tool switch;
2. Provider-backed model has no fixed tool-name mapping;
3. Host supplies the effective descriptor list;
4. a newly registered test tool works without editing Agent core;
5. unknown tools fail closed;
6. install execute still requires prior successful plan;
7. platform/provider/help READ tools are available;
8. tool descriptors reach the LLM dynamically;
9. Agent plugin CI and Platform CI pass;
10. Help, invariants and project authority files describe the same tool-system state.

## 13. Next slice

After P0.2:

1. add current Workbench / PlatformRequestContext;
2. establish Identity / Session / Principal;
3. filter tool catalog by Principal + Scope;
4. route WRITE invocation through `authorization.check`;
5. add Package-owned `agent.tool` contribution after a real second tool owner exists;
6. add richer Eidos Agent execution/evidence UX if required;
7. begin EC Context / Knowledge / Provenance tool adapters.
