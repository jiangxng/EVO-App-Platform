# EVO Plugin Protocol v0.1

**Status:** P0 baseline  
**Protocol version:** `0.1.0`  
**Authority:** EVO App Platform

## Purpose

The Plugin Protocol is the stable **native EVO plugin** boundary between the App Platform and independently developed plugins.

It is not an MCP replacement and MCP is not a replacement for it. Native plugins use Package / Feature / Capability / Contribution semantics inside EVO. MCP/OAuth may be used separately when EVO or a plugin connects to an external system.

A normal plugin change MUST NOT trigger CI for unrelated plugins.

A normal App Platform change MUST NOT execute every plugin's product test suite.

## Canonical model

```text
Package
  -> Feature
      -> Capability dependencies/provisions
      -> Contribution
```

The current protocol surface is intentionally small:

- package identity + version;
- feature identity + activation scope;
- required/provided capabilities;
- versioned Contributions;
- lifecycle visibility;
- host compatibility ranges;
- publisher trust + requested permissions;
- EAGER / ON_DEMAND Feature activation;
- runtime declaration: DECLARATIVE / WORKER / PROCESS / REMOTE;
- package-scoped storage/event declarations;
- publisher-key package integrity envelope and artifact digest;
- provenance metadata;
- deterministic manifest conformance.

Plugins depend on public contracts/capabilities, never another repository's private code.

Native plugins do not need to expose an MCP server or perform OAuth merely to run inside EVO. Those protocols are introduced only when an independent external integration boundary requires them.

## Protocol version

For the current pre-1.0 phase, plugins pin the exact Plugin Protocol version.

`PackageManifestV010.contractVersion = 0.1.0`

A protocol change is explicit. Compatibility is never inferred from repository names, branches or chat history.

## CI isolation constitution

### Platform CI

App Platform PR CI validates only:

- Plugin Protocol parser/validator;
- Package/Feature/Contribution lifecycle engine;
- dependency/capability resolution;
- generic App Host composition;
- generic settings/localization/action routing primitives;
- synthetic reference fixtures.

Platform CI does **not** run Enterprise Agent, OpenAI Provider, Ledger Configurator, Trading Lite or future plugin product suites merely because the platform changed.

### Plugin CI

A plugin PR validates only that plugin:

1. its manifest conforms to this protocol;
2. its own unit tests pass;
3. its own Contributions are internally valid;
4. its direct public-contract adapter tests pass;
5. its install/enable/disable/uninstall lifecycle test passes against a lightweight host fixture when applicable.

A plugin must not recursively trigger CI for unrelated plugins.

### Ecosystem certification

Full ecosystem compatibility is a separate concern.

It runs:

- when Plugin Protocol changes materially;
- on scheduled/nightly certification;
- before release milestones;
- when a human/LLM explicitly requests cross-project certification.

It is not part of the ordinary plugin feedback loop.

## Runtime projects

EVO Ledger Runtime, Eidos and Enterprise Agent/EC are independent products/capabilities.

A plugin that needs them declares public capabilities/contracts. Its ordinary CI uses contract fixtures/fakes where sufficient.

Only the plugin's own direct integration compatibility test may start a real dependency runtime, and that test still does not trigger unrelated plugins.

## Repository topology

A plugin may live:

- temporarily inside EVO App Platform;
- in a dedicated repository;
- in another maintained repository.

The protocol is identical in every case.

The long-term target is that significant plugins are independent CI units. Existing in-repository plugins are transitional assets and will move behind this same protocol without changing their product identity.

## Conformance API

The App Platform exposes a language-level reference validator:

`validatePluginManifestV010(manifest)`

and a fail-fast helper:

`assertPluginManifestV010(manifest)`

The validator checks protocol version, ownership, Feature identity, duplicate dependencies, Contribution ownership/namespaces, route requirements, setting-key uniqueness, provider contract declarations, compatibility declarations, permission metadata, activation events, runtime/isolation pairing, executable entrypoints, runtime resource budgets, storage quotas and event-topic ownership.

This validator is protocol conformance, not product correctness.

## LLM rule

For plugin work, an LLM should load:

1. this protocol;
2. the plugin's manifest/context;
3. only the public contracts for capabilities that plugin directly consumes;
4. the plugin's own tests.

It should not load every plugin or the whole ecosystem by default.


## Executable runtime boundary

Executable runtime semantics are owned by App Platform and documented in:

`docs/architecture/PLUGIN-RUNTIME-ISOLATION-v0.1.md`

