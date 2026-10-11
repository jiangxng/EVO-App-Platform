# EVO LLM-Native Enterprise Adaptation Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-07  
**Owner:** EVO-App-Platform control plane, collaborating through public contracts with Experience-Compiler, Eidos and EVO  
**Purpose:** turn new-industry and enterprise differences into governed software deltas much faster than conventional bespoke ERP implementation

## 1. Problem

Traditional enterprise software implementation commonly follows:

~~~text
requirements interviews
→ consultant specification
→ architecture/database design
→ backend implementation
→ frontend implementation
→ import/report customization
→ permission configuration
→ testing
→ deployment
~~~

If EVO repeats this full cycle for every new enterprise, LLM only makes conventional
development faster.

The stronger target is:

> **LLM understands the enterprise difference; EVO compiles that difference through
> stable contracts into governed enterprise software.**

The goal is not arbitrary AI-generated production code or direct database mutation.
Most enterprise differences should become structured, versioned definitions and
packages rather than bespoke source-code projects.

## 2. External evidence

### SAP

SAP S/4HANA key-user extensibility supports custom fields and custom logic in an
explicit business context, can expose supported fields to UIs/reports/forms and uses
publish/transport governance.

Useful lesson:

- do not modify standard Core for customer differences;
- extension semantics need a clear business context;
- authoring and production activation are distinct.

Limitation for EVO:

- response is still bounded by extension points designed in advance;
- broader new-domain semantics frequently return to conventional engineering.

References:

- https://help.sap.com/doc/99af63e17e7b4f15a18e0605cb940de4/750_SP02/en-US/57909455bf7c4fdd8bcf48d76c1eae33.html
- https://help.sap.com/doc/99af63e17e7b4f15a18e0605cb940de4/750_SP02/en-US/3ccb50e724b045508fea8b2cf1774b2b.html

### Microsoft Dataverse / Solutions

Dataverse allows custom tables, columns, relationships and logic. Power Platform
Solutions package customization metadata/components and support dependency-aware ALM
between environments.

Useful lesson:

- customization is a versionable/packageable software asset;
- extension namespaces and dependencies matter;
- low-code changes still require lifecycle governance.

References:

- https://learn.microsoft.com/en-us/power-apps/developer/data-platform/introduction-solutions
- https://learn.microsoft.com/en-us/power-platform/alm/basics-alm

### Microsoft Power Apps Plans

Power Apps Plans now accepts natural-language business problems plus evidence such as
legacy screenshots or process diagrams. AI agents assist with user requirements,
roles, data models and technology proposals and can generate solution components.

Useful lesson:

- requirements archaeology can be compressed dramatically;
- screenshots, spreadsheets and legacy artifacts are valid first-class evidence;
- Human review remains necessary before generated outputs become accepted solution
  assets.

References:

- https://learn.microsoft.com/en-us/power-apps/guidance/planning/app-development-approaches
- https://learn.microsoft.com/power-apps/maker/plan-designer/create-plan
- https://learn.microsoft.com/en-us/power-apps/maker/common/faq-plan-designer

## 3. EVO opportunity

EVO should combine:

~~~text
SAP
governed extension context
+
Microsoft
metadata/solution packaging
+
AI requirement-to-solution generation
+
EVO
stable enterprise semantics
deterministic runtime
Enterprise Context versioning
Template Store
Eidos
Experience-Compiler learning
=
LLM-native enterprise adaptation
~~~

A new enterprise should normally create an **Enterprise Software Delta** over reusable
semantics rather than a fork of EVO.

~~~text
Reusable Foundation / Industry Pack
        +
Enterprise-specific Delta
        =
Enterprise-owned Software Version
~~~

## 4. Enterprise Adaptation Pipeline

Canonical target:

~~~text
Enterprise Evidence
  ├─ conversation/interviews
  ├─ spreadsheets
  ├─ legacy screenshots/forms/reports
  ├─ schema/database metadata
  ├─ API documentation
  ├─ SOP/process documents
  ├─ sample transactions
  └─ industry/public evidence
        ↓
Evidence Inventory
        ↓
LLM Semantic Archaeology
        ↓
Semantic Delta Classification
        ↓
Enterprise Adaptation Plan
        ↓
Enterprise Working Draft
        ↓
Deterministic Compile + Validate
        ↓
Generated Preview + Import/Test Fixtures
        ↓
Human Review / Acceptance
        ↓
Immutable Enterprise Software Version
        ↓
Explicit Activation
        ↓
Runtime + Workbench + Agent
        ↓
