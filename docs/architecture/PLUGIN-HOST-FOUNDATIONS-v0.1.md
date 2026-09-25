# Plugin Host Foundations v0.1

**Status:** P0 implemented baseline  
**Date:** 2026-09-25  
**Primary integration:** EVO App Platform + Eidos

## Scope

This document records the first stable host foundations required before broad plugin expansion.

The implementation intentionally separates **declared protocol/admission** from **executable runtime isolation**. A capability is not considered implemented merely because a manifest field exists.

## 1. Host compatibility

Package manifests may declare compatibility ranges for:

- EVO App Platform;
- Eidos;
- EVO Plugin Protocol.

Supported P0 range forms include exact versions, comparison ranges such as `>=0.1.0 <0.2.0`, caret ranges and tilde ranges.

Installation fails closed when a declared host range is incompatible.

Packages that omit host ranges remain backward-compatible but are shown as **UNKNOWN** compatibility in Extension Manager. A future protocol revision may make explicit ranges mandatory.

## 2. Activation and lifecycle

Feature activation supports:

- `EAGER` — activated during normal installation when defaultActivation is true;
- `ON_DEMAND` — package/dependencies are prepared during install while the Feature remains inactive until a declared activation event is delivered.

App Manager exposes event-driven activation internally and emits lifecycle events for:

- package installed;
- feature activated;
- feature deactivated;
- package uninstalled.

Lifecycle events are host facts, not business-domain events.

## 3. Permissions and trust

A Package may declare:

- publisher identity/source/trust level;
- requested permissions with LOW / MEDIUM / HIGH risk;
- whether a permission is required and why.

Unverified publisher trust and requested permissions require explicit user approval.

Approval is enforced by App Platform server-side admission, not only by an Eidos confirmation dialog.

Granted permissions and trust approval are persisted with the installed Package record.

Dependencies that independently require trust/permission approval fail closed until a separate dependency-approval flow exists.

## 4. Plugin Runtime isolation

Runtime declarations support:

- `DECLARATIVE / HOST`;
- `WORKER / WORKER`;
- `PROCESS / PROCESS`;
- `REMOTE / REMOTE`.

P0 now implements **PROCESS / PROCESS** for FIRST_PARTY and VERIFIED executable packages.

PROCESS execution uses a supervised child process with minimal inherited environment, package-scoped asynchronous Host API over IPC, invocation timeout, V8 heap budget, crash containment and lazy restart.

`WORKER / WORKER` remains disabled as a security boundary because Worker threads are not treated as a sandbox.

`REMOTE / REMOTE` remains fail-closed until a governed remote runtime adapter exists.

`UNVERIFIED` executable packages remain fail-closed for local PROCESS execution.

Authority and threat model: `docs/architecture/PLUGIN-RUNTIME-ISOLATION-v0.1.md`.

PROCESS P0 is a process/reliability/Host-capability isolation boundary for trusted/verified plugins. It is explicitly **not** claimed as hostile-code sandboxing.

## 5. Runtime dispatch

Executable plugin invocation has one Host-owned dispatch boundary.

```text
installed Package + active Feature
→ Runtime Dispatcher
→ PROCESS or REMOTE Runtime Host
```

The dispatcher rejects uninstalled or inactive Packages and keeps runtime-specific mechanics out of business plugins.

DECLARATIVE packages continue through declarative Contribution/Action contracts. WORKER remains disabled as a security boundary.

There is no generic unauthenticated HTTP method-execution backdoor.

## 6. Plugin Storage and Events

App Platform owns host services for plugin-local state and events.

### Storage

- package namespace isolation;
- optional per-package byte quota;
- memory and file-backed host stores;
- plugins receive a scoped facade and never select another packageId;
- persisted application/business data still belongs to the owning plugin/domain, not automatically to this key/value service.

### Events

- publishers may publish only topics declared in their manifest;
- published topics must be namespaced by packageId;
- subscribers may subscribe only to declared topics;
- plugins receive a scoped event facade rather than the global bus.

