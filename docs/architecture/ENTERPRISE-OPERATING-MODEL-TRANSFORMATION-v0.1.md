# EVO Enterprise Operating Model Transformation Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-07  
**Owner:** EVO-App-Platform, collaborating through public contracts with Experience-Compiler, Eidos and EVO  
**Purpose:** define EVO adoption as enterprise operating-model transformation, where archaeology, rationalization, harmonization, governance, redesign, compilation and transition replace one-to-one legacy-system migration

## 1. Core proposition

When an enterprise adopts EVO, the project should not primarily ask:

> How do we copy the old ERP into EVO?

The project should ask:

> Which parts of the old system represent durable business truth, which parts are
> duplicated/accidental/derived/obsolete, what should be preserved, reorganized,
> normalized, redesigned or retired, and how should the result become a clearer,
> governed EVO operating model?

Canonical distinction:

~~~text
Migration
= move data/configuration/workloads from source to target

Operating Model Transformation
= understand what the enterprise actually does
  + preserve validated business meaning
  + rationalize accumulated complexity
  + harmonize inconsistent semantics where appropriate
  + clean/govern data
  + redesign processes where value justifies it
  + preserve explicit enterprise differentiation
  + recompose Human/Agent experience
  + compile the accepted target model into an enterprise-owned software version
  + transition data and operations into that version
~~~

Migration is only one execution step near the end. "Convergence" remains a useful
operator for some duplicated or inconsistent semantics, but it is not the umbrella
name for the whole adoption journey.

## 1.1 Transformation vocabulary

No single verb is sufficient. EVO deliberately separates these actions:

| Action | Chinese working term | Meaning |
| --- | --- | --- |
| DISCOVER | 考古 / 盘点 / 梳理 | recover how the enterprise actually works from people, data, screens, SOPs and code |
| RATIONALIZE | 整理 / 取舍 / 去冗余 | decide what still has business value and remove accidental complexity |
| HARMONIZE | 归一 / 协调 / 收敛 | align duplicated or inconsistent meanings/codes where one governed meaning is justified |
| GOVERN | 治理 / 清理 | improve data quality, ownership, permissions, identifiers and provenance |
| REDESIGN | 重构 / 优化 / 流程再造 | change objects, responsibilities or end-to-end processes when the current operating model is genuinely suboptimal |
| EXTEND | 保留差异 / 显式扩展 | preserve legitimate industry/enterprise differentiation as governed semantics |
| RECOMPOSE | 重组 / 再编排 | compose objects, capabilities, projections, workbenches and Agent/Human experiences around the target way of working |
| COMPILE | 编译 | turn accepted semantic definitions into storage, validation, import, UI, permissions, Agent contracts and tests |
| TRANSITION | 切换 / 迁移 | move accepted data and operations into the activated target version |

The umbrella is **Enterprise Operating Model Transformation / 企业运营模型重塑**.
"BPR / 流程再造" is one possible REDESIGN technique, not the default treatment for
every process.

## 2. External evidence: recurring enterprise-software pain

External sources and practitioner discussions repeatedly surface several patterns.

### 2.1 Heavy customization creates long-term upgrade debt

SAP's current "clean core" guidance explicitly describes heavily customized ERP
landscapes as difficult and expensive to maintain and upgrade. SAP recommends
standardizing non-differentiating processes and keeping extensions decoupled from
standard Core through governed, upgrade-stable interfaces.

References:

- https://www.sap.com/resources/what-is-a-clean-core
- https://www.sap.com/documents/2024/09/20aece06-d87e-0010-bca6-c68f7e60039b.html

EVO implication:

> Enterprise differentiation must survive without contaminating shared Core.

### 2.2 Users work around the ERP when daily operations do not fit

Recent practitioner discussions describe recurring patterns such as:

- exporting ERP data into spreadsheets for production planning/scheduling;
- operations being executed outside the ERP while the ERP becomes mainly a reporting
  or accounting system;
- different teams maintaining separate spreadsheet versions of the same operational
  truth;