Outcome / Exception Learning
        ↓
Experience-Compiler reusable knowledge
~~~

LLM is strongest at understanding, classification, comparison and proposal generation.

EVO is strongest at authority, validation, versioning, activation and deterministic
execution.

## 5. Semantic Delta classification ladder

Before implementation, every discovered requirement must be classified.

### L0 — Presentation / Projection Delta

Examples:

- label/order/layout;
- default filters;
- shared/personal workspace composition;
- saved projection;
- section visibility.

Normally no new business storage.

### L1 — Enterprise Extension Field

An enterprise-specific fact on an existing semantic owner.

Example:

~~~text
CustomerProfile
  enterprise extension:
    strategicChannelGrade
~~~

This does not modify shared Counterparty Core.

### L2 — Existing Facet / Profile / Relationship Extension

The need already belongs to a known semantic owner, such as Customer Profile,
Supplier Profile, Address, Contact, Bank Account, Responsibility, Tax or Logistics.

Only that owner is extended/configured.

### L3 — New reusable Facet / Relationship / Foundation Object

Evidence proves a missing concept with its own lifecycle/identity or broad
cross-application reuse.

Requires architecture review, but normally remains outside platform/runtime Core.

### L4 — New Application / Business Process

Existing primitives can express a new industry process through:

~~~text
Object references
+ Command
+ BusinessData
+ rules
+ Work/Projection
+ Experience
~~~

Most implementation artifacts should be generated from contracts.

### L5 — New deterministic runtime semantic

Examples include a new replay-sensitive allocation/valuation mechanism that cannot be
expressed with current contracts.

This is not fast customization. It requires full EVO runtime architecture, replay,
migration and certification work.

**LLM speed never removes semantic-risk classification.**

## 6. Enterprise Adaptation Plan

LLM should not jump directly from conversation to source code.

It should first emit a machine-readable intermediate representation:

~~~text
EnterpriseAdaptationPlan
  planId
  targetContextId
  baseEnterpriseSoftwareVersion
  evidenceRefs[]
  assumptions[]
  unresolvedItems[]

  reuse[]
  extensions[]
  newSemantics[]

  data
    objectExtensions[]
    rolesProfiles[]
    relatedResources[]
    dictionaries[]

  intake
    importProfiles[]
    sourceMappings[]

  behavior
    validations[]
    commands[]
    businessDataDefinitions[]
    rules[]

  projections
    savedViews[]
    worklists[]
    metrics[]

  experience
    objectFacets[]
    registryViews[]
    workbenchContributions[]
    actions[]

  authorization
    capabilities[]
    dataScopes[]
    sensitiveFacets[]

  agent
    toolDescriptions[]
    readWriteCapabilities[]

  migration
    transforms[]
    compatibility[]

  verification
    generatedTests[]
    fixtures[]
    expectedInvariants[]
~~~

Human review should focus on this semantic diff, not on a Git/database diff.

## 7. Compile instead of hand-building

An accepted Plan should compile into standard artifacts:

~~~text
EnterpriseAdaptationPlan
        ↓
Adaptation Compiler
        ├─ Enterprise Context definitions
        ├─ ObjectExtensionDefinition
        ├─ Role/Profile/Facet definitions
        ├─ import schema + mapping
        ├─ validation schema
        ├─ permission/capability descriptors
        ├─ Projection definitions
        ├─ Eidos Experience contributions
        ├─ Workbench contributions
        ├─ Agent capability descriptors
        ├─ deterministic tests
        ├─ migration/diff
        └─ package/template manifest
~~~

One declarative definition should drive every applicable surface.

A new field should not require separate developers to remember storage, API, form,
import, permission, Agent and tests independently.

## 8. Example — one new enterprise field

Requirement:

> Customer has a "渠道保证金等级" and it is required for selected customer classes.

Target handling:

~~~text
LLM classifies:
  not Counterparty identity
  CUSTOMER relationship semantic
  enterprise-local for now

Generate:
  CustomerProfile enterprise extension
  enum definition
  conditional required rule
  import column/mapping
  Object Page facet placement
  optional list/projection column
  permission policy
  Agent field description
  deterministic tests

Human reviews semantic diff
→ Create enterprise software version
→ Activate
~~~

No shared Counterparty schema/source-code change should be required.

## 9. Example — entering a new industry

Garment manufacturing evidence introduces:

~~~text
Style
Color
Size
Season
SKU matrix
Sample
Cutting batch
Bundle
Workshop
Subcontract processor
~~~

LLM first compares these with existing semantics.

