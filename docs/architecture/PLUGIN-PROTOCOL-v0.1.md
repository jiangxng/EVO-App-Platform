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

The validator checks protocol version, ownership, Feature identity, duplicate dependencies, Contribution ownership/namespaces, route requirements, setting-key uniqueness and provider contract declarations.

This validator is protocol conformance, not product correctness.

## LLM rule

For plugin work, an LLM should load:

1. this protocol;
2. the plugin's manifest/context;
3. only the public contracts for capabilities that plugin directly consumes;
4. the plugin's own tests.

It should not load every plugin or the whole ecosystem by default.
