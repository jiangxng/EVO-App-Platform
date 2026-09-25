# Plugin Runtime Isolation v0.1

**Status:** PROCESS isolation P0 implemented  
**Date:** 2026-09-25  
**Owner:** EVO App Platform

## Purpose

Executable plugins must not run as arbitrary code inside the App Platform process.

The runtime model separates four execution classes:

| Runtime | Isolation | P0 status | Intended use |
| --- | --- | --- | --- |
| DECLARATIVE | HOST | IMPLEMENTED | ordinary declarative Contributions and host-admitted commands |
| WORKER | WORKER | DISABLED | future trusted performance isolation; not treated as a security sandbox |
| PROCESS | PROCESS | IMPLEMENTED P0 | FIRST_PARTY / VERIFIED executable plugins |
| REMOTE | REMOTE | ADAPTER IMPLEMENTED / ADMISSION FAIL-CLOSED | independently operated runtime with Host credential-provider binding |

## PROCESS runtime

A PROCESS plugin runs in a supervised child Node.js process.

The App Platform process never imports the plugin entrypoint directly.

The boundary provides:

- separate OS process and V8 heap;
- minimal inherited environment rather than the App Platform environment;
- no direct reference to App Platform internals;
- asynchronous IPC-only Host API;
- package-scoped permissions, storage and event access;
- declared event-topic enforcement;
- per-invocation timeout;
- configurable JavaScript heap budget;
- forced termination on timeout;
- crash containment;
- lazy restart on the next invocation;
- process termination on Feature deactivation / Package uninstall;
- process shutdown with App Platform termination;
- declared external supply-chain evidence verification before PROCESS launch.

## Entrypoint contract

A PROCESS entrypoint exports:

```js
export async function invoke(request, host) {
  // request.method
  // request.input
}

export async function activate(host) {
  // optional
}

export async function deactivate(host) {
  // optional
}
```

The process-side Host API is asynchronous.

The plugin receives only its scoped facade:

```text
host.packageId
host.permissions.has/granted
host.storage.get/set/delete/list
host.events.publish/subscribe
```

It does not receive a global storage service, global event bus, Package Catalog, LifecycleStore, secrets store or another packageId.

## Admission

Local PROCESS execution requires:

- runtime declaration `PROCESS / PROCESS`;
- a resolvable entrypoint;
- Publisher trust = `FIRST_PARTY` or `VERIFIED`;
- a trusted Ed25519 Package signature;
- a signed `PROCESS_ENTRYPOINT` SHA-256 digest;
- successful re-verification of the actual entrypoint bytes before launch;
- normal Plugin Protocol conformance;
- normal install/permission admission.

Package-integrity authority: `docs/architecture/PLUGIN-PACKAGE-INTEGRITY-v0.1.md`.

`UNVERIFIED` executable packages remain fail-closed for local PROCESS execution.

## Resource controls

P0 supports:

- `runtime.limits.invocationTimeoutMs`;
- `runtime.limits.memoryMb`.

Timeout terminates the child process. The next invocation starts a new process.

The memory value is implemented as a Node/V8 heap budget. It is not a complete operating-system memory/cgroup limit.

## Filesystem and environment posture

The child starts with a minimal environment allowlist rather than inheriting App Platform secrets.

The Node process is started in permission mode with normal filesystem reads scoped to the runtime bootstrap and plugin directory.

This is defense in depth for trusted/verified code.

## Threat model and explicit limitation

**PROCESS P0 is not a hostile-code security sandbox.**

Node's Permission Model is a defense-in-depth mechanism and does not claim security against malicious code. Worker threads also do not provide the isolation boundary required for untrusted executable plugins.

Therefore:

- WORKER is not promoted as a security boundary;
- UNVERIFIED executable code is not admitted to local PROCESS runtime;
- secrets must cross only explicit Host capability boundaries;
- stronger hostile-code isolation belongs to REMOTE/container/microVM/OS-security designs.

Do not weaken this distinction in future documentation.

## Restart semantics

PROCESS runtimes are lazy.

`READY` in manifest/runtime posture means the Host supports and admits the declared runtime. It does not mean a child process is continuously resident.

A child is started on first invocation, remains supervised while useful, and is removed after:

- timeout;
- crash;
- Feature deactivation;
- Package uninstall;
- App Platform shutdown.

After timeout/crash, the next valid invocation may start a clean process.

## Observability

PROCESS runtime emits structured runtime events and bounded aggregate diagnostics owned by App Platform.

Authority: `docs/architecture/PLUGIN-RUNTIME-OBSERVABILITY-v0.1.md`.

## Future work

P0 does not yet provide:

- container/microVM hostile-code sandboxing;
- OS cgroup CPU/RSS quotas;
- network egress policy;
- signed package/artifact verification;
- remote runtime identity/attestation;
- rolling runtime upgrade/state handoff;
- production runtime telemetry dashboards.

Those remain separate foundations and must not be inferred as complete from PROCESS P0.

## REMOTE adapter

The P0 REMOTE adapter is implemented and documented in:

`docs/architecture/PLUGIN-REMOTE-RUNTIME-v0.1.md`

It provides authenticated request/response isolation with `hostAccess: NONE`, strict correlation, timeout handling and signed endpoint metadata.

Normal App Manager admission remains fail-closed until a Host credential-provider capability is resolved.


## External supply-chain evidence

PROCESS Packages may declare additional signed evidence such as `SIGSTORE_BUNDLE`.

Native EVO signature and artifact digest verification always run first.

When Sigstore evidence is declared, PROCESS launch additionally requires the Host Sigstore verifier adapter to validate the bundle against Host-owned certificate issuer/identity policy and transparency evidence. Missing verifier configuration or failed verification is fail-closed.

This does not make Sigstore mandatory for every internal plugin.
