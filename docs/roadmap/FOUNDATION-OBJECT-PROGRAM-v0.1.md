# EVO Foundation Object Program Roadmap v0.1

**Status:** ACTIVE SHORT-TERM MAINLINE  
**Date:** 2026-10-08  
**Program owner:** EVO-App-Platform  
**Current entry gate:** CP-07 Counterparty maturity gate (CP-06 CLOSED_HUMAN_PASS)
**Architecture authority:** docs/architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md

## 1. Program goal

Build a reusable Foundation Object system through real vertical slices, not by pre-designing a universal ERP ontology.

The program proves one reusable pattern across:

~~~text
Counterparty
→ Item/Product
→ Warehouse/Location
→ Trading Reference Loop
~~~

The intended result is a stable mechanism for small core identities, role/profile/facet composition, enterprise-specific extensions, import-first initialization, responsibility and data-scope authorization, projections/worklists, Personal Workbench contributions, Agent operations over the same contracts, real/demo/RVC validation, and LLM-native enterprise adaptation.

## 2. Program sequencing principle

Do not attempt all Foundation Objects first.

~~~text
shared mechanism
→ prove on Counterparty
→ reuse on Item
→ correct abstraction
→ reuse on Warehouse/Location
→ stop object-first expansion
→ run real Trading business loop
~~~

The program deliberately alternates platform mechanism and business proof.

## 3. Persistent continuation rule

A fresh ChatGPT / LLM session must not reconstruct this roadmap from prior chat.

Read:

1. AI-BOOTSTRAP.md
2. project.status.json
3. docs/roadmap/HANDOFF-LATEST.md
4. LLM.md
5. docs/architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md
6. this roadmap
7. the current milestone's object/plugin authority document

Repository state wins over conversation memory.

Each milestone below has a stable ID. Future chats continue from the first non-closed gate; they do not restart the program from discussion.

## 3A. Enterprise Context persistence invariant

All milestones in this roadmap obey the canonical Enterprise Context Resource
Container architecture.

~~~text
plugin/application
  defines semantics
        ↓
Enterprise Resource contract
        ↓
Enterprise Context Resource Library
  stores durable enterprise-owned resources
~~~

Counterparty, Item and Warehouse MUST NOT introduce private durable stores that bypass
the Enterprise Context persistence/access boundary.

Likewise, Enterprise Context MUST NOT absorb the business semantics of those objects.

Shared capabilities introduced by this roadmap use their own namespaces/resources:

~~~text
Object Extension
Data Import
Responsibility
Projection definitions
Enterprise Adaptation drafts/plans
~~~

where the state is enterprise-owned and durable.

Personal-only layout/preferences remain Personal Context. Runtime BusinessData/Ledger
facts remain with EVO/owning deterministic runtime. Experience-Compiler learning
remains with EC.

## 4. Milestone map

~~~text
FO-00  Architecture + continuity baseline
  ↓
CP-02  Counterparty role Human acceptance
  ↓
FO-01  Shared contracts + EffectiveObjectSchema compiler
  ↓
CP-03  Enterprise Extension + Import-first vertical proof
  ↓
CP-04  Responsibility + role projections + data-scope permissions
  ↓
CP-03D Import learning + reuse Human closure
  ↓
AF-01  Conversation PostgreSQL Authority
  ↓
AF-02  Long-context v0.1
  ↓
CP-05  Facets / Profiles / Contact / Address
  ↓
CP-06  Workbench + Agent composition
  ↓
CP-07  Counterparty demo/RVC maturity gate
  ↓
IT-01  Item/Product second-object proof
  ↓
WH-01  Warehouse/Location third-object proof
  ↓
TR-01  Trading Reference Loop
~~~

Parallel LLM-native adaptation track:

~~~text
AD-01  structured semantic classifier
AD-02  EnterpriseAdaptationPlan preview
AD-03  compile accepted extension/import/projection definitions
AD-04  Experience-Compiler learning loop
~~~

AD work starts only when the deterministic definition contracts it needs are real.

## 5. FO-00 — Architecture + continuity baseline

