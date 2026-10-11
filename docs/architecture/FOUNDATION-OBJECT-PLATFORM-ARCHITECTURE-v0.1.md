# EVO Foundation Object Platform Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-07  
**Owner:** EVO-App-Platform control plane + domain Application plugins  
**Applies to:** Counterparty first, then Item/Product, Warehouse/Location and later Foundation Objects

## 1. Purpose

Counterparty is the first Foundation Object reference implementation. It MUST NOT
become the container for generic import, extension, projection, permission, workbench
or LLM-adaptation infrastructure.

The target is:

> **Object plugins own domain semantics. Shared Foundation Object infrastructure owns
> reusable mechanisms. App Platform Core owns only generic hosting/governance.**

This prevents the next objects from cloning Counterparty-specific infrastructure.

## 2. Architectural layers

~~~text
EVO-App-Platform Core
  package/feature lifecycle
  capability/provider resolution
  authorization invocation
  Enterprise Context governance
  ActionHost / routing / composition
        |
        v
Foundation Object shared contracts + reusable services
        |
        +------------------------+-----------------------+
        |                        |                       |
        v                        v                       v
Counterparty Plugin          Item Plugin          Warehouse Plugin
domain semantics             domain semantics     domain semantics
        |
        v
Business Applications
Sales / Procurement / Inventory / Manufacturing / ...
        |
        v
EVO deterministic runtime when BusinessData/Ledger semantics are required
~~~

Eidos and Experience-Compiler remain peer projects:

~~~text
Eidos
  deterministic Human Experience primitives

Experience-Compiler
  persistent industry/enterprise learning, reasoning and proposals

EVO
  deterministic BusinessData -> Posting/Ledger/Balance/Replay runtime
~~~

### 2.1 Enterprise Context is the persistent data plane

The canonical Enterprise Context authority is:

`docs/architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`

Foundation Object architecture MUST preserve its central rule:

> **Enterprise Context provides space. Plugins define what resources in that space mean.**

A useful mental model remains:

~~~text
Docker Volume
  = workload-independent persistent storage boundary

Enterprise Context
  = plugin/application-independent enterprise persistent resource boundary
~~~

The analogy is logical, not physical. Enterprise Context is not one database or one
JSON table.

For Foundation Objects:

~~~text
Counterparty / Item / Warehouse plugin
  owns semantic meaning, validation, commands and queries
        |
        | Enterprise Resource public contract
        v
Enterprise Context Resource Library
  owns enterprise scope, namespace, addressing, access, lifecycle,
  provenance and persistence boundary
        |
        +-- DOCUMENT
        +-- TABLE
        +-- OBJECT
        +-- REFERENCE
~~~

Plugin lifecycle and enterprise data lifecycle remain separate:

~~~text
uninstall Counterparty plugin
  != delete evo.counterparty resources

reinstall + bind
  -> attach existing namespace/resources
  -> validate/migrate schema when required
~~~

Enterprise Context Core MUST NOT understand Customer, Supplier, Item, Warehouse,
ImportJob business meaning, custom-field semantics or Projection semantics merely
because those resources are stored inside it.

### 2.2 Durable-state placement

Default durable placement for this program:

| State | Durable authority / location | Semantic owner |
| --- | --- | --- |
| Counterparty Subject / Roles / Profiles | Enterprise Context Resource Library, `evo.counterparty` | Counterparty plugin |
| Item / Product resources | Enterprise Context Resource Library, object namespace | Item plugin |
| Warehouse / Location resources | Enterprise Context Resource Library, object namespace | Warehouse plugin |
| ObjectExtensionDefinition + extension values | Enterprise Context Resource Library, dedicated extension namespace | Object Extension application |
| Import Mapping Profiles / committed receipts / enterprise import policy | Enterprise Context Resource Library, import namespace | Data Import application |
| Large/transient staging payload | object/reference/provider storage addressed from enterprise-scoped ImportJob; retention policy explicit | Data Import application |
| ResponsibilityAssignment | Enterprise Context Resource Library, responsibility namespace | Responsibility application |
| shared enterprise Projection/View definitions | Enterprise Context Resource Library, projection namespace or owning domain resource | Projection/owning application |
| personal saved layout/favorites/presentation preference | Personal Context | Personal/workbench capability |
| shared templates | Template Store | Template Store |
| EC learned industry knowledge / adaptation methods | Experience-Compiler | Experience-Compiler |
| BusinessData / Posting / Ledger runtime facts | EVO Runtime or owning deterministic runtime boundary | EVO / owning runtime |
| derived projection cache/materialization | owning Projection/provider implementation; rebuildable, not master truth | Projection/provider |

