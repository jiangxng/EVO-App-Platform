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

The runtime supports two model adapters:

- `createDevelopmentAgentModel()`: deterministic/offline proof adapter; **not an LLM**.
- `createOpenAIResponsesAgentModel()`: real LLM adapter using the OpenAI Responses API.

Both implement the same stable `AgentModel` contract. Replacing the model does not change App Manager or Eidos.

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

Set an API key before starting the Agent service:

```bash
OPENAI_API_KEY=... npm run start:agent
```

Optional:

```text
OPENAI_MODEL=gpt-5.6-luna
OPENAI_BASE_URL=https://api.openai.com/v1
```

When `OPENAI_API_KEY` is absent, the service falls back to the deterministic development model.

The Agent Runtime mechanically enforces a successful side-effect-free install plan before allowing `app.install.execute`. This rule does not rely on model obedience.