- users consuming only a small part of available ERP capability;
- reports that appear clean but no longer match operational reality.

Representative discussions:

- https://www.reddit.com/r/ERP/comments/1rejy55/the_biggest_erp_challenge_in_my_opinion/
- https://www.reddit.com/r/ERP/comments/1qsaw1g/small_manufactturer_outgrowing_current_erp_need/
- https://www.reddit.com/r/ERP/comments/1qykb4n/anyone_else_struggling_after_switching_to_an_erp/

These discussions are anecdotal rather than statistical evidence, but they align with
a common architectural problem:

> the system's configured model and the user's real work diverge over time.

### 2.3 Too many fields/tabs create cognitive and training cost

Users report confusion when simple work requires navigating many tabs/fields and when
they cannot tell which fields matter for their role or task.

Representative discussion:

- https://www.reddit.com/r/ERP/comments/1rfb1w1/i_would_never_use_a_erp_again/

EVO implication:

> capability and permission applicability should determine what is rendered; a user
> should not be forced to understand the whole enterprise data model to finish one job.

### 2.4 Requirements arrive as technical requests rather than business problems

Practitioner discussions also describe customization requests arriving as "add a
field" or "add an approval step" after the underlying business problem has been lost.
When response is slow, users create spreadsheets/scripts that become unowned shadow
systems.

Representative discussion:

- https://www.reddit.com/r/ERP/comments/1wtb9d1/most_customization_requests_reach_me_as_a_spec/

EVO implication:

> LLM adaptation begins with semantic/problem reconstruction, not acceptance of the
> requested physical solution.

### 2.5 Data migration often transfers historical disorder

Migration practitioners repeatedly describe duplicate customers/SKUs, inconsistent
names/UOMs, inactive records and missing business context as major causes of later
report distrust.

Representative discussions:

- https://www.reddit.com/r/ERP/comments/1ruiff6/whats_the_most_underestimated_part_of_erp_data/
- https://www.reddit.com/r/ERP/comments/1r3uv5j/whats_the_most_underestimated_part_of_erp_data/

EVO implication:

> moving all source rows successfully is not proof of successful migration.

### 2.6 Tribal knowledge is often more important than legacy schema

Recent ERP migration discussions describe old delays, scripts, Excel workbooks and
manual routines that nobody can fully explain but that have become operational
dependencies.

Representative discussion:

- https://www.reddit.com/r/ERP/comments/1v87e4l/is_it_just_me_or_are_erp_migrations_basically/

EVO implication:

> implementation is partly business archaeology: evidence must include people,
> spreadsheets, screenshots, reports and observed workarounds, not only database
> schemas.

## 3. Pain map

The recurring pain can be grouped into five structural categories.

### P1 — Model overload

~~~text
years of projects
→ more fields
→ more tabs
→ more hidden controls
→ more exceptions
→ nobody knows what is actually canonical
~~~

### P2 — Translation latency

~~~text
business user
→ consultant
→ requirements document
→ architect
→ developer
→ tester
→ user
~~~

Every handoff increases time and semantic loss.

### P3 — Shadow operations

When software response is slow or the model does not fit:

~~~text
ERP
→ export Excel
→ manual planning
→ local script
→ email approval
→ re-enter result
~~~

The official system no longer contains the whole operational truth.

### P4 — Customization debt

A locally useful customization becomes permanent source-code/database coupling.

~~~text
short-term fit
→ long-term upgrade cost
→ regression testing
→ dependency on original implementer
~~~

### P5 — Migration without understanding

~~~text
source field
→ target field
~~~

is performed without first deciding whether the source concept should be:

- preserved;
- merged;
- split;
- reclassified;
- derived;
- retired;
- archived only.

## 4. EVO response: transformation without homogenization

Transformation MUST NOT mean forcing every enterprise into one rigid standard.

EVO should rationalize and harmonize **accidental complexity** while preserving and
explicitly modeling **intentional differentiation**.

Converge:

- duplicate concepts;
- inconsistent naming;
- legacy physical implementation choices;
- unused fields;
- shadow calculations;
- derived values stored as master data;
- obsolete approval/batch artifacts;
- manual presentation hiding;
- duplicated Customer/Supplier identities;
- undocumented local mappings;
- technical workarounds that no longer express current business intent.

Preserve or explicitly extend:

- regulatory requirements;
- industry-specific semantics;
- true competitive process differences;
- enterprise-specific master facts;
- intentional commercial policies;
- legitimate local operational constraints.

Canonical principle:

> **Standardize what is accidental; model explicitly what is differentiating.**

## 5. Transformation operators

Every discovered legacy concept should receive an explicit transformation disposition.

### REUSE

Existing EVO semantic already represents the concept.

Example:

~~~text
old dealer/customer identity
→ Counterparty
~~~

### MERGE

Multiple legacy representations have one target semantic.

Example:

~~~text
Customer Master
Supplier Master
Dealer Master
→ one Counterparty identity + explicit roles
~~~

### SPLIT

One legacy field/table mixes multiple meanings.

Example:

~~~text
负责人
→ SALES_OWNER
→ PROCUREMENT_OWNER
→ FINANCE_OWNER
~~~

### RECLASSIFY

The value belongs to another semantic layer.

Example:

~~~text
annualSales stored on master record
→ Sales Projection
~~~

### NORMALIZE

Same meaning exists with inconsistent values/codes.

Example:

~~~text
CN / CHN / 中国 / China
→ governed country identifier
~~~

### EXTEND

A legitimate enterprise-specific semantic has no shared owner yet.

~~~text
CustomerProfile.enterprise_x.channelDepositGrade
~~~

### PROMOTE

Repeated accepted enterprise extensions later become a shared Facet/Profile/Industry
Pack after evidence review.

### RETIRE

Legacy semantic is no longer needed in the target operating model.

### ARCHIVE

Historical evidence must remain accessible but should not be active enterprise
software truth.

### REBUILD

The business need remains valid but old implementation is rejected.

Example:

~~~text
mutable stored balance
→ immutable effects + rebuildable Projection
~~~

## 6. Transformation pipeline

~~~text
Legacy enterprise evidence
        ↓
Inventory
        ↓
LLM business archaeology
        ↓
Concept clustering + usage analysis
        ↓
Transformation dispositions
  REUSE / MERGE / SPLIT / RECLASSIFY /
  NORMALIZE / EXTEND / RETIRE / ARCHIVE / REBUILD
        ↓
Target Enterprise Semantic Model
        ↓
EnterpriseAdaptationPlan
        ↓
import mappings + migrations
        ↓
Working Draft
        ↓
scenario validation
        ↓
enterprise software version
        ↓
activation
~~~

This pipeline makes source-to-target mapping an output of target operating-model design rather
than the first design activity.

## 7. Transformation Workspace product direction

EVO should eventually expose convergence as a first-class Human/Agent product
experience.

Candidate experience:

~~~text
EVO Transformation Workspace

Evidence
  3 Excel files
  18 screenshots
  2 SOP documents
  source schema
  50k sample records

LLM findings
  126 source concepts
  71 reused
  19 merged
  8 split
  11 projections
  7 enterprise extensions
  4 obsolete/retire candidates
  6 unresolved questions

Semantic questions
  "年度采购额是人工维护还是系统计算？"
  "负责人是否销售/采购共享？"
  "客户等级是否只影响销售？"

Target preview
  Counterparty
  Customer/Supplier Profiles
  Contacts/Addresses
  Projections
  Workbench
  Import mappings

Data-quality findings
  duplicates
  invalid identifiers
  inconsistent units
  inactive records

Verification
  dry-run
  reconciliation
  scenario tests
~~~

Human users review business meaning, not database migration scripts.

## 8. LLM advantage

The major LLM advantage is not code completion.

It is the ability to rapidly read heterogeneous evidence and recover semantic intent
across:

- natural-language interviews;
- screenshots;
- spreadsheets;
- source database fields;
- reports;
- old implementation code;
- SOPs;
- user workarounds;
- public industry terminology.