The Resource Library is the enterprise persistence boundary even when payload bytes are
stored through TABLE/OBJECT/REFERENCE profiles or a replaceable provider.

### 2.3 Container ownership versus semantic ownership

Use the word "owns" precisely.

~~~text
Enterprise Context owns:
  enterprise persistence/isolation/access/resource lifecycle boundary

Plugin/Application owns:
  schema meaning
  business invariants
  domain lifecycle
  commands/queries
  interpretation/version semantics
~~~

Therefore "enterprise-owned truth stored in Enterprise Context" MUST NOT be shortened
into "Enterprise Context understands/owns the business semantic."


## 3. What belongs inside a Foundation Object plugin

A domain object plugin owns only semantics specific to that object.

For Counterparty:

- Counterparty identity and lifecycle;
- Counterparty roles such as CUSTOMER / SUPPLIER;
- Counterparty-specific shared Profiles/Facets when accepted;
- Counterparty validation invariants;
- Counterparty queries and mutations;
- Counterparty import-target adapter;
- Counterparty projection-source descriptor;
- Counterparty extension slots;
- Counterparty Agent operation descriptors;
- Counterparty-specific fixtures/tests.

It MUST NOT own:

- generic ImportJob/Staging/Mapping framework;
- generic enterprise custom-field registry;
- generic effective-schema compiler;
- generic saved-view/workbench system;
- generic authorization engine;
- generic Personal Workbench;
- generic LLM semantic classifier;
- reusable Eidos Object Page/List/Import renderers;
- Item/Warehouse semantics.

The same rule applies to every future object plugin.

## 4. Shared code topology

Target repository layout:

~~~text
contracts/
  foundation-object/
    descriptor.ts
    schema.ts
    extension.ts
    import.ts
    projection.ts
    responsibility.ts
    adaptation.ts

foundation/
  schema-compiler/
  extension-runtime/
  validation/
  projection-runtime/
  testkit/

apps/
  object-extension/
  data-import/
  enterprise-adaptation/
  responsibility/
  counterparty/
  item/
  warehouse/

providers/
  ... only replaceable infrastructure implementations

manager/
  generic Host wiring only
~~~

The exact file names may evolve, but dependency direction is frozen by this document.

### 4.1 contracts/foundation-object

Contains stable public types/contracts only.

No domain-specific Customer/Supplier/Item/Warehouse vocabulary.

### 4.2 foundation/*

Contains reusable, deterministic and business-semantic-free libraries.

Examples:

- compile EffectiveObjectSchema;
- validate extension definitions;
- merge applicable facets/fields;
- evaluate projection definitions over a declared source adapter;
- test helpers.

These libraries own no durable enterprise truth and expose no independent product UI.

### 4.3 apps/*

Durable product/domain capabilities live in installable Application/Agent packages.

Generic capabilities with their own lifecycle become their own packages rather than
being hidden inside Counterparty or App Platform Core.

## 5. FoundationObjectDescriptor

Every Foundation Object plugin should eventually publish one public descriptor.

Candidate v0.1 shape:

~~~text
FoundationObjectDescriptor
  objectType
  ownerPackageId
  identitySchemaRef
  commands
  queries
  extensionSlots[]
  facetContributions[]
  importTargets[]
  projectionSources[]
  permissionCapabilities[]
  agentOperations[]
~~~

This descriptor is discovery metadata. It is not the object data itself.

Examples:

~~~text
Counterparty
  objectType = evo.counterparty.subject

Item
  objectType = evo.item.item

Warehouse
  objectType = evo.warehouse.warehouse
~~~

Generic services consume descriptors/capabilities rather than importing plugin-private
repositories.

## 6. Effective Object Schema

The central reusable mechanism is an **EffectiveObjectSchema**.

It is compiled from:

~~~text
Object Plugin Core Schema
        +
installed shared Facets/Profiles
        +
