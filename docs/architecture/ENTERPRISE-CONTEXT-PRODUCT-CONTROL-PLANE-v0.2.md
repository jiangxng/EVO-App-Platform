# Enterprise Context Product Control Plane — Historical Reference v0.2

> **SUPERSEDED:** The canonical product role is now defined only by `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`. The broad control-plane information architecture in this document MUST NOT be used as the current product direction.

**Status:** SUPERSEDED — historical design reference
**Date:** 2026-10-05
**Scope:** Enterprise Context creation and management experience
**Stable dependencies:** Ledger Runtime and Template Store are treated as stable external capabilities for this design slice.

## 1. Product definition

Enterprise Context is the governed backend/control-plane boundary for one enterprise workspace.

It is not:

- a single database;
- a disk;
- a legal entity record;
- an Application;
- Ledger Runtime;
- Template Store;
- a UI-owned persistence object.

It is the enterprise-owned authority boundary through which Human and Agent users discover and govern enterprise-scoped resources.

The current `evo-enterprise-context-governance` Application is the Human-facing management Experience over provider-owned Enterprise Context facts.

Canonical split:

```text
Enterprise Context Providers
  own enterprise identity, relationships, grants, lifecycle and resource authorities
        |
        v
Enterprise Context Management Experience
  lists, selects, creates and governs Enterprise Contexts
        |
        v
Eidos
  renders the management surfaces
```

Ledger Runtime and Template Store remain independent.

## 2. Cardinality and selection

The platform architecture supports multiple Enterprise Contexts per Principal.

The product must distinguish three concepts:

```text
Allowed Enterprise Contexts
  = every Enterprise Context the Principal is authorized to access

Default Enterprise Context
  = the Principal's persistent preferred Enterprise Context
  = exactly zero or one when no Enterprise Context exists
  = exactly one when one or more Enterprise Contexts are available

Current Enterprise Context
  = the Enterprise Context selected for the current browsing/operation session
```

Rules:

1. The first Enterprise Context created by a Principal becomes that Principal's default.
2. Creating later Enterprise Contexts does not silently replace the default.
3. A Human may explicitly set another accessible Enterprise Context as default.
4. Default selection is Principal-scoped preference, not an intrinsic property of the Enterprise Context.
5. Current selection and default selection are independent.
6. Operations that require one Enterprise Context but have no explicit target may use the Principal's default Enterprise Context when product semantics permit it.
7. An explicit authorized target always wins over the default.
8. A revoked or unavailable Enterprise Context cannot remain effective as a default; resolution falls back deterministically to another accessible Enterprise Context.
9. Template Store remains independent: it may consume the resolved default target but does not own default-Enterprise policy.

This preserves multi-enterprise architecture without forcing every workflow to present a target selector.

## 3. Lessons from mature enterprise products

These are reference patterns, not dependencies.

### 3.1 Microsoft Power Platform / Dynamics 365 — environment as control plane

Microsoft models an Environment as a container for business data, apps, flows, connections and related resources, with environment-level security, location and administration.

Reference:
- https://learn.microsoft.com/en-us/power-platform/admin/environments-overview
- https://learn.microsoft.com/en-us/power-platform/admin/create-environment

Lesson for EVO:

Enterprise Context should expose one coherent control plane for enterprise-scoped resources even when those resources are physically owned by different Providers.

Do not require users to understand storage implementations before they can understand what belongs to an enterprise.

### 3.2 Odoo — Allowed Company, Default Company and Current Company are different

Odoo permits one user to access multiple companies, while separately defining one Default Company and a current active company.

Reference:
- https://www.odoo.com/documentation/18.0/applications/general/users.html
- https://www.odoo.com/documentation/20.0/applications/general/companies/multi_company.html

Lesson for EVO:

Do not collapse authorization, default preference and current selection into one field.

This directly motivates:

```text
available Enterprise Contexts
!= default Enterprise Context
!= current Enterprise Context
```