Possible result:

~~~text
reuse:
  Counterparty + PROCESSOR role
  Warehouse/Location
  Item identity

extend:
  Item garment facet
    style / season / color / size

candidate new concept:
  CuttingBundle
  evidence = independent identity/lifecycle across operations

new Application:
  cutting issue / bundle transfer / completion
~~~

The goal is not ten instantly generated tables. The goal is the smallest accurate
semantic delta.

## 10. Industry Packs as accelerators

Repeated accepted enterprise deltas can become reusable industry knowledge.

~~~text
Enterprise A delta
Enterprise B delta
Enterprise C delta
        ↓
Experience-Compiler compares accepted patterns
        ↓
candidate common semantic
        ↓
Human/architecture validation
        ↓
Industry Pack / Template Store content
        ↓
new Enterprise D starts closer to target
~~~

Examples may eventually include garment manufacturing, electronics distribution,
project services or food traceability.

A Pack remains a starting definition, not a live runtime parent.

Current Template Store lifecycle remains:

~~~text
Template Store
→ explicit Copy
→ enterprise-owned Draft
→ enterprise adjustment
→ immutable enterprise software version
→ explicit Activation
~~~

Template updates never silently mutate an existing enterprise.

## 11. Cross-project ownership

### Experience-Compiler

Owns persistent advisory intelligence:

- industry knowledge;
- learned mapping methods;
- recurring semantic patterns;
- source-system archaeology knowledge;
- common-field/facet candidates;
- question strategies;
- evidence/rationale;
- proposal/outcome learning.

It proposes; it does not own enterprise runtime truth.

### EVO-App-Platform

Owns adaptation control plane:

- adaptation session/workflow;
- extension definition contracts;
- Enterprise Context Draft/version lifecycle;
- package/feature lifecycle;
- capability/permission governance;
- compilation/validation orchestration;
- import/projection/workbench contributions;
- Human approval path;
- Template Store transfer;
- activation coordination.

### Eidos

Owns reusable deterministic Human Experience primitives, including over time:

- Object Page/facets;
- List/Worklist;
- import mapping/review;
- semantic diff review;
- dynamic governed field rendering;
- bulk action;
- saved projection;
- role/workspace composition;
- responsive/mobile behavior.

Eidos never owns business semantics.

### EVO Runtime

Remains deterministic execution kernel.

Most enterprise differences should not modify EVO.

Only L5 changes should create Runtime work.

## 12. Fast-response operating classes

These are target operating ranges, not contractual SLAs:

| Class | Example | Target response |
| --- | --- | --- |
| A | presentation/projection/workspace | minutes |
| B | enterprise field + UI/import/permission | minutes to hours |
| C | facet/profile/relationship | hours |
| D | new bounded Application/process using existing primitives | hours to a few days, depending on evidence |
| E | new runtime/core deterministic semantic | full architecture engineering; no artificial speed promise |

The business advantage should come mainly from A-D.

## 13. Automatic LLM checklist

For every new requirement, the adaptation agent should automatically answer:

1. What business concept is this?
2. Is an equivalent semantic already present?
3. Is this identity, relationship, profile, related resource, transaction fact,
   projection, presentation or configuration?
4. Who owns it?
5. Does it require stable identity?
6. Does it have an independent lifecycle?
7. Is it current master state or historical transaction snapshot?
8. Is it calculated/derived?
9. Who can read/write it?
10. How is it imported/exported?
11. Which Applications reference it?
12. Does it affect Posting/Ledger/Cost/Settlement?
13. Does Agent need read/write capability?
14. Is it enterprise-local or reusable?
15. What data/evidence can falsify the proposal?
16. What happens on upgrade/rollback?
17. Which generated tests prove it?

This checklist should eventually become executable policy.

## 14. AI safety rails

1. LLM output starts as Draft/Proposal.
2. Raw evidence is retained independently from normalized definitions.
3. LLM cannot directly mutate production enterprise truth without governed action.
4. All generated definitions use stable IDs, schemas and versions.
5. Enterprise extensions are namespaced.
6. Generated capabilities declare permissions/data scope.
7. Derived values never silently become master-data truth.
8. Historical BusinessData is not rewritten by later adaptations.
9. Activation is explicit and versioned.
10. Generated artifacts are reproducible from accepted Plan + compiler version.
11. Migration/compatibility is part of the Plan.
12. Tests are generated with implementation.
13. Agent writes use the same deterministic capabilities as Human UI.
14. Private customer evidence is not silently promoted to shared industry knowledge.
15. Cross-enterprise learning records reusable semantics/methods, not customer secrets.