LLM can continuously ask:

~~~text
"What does this mean?"
"Is this already represented?"
"Is this actually derived?"
"Why is this field present?"
"Who uses it?"
"What happens if we remove it?"
"Which records contradict this interpretation?"
~~~

The transformation proposal then passes through deterministic platform contracts.

## 9. Source evidence is never target authority

The old ERP is evidence, not the specification.

~~~text
old table exists
≠ target table required

old field exists
≠ target field required

old workflow exists
≠ target workflow required

old customization exists
≠ current business requirement
~~~

Likewise:

~~~text
old workaround is ugly
≠ automatically useless
~~~

It may encode a real edge case that must be recovered explicitly.

## 10. Migration as a transformation by-product

Only after convergence do we generate technical migration.

Example:

~~~text
source:
  dealerCode
  dealerName
  label
  annualSales
  handler
  payWay

target transformation:
  dealerCode/name
    → Counterparty

  label
    → Customer/Supplier role

  annualSales
    → do not migrate as master truth;
       rebuild from historical facts or seed a bounded historical projection when required

  handler
    → ResponsibilityAssignment

  payWay
    → Commercial/Settlement Profile

then:
  generate target import/migration mappings
~~~

This avoids faithfully importing the mistakes of the old system.

## 11. Data governance and normalization

Migration should actively improve the enterprise model.

Candidate checks:

- duplicate identity;
- conflicting identifiers;
- inconsistent units/currencies;
- inactive records still referenced by live transactions;
- impossible dates;
- unused fields;
- values that never vary;
- free-text values that are actually dictionaries;
- duplicated reference objects;
- inconsistent role classification;
- missing relationship ownership;
- stored totals that cannot be reconciled.

LLM can prioritize anomalies, but deterministic rules and Human review decide material
corrections.

## 12. Process review, improvement and redesign

The same approach applies to workflow/process.

Not every process should be radically redesigned. IBM's BPR definition is intentionally
radical; EVO therefore treats full process reengineering as one high-change option,
alongside preserve, simplify and incremental improvement.

Each legacy step should first be classified as:

~~~text
BUSINESS_REQUIRED
REGULATORY_REQUIRED
CONTROL_REQUIRED
TECHNICAL_LEGACY
MANUAL_WORKAROUND
REDUNDANT
UNRESOLVED
~~~

Example:

~~~text
"订单必须等待24小时"
~~~

may be:

- a valid risk-control requirement; or
- a historical artifact from a removed nightly batch.

The new system must not preserve the delay simply because users are accustomed to it.

## 13. Standardization boundary

SAP's modern clean-core guidance emphasizes standardizing non-differentiating
processes while extending where differentiation matters.

EVO should adopt the same economic insight but implement it through operating-model
transformation.

~~~text
commodity/common need
→ reuse shared EVO/Industry Pack semantic

true enterprise differentiation
→ explicit Enterprise Extension / Application

accidental historical difference
→ converge/remove
~~~

## 14. Relationship to Microsoft Power Apps Plans

Power Apps Plans demonstrates a highly user-friendly input experience:

~~~text
natural language
+ legacy screenshot
+ process diagram
→ roles
→ requirements
→ data model
→ technology proposal
→ solution artifacts
~~~

EVO should learn strongly from that interaction model.

The key EVO difference is downstream:

~~~text
Power Apps-style evidence/plan experience
        ↓
EVO operating-model transformation
        ↓
EnterpriseAdaptationPlan
        ↓
versioned enterprise-owned definitions
        ↓
deterministic runtime contracts
~~~

AI does not receive authority to freely invent production semantics.

## 15. Relationship to Template Store

Template Store provides a transformation accelerator.

~~~text
legacy enterprise evidence
        +
closest Industry Pack
        ↓
LLM compares both
        ↓
reuse template semantics
        +
enterprise-specific delta
        ↓
Enterprise Working Draft
~~~

This is preferable to starting from either:

- an empty system; or
- copying the old ERP 1:1.

## 16. Relationship to Experience-Compiler