### 3.3 SAP — enterprise structure is hierarchical

SAP separates Client, Company Code, Plant, Storage Location, Purchasing Organization, Sales Organization and other organizational units.

Reference:
- https://help.sap.com/docs/PRODUCT_ID/91b21005dded4984bcccf4a69ae1300c/917cbd534f22b44ce10000000a174cb4.html
- https://help.sap.com/docs/SAP_ERP/8cf202ad62c04521b934c06b4a898efd/b541de531ed3424de10000000a174cb4.html

Lesson for EVO:

Enterprise Context should be the governed root, not a flat substitute for every organization concept.

Future enterprise organization topology may include:

```text
Enterprise Context
  ├─ Legal Entity
  ├─ Division
  ├─ Business Unit
  ├─ Department
  ├─ Site / Plant
  ├─ Warehouse / Storage Location
  └─ other typed Organization Units
```

Apps should consume stable organization references instead of inventing private organization trees.

### 3.4 Oracle Fusion — legal, management and functional axes are distinct

Oracle models enterprise structure through distinct legal, managerial and functional structures. A Business Unit can perform business functions and can also be used to secure transaction access.

Reference:
- https://docs.oracle.com/en/cloud/saas/applications-common/25d/facia/ledgers-legal-entities-balancing-segments-and-business-units.html
- https://docs.oracle.com/en/cloud/saas/applications-common/26b/fafcf/overview.html

Lesson for EVO:

Do not force one hierarchy to represent every enterprise relationship.

Enterprise Context should eventually support typed organizational relations and multiple projections of the same enterprise structure.

### 3.5 Oracle / Odoo — shared reference data and scoped transactional data

Oracle Reference Data Sets permit configuration/reference data to be shared across multiple business units without duplication. Odoo likewise distinguishes shared records from company-specific records.

Reference:
- https://docs.oracle.com/en/cloud/saas/applications-common/25c/facia/reference-data-sharing.html
- https://docs.oracle.com/en/cloud/saas/financials/26b/fafcf/reference-data-sets.html
- https://www.odoo.com/documentation/20.0/applications/general/companies/multi_company.html

Lesson for EVO:

Enterprise data ownership should support explicit scope semantics rather than assuming every record is either globally shared or fully duplicated.

Candidate future concepts:

```text
ENTERPRISE_SHARED
ORGANIZATION_SCOPED
APPLICATION_SCOPED
PERSONAL
```

This is a data-governance concern, not a Ledger Runtime concern.

### 3.6 Microsoft — backup, audit and capacity belong to environment governance

Power Platform exposes environment backup/restore, Dataverse audit and database/file/log capacity as administration concerns.

Reference:
- https://learn.microsoft.com/en-us/power-platform/admin/backup-restore-environments
- https://learn.microsoft.com/en-us/power-platform/architecture/key-concepts/dataverse-auditing
- https://learn.microsoft.com/en-us/power-platform/admin/capacity-storage

Lesson for EVO:

Enterprise Context management should eventually provide one place to inspect governance and operational health across provider-owned resources:

- audit;
- backup/export/recovery status;
- data/file/log or analogous resource consumption;
- connected services;
- background jobs;
- warnings and health.

The Enterprise Context Experience may aggregate these capabilities, but must not become the physical storage implementation.

## 4. Enterprise Context management information architecture

Target Human-facing product:

```text
Enterprise Contexts
  ├─ Directory
  └─ Create Enterprise

Selected Enterprise Context
  ├─ Overview
  ├─ Applications
  ├─ Organization
  ├─ Data
  ├─ Files
  ├─ Members & Access
  ├─ Connections
  ├─ Jobs
  ├─ Audit
  ├─ Backup / Export
  └─ Settings
```

This is a product information architecture. Individual sections appear only when a compatible Provider/capability exists.

### 4.1 Directory

Must answer immediately:

- Have I created or joined any Enterprise Contexts?
- How many can I access?
- Which one is my default?
- Which one is current?
- What is each Context's lifecycle state?
- What role do I have in each?
- How do I enter one?
- How do I create another?
- How do I set the default?

### 4.2 Overview

A selected Enterprise Context overview should aggregate, without duplicating authority:

- name/code;
- lifecycle state;
- current Principal relationship;
- owner(s);
- created-at / created-by audit facts;
- installed Applications summary;
- organization summary;
- storage/resource summary when available;
- connection health summary;
- pending governance actions;
- warnings.

### 4.3 Members & Access

Existing backend capabilities already include:

- OWNER;
- ADMIN;
- MEMBER;
- AUDITOR;
- invitation lifecycle;
- relationship revocation;
- Grants;
- ownership transfer.

The management Experience should expose these existing capabilities before inventing a new IAM model.

### 4.4 Organization

Organization structure is intentionally separate from Enterprise Context identity.

The first organization contract should be generic enough to represent:

- legal entities;
- divisions;
- business units;
- departments;
- sites/plants;
- warehouses/storage locations;
- other typed units.

Do not hard-code SAP or Oracle naming into EVO contracts.

### 4.5 Applications

Enterprise Context should show Applications belonging to or installed into this enterprise boundary.

"Applications" is preferable product terminology to the overly broad "Enterprise Software".

Application lifecycle remains separate from Ledger Runtime execution semantics.

### 4.6 Data / Files / Connections / Jobs / Audit

These are control-plane projections over provider-owned capabilities.

Enterprise Context Management may aggregate them, but it must not privately own every database, object store, integration secret, scheduler or audit backend.

## 5. Lifecycle

Current Context lifecycle contract already reserves:

```text
CREATING
ACTIVE
SUSPENDED
ARCHIVED
```

Product behavior should eventually expose governed transitions.

Rules:

- ACTIVE Contexts require at least one active OWNER.
- archive/suspend must not rewrite immutable creation facts.
- destructive deletion is not the default product model.
- suspension/archive must preserve audit and enterprise-owned history.
- lifecycle actions require both structural governance rules and authorization policy.

## 6. Provider-first implementation rule

Enterprise Context Management is a control plane.

For every future section ask:

> Is this Enterprise Context-owned authority, or a projection over another Provider-owned authority?

Prefer stable capability contracts.

Examples:

```text
enterprise.directory
enterprise.relationship
enterprise.organization
enterprise.membership
enterprise.business-definition.repository
audit.query
secrets.resolve
future storage/file/connection/job capabilities
```

The UI may compose them into one enterprise management experience.

## 7. Immediate implementation priority

Do not expand Ledger Runtime or Template Store in this slice.

Priority:

1. Enterprise Context Directory that visibly lists every accessible Context.
2. Show count, lifecycle, current role, current Context and default Context.
3. First created Context becomes default.
4. Set Default command and UI.
5. Enter/switch Context.
6. After creation return to the Directory so the Human sees the result.
7. Members & Access page over the already-existing invitation/relationship/ownership capabilities.
8. Enterprise Context Overview page.
9. Organization model/design only after the above product loop is coherent.

## 8. Invariants

1. Enterprise Context is an authority/control boundary, not one physical database.
2. The platform supports multiple Enterprise Contexts.
3. A Principal with accessible Enterprise Contexts has one deterministic default target.
4. Default is Principal-scoped; current is session/interaction-scoped.
5. Enterprise Context creation produces an empty governed enterprise boundary; it does not silently install a default Ledger Runtime template.
6. Template Store is a shared distribution surface; copying is explicit and produces enterprise-owned independent content.
7. Ledger Runtime remains stable and outside Enterprise Context version/default-template ownership.
8. Organization units live inside the enterprise boundary; Enterprise Context itself is not synonymous with Legal Entity or Business Unit.
9. UI aggregates Providers; it does not absorb their persistence responsibilities.
10. Existing governance history and immutable creation facts remain authoritative.