## 15. Semantic promotion lifecycle

~~~text
ENTERPRISE_LOCAL
  ↓ repeated evidence
CANDIDATE_SHARED
  ↓ semantic review + real-world validation
SHARED_FACET / SHARED_PROFILE
  ↓ broad stable reuse
FOUNDATION SEMANTIC
~~~

Promotion is not automatic because many customers use a similarly named field.

Required proof includes same meaning, lifecycle, authority, validation behavior and
cross-application use.

This prevents shared Core from becoming the old universal form.

## 16. Storage strategy

Enterprise-specific fields must not require a physical SQL column for every customer
difference.

Logical authority is a governed extension definition with:

- stable field identity;
- value type;
- validation;
- indexing/search declaration;
- permission;
- provenance;
- schema/version;
- migration behavior.

Physical storage may use Enterprise Resource/document/JSON representations where
appropriate.

Performance-critical common semantics may later compile to optimized physical storage
without changing public semantic identity.

## 17. Adaptation preview

Before activation, Human reviewers should see one coherent semantic preview:

~~~text
What changes?
├─ reused concepts
├─ new enterprise fields
├─ new facets/roles
├─ new objects/apps
├─ permission changes
├─ import mappings
├─ projections/workbench
├─ Agent capabilities
├─ runtime effects
└─ migration impact

Representative experience
├─ Object Page preview
├─ list/workbench preview
├─ import dry-run
└─ representative transactions

Verification
├─ generated tests
├─ sample/real-data results
├─ unresolved warnings
└─ compatibility impact
~~~

Approval should be understandable by a business owner/implementation lead.

## 18. Enterprise version lifecycle

~~~text
Enterprise Software v12 ACTIVE
        ↓
new evidence
        ↓
Adaptation Plan Draft
        ↓
Enterprise Working Draft
        ↓
validate / simulate / preview
        ↓
Create Enterprise Software v13
        ↓
explicit Activation
        ↓
v13 ACTIVE
        ↓
v12 retained for lineage / rollback compatibility
~~~

This aligns with existing Enterprise Context and Template Store version boundaries.

## 19. Import is a discovery input

Existing customer data is often the best requirements document.

Example:

~~~text
legacy_customer.xlsx
  customer_grade
  region
  price_factor
  tax_type
  handler
~~~

Target flow:

~~~text
source profiling
→ semantic mapping
→ missing-target detection
→ extension proposal
→ import mapping proposal
→ generated validation/template
~~~

Migration/import is therefore not a late project task. It participates in semantic
discovery from the beginning.

## 20. Legacy UI archaeology is a discovery input

A screenshot of a 60-field old Counterparty page should cause LLM to:

- inventory concepts;
- group likely owners;
- identify projections/calculated fields;
- identify repeated child resources;
- detect sensitive/permission-bound data;
- compare against current EVO semantics;
- propose minimal delta;
- explicitly reject blindly copying the old physical form.

This is one of the strongest practical LLM advantages.

## 21. No-code is not the target

The target is not "nobody ever writes code."

The target is:

> **No unnecessary bespoke engineering.**

Choose the cheapest safe representation:

~~~text
configuration
→ declarative extension
→ generated package
→ deterministic rule
→ Provider/Application code
→ Core change only last
~~~

LLM may generate code when necessary, but generated code still passes contracts,
tests, CI, migration and version governance.

## 22. Target new-industry onboarding journey

~~~text
1. Create/select Enterprise Context

2. Tell EVO about your business
   upload:
     Excel
     old ERP screenshots
     SOP/process docs
     reports
     schemas
     APIs

3. Adaptation Agent reports:
   74% reuse
   18% enterprise extension
    6% candidate industry facet
    2% unresolved/new semantic

4. Human answers semantic questions

5. EVO generates Working Draft
   + import
   + views
   + permissions
   + workbench
   + tests

6. Load sample/real data into staging

7. Run dry-run/scenario verification

8. Human accepts

9. Create enterprise software version

10. Activate
~~~

The percentages are illustrative; the product should compute real classification
results from evidence.

## 23. First implementation slices

Do not build the complete compiler at once.

### A0 — Architecture baseline

This document plus the existing Foundation Object extension/import/workbench baseline.

### A1 — Object Extension Definition

Implement governed enterprise-scoped custom fields for Counterparty.

A field definition should compile into all applicable surfaces:

- storage;
- validation;
- Object Page;
- import schema;
- read/write contract;
- permission;
- Agent schema;
- tests.

