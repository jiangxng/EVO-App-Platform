# Enterprise Context Resource Container — Canonical Design v1.0

**Document class:** CURRENT_AUTHORITY  
**Status:** Canonical architecture baseline  
**Date:** 2026-10-05  
**Owner:** EVO App Platform / Enterprise Context  
**Scope:** Enterprise Context product role, storage model, plugin/resource boundary, Template Store copy, lifecycle, and evolution

> **This document is the single conceptual authority for Enterprise Context.**
>
> Other Enterprise Context documents may describe protocols, implementation history,
> migration details, or UI slices, but MUST NOT redefine the product role in this document.

---

## 1. Canonical definition

Enterprise Context is a **thin enterprise-scoped persistent resource container**.

A useful product mental model is:

```text
Docker Volume
  = persistent storage boundary used by workloads

Enterprise Context
  = persistent enterprise resource boundary used by plugins/applications
```

The analogy is intentional but not literal. Enterprise Context is not a disk volume.
It is an enterprise identity + namespace + persistence + access boundary exposed
through stable resource contracts.

Canonical rule:

> **Enterprise Context provides space. Plugins define what resources in that space mean.**

Enterprise Context MUST remain thin.

It MUST NOT evolve into:

- a second ERP kernel;
- an all-in-one enterprise administration suite;
- a Ledger Manager;
- an Organization Manager;
- a File Manager;
- an Application Manager;
- a workflow engine;
- a generic UI shell for every enterprise function.

Those are separate plugins/capabilities that operate **against** an Enterprise Context.

---

## 2. Minimum Enterprise Context core

A newly created Enterprise Context should be almost empty.

The minimum core owns only platform-level facts such as:

```text
contextId
enterpriseId
displayName
lifecycleState
createdAt
createdBySubjectId
access relationships / grants
resource namespace
resource catalog
```

Creating an Enterprise Context MUST NOT silently create:

- a default ledger;
- organization structure;
- application data;
- document folders;
- jobs;
- connections;
- workflows;
- a hidden ERP schema.

The enterprise becomes useful by accumulating resources and by binding plugins that
understand those resources.

---

## 3. Enterprise Resource Library

The primary storage primitive inside an Enterprise Context is the
**Enterprise Resource Library**.

It is a logical resource catalog, not necessarily one physical database table.

Conceptually:

```text
Enterprise Context: ABC
│
├─ core
│
└─ Resource Library
   ├─ evo.ledger / ledger.definition / ...
   ├─ evo.organization / organization.unit / ...
   ├─ evo.application / application.binding / ...
   ├─ vendor.crm / crm.customer-model / ...
   └─ vendor.wms / ...
```

Every resource has a common envelope.

Recommended minimum envelope:

```text
EnterpriseResource {
  contextId
  namespace
  collectionId?
  resourceType
  resourceId
  schemaRef
  ownerPackageId?
  storageKind
  payload | payloadRef
  metadata
  lifecycleState?
  createdAt
  createdBy
  updatedAt?
}
```

### 3.1 What Core understands

Enterprise Context Core may understand:

- identity;
- namespace;
- resource addressing;
- resource type identity;
- schema reference;
- ownership/provenance metadata;
- access control;
- persistence location;
- basic lifecycle and retention facts;
- generic copy/get/list/archive primitives.

### 3.2 What Core does not understand

Enterprise Context Core MUST NOT understand domain semantics such as:

- what a ledger definition means;
- how ledger versions work;
- what an organization hierarchy means;
- what a customer means;
- how inventory is calculated;
- how workflow transitions work;
- whether one application-specific resource is valid.

Those semantics belong to plugins/providers.

Canonical rule:

> **Context is the container; Plugin is the semantics.**

---

## 3.3 Resource Collections — the SharePoint List/Library lesson

Inside a namespace, plugins may declare **Resource Collections**.

A Resource Collection is a logical typed collection analogous to a SharePoint
List/Library, but generalized beyond documents.

```text
Enterprise Context
  -> Namespace
      -> Resource Collection
          -> Resource Item
```

Example:

```text
ABC Context
├─ evo.ledger
│   ├─ definitions
│   │   ├─ default
│   │   ├─ v1
│   │   └─ v2
│   └─ publish-receipts
│
├─ evo.organization
│   ├─ units
│   └─ relations
│
└─ vendor.crm
    ├─ customer-model
    └─ configuration
```

A collection declaration can describe:

```text
collectionId
namespace
resourceType
schemaRef
storageProfile
ownerPackageId
indexes?
retentionPolicy?
accessPolicyRef?
```

The Core understands the collection contract but not the business meaning of its
items.

