# Host Authentication Orchestration — EA-1B1 v0.1

**Status:** Implementation slice  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent gate:** production-human-login-request-bound-session-v0-1  
**Prerequisite:** PRODUCTION-IDENTITY-SESSION-EA1A-v0.1.md

## 1. Decision

Authentication is a replaceable Provider capability.

```text
identity.authenticate
```

The Provider proves Human identity.

The Host owns:

- public callback origin;
- Session issuance;
- Session cookie;
- request-bound Principal resolution;
- logout/revocation;
- same-origin mutation protection;
- transition into Enterprise Context and authorization.

Do not let an Identity Provider own the EVO browser Session.

## 2. Public contract

`IdentityAuthenticationProviderV010` exposes:

```text
begin()
→ authorization redirect

complete()
→ authenticated Human Principal
  + assurance
  + optional local returnTo
```

Provider-specific OIDC/SAML/passkey fields do not enter the Host contract.

## 3. Host routes

When managed production login is explicitly enabled:

```text
GET  /auth/login
GET  /auth/callback
POST /auth/logout
GET  /auth/session
```

The App Host root requires a valid request-bound Session and redirects an unauthenticated browser to `/auth/login`.

Assets and health remain separately available as required for bootstrap/operations.

## 4. Callback origin

The Host uses:

```text
APP_PLATFORM_PUBLIC_BASE_URL
```

as the canonical callback/public origin.

It does not derive authentication callback authority from untrusted request Host or forwarded-host headers.

Non-localhost public authentication origins must be HTTPS.

## 5. Return URL

Provider or request return targets are normalized to a local path.

Forbidden:

```text
https://external.example/...
//external.example/...
backslash-based authority confusion
```

Invalid targets fall back to `/`.

## 6. Human login only

This browser login flow accepts:

```text
principal.actorType = HUMAN
```

Machine/workload External Agents will use a separate credential/grant path later.

Do not fake a Human Session for a SERVICE Principal.

## 7. Session issuance

After successful provider completion:

```text
authenticated Principal
→ Host Managed Session Service
→ new opaque Session
→ __Host-evo_session Cookie
→ redirect to validated local returnTo
```

The Host never places provider access/refresh tokens into the browser Session cookie.

## 8. CSRF boundary

When the managed browser Session Cookie is present, state-changing methods:

```text
POST
PUT
PATCH
DELETE
```

must provide:

```text
Origin == APP_PLATFORM_PUBLIC_BASE_URL origin
```

Missing, malformed or mismatched Origin fails with:

```text
403 CSRF_REJECTED
```

Bearer-only requests do not use this browser-cookie CSRF rule. They remain governed by their own authentication and authorization contracts.

## 9. Failure semantics

```text
no valid request Session
→ 401 AUTHENTICATION_REQUIRED

authentication/session Provider unavailable or Host auth configuration unavailable
→ 503 AUTHENTICATION_UNAVAILABLE

cookie mutation from wrong/missing Origin
→ 403 CSRF_REJECTED
```

Authentication remains separate from authorization.

## 10. Activation safety

The managed Session Provider remains explicitly gated.

Until a real `identity.authenticate` Provider is installed and production configuration is accepted, current production must not enable the managed login gate.

Therefore EA-1B1 changes no current Railway user access by itself.

## 11. Next slice — EA-1B2

Implement a real generic OIDC Identity Provider Package.

Required:

- OpenID Provider discovery;
- Authorization Code flow;
- PKCE S256;
- state;
- nonce;
- strict redirect URI;
- token response validation;
- ID Token validation;
- issuer/audience/expiry/nonce validation;
- stable Principal mapping;
- Host Secrets for client secret when required;
- no raw IdP tokens in ordinary logs/settings/Agent context;
- Provider-focused CI with a deterministic fake OIDC authority;
- real provider configuration and Human browser live proof before declaring the parent login gate closed.

EA-1B1 is not production login completion.
