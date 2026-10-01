# Cline + DeepSeek Local MCP Adapter

**Status:** Integration Adapter test client  
**Purpose:** Validate a real third-party AI Agent against EVO without weakening EVO's CIMD-first OAuth design.

## Architecture

```text
Cline + DeepSeek
  ↓ local STDIO MCP
EVO Cline Local MCP Adapter
  ↓ CIMD + OAuth Authorization Code + PKCE
  ↓ Streamable HTTP / MCP 2026-07-28
EVO production
```

The adapter is an **Integration Adapter**, not Host Core.

It contains no Ledger business logic and does not bypass:

- Human login;
- Enterprise Context;
- External Agent registration;
- delegated Authority Grant;
- current-authority recomputation;
- Capability Operation authorization;
- MCP bearer protection.

## Client identity

CIMD:

```text
https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/cline-local-adapter-client.json
```

Loopback callback:

```text
http://127.0.0.1:8791/oauth/callback
```

No client secret exists.

## Local token storage

By default the adapter stores OAuth state at:

```text
~/.evo/cline-mcp-adapter-oauth.json
```

The directory/file are created with owner-only permissions.

Do not commit or share this file.

Override only for local testing with:

```text
EVO_ADAPTER_TOKEN_FILE=/another/private/path.json
```

## Cline STDIO configuration

Use an absolute local path to the adapter script:

```json
{
  "mcpServers": {
    "evo": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/EVO-App-Platform/tools/integration-adapters/evo-cline-mcp-adapter.mjs"
      ],
      "env": {
        "EVO_MCP_URL": "https://ledger-configurator-production.up.railway.app/mcp",
        "EVO_OAUTH_CLIENT_ID": "https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/cline-local-adapter-client.json"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Keep `autoApprove` empty during the first portability proof.

## First connection

On the first `tools/list` request the adapter:

1. discovers EVO Protected Resource Metadata;
2. discovers EVO OAuth Authorization Server Metadata;
3. starts the loopback callback on port 8791;
4. opens the browser;
5. uses CIMD as `client_id`;
6. requests `evo.capabilities offline_access`;
7. performs PKCE S256;
8. exchanges the code for an access/refresh token;
9. stores tokens locally;
10. forwards Cline's MCP tool discovery to EVO.

The browser must have a valid EVO Human session and exactly one effective delegated Grant for this Client.

## Protocol translation

Cline-facing side:

```text
STDIO MCP
legacy initialize handshake
```

EVO-facing side:

```text
Streamable HTTP
MCP 2026-07-28
MCP-Protocol-Version
Mcp-Method
Mcp-Name for tools/call
modern _meta envelope
```

The adapter translates protocol mechanics only.

Tool names, schemas, authorization and business results remain EVO-owned.

## First AI-Agent portability proof

Prompt Cline naturally, for example:

```text
请告诉我当前 EVO installation 的 Ledger Runtime 配置概况。
如果需要，请读取少量账户示例来说明，但不要读取无关数据。
```

Pass criteria:

- Cline discovers only the delegated tools;
- DeepSeek chooses `ledger.runtime.configuration.describe` itself;
- DeepSeek calls `ledger.runtime.configuration.section.read` only if useful;
- no GitHub/source/private endpoint knowledge is supplied to the Agent;
- the answer says installation-scoped configuration;
- no Enterprise-specific Ledger Template claim is made;
- no WRITE operation is exposed.

## Security / revocation

The adapter does not make an access token authoritative.

EVO still recomputes current delegated authority on each bearer request.

If the Grant is revoked, the next remote MCP request fails even if the local token file still exists.

On an HTTP 401 the adapter deletes its local token state so a later reconnect must authorize again.


## Production live proof — 2026-10-01

Status:

```text
cline-deepseek-real-ai-agent-portability-v0-1
= VERIFIED_PRODUCTION_PASS
```

Observed client/model:

```text
Cline 4.1.22
DeepSeek API
```

Cline's native remote MCP OAuth path attempted Dynamic Client Registration and failed against EVO's intentionally CIMD-first authorization server:

```text
Incompatible auth server:
does not support dynamic client registration
```

EVO did not enable DCR or add a Cline-specific Host authorization branch.

The local Integration Adapter was used instead:

```text
Cline + DeepSeek
  ↓ STDIO MCP
EVO Cline Local Integration Adapter
  ↓ CIMD + Authorization Code + PKCE
  ↓ MCP 2026-07-28
EVO production
```

### Human prompt constraints

The Human asked for the current EVO installation Ledger Runtime configuration and explicitly required:

- use currently available tools autonomously;
- do not inspect local source;
- do not use GitHub;
- do not query the database;
- do not use private endpoints;
- do not assume Enterprise-specific Ledger Template binding.

The prompt did **not** disclose EVO operation IDs.

### Autonomous tool selection

The Agent first selected:

```text
ledger.runtime.configuration.describe
```

After receiving the overview, it independently concluded that a small account sample would help explain the configuration structure and selected:

```text
ledger.runtime.configuration.section.read
```

with:

```json
{
  "section": "accounts",
  "pageSize": 5
}
```

No unnecessary pagination or broad data dump was observed.

### Final answer behavior

The Agent summarized:

```text
templateId = bookkeeping-default
semanticDigest = 8a1e5f7110625cf92da1c6c65a57d875cca9c008bc47c391ebeb76a694990e98

accounts = 141
applications = 143
dictionaries = 106
postingRules = 912
referenceLegacyPostingRules = 587

burnReady = true
blockers = []
```

It also used the five returned account records only as bounded structural examples.

The answer correctly described the result as the **current EVO installation Ledger Runtime configuration** and did not claim Enterprise Context-specific Ledger Template selection.

### What this proves

```text
natural-language intent
→ real third-party AI Agent harness
→ non-OpenAI model
→ governed EVO tool discovery
→ autonomous capability choice
→ bounded follow-up read
→ current installation answer
```

This is a real AI-Agent portability proof.

### What this does not prove

- Cline 4.1.22 natively supports CIMD-first remote MCP OAuth without an adapter;
- a second mature external AI Agent has completed the same proof;
- ChatGPT custom MCP has completed the same proof;
- Enterprise Context → Ledger Template binding exists;
- External Agent WRITE is proven.

The next interoperability goal is a second mature external AI Agent, preferably using EVO's remote CIMD-first contract natively.