This gives EVO the useful part of the SharePoint pattern:

```text
SharePoint Site
  -> List / Library
      -> Content Type + Columns
          -> Item / File

EVO Enterprise Context
  -> Resource Collection
      -> SchemaRef + Resource Type
          -> Resource Item
```

It also gives plugin installation/binding a concrete initialization primitive:
a plugin may provision or attach to declared collections without needing to
change Enterprise Context Core.

### Storage profiles

Collections may use different physical storage profiles while preserving one
logical API:

```text
DOCUMENT
  small/medium structured JSON resources

TABLE
  high-volume typed structured records

OBJECT
  files / binary / large payloads

REFERENCE
  externally stored resources addressed by provider reference
```

The first implementation does not need all profiles, but the contract MUST avoid
assuming every resource is one JSON row or one file.

## 4. Logical “big table”, not physical mega-table

SharePoint is useful as a conceptual reference because it presents content through
common containers and common item metadata even though the physical persistence
implementation is more complex.

EVO should adopt the **logical** pattern, not clone SharePoint SQL internals.

Recommended model:

```text
Enterprise Resource Catalog
    |
    +-- small structured payload -> document/JSON storage
    +-- file/blob payload        -> object storage
    +-- large relational domain  -> provider/plugin data store
    +-- external data            -> reference / connector locator
```

The Resource Library therefore behaves like one coherent content system from the
API point of view, while physical storage remains pluggable.

This avoids two opposite failures:

1. one giant physical JSON/table becoming a performance and migration bottleneck;
2. every plugin inventing a private storage world with no common enterprise
   addressing, access, audit, provenance, export, or discovery model.

---

## 5. Namespace and resource-type model

Namespaces isolate plugin/domain resource families.

Examples:

```text
evo.ledger
evo.organization
evo.application
com.vendor.crm
com.vendor.wms
```

A namespace is not a UI menu and not necessarily a physical directory.

A plugin/package should declare:

```text
namespace: evo.ledger

resourceTypes:
  - ledger.definition
  - ledger.publish-profile
  - ledger.validation-result

schemas:
  - evo.ledger-definition/0.1
  - evo.ledger-definition/0.2

capabilities:
  - understand
  - validate
  - edit
  - publish
```

Namespaces prevent collisions and establish ownership boundaries.

Default rule:

> A plugin may directly read/write only the namespaces/resources granted to it.
> Cross-plugin behavior should use stable capabilities/providers instead of
> reading another plugin's private resource payload.

---

## 6. Plugin installation, binding, and provisioning are distinct

These three actions MUST remain separate.

### 6.1 Install Package

```text
Install Package
= make a plugin/package available to the platform
```

Installation does not automatically modify every Enterprise Context.

### 6.2 Bind Package to Context

```text
Bind Package
= make this plugin serve one specific Enterprise Context
```

Binding may cause resource provisioning.

### 6.3 Provision / Attach Namespace

When a plugin binds to a Context:

```text
namespace absent
  -> provision declared namespace/resources

namespace already present
  -> attach to existing resources

schema older than supported
  -> run explicit migration

schema incompatible
  -> fail safely / require migration plan
```

The plugin MUST NOT assume it is the first component to place data in its namespace.

Data may already exist because a Template Store or another authorized transfer
mechanism copied a valid resource into the Context before the manager plugin was installed.

---

## 7. Direct resource copy does not require the manager plugin

A central invariant:

> **Storing a valid resource does not require the plugin that understands it to
> be installed.**

For example:

```text
Template Store
    |
    | Copy
    v
Enterprise Context
    |
    +-- evo.ledger / ledger.definition / default
```

Ledger Manager is not required for that copy.

The copied resource must be:

- addressed to an authorized target Context;
- identified by namespace/resource type/schema;
- integrity checked;
- provenance recorded;
- independently owned by the target enterprise after copy.

Later:

```text
Install Ledger Manager
    |
Bind to ABC Context
    |
List ledger.definition
    |
discover "default"
    |
View / Edit / Version / Validate / Publish
```

This is deliberate decoupling.

---

## 8. Template Store relationship

Template Store is a shared distribution repository.

Enterprise Context is an enterprise-owned persistent resource repository.

Canonical use flow:

```text
Template Store
    |
    | explicit Copy / Use Template
    v
Enterprise Context Resource Library
    |
    +-- independent enterprise-owned resource
```

Template Store does not require the destination manager plugin.

The copy operation preserves provenance, for example:

```text
origin.type        = TEMPLATE_COPY
origin.templateId  = ...
origin.sourceVersion = ...
```

