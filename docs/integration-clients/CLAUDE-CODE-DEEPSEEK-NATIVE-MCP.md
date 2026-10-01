# Claude Code + DeepSeek Native Remote MCP Validation

**Status:** Integration client profile  
**Purpose:** Prove a second mature AI Agent against EVO using native Remote MCP + CIMD/OAuth, with no local MCP protocol adapter.

## Architecture

```text
Claude Code
  ↓
DeepSeek Anthropic-compatible API
  ↓ native Remote MCP
EVO production /mcp
  ↓
CIMD + Authorization Code + PKCE
  ↓
Governed Capability Operations
```

No Cline adapter or other local MCP bridge participates in this proof.

## Why a dedicated CIMD document

Current Claude Code releases support CIMD but use a runtime loopback callback with a TCP port.

Anthropic's own published CIMD declares portless loopback callbacks while the CLI currently emits `http://localhost:<port>/callback`.

To keep EVO redirect validation deterministic and avoid a vendor-specific Host exception, this profile pins the native Claude Code callback port and supplies a matching public CIMD document.

Client ID:

```text
https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/claude-code-native-client.json
```

Redirect URI:

```text
http://localhost:3118/callback
```

No client secret exists.

## Required Claude Code environment

```text
MCP_OAUTH_CLIENT_METADATA_URL=https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/claude-code-native-client.json
MCP_OAUTH_CALLBACK_PORT=3118
```

These values configure the client-side CIMD identity and loopback listener only.

They do not bypass EVO governance.

## DeepSeek model backend

DeepSeek supports Claude Code through its Anthropic-compatible endpoint.

Typical macOS shell environment:

```text
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
ANTHROPIC_AUTH_TOKEN=<local DeepSeek API key>
ANTHROPIC_MODEL=deepseek-flash
ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-flash
ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-flash
```

Do not commit or share the API key.

## Remote MCP registration

Add EVO directly as a remote HTTP MCP server:

```text
claude mcp add --transport http --scope user evo https://ledger-configurator-production.up.railway.app/mcp
```

Then start Claude Code with the required environment variables and use `/mcp` to authenticate the EVO server.

Expected OAuth path:

```text
Claude Code
→ EVO /mcp
→ RFC 9728 Protected Resource Metadata
→ EVO Authorization Server Metadata
→ CIMD client identity
→ Human browser authorization
→ PKCE S256
→ http://localhost:3118/callback
→ bearer-protected /mcp
```

## Blind AI-Agent prompt

Use a natural-language prompt that does not reveal operation IDs:

```text
请告诉我当前 EVO installation 的 Ledger Runtime 配置概况。
只有在为了说明配置结构确有必要时，读取少量账户示例。
不要查看本地源码、GitHub、数据库或任何私有接口，
也不要假设这是某个企业专属的 Ledger Template。
请根据当前可用工具自行完成。
```

## Pass criteria

- Claude Code connects directly to EVO remote MCP with no protocol adapter;
- OAuth uses CIMD + Authorization Code + PKCE;
- only the delegated Ledger READ Capability Operations are visible;
- the Agent autonomously selects `ledger.runtime.configuration.describe`;
- it uses bounded `ledger.runtime.configuration.section.read` only if useful;
- no source/GitHub/database/private endpoint is used;
- the final answer is installation-scoped;
- no Enterprise Context-specific Ledger Template binding is claimed;
- no WRITE operation is exposed;
- Grant revocation still removes current effective access immediately.

## Classification

This document is an **Integration Client Profile**.

It does not add Claude-specific business logic to EVO Host Core.