A manifest declaring executable code does not grant execution authority.

Current admission:

```text
DECLARATIVE / HOST → supported
PROCESS / PROCESS  → supported for FIRST_PARTY / VERIFIED publishers
WORKER / WORKER    → fail-closed
REMOTE / REMOTE    → fail-closed
UNVERIFIED local executable code → fail-closed
```

PROCESS plugins access Host capabilities only through the scoped IPC Host API.


## Package integrity

Supply-chain integrity is part of native Plugin Protocol admission.

Authority:

`docs/architecture/PLUGIN-PACKAGE-INTEGRITY-v0.1.md`

PROCESS packages require a signed `PROCESS_ENTRYPOINT` digest. Invalid/untrusted signatures fail admission. The Host owns trusted keys; Packages cannot self-declare trusted public keys.


## REMOTE runtime

REMOTE execution protocol authority:

`docs/architecture/PLUGIN-REMOTE-RUNTIME-v0.1.md`

P0 requires HTTPS, a signed Manifest, Host-injected bearer credentials and `hostAccess: NONE`.

The adapter exists, but normal platform admission remains fail-closed until the required credential-provider capability is bound.


## Portable manifest schemas

Plugin Protocol v0.1 publishes portable JSON Schema Draft 2020-12 contracts:

```text
contracts/schema/plugin-package-v0.1.schema.json
contracts/schema/plugin-feature-v0.1.schema.json
```

These are the normal entry point for independent plugin repositories, IDEs and LLM tooling.

Validation has two layers:

1. JSON Schema — portable structural validation;
2. `validatePluginManifestV010(...)` — canonical semantic/ownership/policy validation.

Structural schema does not replace semantic validation for rules such as Package/Feature ownership, namespace ownership, event namespace ownership, HTTPS remote policy or host admission.

A local manifest can be checked with:

```bash
npm run plugin:validate -- examples/plugin-manifest.minimal.json
```

An incompatible schema change requires an explicit Plugin Protocol version change.


## Package Secret requirements

A Package may declare Secret requirements through `PackageManifestV010.secrets`.

The declaration is metadata-only:

```text
key
label
description?
scope
required?
```

Secret values, encrypted payloads and credential defaults are forbidden Manifest content.

A Package declaring one or more Secrets MUST explicitly require the `secrets.resolve` Capability in its Feature dependency graph. This keeps install planning portable and prevents a Secret-dependent Package from appearing ready without an admitted Secrets Provider.

The Host owns collection, authorization, storage, audit and resolution. Packages consume the public Secret reference/resolver contracts and must not depend on Railway variables, filesystem paths or a specific Vault/KMS implementation.

See `PLATFORM-SECRETS-v0.1.md`.


## Callable Capability Operations

Plugin Protocol v0.1 includes the declarative Contribution:

```text
kind: platform.capability-operation
```

Authority:

`docs/architecture/PLATFORM-CAPABILITY-OPERATION-EA2A-v0.1.md`

This Contribution is distinct from `providesCapabilities`:

```text
providesCapabilities
= dependency / availability declaration

platform.capability-operation
= stable callable semantic operation
```

The operation declares:

- stable operation id + version;
- owning Capability;
- title/description;
- READ / PLAN / WRITE effect;
- explicit data ownership scope: SYSTEM / INSTALLATION / ENTERPRISE / COMPANY / WORKSPACE / USER;
- authorization action + resource semantics;
- JSON Schema input/output;
- ACTION_HOST execution binding;
- explicit eligible consumer classes;
- mandatory Host idempotency + receipt requirement for WRITE.

The owning Feature MUST provide the declared Capability.

Operation ids are capability-namespaced and globally unique among effective active Features. Active collisions fail closed.

App Manager exposes only operations contributed by currently active Features. Disable/uninstall therefore removes the operation from the effective registry automatically.

This Contribution does not itself grant authorization and does not create an external endpoint.

EA-2C uses the declared `dataScope` and `authorization` metadata with the
Host-resolved Principal/Context and the existing `authorization.check`
Provider to derive an authorized catalog and to guard direct ACTION_HOST
invocation. Missing/errored authorization or unavailable required scope fails
closed.

`EXTERNAL_AGENT` remains only exposure eligibility until explicit delegated
Agent authority is introduced in EA-3.

Authority:
`docs/architecture/AUTHORIZED-CAPABILITY-OPERATION-CATALOG-EA2C-v0.1.md`.