but creates an independent enterprise-owned copy.

Template updates MUST NOT silently mutate the copied enterprise resource.

---

## 9. Domain versioning is not an Enterprise Context concern

Enterprise Context stores resources but does not define the meaning of their versions.

For a ledger resource, a Ledger Manager may interpret:

```text
default
v1
v2
v3
```

For another plugin, version semantics may instead be:

```text
revision
snapshot
effectiveFrom
draft/published
```

Another resource type may have no domain versioning at all.

Therefore the Resource Library must not impose one global business-version model.

For the initial copied ledger template, the product may show:

```text
default
```

while the machine representation can use a stable initial revision such as:

```text
revision = 0
label = "default"
origin = TEMPLATE_COPY
```

The interpretation belongs to Ledger Manager, not Enterprise Context Core.

---

## 10. Ledger Manager boundary

Ledger Manager is a separate plugin.

It reads ledger resources from the selected Enterprise Context and understands their
domain semantics.

Responsibilities:

- List ledger definitions;
- 2D Viewer projection;
- edit / design;
- domain version history;
- validation;
- restore prior design as a new draft/version;
- publish to Ledger Runtime.

Canonical publish flow:

```text
Enterprise Context
    |
    | Get ledger resource
    v
Ledger Manager
    |
    | Validate / Compile / Publish
    v
Ledger Runtime
```

Ledger Runtime remains versionless:

> **Ledger Runtime executes only the current published definition.**

Runtime may keep technical digest/revision/publish receipt for traceability, but it
does not own v1/v2 selection or design history.

---

## 11. Uninstall is not deletion

Plugin lifecycle and enterprise data lifecycle MUST remain separate.

```text
Uninstall Ledger Manager
    !=
Delete evo.ledger resources
```

Default behavior:

```text
uninstall plugin
  -> resource data remains

reinstall + bind
  -> attach existing namespace
  -> validate schema
  -> migrate if required
  -> continue
```

Permanent deletion is a distinct destructive operation such as:

```text
Purge plugin/domain resources
```

and should require dependency, retention, audit and explicit-confirmation checks.

---

## 12. External product references

These products are references, not dependencies.

### 12.1 SharePoint Server / SharePoint Online

SharePoint's logical storage hierarchy treats site collections as storage/security
boundaries and Lists/Libraries as basic content containers. Content Types provide
reusable metadata/behavior definitions for list items and documents.

Useful EVO lesson:

- separate container identity from content semantics;
- give stored items a common metadata envelope;
- allow reusable type/schema definitions;
- expose content through logical APIs rather than relying on physical SQL layout.

Do **not** copy SharePoint's historical physical content-database schema.

References:

- https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-spo/9706f29f-8082-4dee-a8fe-9ca5209b2619
- https://learn.microsoft.com/en-us/sharepoint/governance/content-type-and-workflow-planning
- https://learn.microsoft.com/en-us/graph/api/resources/list?view=graph-rest-1.0

### 12.2 SharePoint Embedded

SharePoint Embedded is an especially close modern reference.

It provides application-owned, API-only File Storage Containers inside the
customer's Microsoft 365 tenant. The container has no user experience of its own;
the consuming application provides the experience.

Useful EVO lesson:

> storage/container authority can be deliberately headless while external
> applications provide domain UI and behavior.

Reference:

- https://learn.microsoft.com/en-us/sharepoint/dev/embedded/overview

### 12.3 Salesforce managed packages

Salesforce managed packages use namespaces to distinguish package components inside
a subscriber organization and avoid collisions. Installing a package places
package-defined components into that organization.

Useful EVO lesson:

- package namespaces should be stable;
- plugin-defined resource types must not collide;
- installing/binding a plugin may introduce schema/components into a tenant scope;
- ownership and upgrade rules need explicit contracts.

References:

- https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-plan-namespaces.html
- https://developer.salesforce.com/docs/platform/pkg2-dev/guide/packaging-packageable-components.html

### 12.4 Microsoft Dataverse Solutions

Dataverse Solutions package and transport application components such as tables,
apps, flows and other metadata into an Environment, with dependencies and layered
customization.

Useful EVO lesson:

- package deployment can provision declarative structures;
- dependencies should be machine-readable;
- environment/container and solution/package are separate concepts.

EVO should avoid inheriting Dataverse's solution-layer complexity inside the
Enterprise Context resource core.

References:

- https://learn.microsoft.com/en-us/power-apps/developer/data-platform/introduction-solutions
- https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm

### 12.5 Kubernetes Persistent Volumes

Kubernetes separates workload lifecycle from persistent storage lifecycle.
Persistent storage can use explicit retention/reclaim policies and third-party
provisioners.

