# Generic OIDC Host Wiring — EA-1B2B v0.1

**Status:** Implementation slice  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent gate:** production-human-login-request-bound-session-v0-1  
**Prerequisites:** EA-1A, EA-1B1, EA-1B2A

## 1. Purpose

EA-1B2B wires the generic OIDC Identity Provider into the real App Platform Host control plane without turning production login on automatically.

The slice connects:

```text
Package Catalog
→ installation / Feature lifecycle
→ Eidos Settings
→ Host Secrets
→ Provider Runtime Registry
→ identity.authenticate resolution
→ Host Authentication Flow
→ Host Managed Session
```

## 2. Safety posture

The OIDC Provider runtime becomes registered only when both ordinary required settings exist:

```text
issuer
clientId
```

Optional confidential-client secret is resolved only through Host Secrets.

Incomplete configuration produces:

```text
runtime absent
```

rather than a partially functional Provider.

If refresh throws:

```text
remove generic.oidc runtime
→ fail closed
```

## 3. Lifecycle separation

Three states remain distinct:

```text
Package present in Catalog
≠ Package installed/Feature active
≠ Provider runtime configured
```

Even if a runtime instance exists in the Host registry, `identity.authenticate` can become effective only through the normal installed/active Provider Contribution lifecycle and deterministic Provider resolution.

No package gains hidden authority from being built into the Host binary.

## 4. Configuration sources

Ordinary non-secret settings:

```text
generic-oidc-identity-provider
├── issuer
├── clientId
└── scopes
```

Secret:

```text
generic-oidc-identity-provider/clientSecret
scope = INSTALLATION/default
```

The client secret MUST NOT be copied into:

- ordinary Settings;
- Package Manifest values;
- browser state;
- logs;
- health text;
- Agent context.

## 5. Runtime refresh

The Host refreshes the OIDC runtime:

- at startup;
- after OIDC Settings changes;
- after OIDC client-secret changes through the normal Settings/Secrets action.

Refresh is deterministic:

```text
read Settings
→ resolve optional Secret
→ validate minimum configuration
→ replace/remove Provider runtime
→ attach health probe
```

No authentication request is sent merely because configuration was saved.

External discovery occurs when the Provider is used or explicitly health-probed.

## 6. Catalog

The Package enters the normal App Platform Catalog as:

```text
generic-oidc-identity-provider
type = PLATFORM_PROVIDER
provides = identity.authenticate
requires = secrets.resolve
```

It follows ordinary Package installation/activation/disable/uninstall rules.

Disable/uninstall removes the effective Provider descriptor even if the process still knows how to construct the implementation.

## 7. Login activation rule

Production cutover MUST use this order:

```text
1. Host encrypted Secrets capability available
2. install Generic OIDC Identity Provider Package
3. configure issuer/clientId/scopes
4. configure clientSecret when required
5. bind/resolve identity.authenticate
6. run Provider health probe successfully
7. configure IdP redirect URI to <public-base>/auth/callback
8. only then enable APP_PLATFORM_MANAGED_SESSION_ENABLED=true
9. execute Human browser login proof
10. execute logout/revocation proof
```

Do not enable the managed login gate first and hope to repair OIDC configuration from behind it.

## 8. Production rollback

If live login fails during cutover:

- do not weaken Principal verification;
- do not silently fall back to forged request identity;
- do not change DENY to ALLOW;
- revert the managed-login enablement/configuration through the deployment control plane;
- preserve Session and authorization evidence.

The static Session Provider remains development/reference compatibility capital and is not production delegated-Agent authority.

## 9. Machine acceptance

EA-1B2B machine acceptance requires:

1. OIDC Package is in the App Platform Catalog;
2. incomplete issuer/clientId leaves runtime absent;
3. complete settings register runtime;
4. clientSecret resolves only through Host Secrets;
5. secret value is absent from runtime health/result metadata;
6. removing required configuration removes runtime immediately;
7. startup configuration does not perform external network I/O;
8. explicit health probe performs discovery and reports health;
9. OIDC Settings/Secrets save refreshes runtime;
10. existing identity/session/authentication CI remains green.

## 10. Live gate remains open

EA-1B2B wiring alone does not close:

`production-human-login-request-bound-session-v0-1`.

Closure still requires one real external OIDC authority and Human browser evidence:

```text
/auth/login
→ real IdP
→ /auth/callback
→ __Host-evo_session
→ /auth/session
→ authorized enterprise use
→ /auth/logout
→ old Session rejected
```

No public External Agent OAuth/MCP endpoint is opened before that proof.

## 11. Next after live login

Once the parent login gate is production-proven:

```text
Capability Operation contract + effective registry
→ External Agent/client identity + delegated Authority Grant
→ OAuth protected resource profile
→ Generic MCP READ/PLAN
→ EA-001 Ledger Runtime blind discovery
```
