# Plugin Remote Runtime v0.1

**Status:** Adapter + credential Provider binding implemented; admission is readiness-gated  
**Date:** 2026-09-25  
**Owner:** EVO App Platform

## Purpose

REMOTE Runtime provides a stronger execution boundary than local in-process or child-process execution by moving executable plugin code outside the App Platform host.

P0 is intentionally narrow:

- remote runtime receives explicit invocation input only;
- remote runtime receives no Host Storage/Event/Secrets callback API;
- credentials are injected by a Host credential provider;
- Package Manifest contains no bearer token or long-lived secret;
- signed Package metadata binds the remote endpoint, audience and runtime declaration;
- App Platform validates strict request/response correlation and timeout behavior.

## Manifest model

A REMOTE runtime declares:

```text
kind: REMOTE
isolation: REMOTE
remote.protocol: EVO-REMOTE-RUNTIME-v0.1
remote.endpoint: https://...
remote.hostAccess: NONE
remote.auth.scheme: HOST_BEARER
remote.auth.audience: <stable audience>
```

The Package must be cryptographically signed.

The signature covers the endpoint and auth audience because they are part of the signed Package Manifest.

## Credential boundary

The Manifest does not contain credentials.

The runtime adapter requires a Host-side credential Provider capability.

P0 capability:

`plugin.remote-credential`

Reference Package:

`host-remote-credential-provider`

Reference Provider runtime:

`host.remote-bearer`

The Provider is a normal `PLATFORM_PROVIDER` contribution and is resolved through the shared Provider Runtime Registry.

The reference runtime reads secret material only from the Host secret boundary:

`APP_PLATFORM_REMOTE_BEARER_TOKENS_JSON`

The Package Manifest contains only metadata describing the secret boundary; bearer values are never Package data.

Credential contract:

```text
getBearerToken(packageId, audience, endpoint)
→ short-lived bearer token
```

Long-lived provider secrets belong to the secure Provider/Secrets boundary.

P0 adapter sends only:

```http
Authorization: Bearer <host-injected token>
Content-Type: application/json
```

Redirects are rejected.

## Invocation protocol

Request:

```json
{
  "contractVersion": "0.1.0",
  "protocol": "EVO-REMOTE-RUNTIME-v0.1",
  "invocationId": "<uuid>",
  "packageId": "<package>",
  "packageVersion": "<version>",
  "method": "<method>",
  "input": {}
}
```

Response must echo the exact:

- contractVersion;
- protocol;
- invocationId;
- packageId.

A correlation mismatch fails closed.

## Host capability boundary

P0 uses:

`hostAccess: NONE`

Therefore a REMOTE P0 Package cannot directly declare/use Plugin Storage or Plugin Events.

This is deliberate.

A future remote Host-capability RPC protocol must be designed as a separate, capability-scoped contract. P0 does not expose callbacks, App Platform internals or a generic arbitrary Host API over the network.

## Security posture

P0 requires:

- HTTPS endpoint in Plugin Protocol conformance;
- FIRST_PARTY or VERIFIED publisher posture;
- trusted signed Package Manifest;
- Host-injected credentials;
- redirect rejection;
- invocation timeout;
- strict response correlation;
- structured runtime diagnostics.

Tests may explicitly permit insecure loopback HTTP. Production protocol conformance does not.

## Current admission state

The REMOTE adapter itself is implemented and tested.

App Manager installation evaluates Host-specific runtime readiness.

A REMOTE Package is READY only when all of the following are true:

- signed/trusted REMOTE metadata is valid;
- the Remote Runtime adapter is supported;
- an active `plugin.remote-credential` Provider descriptor exists;
- a matching Provider Runtime is registered.

If either the Provider Package or its configured runtime is absent, admission remains fail-closed.

The canonical execution path is now:

```text
installed + active Package
→ Plugin Runtime Dispatcher
→ resolve Remote Credential Provider runtime
→ REMOTE Runtime adapter
→ signed endpoint invocation
```

If no credential Provider runtime is resolved, REMOTE invocation remains fail-closed with `PLUGIN_REMOTE_CREDENTIAL_PROVIDER_UNAVAILABLE`.

The dispatcher is an internal Host boundary; App Platform intentionally does not expose a generic unauthenticated HTTP endpoint for arbitrary plugin method execution.

Next maturity milestones:

```text
OAuth / workload-identity credential Provider Packages
→ scope/policy-aware Provider selection
→ token rotation / expiry telemetry
→ mTLS or workload attestation where required
```

## Not yet implemented

- remote Host Storage/Event callback protocol;
- mTLS workload identity;
- runtime attestation;
- signed remote deployment/image identity;
- container/microVM provisioning;
- network egress policy of the remote workload;
- multi-region routing/failover;
- remote session/state handoff.

Those are separate foundations and must not be inferred from the existence of the P0 adapter.