enterprise-local ObjectExtensionDefinitions
        +
current relationship-role applicability
        +
authorization/data-scope policy
        =
EffectiveObjectSchema
~~~

The same EffectiveObjectSchema drives all applicable surfaces:

- Object Page fields;
- edit validation;
- Import target columns;
- API/Agent field schema;
- searchable/filterable field catalog;
- export schema;
- generated tests;
- semantic-diff preview.

This is the architectural mechanism behind:

> **Define once; apply everywhere.**

No separate "UI custom fields", "Excel custom fields" and "Agent custom fields" are
allowed to drift independently.

## 7. Extension slots

Object plugins explicitly declare where enterprise-local extension semantics may
attach.

Counterparty example:

~~~text
counterparty.identity
counterparty.customer-profile
counterparty.supplier-profile
~~~

Item example later:

~~~text
item.identity
item.sales-profile
item.procurement-profile
item.inventory-profile
item.manufacturing-profile
~~~

An enterprise extension targets a declared semantic slot, not an arbitrary database
table.

## 8. Enterprise custom-field authority

Enterprise-specific extension definitions are enterprise-owned governed resources
persisted inside the Enterprise Context Resource Library. Their semantics are owned by
the dedicated Object Extension application, not by Enterprise Context Core and not by
Counterparty.

Candidate logical contract:

~~~text
ObjectExtensionDefinition
  extensionId
  targetObjectType
  targetSlot
  namespace
  fieldId
  valueType
  label
  validation
  applicability
  permissions
  searchable
  importable
  exportable
  agentReadable
  agentWritable
  version
~~~

Rules:

1. enterprise extension does not modify shared Core schema;
2. stable field identity is independent of label;
3. definition is versioned;
4. activation/publishing follows Enterprise Context governance;
5. presentation metadata is not permission authority;
6. promotion to shared semantics requires separate evidence.

## 9. Extension value storage

The reusable Object Extension capability is an independent application boundary:

~~~text
apps/object-extension
  owns ObjectExtensionDefinition semantics
  owns extension-value validation/lifecycle
  persists enterprise definitions/values through Enterprise Resource contracts
~~~

Enterprise Context supplies persistence/isolation only.

The semantic model MUST NOT require one SQL column per enterprise-specific field.

Initial target:

~~~text
Object Extension Value
  targetRef
    objectType
    objectId
    slot
  extensionNamespace
  schema/version
  values
  provenance
~~~

Values should normally be stored as one governed sidecar resource per
object/slot/namespace rather than one resource per field.

This keeps domain identity payloads stable.

Physical optimization may later materialize/index common fields without changing
semantic identity.

## 10. Shared Data Import application

Bulk import is a reusable Application capability and MUST NOT be implemented inside
Counterparty.

Target package:

~~~text
apps/data-import
  ImportJob
  StagingDataset
  MappingProfile
  ValidationResult
  DryRunResult
  CommitReceipt
  ErrorExport
~~~

Object plugins contribute import targets.

~~~text
Data Import
   |
   | discover FoundationObject import target
   v
Counterparty / Item / Warehouse public import capability
   |
   v
owning domain validation + mutation
~~~

The generic Import application MUST NOT write a domain plugin's private repository.

It invokes public target capabilities.

Import lifecycle:

~~~text
source file/API
→ staging
→ mapping
→ normalization
→ validation
→ duplicate/match analysis
→ dry run
→ explicit commit
→ receipt/reconciliation
~~~

CSV/XLSX is the first target, but the contracts must allow API/provider sources later.

## 11. Import transaction rule

Each committed row/batch must have deterministic idempotency and explicit outcome.

Generic import orchestration may coordinate multiple public operations, but domain
invariants remain with the owning plugin.

A later transaction adapter may optimize atomic multi-resource writes through a
public Enterprise Context capability. Generic Import must never acquire private
repository access merely for convenience.

## 12. Projection architecture

Projection is a read model over authoritative object/domain/runtime data.

There is no new global "Projection business object".

Object/domain plugins expose **ProjectionSource** capabilities and projection field
metadata.

A ProjectionDefinition may specify:

~~~text
source
filters
role predicates
responsibility predicates
sort/group
visible columns
summary metrics
actions
drill-down
freshness
~~~

Examples:

