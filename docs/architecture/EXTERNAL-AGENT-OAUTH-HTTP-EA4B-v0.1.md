# External Agent OAuth HTTP Projection — EA-4B v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Production activation:** OFF by default  
**Requires:** EA-1 production Human Session foundation, EA-3 delegated authority, EA-4A OAuth core

## 1. Purpose

EA-4B projects the already-tested EA-4A OAuth state machine onto the App Platform HTTP Host.

This slice adds protocol endpoints without changing the underlying authority model.

Canonical flow:

```text
External Agent / MCP Client
        ↓
Protected Resource Metadata
        ↓
Authorization Server Metadata
        ↓
Human browser authorization
        ↓
existing EVO Human Session
        ↓
existing explicit Authority Grant
        ↓
Authorization Code + PKCE S256
        ↓
resource-bound Access Token
        ↓
future /mcp protected resource
```

## 2. Deployment gate

All External Agent OAuth HTTP endpoints are controlled by:

```text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED
```

Default:

```text
false
```

When disabled, OAuth endpoints return 404 and no external delegated access is activated.

Enabling OAuth requires:

- `APP_PLATFORM_MANAGED_SESSION_ENABLED=true`;
- `APP_PLATFORM_PUBLIC_BASE_URL`;
- durable lifecycle state or explicit durable governance/OAuth paths.

The Host fails startup if OAuth is enabled without these prerequisites.

## 3. Durable Host state

The Host now reserves two durable stores:

```text
external-agent-governance.json
external-agent-oauth.json
```

By default they live alongside `APP_PLATFORM_STATE_FILE`.

Override variables:

```text
APP_PLATFORM_EXTERNAL_AGENT_GOVERNANCE_FILE
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_FILE
```

When public OAuth is enabled, memory-only governance/OAuth state is forbidden.

## 4. Protected Resource identifier

The first protected resource is:

```text
<APP_PLATFORM_PUBLIC_BASE_URL>/mcp
```

This is the future Generic MCP HTTP endpoint.

Under RFC 9728, because the Resource Identifier contains the `/mcp` path, its authoritative Protected Resource Metadata URL is:

```text
/.well-known/oauth-protected-resource/mcp
```

The returned `resource` value is exactly:

```text
<APP_PLATFORM_PUBLIC_BASE_URL>/mcp
```

This preserves RFC 9728 resource/metadata binding.

## 5. Authorization Server metadata

The authorization server issuer is the configured EVO public base URL.

Metadata route:

```text
/.well-known/oauth-authorization-server
```

Advertised endpoints:

```text
/oauth/authorize
/oauth/token
/oauth/revoke
```

Profile:

- Authorization Code;
- Refresh Token;
- PKCE S256;
- CIMD support;
- `evo.capabilities`;
- `offline_access`;
- one protected `/mcp` resource.

## 6. Human authentication reuse

OAuth authorization does not create another Human login system.

`/oauth/authorize` resolves the normal request-bound EVO Human Session.

If the Human has no valid managed Session:

```text
/oauth/authorize?... 
→ 303 /auth/login?returnTo=<same local authorize request>
→ configured OIDC Provider
→ /auth/callback
→ Host managed Session
→ original /oauth/authorize request
```

The return target remains local to EVO.

The external client's redirect URI is not used until the client metadata has been validated.

## 7. Pre-existing Grant as P0 authorization decision

EA-4B does not auto-create an Authority Grant from OAuth scopes.

A Grant is an explicit governed EVO fact created by a Human before protocol authorization.

P0 deterministic selection:

```text
registered OAuth Client
∩ current Human
∩ ACTIVE Grant
∩ current effective delegated authority
```

Then:

- 0 matching effective Grants → `access_denied`;
- exactly 1 → use it;
- more than 1 → `interaction_required`.

The Host never chooses first-installed/first-created/lexical Grant.

A future Eidos consent/Grant picker can resolve multi-Grant selection explicitly.

## 8. Client redirect safety

Before redirecting to any external URI, the Host:

1. resolves the registered EVO External Agent Client;
2. fetches/validates CIMD;
3. requires exact `client_id`;
4. verifies the requested redirect URI is one of CIMD `redirect_uris`.

An unregistered redirect URI causes local failure.

The Host never redirects an OAuth error to an unvalidated URI.

## 9. Authorization request

P0 requires:

```text
response_type=code
client_id=<CIMD HTTPS URL>
redirect_uri=<registered URI>
resource=<EVO /mcp resource>
scope=evo.capabilities [offline_access]
state=<client state, recommended>
code_challenge=<PKCE challenge>
code_challenge_method=S256
```

Human identity and Context are never accepted from OAuth query parameters.

The selected Grant determines the Context, and the Host resolves that Context through the current Human's Context Registry.

## 10. Token endpoint

Route:

```text
POST /oauth/token
Content-Type: application/x-www-form-urlencoded
```

Supported:

```text
grant_type=authorization_code
grant_type=refresh_token
```

Unsupported grant types fail with `unsupported_grant_type`.

Authorization Code exchange requires:

- client_id;
- resource;
- code;
- redirect_uri;
- code_verifier.

Refresh requires:

- client_id;
- resource;
- refresh_token.

The endpoint never accepts a Human Session as Agent authority.

## 11. Revocation endpoint

Route:

```text
POST /oauth/revoke
Content-Type: application/x-www-form-urlencoded
```

Unknown and already-revoked tokens receive the same success response.

This avoids token-existence disclosure.

Grant revocation remains stronger than token revocation because Grant state is re-evaluated at resource use.

## 12. Browser CSRF boundary

Existing EVO same-origin CSRF protection remains unchanged.

It applies to mutating requests carrying the Human Session cookie.

Machine OAuth Token/Revocation requests normally do not carry the Human cookie and therefore do not become browser session mutations.

OAuth support does not relax Eidos/Human cookie-origin checks.

## 13. Credential-channel separation

Two credential channels remain distinct:

```text
Human browser:
__Host-evo_session

External Agent:
Authorization: Bearer <EVO Agent Access Token>
```

An External Agent Access Token MUST NOT be resolved by `identity.session.request` as a Human Session.

A Human managed Session MUST NOT be treated as an MCP bearer access token.

EA-5 will add the explicit protected-resource Bearer resolver for `/mcp`.

## 14. HTTP cache/security behavior

Metadata:

```text
public, max-age=300
```

Authorization, token and revocation:

```text
no-store
```

Token endpoint accepts only bounded URL-encoded bodies.

JSON/body limits and standard Host security headers remain active.

## 15. EA-4B machine acceptance

EA-4B requires:

1. OAuth disabled by default;
2. enabling without managed Human Session fails startup;
3. enabling without public base URL fails startup;
4. enabling without durable OAuth/governance store fails startup;
5. RFC 9728 metadata route matches the `/mcp` Resource Identifier;
6. AS metadata points to Host OAuth routes;
7. unauthenticated authorize returns to local Human login;
8. redirect URI is validated before any external redirect;
9. exactly one current effective Grant is required for automatic P0 authorization;
10. zero Grants yields `access_denied`;
11. multiple Grants yields `interaction_required`;
12. token endpoint projects Authorization Code + Refresh flows only;
13. revocation is non-disclosing;
14. existing Human Session/CSRF behavior remains unchanged;
15. no MCP endpoint is opened in this slice.

## 16. Production status

Merging EA-4B still does not enable External Agent access in Railway because the feature flag remains unset.

The real production Human OIDC login gate also remains open until an external IdP has been configured and browser-proven.

Do not enable:

```text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED=true
```

before Human login is production-proven.

## 17. Next

After EA-4B:

```text
EA-5A
Generic MCP stateless HTTP protocol core

EA-5B
OAuth Bearer protected-resource binding

EA-5C
Capability Operation → MCP Tool projection

EA-001
Ledger Runtime blind discovery through a real external Agent
```

The MCP implementation should target protocol revision `2026-07-28`, which is stateless at the protocol layer.
