# External Agent OAuth Protected Resource — EA-4A v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Public network exposure:** NO — EA-4A implements protocol state and contracts only  
**Next:** EA-4B HTTP discovery/authorization/token routes behind an explicit disabled-by-default feature flag

## 1. Purpose

EA-4A adds the OAuth transport-security layer between durable delegated External Agent authority and future MCP/OpenAPI protocol exposure.

It does not create a second permission system.

Canonical derivation remains:

```text
OAuth credential
∩ active Agent
∩ active Client
∩ active/unexpired Grant
∩ current Human identity
∩ current Enterprise Context membership
∩ current plugin/Feature lifecycle
∩ current authorization.check
=
current usable External Agent capability
```

A syntactically valid access token with no current delegated authority is denied.

## 2. Standards profile

EA-4A follows:

- RFC 9728 OAuth 2.0 Protected Resource Metadata;
- RFC 8414 Authorization Server Metadata;
- RFC 8707 Resource Indicators;
- RFC 7636 PKCE;
- RFC 9700 OAuth 2.0 Security BCP;
- MCP 2026-07-28 Client ID Metadata Document direction.

The first client profile is CIMD-first.

Dynamic Client Registration is not the mainline design.

## 3. Client identities

EVO keeps two identifiers distinct:

```text
internal clientId
= EVO governance/audit identity

oauthClientId
= OAuth wire-protocol client identifier
```

For MCP 2026-07-28 CIMD clients:

```text
oauthClientId
= stable HTTPS URL of the Client ID Metadata Document
```

The OAuth client id is an optional immutable fact on `ExternalAgentClientRegistrationV010`.

A CIMD client in v0.1 must be a PUBLIC client.

## 4. CIMD validation

The Host resolves the registered `oauthClientId`, fetches the document with redirects disabled, then validates:

- exact `client_id` equality;
- non-empty redirect URI list;
- secure redirect URI rules;
- RFC 8252 native loopback-IP redirect matching: exact URI match except that the runtime TCP port may vary for `http://127.0.0.1/... ` and `http://[::1]/...`;
- Authorization Code support where declared;
- `code` response support where declared;
- no confidential-client authentication method in the P0 public-client profile.

OAuth metadata does not create a registered EVO client.

The client must already exist in External Agent governance.

## 5. OAuth scope is not EVO authority

The first transport scopes are:

```text
evo.capabilities
offline_access
```

`evo.capabilities` means only that the credential is intended for governed EVO Capability access.

It does not identify which operation is authorized.

Actual authority remains in the Host-owned Authority Grant and current runtime authorization intersection.

`offline_access` allows issuance of a rotating Refresh Token but does not expand delegated operations.

## 6. Protected resource binding

Every authorization code, Access Token and Refresh Token is bound to one Resource Identifier.

The target resource is an HTTPS URI.

The authorization request/token exchange/refresh/resource-server validation must agree on the same resource.

A token minted for one resource is not accepted by another.

## 7. Opaque credential model

EA-4A deliberately uses opaque credentials.

Raw values are returned once:

```text
evo_code_<random>
evo_at_<random>
evo_rt_<random>
```

Persistent state stores only SHA-256 hashes.

The Host does not need JWT signing/JWKS merely to establish the first External Agent vertical.

Opaque credentials make server-side revocation and current Grant rebinding straightforward.

JWT access tokens may be added later behind the same authority semantics if interoperability evidence requires them.

## 8. Authorization Code

Authorization Code is:

- short lived;
- one time;
- bound to OAuth client;
- bound to internal Agent/Client/Grant;
- bound to Human authorizer;
- bound to resource;
- bound to the exact runtime redirect URI used for the issued code;
- registration matching is exact for ordinary redirects; RFC 8252 loopback IP registrations may vary only the TCP port while scheme, IP literal, path and query remain identical;
- bound to requested scopes;
- bound to PKCE S256 challenge.

Issuance requires:

```text
current Human browser Principal
= Grant authorizing Principal

current active Context
= Grant Context

CIMD client
= registered Grant client

current effective delegated authority
= non-empty
```

A code is not issued from stale historical Grant facts.