~~~text
Counterparty:
  Customers
  Suppliers
  My Customers
  My Suppliers

Item:
  Sellable Items
  Purchasable Items
  Low-stock Items

Warehouse:
  Active Warehouses
  Warehouses With Inventory Exceptions
~~~

Projection execution/composition is reusable infrastructure. Business meaning remains
owned by source plugins.

## 13. Responsibility as a shared relation capability

Responsibility is not a Counterparty field.

Target package:

~~~text
apps/responsibility
~~~

Candidate relation:

~~~text
ResponsibilityAssignment
  targetRef
  responsibilityType
  assigneeRef
  effectiveFrom
  effectiveTo
  status
~~~

Examples:

~~~text
Counterparty CUSTOMER
  SALES_OWNER -> user/position/org

Counterparty SUPPLIER
  PROCUREMENT_OWNER -> user/position/org

Warehouse
  WAREHOUSE_MANAGER -> user/position/org
~~~

This makes responsibility reusable across objects.

"My X" projections are always:

~~~text
authorized data scope
INTERSECT
object/domain predicate
INTERSECT
responsibility relation
~~~

They are never cosmetic client-side filters over unauthorized data.

## 14. Personal Workbench boundary

Personal Workbench is not part of Counterparty.

Ownership:

~~~text
App/domain packages
  contribute governed Work / Projection / Capability references

Enterprise/role configuration
  defines shared defaults

Personal Context
  owns user layout, favorites and saved presentation preferences

Eidos/App Host
  renders/composes Workbench

Agent
  reasons over the same authorized capabilities/projections
~~~

Counterparty may contribute "My Customers"; it does not own the Workbench framework.

## 15. Eidos boundary

Eidos should provide generic deterministic Human Experience primitives:

- Object Page;
- Facet/Section contribution;
- List/Worklist;
- Import Mapping/Review;
- Semantic Diff/Review;
- dynamic field rendering from EffectiveObjectSchema;
- bulk selection/action;
- Saved View;
- Workbench composition;
- progressive disclosure;
- permission-aware rendering input;
- responsive desktop/mobile surfaces.

Eidos never owns Counterparty/Item/Warehouse semantics or enterprise data.

## 16. Enterprise Adaptation package

LLM-native enterprise adaptation must not live inside Counterparty.

Target package:

~~~text
apps/enterprise-adaptation
~~~

Responsibilities:

- collect evidence references;
- maintain EnterpriseAdaptationPlan Drafts;
- call LLM/EC advisory capabilities;
- classify discovered requirements;
- propose reuse/extension/new-semantic dispositions;
- compile accepted definitions through shared contracts;
- preview generated effects;
- request Human approval;
- create enterprise-owned software Draft/version.

It is a control plane, not authoritative business data storage.

## 17. Experience-Compiler boundary

Experience-Compiler owns:

- long-term industry knowledge;
- semantic mapping methods;
- learned implementation patterns;
- recurring extension/profile candidates;
- reasoning/evidence;
- question strategies;
- outcome learning.

It proposes to enterprise-adaptation through public contracts.

It does not persist accepted Counterparty/Item/Warehouse truth.

## 18. EVO Runtime boundary

Foundation Object infrastructure must not expand EVO Runtime Core.

EVO becomes involved only when an activated business Application produces canonical
BusinessData and deterministic Posting/Ledger/Cost/Replay effects.

~~~text
Foundation Object
→ referenced by Business Application
→ BusinessData
→ EVO Runtime where applicable
~~~

Object extensions do not automatically become Ledger dimensions or Posting inputs.

Those mappings must be explicit.

## 19. Dependency rules

Allowed:

~~~text
counterparty -> contracts/foundation-object
item         -> contracts/foundation-object
warehouse    -> contracts/foundation-object

data-import  -> contracts/foundation-object
adaptation   -> contracts/foundation-object

