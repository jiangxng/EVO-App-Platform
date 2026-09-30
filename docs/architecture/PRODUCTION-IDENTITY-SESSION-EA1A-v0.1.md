# Production Identity Session — EA-1A v0.1

**Status:** Implementation slice  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Gate:** production-human-login-request-bound-session-v0-1  
**Scope:** Host-owned durable request Session foundation only

## 1. Purpose

EA-1A establishes the production-shaped Session substrate that future Human login and External Agent delegation depend on.

It deliberately does not implement an identity-provider login flow yet.

The separation is:

```text
Identity Provider
→ authenticates Human
→ returns authenticated Principal
        ↓
Host Session Service
→ issues opaque request Session
→ transports browser credential
→ resolves Principal on every protected request
→ expires / revokes / rotates
```

Authentication provider identity and Host Session lifecycle are separate concerns.

## 2. Existing contract preserved

EA-1A reuses:

```text
identity.session.request
evo.identity.request-session@0.1.0
RequestIdentitySessionProviderV010
```

No separate "External Agent Session" contract is introduced.

Human browser, Personal Agent Host requests and later delegated External Agent authorization all converge on the same authoritative Principal/Session boundary.

## 3. Provider topology

Reference/development providers remain:

```text
host-static-session-provider
→ deployment-scoped current Session reference

host-bearer-session-provider
→ deployment-configured bearer Session directory reference
```

EA-1A adds:

```text
host-managed-session-provider
→ durable opaque Session credentials
→ request-bound resolution
→ expiry / revocation / rotation
```

The managed Provider is disabled by default and is activated only with:

```text
APP_PLATFORM_MANAGED_SESSION_ENABLED=true
```

This prevents an unfinished Login flow from locking current production users out.

## 4. Credential model

Managed Session credentials are:

- 32 random bytes by default;
- encoded as base64url;
- bearer secrets;
- returned only at issuance/rotation;
- never persisted in plaintext.

Persistence stores only:

```text
SHA-256(session token)
+ Session metadata
+ append-only lifecycle events
```

Because the source credential has 256 bits of entropy, hashing is for credential non-disclosure rather than password stretching.

## 5. Session state

Managed Session state is materialized from append-only events:

```text
ISSUED
  ↓
ACTIVE
  ├── expires naturally
  ├── REVOKED
  └── ROTATE
        = revoke old first
        + issue new credential
```

The old credential is invalid before the replacement becomes valid.

A crash during rotation may force re-authentication, but must not leave both old and new credentials intentionally active.

## 6. Request hot path

Disk persistence is restart evidence, not the per-request lookup mechanism.

Startup:

```text
JSONL events
→ one replay
→ in-memory sessionId index
→ in-memory tokenHash index
```

Request:

```text
Cookie / Bearer
→ SHA-256
→ in-memory lookup
→ expiry/revocation check
→ IdentitySession
```

Do not reread/replay the full Session log for every HTTP request.

## 7. Browser cookie

Browser Session transport reserves:

```text
__Host-evo_session
```

Production cookie properties:

```text
Path=/
HttpOnly
Secure
SameSite=Lax
no Domain attribute
```

The Host owns cookie transport.

The Identity Provider plugin must not invent its own long-lived browser Session format.

## 8. Credential ambiguity

A request that carries two different authoritative Session credentials is not resolved by precedence.

Example:

```text
Cookie Session A
+
Authorization: Bearer Session B
→ fail closed
```

This prevents a browser/Agent mixed request from silently changing actor identity.

## 9. HTTP failure semantics

Authentication failures must be distinguishable from platform failures.

```text
missing / invalid / ambiguous request Session
→ 401 AUTHENTICATION_REQUIRED

configured request Session Provider unavailable
→ 503 AUTHENTICATION_UNAVAILABLE

unrelated server error
→ existing 500 handling
```

Authentication success remains separate from authorization.

## 10. Authorization boundary

EA-1A does not grant business permission.

Canonical sequence remains:

```text
Session
→ Principal
→ Enterprise Context grants
→ active Context
→ authorization.check
→ operation
```

A valid Session can still receive DENY.

## 11. Persistence

When enabled, Session state uses:

```text
APP_PLATFORM_MANAGED_SESSION_FILE
```

or, when lifecycle state is durable and no explicit Session path is supplied:

```text
<lifecycle-state-directory>/identity-sessions.jsonl
```

The event file is created with restrictive file mode where supported.

Expired/revoked records are retained as bounded lifecycle evidence until a future explicit Session-retention policy exists.

## 12. Security work intentionally deferred to EA-1B

EA-1A does not claim production Human login is complete.

EA-1B must add:

- real authentication via a replaceable Identity Provider;
- OIDC Authorization Code + PKCE first;
- state/nonce/PKCE transaction binding;
- OIDC callback validation;
- login and logout journeys;
- Host issuance of managed Session after successful authentication;
- CSRF/origin protection for cookie-authenticated state-changing browser requests;
- Session rotation at authentication/security-sensitive transitions;
- real production enablement and Human browser proof.

No public External Agent OAuth/MCP endpoint is permitted before this login gate is complete.

## 13. Acceptance for EA-1A

Machine acceptance:

1. TypeScript build passes;
2. raw managed Session token is absent from persistent storage;
3. correct token resolves the Principal;
4. expired token fails closed;
5. revoked token fails closed;
6. rotation invalidates old token;
7. state reconstructs after process restart;
8. Cookie request resolves through `identity.session.request`;
9. ambiguous Cookie + Bearer credentials fail closed;
10. missing Session maps to 401;
11. unavailable Session Provider maps to 503;
12. existing static/bearer Session regression remains green;
13. managed Provider has isolated CI;
14. provider remains disabled by default.

## 14. Non-goals

EA-1A does not implement:

- usernames/passwords;
- password storage;
- OIDC itself;
- SAML;
- passkeys;
- login UI;
- external Agent delegation;
- OAuth Authorization Server;
- MCP;
- user/group administration;
- SCIM;
- full IAM.

Those belong to later accepted slices.
