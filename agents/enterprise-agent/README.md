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

The current `createDevelopmentAgentModel()` is deliberately **not an LLM**. It is an offline deterministic adapter used only to verify the end-to-end tool loop without credentials or provider lock-in.

A real LLM adapter must implement the same `AgentModel` contract. Replacing the model must not change App Manager or Eidos.

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
