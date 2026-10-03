# EOG Peer-Plugin Extraction Baseline v0.1

**Status:** AUTHORITATIVE EXTRACTION BASELINE  
**Date:** 2026-10-02  
**Parent authorities:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`, `ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md`

## Decision

The EOG three-application family is physically converged. The next work is extraction of preserved capabilities that are peers of EOG, not children of it.

This baseline freezes responsibility and extraction order before moving implementation.

```text
Enterprise Context
= authoritative Business Definition lifecycle/persistence

SOP Designer
= SOP/APQC+time domain semantics, validation and governed editing

EOG 2D/3D Viewers
= graph navigation + aggregation of peer contributions

Runtime Fact / Analysis Providers
= observations and derived analysis

Runtime Binding Adapter
= explicit mapping between Host semantic references and runtime identities
```

## 1. SOP Designer logical identity

SOP Designer remains a valid peer-plugin boundary, but its extraction is currently **DEFERRED**. The active next convergence target is the Runtime Binding Adapter.

Logical role:

`SOP_DESIGNER`

A concrete package id is deliberately not frozen in this baseline. Package naming will be chosen in the package-identity slice, without changing the role boundary.

SOP Designer owns:

- the project-specific SOP domain model: APQC-like process structure + time dimension;
- SOP domain validation;
- create/revise/publish orchestration through Enterprise Context Business Definition authority;
- Human editing actions;
- governed Agent proposal/edit tools;
- compatibility interpretation of the historical `EogExpectedSop*` contract.

SOP Designer does **not** own:

- authoritative Draft/Published/history persistence;
- Enterprise Context lifecycle rules;
- EOG graph authority;
- runtime fact collection;
- bottleneck/SOP conformance/deviation calculation;
- generic report/analysis infrastructure.

The machine term `SOP` remains a compatibility name in v0.1.

## 2. SOP persistence authority

SOP definitions remain Business Definitions in Enterprise Context.

```text
SOP Designer
  ↓ domain-valid mutation request
Enterprise Context Business Definition Repository
  ↓ immutable revision / publication authority
