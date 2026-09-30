# MCP OAuth Protected Resource — EA-5B v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Requires:** EA-4A/EA-4B OAuth + EA-5A MCP modern core  
**Production activation:** OFF by default  
**Business tool projection:** NOT YET ENABLED

## 1. Purpose

EA-5B turns the reserved EVO MCP resource into a real OAuth-protected HTTP resource while keeping business capability projection closed until EA-5C.

Canonical path:

```text
POST /mcp
  ↓
Bearer credential present?
  ↓
EA-4 resolveAccessToken()
  ↓
exact /mcp resource binding
  ↓
current delegated authority still valid?
  ↓
modern MCP HTTP/core
```

No new permission engine is introduced.

## 2. Rollout flag

The MCP route is controlled independently:

```text
APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED
```

Default:

```text
false
```

MCP may not be enabled unless:

```text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED=true
```

Startup fails if MCP is enabled without OAuth.

This allows OAuth metadata/token infrastructure to be deployed without exposing the MCP protected resource.

## 3. Protected resource

Resource Identifier:

```text
<APP_PLATFORM_PUBLIC_BASE_URL>/mcp
```

Authoritative RFC 9728 metadata:

```text
<APP_PLATFORM_PUBLIC_BASE_URL>/.well-known/oauth-protected-resource/mcp
```

EA-5B reuses exactly the resource already established by EA-4.

It does not create a second MCP resource identity.

## 4. Challenge behavior

Missing Bearer token:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="<base>/.well-known/oauth-protected-resource/mcp"
Cache-Control: no-store
```

Invalid, expired, revoked, wrong-resource or currently unauthorized token:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="<base>/.well-known/oauth-protected-resource/mcp", error="invalid_token"
Cache-Control: no-store
```

The response does not reveal whether the credential:

- never existed;
- expired;
- was revoked;
- lost Human authority;
- lost enterprise membership;
- lost plugin lifecycle authority;
- lost policy authorization.

Detailed reason remains internal audit/diagnostic evidence.

## 5. Current-authority recomputation

EA-5B calls:

```text
ExternalAgentOAuthService.resolveAccessToken()
```

That function already recomputes:

```text
active Agent
∩ active Client
∩ active Grant
∩ current Human
∩ current membership
∩ current plugin lifecycle
∩ current authorization.check
∩ Grant operation/effect constraints
```

Therefore MCP does not cache frozen authority from token issuance.

A still-unexpired token cannot resurrect revoked authority.

## 6. Authentication before request parsing

The Host performs:

```text
Bearer validation
→ only then read/parse MCP JSON body
```

Unauthenticated traffic therefore does not receive the ordinary 1 MiB MCP JSON parsing budget.

This reduces avoidable unauthenticated CPU/memory pressure and keeps the protected-resource boundary explicit.

## 7. Credential channel separation

Human browser channel:

```text
__Host-evo_session
```

External Agent channel:

```text
Authorization: Bearer <EVO Agent Access Token>
```

The existing same-origin CSRF check applies only when the Human Session cookie is present.

A pure Bearer MCP request is not converted into a Human Session mutation.

MCP client self-report metadata does not become identity.

## 8. MCP clientInfo is not authority

A client may report:

```text
params._meta["io.modelcontextprotocol/clientInfo"]
```

EA-5B ignores this for authorization.

Authoritative identity comes from:

```text
opaque Access Token
→ EA-4 token record
→ registered EVO Client
→ registered External Agent
→ Authority Grant
```

A caller cannot claim FIRST_PARTY or another Agent identity through MCP metadata.

## 9. Two-stage protected-resource adapter

The MCP protected-resource wrapper exposes:

```text
authorize(headers, correlationId)
handleAuthorized(access, request, correlationId)
```

This separation is intentional.

It lets the Host authenticate before reading the body while keeping a convenience combined `handle()` path for isolated tests/adapters.

EA-5C will consume the verified `access` object to derive tools.

## 10. Current MCP behavior after successful Bearer auth

EA-5B intentionally keeps:

```text
tools/list → []
tools/call → MCP_CAPABILITY_PROJECTION_NOT_READY
```

when using the Host's temporary placeholder core.

This means:

> Protocol exposure cannot accidentally become business authority merely because `/mcp` exists.

EA-5C replaces the placeholder callbacks with current authorized Capability Operation projection.

## 11. HTTP behavior

`/mcp`:

- POST only;
- body limit: 1 MiB;
- JSON parse errors return JSON-RPC parse error;
- modern MCP header checks remain owned by EA-5A;
- responses are `no-store`.

When MCP rollout flag is false:

```text
/mcp → 404
```

Merging EA-5B therefore does not expose production MCP.

## 12. Production enablement gate

Do NOT enable:

```text
APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED=true
```

until all of the following are true:

1. production Human OIDC login is browser-proven;
2. External Agent OAuth is intentionally enabled;
3. durable Agent/Grant/OAuth stores are active;
4. EA-5C authorized tool projection is merged;
5. at least the Ledger EA-001 read grant can be created explicitly;
6. protected-resource challenge and token path pass production-like tests.

## 13. Machine acceptance

EA-5B proves:

1. missing token returns RFC 9728 discovery challenge;
2. malformed Authorization scheme receives the same bounded challenge;
3. valid Bearer resolves against exact `/mcp` resource;
4. invalid/revoked/currently-authorityless token returns `invalid_token`;
5. resolved wrong resource is rejected independently;
6. MCP `clientInfo` cannot influence OAuth identity;
7. authorized access context reaches the next protocol layer;
8. MCP route is independently feature-gated;
9. MCP cannot be enabled without OAuth;
10. authentication happens before body parsing;
11. existing OAuth CI remains green;
12. existing Human cookie/CSRF behavior remains unchanged.

## 14. Next

EA-5C binds verified access to the real operation catalog:

```text
verified OAuth access
        ↓
current operationIds
        ↓
current delegated operation resolution
        ↓
Capability Operation public metadata
        ↓
MCP tools/list
        ↓
MCP tools/call
        ↓
same ACTION_HOST execution path
```

The first tools are:

```text
ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
```

Then EA-001 can be exercised through a real MCP client.
