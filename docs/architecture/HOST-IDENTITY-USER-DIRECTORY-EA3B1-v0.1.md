# Host Identity User Directory — EA-3B1 v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Parent:** EA-3A External Agent delegated authority governance  
**External network exposure:** NONE

## 1. Purpose

EA-3B1 adds the missing current-Human identity boundary required to re-evaluate delegated authority when the authorizing Human has no active browser Session.

It implements:

```text
identity.user-directory
```

as a replaceable Platform Provider contract.

The Host reference implementation stores bounded Human Principal state independently of browser Sessions.

## 2. Why Session is insufficient

A delegated external Agent may act while the Human is offline.

Therefore this is invalid:

```text
Grant
→ require old/live browser Session
→ reconstruct Human authority
```

Browser Session is transport/authentication continuity, not the durable current Human identity directory.

Likewise, an old OIDC ID/access token must not become the durable authority source.

Target:

```text
authorizingPrincipalSubjectId
→ identity.user-directory
→ current ACTIVE Human Principal
→ current Enterprise Context membership
→ current authorization.check
→ current active Capability Operation
→ effective delegated authority
```

## 3. Boundaries

### OIDC / identity.authenticate

Proves Human identity at login time.

### identity.user-directory

Answers:

> Does EVO currently recognize this Human subject as ACTIVE, and what bounded Principal should be used for current platform authorization?

### identity.session.request

Answers:

> Which Human is making this current browser/API request?

### enterprise.membership

Answers:

> Which Enterprise Contexts may this current Human Principal access?

### authorization.check

Answers:

> May this current Principal perform this operation in this current Context?

No one layer replaces another.

## 4. Directory entry

Contract:

```text
IdentityUserDirectoryEntryV010

principal
state:
  ACTIVE
  DISABLED

firstAuthenticatedAt
lastAuthenticatedAt

disabledAt?
disabledBySubjectId?
```

The Principal is bounded and session-independent.

The directory does not persist:

- browser Session credential;
- Session token hash;
- OIDC ID Token;
- OIDC access token;
- refresh token;
- authorization code;
- client secret.

## 5. Authentication transaction ordering

Production authentication must execute:

```text
OIDC Provider validates Human
        ↓
Host identity.user-directory records/refreshes current Principal
        ↓
Host Managed Session is issued
```

Never:

```text
issue Session
→ maybe update directory later
```

If current identity recording fails, Session issuance fails closed.

This avoids:

```text
valid browser Session
+
no current Principal directory truth
```

## 6. Provider identity binding

An existing subject is bound to its recorded identity Provider.

If a second Provider tries to authenticate the same EVO subject id:

```text
IDENTITY_USER_DIRECTORY_PROVIDER_MISMATCH
```

The directory does not silently merge identities.

Future explicit account-linking requires its own governed contract.

## 7. Disablement

Disablement is terminal for the directory entry.

```text
ACTIVE
→ DISABLED
```

A disabled subject cannot self-reactivate merely by successfully authenticating again.

This is intentional.

Reactivation, if ever supported, requires a new explicit identity-governance action rather than accidental login side effects.

## 8. Durable storage

The Host reference implementation supports:

```text
memory store
file-backed store
```

Production default path when `APP_PLATFORM_STATE_FILE` exists:

```text
<state-directory>/identity-user-directory.json
```

Explicit override:

```text
APP_PLATFORM_IDENTITY_USER_DIRECTORY_FILE
```

File persistence uses atomic temporary-file replacement.

## 9. Package / Provider model

Package:

```text
host-identity-user-directory-provider
```

Feature provides:

```text
identity.user-directory
```

Provider:

```text
host.identity-user-directory
```

Contract:

```text
evo.identity.user-directory@0.1.0
```

The runtime exists in Host code, but becomes platform-effective only through the normal Package/Feature/Provider lifecycle.

When production managed Human login is enabled, the Host auto-installs this first-party Provider alongside the managed Session foundation.

## 10. Security semantics

A current directory lookup returning:

```text
not found
DISABLED
provider mismatch
Provider unavailable
```

must not be upgraded into delegated authority.

Login-time behavior:

- Provider unavailable → authentication unavailable / fail closed;
- disabled current Principal → authentication forbidden;
- Provider mismatch → authentication forbidden.

EA-3B2 will apply the same fail-closed posture to delegated Agent authority resolution.

## 11. What this is not

EA-3B1 is not:

- an HR directory;
- an organization chart;
- role management;
- SCIM;
- SAML;
- password storage;
- a local IdP;
- a replacement for OIDC;
- a replacement for Enterprise Context relationships;
- a replacement for authorization policy;
- a public External Agent API.

It is intentionally narrow.

## 12. Machine acceptance

EA-3B1 must prove:

1. first Human authentication records ACTIVE current Principal;
2. repeat authentication refreshes bounded Principal + lastAuthenticatedAt;
3. firstAuthenticatedAt remains stable;
4. browser sessionId is not persisted as durable identity;
5. different identity Provider cannot seize an existing subject;
6. non-Human Principal is rejected;
7. disablement is terminal;
8. successful authentication after disablement cannot self-reactivate;
9. file-backed directory survives restart;
10. directory write occurs before managed Session issuance;
11. directory failure leaves zero newly-issued Session;
12. Host Provider is lifecycle-governed;
13. current identity directory has isolated CI.

## 13. Next — EA-3B2

EA-3B2 should implement the effective delegated authority resolver:

```text
Agent active
∩ Client active
∩ Grant active/unexpired
∩ current authorizing Human from identity.user-directory
∩ current Enterprise Context grant/membership
∩ current active Capability Operation
∩ current authorization.check
∩ Grant allowedOperationIds/effectConstraints
=
effective delegated Capability Operation
```

This must be recomputed at discovery/invocation time.

A durable Grant remains evidence of delegation offered by the Human; it never becomes frozen permanent authority.
