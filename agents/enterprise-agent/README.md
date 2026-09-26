# Enterprise Agent MVP

**Status:** short-term mainline implementation  
**Purpose:** prove natural-language request → governed App Manager tools → application installation.

## Architecture

```text
User
→ Enterprise Agent
→ AgentModel
→ public Agent tools
→ App Manager HTTP API
→ Package/Feature lifecycle
```

The Agent runtime does not import App Manager private implementation.

## Model boundary

`AgentModel` is replaceable.

The product runtime now resolves models through the platform `llm.inference` Provider contract.

- `createProviderBackedAgentModel()` adapts the generic LLM Provider contract to the AgentModel decision loop.
- `createDevelopmentAgentModel()` remains an offline deterministic test/proof adapter.
- `createOpenAIResponsesAgentModel()` is retained only as migration/reference evidence for the old direct-integration path.

Replacing the installed LLM Provider does not change the Enterprise Agent package, EC durable assets, App Manager or Eidos.

## Current tools

- `app.catalog.list`
- `app.install.plan`
- `app.install.execute`

The install plan remains side-effect free. Installation is executed only through App Manager.

## Local MVP

With App Manager running on port 4100:

```bash
npm run build
npm run start:agent
```

Default Agent URL: `http://localhost:4300`.

Example:

```text
POST /v1/chat
{"message":"帮我安装 Company Notes"}
```

Expected tool trace:

```text
app.catalog.list
→ app.install.plan
→ app.install.execute
→ final response
```

This server currently uses permissive CORS for the local proof only.


## Real LLM mode

Install an LLM Provider Package such as `openai-llm-provider`. Provider credentials remain outside Package manifests.

For the OpenAI reference provider, runtime configuration uses secure environment/secrets such as:

```text
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_BASE_URL
```

The App Host Enterprise Agent Experience resolves `llm.inference` from active Provider contributions. If the provider package is absent, chat fails closed with `LLM_PROVIDER_REQUIRED`; if installed but credentials/runtime are not configured, it fails closed with `LLM_PROVIDER_NOT_CONFIGURED`.

The Agent Runtime still performs installation planning internally as a safety preflight before `app.install.execute`; this is not a mandatory human UI step.


## Tool Discovery P0.2

Enterprise Agent core no longer owns a fixed tool list.

The runtime receives an effective Host tool catalog for each chat turn:

```text
Host state / lifecycle / Providers / Help
            ↓
EnterpriseAgentHostToolCatalogV010
            ↓
effective AgentToolDescriptorV010[]
            ↓
AgentModel
            ↓
LLM Provider tool schema
            ↓
tool call
            ↓
Host catalog invoke
```

Each descriptor declares:

- stable tool id;
- LLM-safe model name;
- owner Package;
- effect: `READ | PLAN | WRITE`;
- JSON input schema;
- optional Capability association.

P0.2 Host tools include:

- `platform.snapshot.get`;
- `capability.list`;
- `app.catalog.list`;
- `app.install.plan`;
- `app.install.execute`;
- `provider.list`;
- `provider.health.get`;
- `provider.binding.list`;
- `help.search`.

Unknown/unavailable tools fail closed. The model cannot invent tools or promote a READ/PLAN tool into a WRITE operation.

The existing installation safety rule remains Host-owned: `app.install.execute` requires a successful side-effect-free `app.install.plan` observation for the same Package.

P0.2 registration is Host-owned. A future Plugin Protocol contribution will allow installed Packages to declare Agent tools without adding those tool names to Enterprise Agent source.

Tool discovery is not authorization. Principal/Scope-aware filtering and write authorization remain the next security maturity step for privileged Agent tools.
