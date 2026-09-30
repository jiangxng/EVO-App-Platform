# Generic MCP Modern Core — EA-5A v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Protocol revision:** MCP 2026-07-28 modern era  
**Public `/mcp` endpoint:** NOT ENABLED in EA-5A  
**Authorization:** NOT implemented in this slice

## 1. Purpose

EA-5A establishes the protocol-neutral-to-MCP transport boundary before binding it to EVO External Agent OAuth.

The implementation follows the 2026-07-28 modern MCP lifecycle:

```text
no initialize handshake
no Mcp-Session-Id
each request self-describes protocol/client capabilities
server/discover is optional discovery probe
```

The first implemented methods are:

```text
server/discover
tools/list
tools/call
```

This is sufficient for the first read-only EVO plugin vertical once OAuth and Capability projection are attached.

## 2. Architecture boundary

```text
MCP HTTP transport
        ↓
MCP modern protocol core
        ↓
callbacks:
  listTools()
  callTool()
        ↓
EA-5B / EA-5C later bind:
OAuth Bearer
+ delegated authority
+ Capability Operation Catalog
+ Host Action invocation
```

EA-5A itself does not know:

- Human identity;
- External Agent Grant;
- Enterprise Context;
- plugin lifecycle;
- authorization.check;
- Ledger Runtime;
- ChatGPT;
- Claude.

Those are injected later.

## 3. Modern protocol only

EA-5A advertises:

```text
2026-07-28
```

and deliberately does not implement the older initialize/session era.

Reason:

- current EVO design is stateless at the MCP protocol layer;
- OAuth credentials already carry the authorization context;
- ordinary load balancing should not require MCP sticky sessions;
- the 2026-07-28 protocol is the target recorded in EA-4B.

Legacy compatibility may be added later as a separate adapter only if real client evidence requires it.

## 4. Request metadata

Every request must carry:

```text
params._meta["io.modelcontextprotocol/protocolVersion"]
params._meta["io.modelcontextprotocol/clientCapabilities"]
```

Expected protocol version:

```text
2026-07-28
```

`clientInfo` is accepted when present but is not used for security decisions.

This preserves the standards rule that self-reported client identity is descriptive, not authority.

## 5. HTTP standard headers

Modern HTTP requests require:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: <exact JSON-RPC method>
```

For `tools/call`:

```text
Mcp-Name: <exact params.name>
```

Header/body disagreement returns JSON-RPC:

```text
-32020
```

and HTTP 400.

The Host does not route/authorize based on a header value that disagrees with the body.

## 6. server/discover

The modern discovery result advertises:

```text
supportedVersions:
  - 2026-07-28

capabilities:
  tools:
    listChanged: false
```

Server identity is placed under:

```text
_meta["io.modelcontextprotocol/serverInfo"]
```

rather than a body-level `serverInfo` member.

Discovery is private-cache scoped.

## 7. tools/list

EA-5A receives tools from an injected callback.

The core:

- does not create tools from EVO internals;
- sorts names deterministically;
- returns private cache scope;
- uses zero TTL until EA-5C has authorization-aware revision/cache evidence.

Future EA-5C will project only current authorized public Capability Operation metadata.

## 8. tools/call

EA-5A validates:

- tool name;
- arguments object;
- HTTP `Mcp-Name` agreement.

Execution is delegated to an injected callback.

The core does not invoke App Actions directly in this slice.

Future EA-5C will resolve:

```text
tool name
→ authorized Capability Operation
→ internal ACTION_HOST binding
→ governed Host Action
```

## 9. Errors

JSON-RPC standard codes used in EA-5A:

```text
-32600 Invalid Request
-32601 Method not found
-32602 Invalid params
-32603 Internal error
-32020 Header mismatch
```

Internal diagnostic codes are placed in error `data.code`.

Protocol adapters must not leak secret values, Grant internals, private Action bindings or authorization policy details.

## 10. No network exposure yet

Merging EA-5A does not create the `/mcp` route.

This is deliberate.

EA-4 already reserves the protected resource identifier:

```text
<APP_PLATFORM_PUBLIC_BASE_URL>/mcp
```

EA-5B must bind that route to:

```text
Authorization: Bearer <EVO External Agent access token>
```

and must use `resolveAccessToken()` before the MCP core receives business callbacks.

Unauthenticated/invalid credential handling belongs to EA-5B.

## 11. Security invariants

### MCP-A-01

MCP protocol metadata MUST NOT create EVO authority.

### MCP-A-02

Self-reported `clientInfo` MUST NOT be used for authorization.

### MCP-A-03

MCP headers and JSON-RPC body MUST agree before dispatch.

### MCP-A-04

The protocol core MUST NOT inspect plugin source code or internal database state.

### MCP-A-05

Tool list and call implementations MUST be injected from the governed capability layer.

### MCP-A-06

No MCP Session id is introduced for 2026-07-28 traffic.

### MCP-A-07

EA-5A MUST NOT expose a public `/mcp` endpoint before Bearer protection exists.

## 12. Machine acceptance

EA-5A proves:

1. `server/discover` supports only 2026-07-28;
2. server identity is response `_meta`;
3. no initialize/session state is required;
4. per-request protocol metadata is mandatory;
5. client capabilities metadata is mandatory;
6. malformed client info fails closed;
7. `tools/list` is deterministic;
8. `tools/call` returns structured content;
9. unknown methods return -32601;
10. non-POST HTTP fails;
11. non-JSON content type fails;
12. wrong protocol header fails;
13. Mcp-Method/body mismatch returns -32020;
14. Mcp-Name/body mismatch returns -32020;
15. Mcp-Name on unnamed methods fails;
16. no External Agent OAuth/public endpoint is opened.

## 13. Next

EA-5B:

```text
/mcp
+ Bearer challenge
+ resolveAccessToken()
+ exact resource binding
+ current delegated authority
```

EA-5C:

```text
authorized Capability Operations
→ MCP tools/list
→ MCP tools/call
→ ACTION_HOST
```

Then EA-001 can run:

> Tell me the current Ledger Runtime template content for this enterprise.

without GitHub, source, database or private endpoint knowledge.

## 14. Standards evidence

Implementation direction is aligned with the MCP 2026-07-28 specification and current Tier-1 SDK behavior:

- modern requests are stateless;
- `initialize` is removed;
- `server/discover` is the modern discovery method;
- every request carries protocol/client metadata;
- HTTP requests carry routable MCP method/name headers;
- server identity is returned in response `_meta`;
- cacheable results carry TTL/cache-scope semantics.

The transport wrapper remains intentionally narrow so it can later be replaced by the official TypeScript SDK without changing EVO capability/authorization semantics.