SOP definition truth
```

The existing EOG-named SOP store is a preserved compatibility/migration asset, not future authoritative storage.

## 3. Analysis/provider boundary

The current working assets are preserved:

- EVO Runtime Observatory Provider;
- EOG Bottleneck Analysis Provider;
- SOP conformance/deviation analysis;
- Runtime Facts / Time Lens / Analysis Overlay contracts.

No monolithic Reporting or Analysis plugin is introduced here.

Current target classification:

- existing concrete Provider packages remain peer Providers;
- common Observatory contracts remain public/shared contracts;
- future report/analysis Experience/package portfolio remains **TBD**;
- SOP analysis is not automatically owned by SOP Designer merely because it consumes SOP definitions.

## 4. Runtime Binding Adapter boundary

The existing application-runtime binding assets represent a distinct adapter responsibility.

Logical role:

`RUNTIME_BINDING_ADAPTER`

It owns mapping between Host semantic application references and runtime-provider/runtime-application identities.

It does not own:

- Enterprise Graph definitions;
- SOP definitions;
- Ledger Runtime execution;
- Provider discovery policy;
- Viewer presentation.

Concrete package id remains TBD until the adapter contract is frozen.

## 5. Extraction order

The controlled order is now:

1. preserve the SOP boundary and existing implementation assets without further extraction;
2. freeze Runtime Binding Adapter public contract and package identity;
3. physically extract Runtime Binding Adapter implementation;
4. audit existing Runtime Fact / Analysis Provider packages against public contracts;
5. return to SOP Designer only when SOP product development is explicitly resumed;
6. design additional report/analysis Experience packages only when a concrete product requirement exists.

## 6. Preserved assets

No preserved implementation is deleted during ownership correction.

SOP definition/editor candidates:

- `contracts/enterprise-operating-graph-sop.ts`;
- `manager/enterprise-operating-graph-sop-service.ts`;
- `manager/enterprise-operating-graph-sop-actions.ts`;
- `manager/enterprise-operating-graph-sop-agent-tools.ts`;
- `manager/enterprise-operating-graph-sop-store.ts`.

Runtime binding candidates:

- `contracts/enterprise-operating-graph-application-runtime.ts`;
- `manager/enterprise-operating-graph-application-runtime-service.ts`;
- `manager/enterprise-operating-graph-application-runtime-store.ts`.

Analysis/provider assets stay preserved in place until their own owner boundary is justified.

## 7. Dependency invariants

Peer plugins must communicate through public contracts.

Forbidden:

```text
SOP Designer -> apps/eog-*/private implementation
Runtime Adapter -> apps/eog-*/private implementation
Analysis Provider -> apps/eog-*/private implementation
peer plugin -> manager/private implementation after its cutover
```

Allowed:

```text
peer plugin -> public contracts
peer plugin -> Enterprise Context definition capability
peer plugin -> App Platform provider/capability binding
EOG Viewer -> declared read-only peer contribution
```

## Canonical statement

> SOP Designer owns SOP domain semantics and editing; Enterprise Context owns SOP definition truth; runtime and analysis remain separate peer responsibilities; EOG only designs/navigates the graph and aggregates peer contributions.


## SOP extraction deferral

SOP remains architecturally separate from EOG.

Current status:

```text
SOP domain boundary = DEFINED
SOP preserved implementation = RETAINED
SOP extraction/product development = DEFERRED
EOG dependency on SOP private implementation = FORBIDDEN
```

No new SOP package identity, UI, editor, service abstraction or model expansion should be introduced until SOP work is explicitly resumed.


## Runtime Binding Adapter concrete identity

The active Runtime Binding Adapter target is now concrete:

```text
packageId       = evo-application-runtime-binding-provider
providerId      = evo.application-runtime-binding
capability      = enterprise.application-runtime-binding
providerContract= evo.enterprise.application-runtime-binding
```

It is a headless `PLATFORM_PROVIDER`, not an application Experience.

Its public contract is:

`contracts/enterprise-application-runtime-binding.ts`

The historical `enterprise-operating-graph-application-runtime.ts` path is compatibility-only and MUST NOT be treated as evidence that EOG owns runtime identity binding.

The provider scaffold remains default-OFF until the existing service/store implementation is physically cut over and runtime binding is proven equivalent.


## Runtime Binding Adapter physical ownership

Service and store implementation now belong to:

- `providers/application-runtime-binding/runtime.ts`;
- `providers/application-runtime-binding/store.ts`.

The old `manager/enterprise-operating-graph-application-runtime-*` modules are compatibility re-exports only.

Host bootstrap consumes the provider-owned implementation directly. Existing persisted data remains compatible:

- the binding schema is unchanged;
- the existing default file name remains readable;
- `APP_PLATFORM_EOG_APPLICATION_RUNTIME_BINDING_FILE` remains supported;
- new configuration may use `APP_PLATFORM_APPLICATION_RUNTIME_BINDING_FILE`.

Package lifecycle activation is intentionally deferred to the next slice so implementation ownership and lifecycle cutover remain independently verifiable.


## Runtime Binding Adapter lifecycle cutover

Provider runtime registration and provider availability are deliberately separate.

The runtime may be present in the Host runtime registry, but consumers resolve it only through effective provider descriptors from installed packages:

```text
runtime registry presence
    +
installed package descriptor
    ↓
Provider Resolution
    ↓
Application Runtime Binding Provider
```

Therefore uninstalling/deactivating the provider package removes it from normal resolution without requiring consumers to know implementation details.

Upgrade compatibility:

- a persisted legacy binding snapshot triggers provider-package installation;
- configured EVO Observatory application mappings trigger provider-package installation;
- otherwise the package remains uninstalled; once explicitly or migrationally installed, its sole Provider Feature activates by default;
- runtime consumers resolve the provider through the standard capability resolver rather than directly calling the implementation instance.


## Runtime Binding activation correction — 2026-10-03

The package remains opt-in at the package lifecycle level: it is not installed
unless persisted bindings or configured mappings require it.

Because App Manager installation only activates Features marked
`defaultActivation: true`, the provider's sole Feature now activates when the
package is installed. This corrects the previous impossible state where
bootstrap installed the package but normal provider resolution could never
observe it.


### Legacy installed-but-inactive repair

Hosts upgraded from the earlier `defaultActivation: false` descriptor may
already contain the provider package in durable lifecycle state without its
Feature being active. Bootstrap therefore checks Feature activation, not only
package installation. If such a legacy state is found, the installed package
is enabled to activate its sole provider Feature before provider resolution.