Experience-Compiler should learn the **methods and reusable semantic patterns** of
successful target transformation:

- common source-system mappings;
- recurring legacy anti-patterns;
- industry vocabulary;
- frequent split/merge patterns;
- questions that reveal hidden semantics;
- accepted Enterprise Extension patterns;
- reconciliation methods;
- known migration hazards.

It must not convert private customer records into shared knowledge without explicit
governance.

## 17. Human role in transformation

Humans remain decisive where meaning cannot be proven from evidence.

Human responsibilities:

- confirm business intent;
- resolve ambiguous terminology;
- decide which differences are strategically important;
- approve data cleanup;
- approve retirement of old behavior;
- approve compliance-sensitive mappings;
- accept enterprise software version.

LLM should minimize technical questions.

Good question:

> "这个年度销售额是从订单实时汇总，还是财务确认后的销售额？"

Bad question:

> "要不要在 counterparty 表加 annual_sales decimal(18,2)？"

## 18. Adoption value proposition

For a customer, moving to EVO should create three outcomes simultaneously.

### 18.1 New operational software

The enterprise receives a modern Human/Agent experience.

### 18.2 Semantic cleanup

The enterprise reduces accumulated model ambiguity, duplicate objects and stale
technical constraints.

### 18.3 Future adaptability

Differences are expressed as governed definitions/extensions instead of uncontrolled
custom-code debt.

Therefore the migration project is not simply:

> "replace ERP A with EVO."

It becomes:

> **"Use EVO to understand, reorganize and reshape the enterprise's accumulated
> digital operating model into a clearer, explicit and continuously adaptable form."**

## 19. Transformation acceptance

An EVO transformation project is not complete merely because row counts match.

Evidence should include:

- source evidence inventory complete enough for target scope;
- each material legacy semantic has a documented convergence disposition;
- unresolved semantics are explicit;
- duplicate/inconsistent master data is reported and dispositioned;
- active workflows are reconciled against real Human work;
- target objects/profiles/projections have explicit ownership;
- import/migration is generated from accepted target semantics;
- representative BusinessData scenarios pass;
- balances/projections reconcile within declared boundaries;
- authorization/workbench behavior is validated by role;
- retired semantics remain available as historical evidence when required;
- enterprise version/provenance is pinned.

## 20. Metrics

Useful transformation metrics:

~~~text
Semantic reuse %
Merge count
Split count
Retired legacy fields/processes
Enterprise Extension %
Unresolved semantic count
Duplicate master-data reduction
Shadow spreadsheet/process reduction
Manual field-hiding reduction
Bespoke source-code requirement %
Reconciliation exception rate
Human questions per source concept
Time evidence → target preview
Time accepted preview → activation
~~~

The goal is not maximizing deletion.

The goal is maximizing semantic clarity while preserving business value.

## 21. Hard invariants

1. Legacy physical schema is evidence, not target authority.
2. Migration is subordinate to operating-model transformation.
3. Transformation rationalizes accidental complexity while preserving justified differentiation.
4. Every material source concept receives an explicit disposition.
5. Derived values do not become master truth merely because the old system stored
   them that way.
6. Old workarounds are investigated before either copying or deleting them.
7. Source evidence and target interpretation remain separately traceable.
8. Data cleanup and semantic cleanup are first-class migration outcomes.
9. Industry/template content accelerates convergence but never silently overwrites an
   enterprise.
10. LLM proposes and classifies; governed enterprise definitions own accepted truth.
11. Human review focuses on business semantics and material risk.
12. Historical BusinessData/runtime truth is not rewritten solely to fit a new model.
13. Enterprise differentiation should become explicit extension semantics instead of
   hidden Core customization.
14. A successful EVO adoption should leave the enterprise easier to understand,
   operate and change than before the transformation.

## 22. One-line target

> **EVO adoption is an enterprise operating-model transformation: understand what the
> business truly is, rationalize what history accidentally accumulated, redesign where
> value requires it, preserve meaningful differentiation, and compile the accepted
> result into a cleaner enterprise software version that can keep evolving.**