## 6. Package integrity and supply-chain trust

App Platform verifies signed Package metadata against a Host-owned publisher key trust store.

PROCESS runtimes require a signed PROCESS_ENTRYPOINT digest and the actual entrypoint bytes are re-verified before execution.

Unsigned declarative Packages remain P0-compatible during the pre-1.0 transition; invalid or untrusted signed Packages fail admission.

Authority: `docs/architecture/PLUGIN-PACKAGE-INTEGRITY-v0.1.md`.

## 7. Runtime observability

PROCESS runtime emits structured lifecycle/invocation events into a bounded App Platform diagnostic store.

Extension Manager may display aggregate health, invocations, failures, timeouts, crashes and restarts.

Authority: `docs/architecture/PLUGIN-RUNTIME-OBSERVABILITY-v0.1.md`.

## 8. Extension Manager

The Eidos Extension Manager now presents:

- lifecycle state;
- host compatibility;
- publisher trust;
- requested/granted permissions;
- activation mode/events;
- runtime/isolation posture;
- storage availability;
- event publish/subscribe counts;
- recent runtime operational history;
- Contributions and Capabilities;
- install/open/configure/disable/enable/uninstall actions.

App Platform supplies the truth. Eidos renders it without owning lifecycle/security semantics.

## 9. Workbench usability

Current P0 Workbench improvements include:

- Eidos Productive Design Language;
- Eidos semantic Icon System;
- resizable/hideable Side Panel;
- mobile single-surface behavior;
- visible focus and semantic icon controls;
- Ctrl/Cmd+B to toggle Side Panel;
- Ctrl/Cmd+L to focus/select the workspace target.

Further usability work is evidence-driven and belongs to Eidos before plugin-specific forks.

## Status matrix

| Foundation | P0 status | Next |
| --- | --- | --- |
| Host compatibility | IMPLEMENTED | make explicit ranges mandatory in a future protocol revision |
| Activation/lifecycle | IMPLEMENTED P0 | activation event sources and runtime supervision |
| Permissions/trust | IMPLEMENTED P0 | richer permission scopes, policy/enterprise admin approval |
| Runtime isolation | PROCESS P0 + REMOTE ADAPTER IMPLEMENTED | bind remote-auth Provider; container/microVM hostile-code isolation; OS-level CPU/RSS/network policy |
| Package integrity/signing | IMPLEMENTED P0 | CI/KMS signing workflow, bundle-level artifacts, provenance verification |
| Runtime observability | IMPLEMENTED P0 | durable telemetry sink, OpenTelemetry/SLO integration |
| Plugin Storage | IMPLEMENTED P0 | durable production backend, migration/versioning |
| Plugin Events | IMPLEMENTED P0 | durable/evented transport where required, delivery guarantees |
| Extension Manager | IMPLEMENTED P0 | filtering/search, richer details/history/update flows |
| Workbench UX | CONTINUOUS | tabs/history/command surfaces and usability validation |

## CI rule

These host foundations are tested by App Platform protocol/core tests and focused App Platform ↔ Eidos integration.

They do not require EVO Ledger Runtime, Experience Compiler or unrelated plugin product CI.


## Remote credential Provider

REMOTE executable plugins authenticate through the generic `plugin.remote-credential` Provider capability.

The reference Host Provider is an installable `PLATFORM_PROVIDER`. Provider descriptor activation and Provider Runtime registration are both required for REMOTE readiness.

Secrets remain outside Package manifests and Eidos settings.


## Supply-chain evidence

Package integrity supports layered evidence:

```text
EVO Ed25519 Package signature
+ artifact SHA-256
+ optional SLSA provenance
+ optional Sigstore bundle verification
```

Trust policy remains Host-owned. A Package cannot self-authorize signing keys, builder identities, OIDC issuers or workflow identities.

Declared Sigstore evidence is enforced before PROCESS launch.