**Purpose:** prevent Counterparty from becoming a monolithic framework.

Deliverables:

- Foundation Object Platform Architecture;
- explicit code/dependency topology;
- roadmap with stable milestone IDs;
- project.status pointer;
- fresh-session continuation acceptance;
- current Counterparty v0.2 gate preserved.

Exit:

- docs merged;
- continuity CI PASS;
- next chat can identify current gate without transcript.

## 6. CP-02 — Counterparty Relationship Roles v0.2

**Current state:** CLOSED_HUMAN_PASS. Production Human validation confirmed simultaneous CUSTOMER + SUPPLIER roles and independent role removal without deleting the Counterparty identity.

Human acceptance:

- same Counterparty can be CUSTOMER + SUPPLIER;
- remove one role without deleting identity or other role;
- detail UX understandable;
- desktop/mobile remain usable.

Do not add new platform mechanisms before this gate is at least Human-observed unless the change is documentation-only or required to fix a regression.

Exit state: COUNTERPARTY_V0_2_HUMAN_PASS

## 7. FO-01 — Shared contracts + EffectiveObjectSchema

**Purpose:** build the smallest reusable mechanism that future objects can consume.

Implement:

- contracts/foundation-object/*;
- Object Extension application package boundary (durable state via Enterprise Context);
- FoundationObjectDescriptorV010;
- ObjectExtensionDefinitionV010 draft contract;
- EffectiveObjectSchemaV010;
- deterministic schema compiler;
- extension-slot declaration;
- permission/applicability filtering contract;
- shared conformance testkit.

Counterparty contributes the first descriptor but does not own compiler code.

Acceptance:

- Counterparty renders current core fields from effective schema without semantic loss;
- one synthetic enterprise extension can be compiled without editing Counterparty core payload type;
- the same schema representation can feed Human UI, import and Agent-facing schema adapters;
- no Customer/Supplier vocabulary appears in generic compiler implementation.

Contract status after FO-01: EXPERIMENTAL. Do not call it stable until Item consumes it.

## 8. CP-03 — Enterprise Extension + Import-first vertical proof

**Purpose:** prove fast enterprise variation on a real object.

### CP-03A — Enterprise extension

Use a realistic field such as CustomerProfile.channelDepositGrade.

It must be enterprise-scoped, namespaced, versioned, attached to a declared semantic slot, permission-aware, visible/editable through effective schema, Agent-readable according to policy, and absent from shared Counterparty core schema.

### CP-03B — Shared Data Import MVP

Create generic apps/data-import capability.

~~~text
CSV/XLSX
→ ImportJob
→ staging
→ mapping
→ validation
→ dry run
→ explicit commit
→ receipt/error report
~~~

Counterparty supplies an import target through a public contract.

Acceptance:

- 1,000-record demo import; **PASS via atomic full commit**
- 10,000-record interaction/performance import; **stage/dry-run PASS; full commit remains optional follow-up certification**
- customer-only / supplier-only / both roles;
- extension-field mapping;
- duplicate/code validation;
- failed-row export;
- repeat commit is idempotent or deterministically blocked;
- Import does not import Counterparty private repository code.

### CP-03C — Test data

Create deterministic CI fixture, 1k demo seed, 10k larger demo/import dataset, and source manifest for external RVC evidence.

Current implementation evidence:

- Object Extension governed public operations: PASS.
- Generic CSV Data Import core + Counterparty import target: PASS.
- EffectiveObjectSchema-driven core + extension mapping: PASS.
- CUSTOMER/SUPPLIER role-aware import: PASS.
- Enterprise Context extension-value sidecars: PASS.
- Atomic Enterprise Resource transaction/bulk persistence: PASS.
- Deterministic 1k full Counterparty commit: PASS.
- Whole-batch rollback on commit failure: PASS.
- 10k stage/dry-run: PASS.
- XLSX source adapter: **PASS — merged/CI/production through PR #439.**
- Eidos Human import mapping/review/dry-run/error experience: **PASS — merged/CI/production through PR #439; Human production validation PASS on 2026-10-07.**

Human gate: **CLOSED_HUMAN_PASS on 2026-10-07.**

Exit state: COUNTERPARTY_IMPORT_EXTENSION_VERTICAL_PASS

### CP-03D — Import learning + reuse product closure

**Current state:** CLOSED_HUMAN_PASS. Same-structure saved-mapping reuse passed Human production validation, and the cross-structure backend learning loop passed against the real production Experience Compiler after fixing the SQLite worker-thread defect. The Human explicitly accepted that recommendation-presentation styling is not a meaningful remaining gate at this stage. CP-03/CP-03D therefore closes at the Data Import foundation boundary.

The earlier Data Import work proved two useful but different mechanisms:

- deterministic field matching from the current target schema;
- whole-file Import Recipe reuse when the later source structure is compatible.

Neither mechanism by itself is the persistent learning capability. A later Human test exposed the missing behavior: a source field such as `编码` had been Human-mapped to `Counterparty.code` before, but a structurally different later file did not reuse that experience.

The authority boundary is now explicit:

~~~text
EVO / Data Import
  deterministic source handling
  target schema
  mapping execution
  dry run
  Human correction / confirmation
  commit
  receipt / evidence
  Import Recipe deterministic cache
        |
        | successful Human-confirmed experience
        v
Experience Compiler
  persistent advisory experience
  provenance
  scoped learning
  contradiction handling
  recommendation
        |
        | advisory recommendation + confidence + evidence
        v
EVO / Eidos Human review
  Human may accept or correct
  deterministic execution remains owned by EVO
~~~

**Experience Compiler is the learning owner.** Enterprise Context is not a substitute learning store, and Import Recipe is not the learning system. Recipe remains an executable whole-file artifact/cache for formats that are already known and stable.

The closure loop is:

~~~text
first unfamiliar import
→ deterministic mapping where possible
→ optional Agent/EC assistance for unresolved semantics
→ Human review/correction
→ dry run
→ explicit confirmation
→ atomic commit
→ Recipe may be compiled for same-structure reuse
→ successful Human-confirmed mapping evidence is submitted to EC
→ EC persists scoped experience with provenance

same-structure later import
→ confirmed Recipe fast path
→ no unnecessary EC/LLM call
→ dry run / Human confirmation / commit

different-structure later import
→ Recipe does not match
→ deterministic mapping resolves what it safely can
→ EC receives unresolved/current source terms + target schema
→ EC may recommend mappings from prior scoped experience
→ recommendation includes confidence/evidence and remains Human-correctable
→ EVO validates and executes deterministically
→ successful outcome returns new evidence to EC
~~~

Hard requirements:

- EC learns only from a final Human-confirmed mapping whose dry run passed and commit succeeded;
- one tenant/object experience does not silently become global truth;
- learned experience is at least tenant + target-object scoped;
- equal conflicting experience fails closed;
- EC recommendations are advisory only and cannot commit or mutate operational truth;
- EC may disappear or time out without making Data Import unavailable;
- the target field must still exist and be importable before an EC recommendation can be applied;
- same-structure Recipe reuse remains the cheaper deterministic fast path;
- unmapped columns and original source evidence are preserved;
- Import function entry and Import history/review remain separate UX concerns;
- recommendation provenance/confidence and learning outcome must remain auditable.

Implemented evidence:

- Experience Compiler PR #7 merged at `63c2304b6b54fa40a63996b3c3736b8ad4277c1e`, CI PASS.
- EC exposes versioned advisory endpoints for mapping experience intake and mapping recommendations.
- App Platform PR #462 merged at `be1e33bc0bb8b7ec220f04ad1589d97171e9c7d1`, all required CI PASS.
- App Platform production deployment `fa2d9ffb-46e7-4b7f-bb61-6b4b4351c7ee` is SUCCESS.
- Protocol proof demonstrates:
  - file A Human-confirms `编码 -> Counterparty.code`;
  - commit succeeds and EC experience is recorded;
  - file B has a different overall column structure;
  - `编码` is recommended again as `Counterparty.code` from EC experience rather than whole-file Recipe reuse.
- App Platform consults EC only when configured and catches EC failure/timeouts so normal import remains available.

Production deployment is now live:

- Experience Compiler service: `472c1e8d-94ff-4e58-8bb0-bb06e6efe8b1`
- EC deployment: `6bc36f41-c76f-41db-aae3-3643534b9911` — SUCCESS
- EC persistent volume: `b8d746a5-0b95-4ace-b7cf-6ac5cae40096` mounted at `/data`
- EC private endpoint: `experience-compiler.railway.internal:8000`
- Railway health proof: `GET /health -> 200 OK`
- App Platform EC wiring deployment: `38c63eb9-cce6-444f-837f-cf4e919a5e10` — SUCCESS
- `APP_PLATFORM_EC_ADVISORY_BASE_URL` points to the EC private endpoint.

Closure evidence:

1. same-structure Recipe reuse is HUMAN PASS in production, including save-mapping -> precheck -> no-import -> later same-structure reuse;
2. a real production proof completed Human-origin dry run + commit -> EC experience -> differently structured second-file recommendation;
3. the second proof explicitly showed whole-file Recipe reuse was absent;
4. recommendations carried confidence/provenance, remained advisory-only and did not directly write operational truth;
5. EC failure fallback, stale-target safety and source evidence are covered by implementation/protocol evidence;
6. Human scope decision on 2026-10-08 closed recommendation-presentation styling as a non-gating concern for this milestone.

Boundary note: CP-03 closure does **not** claim that every legacy Counterparty source column already has a mature domain model. Repeatable Contact/Address resources, CustomerProfile/SupplierProfile semantics, richer field destinations and full representative business-data completeness remain CP-05 through CP-07 work. Those later semantics must not reopen CP-03.

Exit state: COUNTERPARTY_IMPORT_EC_LEARNING_REUSE_LOOP_PASS — CLOSED_HUMAN_PASS

### Interposed execution route before CP-05

After CP-03D closes, the Foundation Object Program pauses for two bounded Agent-foundation debt gates before CP-05 begins:

~~~text
CP-03D CLOSED
  ↓
AF-01 Conversation PostgreSQL Authority
  ↓
AF-02 Long-context v0.1
  ↓
CP-05
~~~

Authority: `docs/roadmap/AI-NATIVE-AGENT-FOUNDATION-DEBT-RETIREMENT-v0.1.md`.

This does **not** reopen CP-04 and does **not** turn Personal Agent foundation work into an open-ended rewrite. AF-01 and AF-02 have explicit exit criteria; once both pass, return to CP-05.

## 9. AD-01 — Semantic classifier

Starts after CP-03 contracts exist.

Input: natural-language requirement, spreadsheet columns, old UI screenshot/field inventory.

Structured output classes:

~~~text
REUSE_CORE
ROLE_PROFILE
RELATED_RESOURCE
ENTERPRISE_EXTENSION
PROJECTION
PRESENTATION
CANDIDATE_NEW_SEMANTIC
UNRESOLVED
~~~

Output includes target owner, confidence, evidence, questions and proposed definition. No production write.

Counterparty old-system evidence is the evaluation corpus.

Exit requires a fixed known-answer test set and structured Human corrections.

## 10. CP-04 — Responsibility + Projections + data scope

**Current state:** CLOSED_HUMAN_PASS (PR #458). Implementation is merged, CI-passed and production-deployed. Human product validation closed CP-04 on 2026-10-08. CP-03D is also now CLOSED_HUMAN_PASS; AF-01 is the active interposed gate.

Create shared Responsibility capability.

Counterparty proves CUSTOMER + SALES_OWNER and SUPPLIER + PROCUREMENT_OWNER.

Add governed projections: Customers, Suppliers, My Customers, My Suppliers.

Permission model must prove:

~~~text
authorized data scope
∩ relationship role
∩ responsibility relation
= effective My X result
~~~

Acceptance:

- My Customers is not a client-side filter over all Counterparties;
- unauthorized records/fields never reach the client;
- one Counterparty may have different sales/procurement owners;
- projections do not duplicate identities;
- list/search remains responsive at 10k demo records.

Long-term BI reference only: `docs/architecture/COUNTERPARTY-ANALYTICS-ENTRY-PRINCIPLE-v0.1.md`. It records that Customer/Supplier role lists may later act as optional analysis entry points. This is non-gating and adds no CP-05/CP-06 requirement.

## 11. AD-02 — EnterpriseAdaptationPlan preview

Once extensions/import/projections are deterministic, add machine-readable EnterpriseAdaptationPlan Draft.

Human preview must show reused semantics, enterprise extensions, projections, permissions, import mappings, unresolved questions, representative Object Page/List preview, generated tests/validation and transformation dispositions.

No activation from free-form chat.

Exit: Human can approve/reject semantic changes without reading a source-code diff.

## 12. CP-05 — Facets / Profiles / related resources

**Current state:** CLOSED_HUMAN_PASS. Contact/Address child resources, role-scoped CustomerProfile/SupplierProfile, explicit EffectiveObjectSchema semantic destinations, Data Import persistence and progressive Eidos detail composition are implemented, deployed and Human validated. PRs #488/#491/#492 provide implementation evidence; production deployment 10662ea6-5c4f-4201-9d0f-a952c3dc71cb was accepted on 2026-10-09.

Add only business-proven concepts.

Initial candidates: Contact, Address, CustomerProfile, SupplierProfile.

Potential later facets: BankAccount, Tax/Invoicing, Certificate/Credential, Commercial/Settlement terms.

Do not implement all old Asloop fields.

Acceptance:

- repeatable Contact/Address are child resources, not flattened fields;
- Customer-only data is absent when CUSTOMER role does not apply;
- Supplier-only data is absent when SUPPLIER role does not apply;
- enterprise extensions can target declared Profile slots;
- object page composes facets progressively through Eidos.

## 13. CP-06 — Personal Workbench + Agent

**Current state:** CLOSED_HUMAN_PASS. Shared governed Counterparty projections, package-contributed Workbench composition, Enterprise/role defaults, personal preferences, Favorites/Recent, fixed capability entries and Personal Agent projection reuse are implemented. Workspace is the independent optional `evo-bi-workbench` application plugin in the BI / Insight Experience Layer. Human product validation passed on 2026-10-09 against the current production mainline; PR #509 also makes install/use-driven plugin lazy resource loading a platform authority.

Counterparty contributes to, but does not own, Personal Workbench. App Platform Host also does not own Workbench semantics; it owns only generic Package/Feature lifecycle, authorization, Contribution discovery and routing.

First shared workbench proof: My Work, My Customers, My Suppliers, Recent/Favorites, authorized exception projections, fixed capabilities and Personal Agent.

Acceptance:

- Package default -> enterprise/role default -> personal preference layering;
- personalization cannot expand authority;
- Agent opens/queries the same projection contracts as Human UI;
- common deterministic actions remain fixed capabilities, not Agent-only behavior.

## 14. AD-03 — Definition compilation

Compile one accepted enterprise extension/adaptation plan into all applicable outputs:

~~~text
definition
→ persistence schema
→ validation
→ Eidos field/facet
→ Import target
→ permission descriptor
→ Projection field catalog
→ Agent schema
→ deterministic tests
~~~

Acceptance:

- no hand-maintained duplicate field declaration for UI/import/Agent;
- accepted Plan + compiler version reproduces generated artifacts;
- semantic diff is versioned in Enterprise Context.

## 15. CP-07 — Counterparty maturity gate

**Current state:** ACTIVE. CP-06 is CLOSED_HUMAN_PASS. Pressure-test and document the accepted Counterparty/Foundation Object vertical before starting Item/Product; do not reopen closed Counterparty semantics merely to add more features.

Before calling Counterparty a mature Foundation Object:

- identity pass;
- role pass;
- extension/import pass;
- responsibility/projection/permission pass;
- facets/profile pass;
- workbench/Agent pass;
- 10k demo data pass;
- >=100k RVC integration pressure test;
- 1M+ performance test where practical;
- permission/sensitive-field tests;
- legacy-field transformation report;
- upgrade/version compatibility evidence.

This means the Foundation Object mechanism is proven deeply enough to move to a second object, not that every possible Counterparty feature exists.

## 16. IT-01 — Item/Product second-object proof

Purpose: validate shared architecture against a materially different object.

Initial semantic questions include Product vs Item vs SKU vs Service, variant dimensions, UOM, barcode/GTIN, category, sales/procurement/inventory/manufacturing Profiles, and batch/serial identity boundaries.

Mandatory architecture acceptance:

- reuse FoundationObjectDescriptor;
- reuse EffectiveObjectSchema;
- reuse Enterprise Extensions;
- reuse Data Import;
- reuse Projection;
- reuse Responsibility where applicable;
- no Counterparty-specific branches in shared infrastructure.

Use Open Food Facts and other real Item datasets for pressure evidence.

After Item passes, shared contracts may move from EXPERIMENTAL toward STABLE if compatibility evidence supports it.

## 17. WH-01 — Warehouse/Location third-object proof

Validate Warehouse stable identity, Zone/Location/Bin structure, hierarchical imports, responsibility, physical/facility facets and operational projections.

Hard separation:

~~~text
Warehouse = where
Inventory Position = what Item is there and how much
~~~

Do not put on-hand balance into Warehouse master data.

Use real WMS/public warehouse/location evidence.

## 18. TR-01 — Trading Reference Loop

After three Foundation Object proofs, stop adding objects as the mainline.

~~~text
Counterparty
Item
Warehouse / Location

Purchase Order
→ Receipt
→ Inventory
→ Payable

Sales Order
→ Shipment
→ Inventory
→ Receivable
→ Receipt / Settlement
~~~

Purpose: exercise objects in real business relationships, pressure BusinessData snapshots, prove Ledger/Projection boundaries, produce Work/Personal Workbench, and reveal missing object semantics through real operations.

## 19. AD-04 — Experience-Compiler learning loop

After multiple accepted enterprise adaptations exist:

- store semantic mapping methods;
- compare repeated enterprise extensions;
- propose reusable Profile/Facet/Industry Pack candidates;
- track Human correction/outcome evidence;
- preserve customer-data isolation;
- promote only after explicit semantic review.

Do not build a giant industry ontology in advance.

## 20. Cross-chat execution protocol

Every implementation chat begins by identifying:

~~~text
program = Foundation Object Program
currentGate = first non-closed milestone
ownerRepo(s)
authority docs
acceptance criteria
known production evidence
~~~

Then follow:

~~~text
read authority
→ inspect existing assets
→ implement smallest vertical slice
→ tests/CI
→ deploy when product evidence requires
→ Human validation when required
→ update project.status
→ regenerate HANDOFF-LATEST
→ move to next gate
~~~

Do not use chat memory as the milestone tracker.

## 21. Change-management rules

When a new generic requirement appears while working in Counterparty:

1. If it is Counterparty semantic, keep it in Counterparty.
2. If it is object-agnostic and required by the accepted vertical slice, place it behind shared Foundation Object contract/module/package.
3. If speculative, defer it.
4. If it belongs to Eidos / EC / EVO, change the correct owner through public contracts.

When Item exposes a generic mechanism already embedded in Counterparty, extract/converge it into shared infrastructure before duplicating it.

Shared contract changes must document compatibility impact, migration path, object consumers, generated artifact impact and tests.

## 22. Explicit non-goals

Do not:

- build every ERP master-data object first;
- create a universal Entity mega-table;
- build a general no-code database/form designer;
- copy all Asloop fields;
- create an industry template catalog before real proofs;
- move object semantics into App Platform Core;
- let LLM freely mutate production definitions;
- replace deterministic capabilities with Agent prompts;
- make every projection a materialized table;
- freeze shared contracts before second-object evidence.

## 23. Program success

The program is successful when a new enterprise can present business/data evidence and EVO can respond mostly through reuse, enterprise definitions, generated imports, projections, workbench composition and bounded new Applications rather than bespoke database/backend/page/import/permission/Agent implementations.

Counterparty is the first proof, Item is the first anti-overfit proof, Warehouse is the structural proof, and Trading Loop is the real-business proof.