### A2 — LLM semantic field classifier

Inputs:

- natural-language requirement;
- spreadsheet columns;
- legacy screenshot/evidence.

Outputs:

- reuse/profile/projection/custom-extension/new-semantic classification;
- confidence/rationale/evidence;
- proposed ObjectExtensionDefinition.

No direct production write.

### A3 — Adaptation Preview

Human sees semantic diff + generated Counterparty experience + import dry-run.

### A4 — Enterprise Extension Package

Bundle extensions, projections, import maps and workspace contributions into one
enterprise-owned versioned package/draft.

### A5 — Learning loop

Experience-Compiler compares accepted/anonymized semantics and proposes reusable
industry/template candidates.

### A6 — Bounded Application generation

Generate new Applications/Commands/BusinessData definitions from existing contracts
only after Foundation Object adaptation is proven.

## 24. First proof scenario

Counterparty is the first proof because we already have strong old-system evidence.

Inputs:

- old Asloop Counterparty screenshots;
- old field inventory;
- sample import spreadsheet;
- current Counterparty v0.2 model.

Expected classification:

~~~text
Core identity
  reuse

CUSTOMER/SUPPLIER
  reuse Relationship Roles

Contacts/Addresses
  Facet/related resources

credit/payment/logistics
  relationship Profile

annual sales/purchase/current shipment total
  Projection — reject as master data

unusual project-only field
  Enterprise Custom Extension
~~~

Then generate one real extension end-to-end:

~~~text
definition
→ persistence
→ Object Page
→ import column
→ permission
→ Agent descriptor
→ tests
~~~

If this works, we have proven the core fast-response mechanism before entering an
unknown industry.

## 25. Success metrics

### Speed

- evidence → first semantic delta;
- semantic delta → working preview;
- accepted plan → activated enterprise version.

### Reuse

- percentage mapped to existing semantics;
- enterprise-local extension percentage;
- truly new semantic percentage;
- percentage requiring bespoke code.

### Quality

- Human corrections per generated plan;
- post-activation defects;
- import reconciliation failures;
- permission defects;
- replay/runtime regressions.

### Learning

- reusable patterns promoted;
- repeated questions eliminated;
- adaptation time improvement for later enterprises in the same industry.

Long-term target:

> Most new-enterprise differences are resolved by definitions/packages rather than
> bespoke source-code changes.

## 26. Hard invariants

1. A new enterprise requirement does not automatically mean a new shared schema.
2. LLM semantic classification precedes implementation generation.
3. A structured Adaptation Plan precedes material activation.
4. Enterprise-specific extensions are namespaced and versioned.
5. One accepted definition drives applicable storage/UI/import/permission/Agent
   surfaces; these must not drift independently.
6. Projection/derived state never becomes master truth for convenience.
7. Historical BusinessData is preserved under later adaptation.
8. Template Store content is a starting copy, not a live runtime parent.
9. Experience-Compiler learns/proposes; Enterprise Context owns enterprise truth.
10. Eidos renders; domain/application definitions own semantics.
11. EVO runtime changes are exceptional L5 work.
12. Human approval is proportional to semantic/material risk.
13. Generated code remains governed source code with tests and CI.
14. Customer-private data is not shared across enterprises by default.
15. Every activation has reproducible version/provenance evidence.
16. Fast response must reduce bespoke engineering without weakening deterministic
    authority, security, replay or rollback.

## 27. One-line target

> **A new industry should feel less like starting a software project and more like
> teaching EVO a new enterprise dialect: the LLM performs understanding and semantic
> convergence, while EVO compiles the accepted understanding into governed software.**


## 28. Enterprise operating-model transformation companion

The enterprise adaptation pipeline is also the mechanism by which a legacy enterprise
reorganizes and reshapes its operating model into EVO.

Companion authority:

`docs/architecture/ENTERPRISE-OPERATING-MODEL-TRANSFORMATION-v0.1.md`

Canonical relationship:

~~~text
legacy evidence
→ discover / rationalize / harmonize / redesign
→ EnterpriseAdaptationPlan
→ import/migration mappings
→ enterprise-owned software version
~~~

Migration is therefore generated from an accepted target semantic model rather than
used as the source of target architecture.

The adaptation agent should explicitly classify source concepts with transformation
dispositions such as REUSE, MERGE, SPLIT, RECLASSIFY, NORMALIZE, EXTEND, RETIRE,
ARCHIVE and REBUILD.

This keeps the fast-response LLM advantage while preventing a one-to-one recreation
of legacy technical debt.
