# Generic OIDC Identity Provider — EA-1B2A v0.1

**Status:** Implementation slice  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent gate:** production-human-login-request-bound-session-v0-1  
**Prerequisites:** EA-1A Host Managed Session + EA-1B1 Host Authentication Orchestration

## 1. Purpose

EA-1B2A implements the protocol-critical core of the first real replaceable Human Identity Provider.

It does not enable production login by itself.

The Provider owns:

- OIDC discovery;
- Authorization Code flow;
- PKCE S256;
- state;
- nonce;
- token exchange;
- JWKS retrieval;
- RS256 ID Token verification;
- issuer/audience/azp/expiry/nonce validation;
- stable OIDC Principal mapping.

The Host continues to own:

- public callback origin;
- browser Session issuance;
- Session cookie;
- Session revocation/rotation;
- request-bound Principal resolution;
- CSRF;
- authorization;
- Enterprise Context grants.

## 2. Supported protocol profile

P0 profile:

```text
OpenID Connect
Authorization Code
PKCE S256
ID Token RS256
Discovery
JWKS
public client or client_secret_basic
```

This profile intentionally starts narrow and safe.

Later algorithm/client-auth expansion requires explicit compatibility tests.

## 3. Transaction security

Each login start creates one bounded transaction:

```text
state
nonce
code_verifier
callback URL
returnTo
createdAt
```

State is consumed before token exchange.

Therefore callback replay fails closed even if token exchange or later validation fails.

Transaction state is ephemeral by design in this slice. A Host restart during an in-progress login requires the Human to restart login rather than attempting recovery from partially persisted protocol secrets.

## 4. Discovery

Configured input:

```text
issuer
clientId
scopes
optional clientSecret
```

Endpoints come from discovery metadata, not independent ordinary Settings.

The discovered issuer must exactly equal the configured issuer.

Production endpoints must be HTTPS except localhost development.

Redirect following is disabled for security-sensitive protocol fetches.

## 5. PKCE

Every authorization request uses:

```text
code_challenge_method=S256
```

The code verifier remains server-side and is sent only to the token endpoint.

## 6. ID Token validation

The first accepted algorithm is:

```text
RS256
```

Validation includes:

- three-part JWT structure;
- alg = RS256;
- kid present;
- matching RSA signing JWK;
- cryptographic signature;
- exact issuer;
- client audience;
- azp when multiple audiences exist;
- non-empty subject;
- expiration;
- future-issued guard;
- exact nonce.

Unknown signing kid triggers one JWKS refresh before failure so ordinary key rotation can converge.

## 7. Principal mapping

OIDC subject identity is issuer-scoped.

The Provider does not use bare `sub` as EVO subject identity.

Conceptually:

```text
subjectId
= oidc:<issuer-digest>:<sub>
```

This prevents subjects from two IdPs colliding.

Only bounded useful claims are projected into the EVO Principal.

Raw ID Token, access token and refresh token are not returned as Principal claims.

## 8. Client secret

The Package declares an optional:

```text
clientSecret
```

Secret value belongs to `secrets.resolve`.

It is not ordinary Settings, Package Manifest value, browser-readable state or Agent context.

EA-1B2B will wire the installed Package to Host Secrets at runtime.

## 9. Package boundary

Package:

```text
generic-oidc-identity-provider
```

provides:

```text
identity.authenticate
```

It does not provide:

```text
identity.session.request
```

That separation is deliberate:

```text
OIDC Provider
→ authenticate Human

Host Managed Session Provider
→ own EVO request Session
```

## 10. Deterministic Provider CI

The Provider has isolated CI using a fake OIDC authority.

Tests prove:

- discovery;
- Authorization Code request;
- PKCE S256;
- state + nonce;
- successful ID Token verification;
- bounded Human Principal;
- callback replay denial;
- nonce mismatch denial;
- audience mismatch denial;
- expired-token denial;
- unsupported-alg denial;
- discovery issuer mismatch denial;
- optional client_secret_basic;
- discovery health probe.

No real external IdP is required for ordinary plugin CI.

## 11. Not yet production enabled

EA-1B2A does not yet:

- register the runtime into the Host Provider Runtime Registry;
- resolve issuer/clientId/scopes from Eidos Settings;
- resolve clientSecret from Host Secrets;
- activate the Provider in Railway;
- configure a real external IdP;
- run Human browser live proof.

Those are EA-1B2B.

## 12. EA-1B2B acceptance target

EA-1B2B should complete:

```text
install/configure OIDC Provider
→ resolve client secret through Host Secrets
→ register runtime
→ bind identity.authenticate
→ enable Host Managed Session login
→ Human /auth/login
→ real IdP
→ /auth/callback
→ Host Session Cookie
→ /auth/session
→ logout
→ revoked Session denied
```

Only after real Human browser proof may the parent production login gate be closed.

## 13. Security references

Protocol direction follows:

- OpenID Connect Core / Discovery;
- RFC 7636 PKCE;
- RFC 8414 metadata direction where applicable;
- RFC 9700 OAuth 2.0 Security BCP.

EVO remains responsible for its own Principal, Session, authorization and delegated Agent authority semantics.