Useful EVO lesson:

- plugin/application lifecycle must not equal data lifecycle;
- provisioning is a separate concern;
- retention/purge policy must be explicit.

Reference:

- https://kubernetes.io/docs/concepts/storage/storage-classes/

### 12.6 HashiCorp Vault namespaces and mounts

Vault namespaces provide isolated tenant environments while auth methods and secret
engines are mounted within those namespaces.

Useful EVO lesson:

- a Context can be a thin isolation boundary;
- plugins/providers may mount capabilities inside it;
- namespace-level policy restricts blast radius;
- tenant scope and mounted capability are distinct concepts.

References:

- https://developer.hashicorp.com/vault/docs/enterprise/namespaces
- https://developer.hashicorp.com/vault/docs/enterprise/namespaces/namespace-structure

### 12.7 Atlassian Forge hosted storage

Forge hosted storage automatically namespaces application data by installation,
site and environment. App storage is isolated from other apps/installations.

Useful EVO lesson:

- plugin data should be tenant/context scoped automatically;
- a plugin should not need globally unique table/key names outside its assigned namespace;
- isolation should be platform-enforced, not left to plugin convention.

References:

- https://developer.atlassian.com/platform/forge/storage-reference/
- https://developer.atlassian.com/platform/forge/storage-reference/kvs/

### 12.8 Amazon S3 prefixes

S3 provides a flat object-key namespace; prefixes are useful logical organization
but are not physical directories.

Useful EVO lesson:

- do not confuse logical resource paths with physical database/folder layout;
- stable addressing can survive storage-engine changes.

Reference:

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/common-bucket-patterns.html

---

## 13. Resulting architecture

```text
                           EVO Shell
                              |
                    Current Enterprise Context
                              |
      +-----------------------+------------------------+
      |                       |                        |
      v                       v                        v
 Template Store          Ledger Manager          Other Plugins
      |                       |                        |
      | Copy                  | Get/List/Edit          | Get/List
      |                       |                        |
      +-----------------------v------------------------+
                      Enterprise Context
                   Enterprise Resource Library
                              |
                 namespace + resource contracts
                              |
          +-------------------+-------------------+
          |                   |                   |
      evo.ledger        evo.organization      vendor.*
          |
          | publish through Ledger Manager
          v
     Ledger Runtime
     current definition only
```

---

## 14. Hard invariants

1. Enterprise Context is thin.
2. A new Enterprise Context is almost empty.
3. Enterprise Context is primarily a persistent enterprise resource boundary.
4. Enterprise Context Core does not understand business-domain semantics.
5. Enterprise resources use a common envelope and stable addressing.
6. Physical persistence is implementation-specific; the logical Resource Library is stable.
7. Enterprise schema/shape is an emergent result of plugin composition and stored resources.
8. Install Package, Bind Package and Copy Resource are separate actions.
9. Valid resources may exist before their manager plugin is installed.
10. Template Store may copy directly into an Enterprise Context.
11. Copy creates independent enterprise-owned content.
12. Domain version semantics belong to the domain manager/plugin.
13. Ledger Runtime does not own Ledger Manager design versions.
14. Uninstalling a plugin does not delete enterprise resources by default.
15. Namespace access is isolated by default.
16. Cross-plugin integration uses stable capabilities/providers rather than private payload coupling.
17. Logical paths/namespaces MUST NOT dictate physical storage topology.
18. Enterprise Context management UI MUST stay small and must not become an all-in-one enterprise backend.

---

## 15. Product implication

The Enterprise Context Human-facing plugin should focus on:

- Context Directory;
- Create Context;
- current/default selection;
- basic identity/lifecycle;
- access/ownership required to operate the container;
- optional generic Resource Library inspection for diagnostics/admin purposes.

It should NOT grow dedicated pages for every domain such as Applications,
Organization, Ledger, Files, Jobs, Connections and Audit.

Those belong to independent plugins that operate against the currently selected
Enterprise Context.

---

## 16. Implementation direction

The next architecture slice should define a provider-neutral resource contract,
for example:

```text
enterprise.resource.put
enterprise.resource.get
enterprise.resource.list
enterprise.resource.copy
enterprise.resource.archive

enterprise.namespace.claim
enterprise.namespace.describe
```

The contract should support:

- schema references;
- namespace ownership;
- provenance;
- inline small payloads;
- external/object payload references;
- integrity digest;
- authorization;
- idempotent copy;
- migration/provisioning metadata;
- export/backup without requiring domain understanding.

The physical storage implementation should remain replaceable.