foundation/* -> contracts/foundation-object
~~~

Forbidden:

~~~text
counterparty -> item private implementation
counterparty -> warehouse private implementation
item         -> counterparty private implementation

data-import -> counterparty private repository
adaptation  -> counterparty private repository

Eidos -> Counterparty private storage
Experience-Compiler -> Enterprise Context private storage
App Platform Core -> Customer/Supplier/Item/Warehouse semantics
~~~

Cross-owner integration uses public capabilities/contracts.

## 20. Generalization rule

EVO MUST avoid both extremes:

### Wrong extreme A — keep generic mechanisms inside Counterparty

This creates copy/paste architecture for Item/Warehouse.

### Wrong extreme B — invent a universal framework before evidence

This creates speculative abstractions.

Rule:

> Build generic mechanisms only from a real accepted vertical slice, but place them
> outside the domain plugin as soon as their semantics are clearly object-agnostic.

Contract maturity:

~~~text
Counterparty first proof
→ EXPERIMENTAL shared contract
→ Item second-object proof
→ compatibility correction
→ STABLE v0.x/v1 boundary
~~~

A generic contract should normally not be declared stable before a second materially
different Foundation Object consumes it.

## 21. Test architecture

### Shared contract tests

Prove:

- descriptor validation;
- effective schema determinism;
- extension namespace/version behavior;
- authorization filtering;
- import-target conformance;
- projection definition validation.

### Domain plugin tests

Prove object semantics only.

Counterparty tests should not test generic Import UI internals.

### Cross-object compatibility tests

Once Item exists, the same Extension/Import/Projection infrastructure must work
without Counterparty-specific branching.

### RVC/performance tests

Large datasets remain external to Git as defined by the RVC architecture.

## 22. First vertical proof

The first proof of this architecture remains Counterparty.

Target scenario:

~~~text
Enterprise wants CustomerProfile.channelDepositGrade
        ↓
ObjectExtensionDefinition
        ↓
EffectiveObjectSchema
        ├─ Object Page field
        ├─ validation
        ├─ import target column
        ├─ permission
        ├─ Agent schema
        └─ tests
        ↓
Import 10k Counterparties
        ↓
Customers / My Customers Projection
        ↓
same stable counterpartyId
~~~

No generic mechanism above may be implemented inside apps/counterparty.

## 23. Second-object proof

Item/Product is the mandatory architecture reuse test.

Acceptance:

- Item consumes shared descriptor/schema/extension/import/projection contracts;
- no Counterparty-specific switch/branch is added to shared infrastructure;
- Item-specific meaning remains in Item plugin;
- gaps discovered by Item improve shared contracts rather than duplicate mechanisms.

Only after this proof should major shared Foundation Object contracts be considered
stable.

## 24. Third-object proof

Warehouse/Location validates:

- hierarchical/related objects;
- responsibility reuse;
- import of location structures;
- projections over current operational state;
- separation of Warehouse identity from Inventory Position.

After Counterparty + Item + Warehouse, stop Foundation Object-first expansion and
enter the Trading Reference Loop.

## 25. Hard invariants

1. Counterparty is a reference implementation, not the Foundation Object framework.
2. Foundation Object plugins own domain semantics only.
3. Generic reusable mechanisms live behind shared contracts/capabilities.
4. App Platform Core does not absorb domain semantics.
5. Enterprise custom fields never mutate shared object schemas by default.
6. One EffectiveObjectSchema drives applicable UI/import/API/Agent/test surfaces.
7. Generic Import never writes a domain private repository.
8. Projection remains derived read state, not master truth.
9. Responsibility is an explicit relation, not a generic "owner" column.
10. Personal Workbench is composition over governed capabilities/projections.
11. Eidos renders; it does not own business semantics.
12. Experience-Compiler learns/proposes; accepted enterprise resources persist in Enterprise Context while semantic authority remains with the owning plugin/application.
13. EVO Runtime remains deterministic business-fact/ledger infrastructure.
14. No generic contract is stabilized solely from one object's needs.
15. Item is the required second-object validation before declaring the framework stable.
16. Shared infrastructure must remain usable by future unknown industries without
    requiring those industries to fork App Platform Core.
17. Enterprise Context is the durable enterprise resource boundary for Foundation Object state; it does not own Foundation Object semantics.
18. Plugin uninstall does not delete its enterprise resources by default.
19. Foundation Object plugins and generic applications persist durable enterprise state through Enterprise Resource public contracts rather than private ungoverned stores.

## 26. One-line architecture

> **Foundation Objects are independent domain plugins connected by a small shared
> object contract layer; reusable import, extension, projection, responsibility,
> workbench and adaptation capabilities live outside any one object plugin and compose
> through public contracts.**
