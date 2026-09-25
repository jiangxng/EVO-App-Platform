# Plugin Package Integrity v0.1

**Status:** P0 implemented baseline  
**Date:** 2026-09-25  
**Owner:** EVO App Platform

## Purpose

A plugin Package is not trusted merely because its manifest claims a publisher identity.

EVO App Platform verifies a cryptographic package signature against a Host-owned publisher key trust store and, when executable artifact bytes are available, verifies the declared SHA-256 artifact digest.

## Signature envelope

P0 uses:

- format: `EVO-SIGNATURE-v0.1`;
- algorithm: Ed25519;
- stable publisher id;
- stable key id;
- optional artifact digest;
- optional provenance metadata;
- detached Base64 signature.

The signature covers the canonical Package Manifest together with the integrity metadata except for the signature bytes themselves.

Changing Package identity, version, runtime declaration, permissions, Contributions, artifact digest or provenance metadata invalidates the signature.

## Artifact integrity

P0 supports:

- `PROCESS_ENTRYPOINT` — digest of the executable PROCESS entrypoint;
- `PACKAGE_BUNDLE` — reserved for packaged/bundled distribution artifacts.

Digest format:

```text
sha256:<64 lowercase hex>
```

PROCESS runtime Packages MUST declare a signed `PROCESS_ENTRYPOINT` digest.

REMOTE runtime Packages MUST also be signed. Their signed Manifest binds the remote endpoint, protocol, auth audience and Host-access mode; no local artifact digest is required by REMOTE P0.

App Platform verifies the signature during install planning and re-verifies the actual entrypoint bytes before PROCESS execution.

## Trust store

The Host owns the publisher-key trust store.

A key record contains:

- publisherId;
- keyId;
- algorithm;
- publicKeyPem;
- TRUSTED / REVOKED status;
- optional source metadata.

The runtime configuration variable is:

`APP_PLATFORM_PLUGIN_TRUST_STORE_FILE`

Trust state is never inferred from a Package-provided public key.

Unknown or revoked keys fail closed for signed packages.

## Admission behavior

| Integrity state | Declarative package | PROCESS package |
| --- | --- | --- |
| VERIFIED | allowed | allowed if all other runtime rules pass |
| PENDING_ARTIFACT | allowed | PROCESS install may proceed; actual bytes MUST verify before launch |
| UNSIGNED | P0 allowed | blocked for PROCESS/REMOTE |
| UNTRUSTED | blocked | blocked |
| INVALID | blocked | blocked |

Unsigned declarative packages remain temporarily supported for backward compatibility during the pre-1.0 phase. This does not mean unsigned distribution is the long-term target.

## Provenance

The P0 envelope reserves provenance types:

- `INTERNAL_CI`;
- `OIDC_CI`;
- `SIGSTORE_BUNDLE`.

Provenance metadata is signed, but P0 does not yet independently validate external Sigstore transparency-log inclusion or OIDC workflow identity.

This is intentional: EVO's native Package protocol keeps a provider-neutral verification boundary while allowing future integration with modern supply-chain systems.

## Future convergence

Preferred future direction:

```text
source repository
→ trusted CI identity (OIDC)
→ reproducible package build
→ artifact digest
→ provenance attestation
→ signature / transparency evidence
→ EVO catalog admission
→ Host verification
```

Public ecosystems may use Sigstore-compatible bundles/transparency logs. Private enterprise catalogs may use internal PKI/KMS/HSM-backed keys and private provenance.

The protocol should verify evidence without requiring one specific public provider.