## 9. PKCE

EA-4A requires:

```text
code_challenge_method = S256
```

The token exchange verifies a 43–128 character RFC 7636-compatible verifier.

Wrong verifier does not consume the code.

Successful exchange consumes the code atomically with credential issuance.

A consumed code cannot be replayed.

## 10. Access Token

Access Token is:

- opaque;
- short lived;
- resource bound;
- client/Agent/Grant bound;
- scope bound;
- server revocable.

Default target TTL is 15 minutes, capped by Grant expiry.

Resource access does not trust the token as frozen authority.

Each access resolves the current effective delegated catalog through EA-3B2.

Therefore all of these invalidate use immediately without rewriting the token record:

- Human disabled;
- Enterprise membership removed;
- authorization policy changes to DENY;
- plugin Feature disabled;
- Client revoked;
- Agent revoked;
- Grant revoked/expired;
- operation no longer effective.

## 11. Refresh Token

Refresh Token is issued only when `offline_access` is granted.

The first profile uses rotation:

```text
refresh token A
→ use once
→ A consumed
→ access token B + refresh token B
```

Replay of A fails closed.

Rotation does not extend authority beyond:

- current Grant validity;
- original refresh-token expiry ceiling.

Every refresh also re-resolves current delegated authority before issuing a new Access Token.

## 12. Revocation

The Host can revoke Access or Refresh Tokens by opaque value.

Revocation stores only the matching hash/fact transition.

Credential revocation and Grant revocation remain distinct:

```text
revoke token
= stop this credential

revoke Grant
= stop delegated authority independent of all token lifetimes
```

Grant/client/Agent/Human/plugin authority changes remain effective even when no explicit token revocation occurs.

## 13. Durable state

OAuth state has a memory and atomic file store.

Durable records:

- Authorization Code facts;
- Access Token facts;
- Refresh Token facts;
- append-only OAuth events.

Creation/binding facts are immutable.

Allowed state changes are narrowly bounded:

- Code gains one terminal `consumedAt`;
- Access Token gains one terminal `revokedAt`;
- Refresh Token gains terminal consumption/revocation/replacement facts;
- OAuth events append only.

## 14. Metadata contracts

Protected Resource Metadata exposes:

- resource;
- authorization server;
- supported transport scopes;
- Bearer header method;
- resource name.

Authorization Server Metadata exposes:

- issuer;
- authorization endpoint;
- token endpoint;
- revocation endpoint;
- Authorization Code;
- Refresh Token;
- PKCE S256;
- scopes;
- CIMD support;
- protected resource list.

EA-4A defines these metadata objects but does not publish HTTP routes yet.

## 15. Public-route gate

No OAuth route is enabled merely because EA-4A merges.

EA-4B must implement the HTTP projection and all routes remain behind an explicit deployment flag that defaults OFF.

The production Human login live gate also remains open until a real OIDC IdP is configured and browser-proven.

Public External Agent access must not be enabled before that Human identity boundary is proven.

## 16. Machine acceptance

EA-4A requires deterministic tests for:

1. RFC-style protected-resource/authorization-server metadata shape;
2. CIMD exact client-id binding;
3. redirect URI validation;
4. only hashes stored for code/token values;
5. Authorization Code + PKCE S256 success;
6. wrong PKCE rejection without consuming the code;
7. code replay rejection;
8. resource mismatch rejection;
9. Access Token resolution to current operation ids;
10. Refresh Token rotation;
11. old refresh replay rejection;
12. current authorization DENY invalidating an existing token;
13. disabled Human invalidating an existing token;
14. disabled plugin invalidating an existing token;
15. explicit access-token revocation.

## 17. Next slice

EA-4B should add:

```text
/.well-known/oauth-protected-resource
/.well-known/oauth-authorization-server
/oauth/authorize
/oauth/token
/oauth/revoke
```

behind:

```text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED=false
```

by default.

The authorization endpoint must use real request-bound Human Session and must never accept caller-supplied Principal/Enterprise authority.

After EA-4B:

```text
EA-5
Generic MCP READ/PLAN
→ EA-001 Ledger Runtime blind discovery
```
