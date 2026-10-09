# EVO Foundation Object Experience, Import & Workbench Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-07  
**Owner:** EVO App Platform / first-party foundation-object plugins  
**Applies to:** Counterparty first; then Item/Product, Warehouse/Location and later foundation objects

## 1. Why this architecture exists

Legacy ERP implementation often accumulates every possible field on one master-data
form and then hides irrelevant fields per customer project.

The old Asloop Counterparty/Dealer create page is a representative example. Over time
it accumulated identity, relationship, CRM, procurement, finance, tax, logistics,
responsibility, contact, address, certificate, attachment and derived operating
information in one screen.

That pattern creates four long-term problems:

1. **field explosion** — the shared page grows with every project;
2. **implementation-by-hiding** — consultants must manually hide irrelevant fields;
3. **wrong authority** — derived or role-specific values appear to be core master data;
4. **wrong primary workflow** — users are forced into single-record forms even when
   project initialization is overwhelmingly bulk import.

EVO MUST NOT reproduce this as a more modern-looking dynamic form.

Canonical response:

> **One object authority, many facets, many projections, many intake channels.**

## 2. Legacy Counterparty screen archaeology

The old page is useful evidence because its fields show several different semantic
owners that were flattened into one form.

| Legacy field family | Examples observed | EVO target owner |
| --- | --- | --- |
| Stable identity | 往来编码, 主体类型, 往来名称, 往来简称 | Counterparty Subject / Identity |
| Relationship classification | 关系标签 | Counterparty Relationship Role |
| Geographic identity/address | 国家或地区, 省, 市, 区, 详细地址 | Address Resource / Address Facet |
| Sales/customer profile | 客户等级, 客户来源, 销售区域, 小区域, 报价浮动系数 | Customer / Sales Relationship Profile |
| Supplier/procurement profile | 年度采购额, 采购额增量, 返利率 | Supplier / Procurement Profile or derived projection |
| Organization facts | 注册资本, 员工人数, 厂房性质, 经营年限 | Optional enterprise/company profile, not Counterparty core |
| Responsibility | 经办人, 经办组织, 经办职位, 负责人 | Enterprise Responsibility Relationship |
| Tax/invoice | 是否开票, 发票类型, 税率, 开票地区 | Tax / Invoicing Facet |
| Bank/settlement | 开户银行, 户名, 银行账号, 币种, 默认支付方式 | Bank Account + Settlement/Commercial Profile |
| Logistics | 默认物流条款 | Logistics/Commercial Profile |
| Contact | 联系人, 手机, 电子邮件, 职位, 称谓 | Contact Resource |
| Address list | 地址名称, 联系人, 联系方式, 邮编 | Address Resource + usage binding |
| Certificate | 证件名称, 证件号, 到期时间 | Credential/Certificate Resource |
| Attachments | 附件 | Attachment capability |
| Notes | 往来说明 | Notes/description extension |
| Derived operating state | 年度销售额, 当月可发货总额 and similar totals | Projection / Read Model |

Important lesson:

> A field visible on a historical Counterparty screen is not evidence that it belongs
> to the canonical Counterparty payload.

## 3. External product evidence

EVO uses external products as comparative evidence, not schema authority.

### 3.1 SAP Business Partner

SAP Business Partner allows one business partner to hold multiple roles such as
Customer, Supplier or Employee. Common data is maintained once while role-specific
data is maintained according to the role.

Reference:
https://help.sap.com/docs/SAP_S4HANA_CLOUD/f86dc2eb1f8b48c880a7607213104b27/981e51b7ed7349c693d54587acf3b2a4.html

Useful EVO lesson:

- identity should not be duplicated per role;
- role-specific data should not expand the general identity indefinitely;
- role authorization may differ.

### 3.2 SAP Fiori Object Page

SAP Fiori Object Page uses sections/subsections and progressive disclosure rather
than requiring every possible field to be visible at once.

References:
https://experience.sap.com/fiori-design-web/object-page/
https://experience.sap.com/fiori-design-web/object-page-content-area-sap-fiori-elements/

Useful EVO lesson:

- complex objects are navigated by meaningful facets/sections;
- secondary information can be collapsed or loaded progressively;
- one object page may compose forms, tables, charts and related objects.

### 3.3 Microsoft Dynamics 365 data management

Dynamics 365 Finance & Operations separates high-volume import into a Data Management
workspace and uses Source -> Staging -> Target flow. Mapping, validation and job/error
status are explicit before/while data reaches target entities.

References:
https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/data-management-integration-data-entity
https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/data-entities/data-import-export-job

Useful EVO lesson:

- project initialization and bulk maintenance deserve their own import workflow;
- files should not write directly and silently into master truth;
- mapping/validation/error evidence must be observable.

### 3.4 Microsoft Business Central role centers and personalization

Business Central uses Role Centers as role-tailored home pages. Administrators can
customize pages for a profile/role and users can personalize their own workspace on
top of that.

References:
https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-role-customization
https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-user
https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-manage

Useful EVO lesson:

- organization/role defaults and personal preferences are different layers;
- a business user should enter through relevant work, not the global master registry;
- personal layout must not redefine permissions or business truth.

### 3.5 Dynamics saved views/workspace composition

Finance & Operations can add a filtered/sorted list or saved view to a workspace as
a list, count tile or link.

Reference:
https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/personalize-user-experience

Useful EVO lesson:

> A workspace is a composition of governed projections/worklists, not a second data
> store.

### 3.6 Odoo / ERPNext / NetSuite

Odoo Contact represents a common business entity that may participate as customer,
vendor or another business capacity.

Reference:
https://www.odoo.com/documentation/20.0/applications/essentials/contacts.html

ERPNext exposes independent Data Import, Customize Form and role-based permission
capabilities.

References:
https://docs.frappe.io/erpnext/data-import
https://docs.frappe.io/erpnext/customize-form
https://docs.frappe.io/erpnext/permissions
https://docs.frappe.io/erpnext/workspace

NetSuite supports preferred/custom forms by role.

Reference:
https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2873968.html

Useful EVO lesson:

- customization, import, permission and role presentation are separate concerns;
- one universal page is not the only Human experience for one object.

## 4. Canonical EVO foundation-object experience model

A foundation object has one authoritative identity but can have multiple experience
surfaces.

~~~text
Foundation Object authority
        |
        +-- Registry / Master Data Administration
        |
        +-- Role-specific projection
        |     +-- Customers
        |     +-- Suppliers
        |     +-- My Customers
        |     +-- My Suppliers
        |
        +-- Object Page
        |     +-- Identity facet
        |     +-- Relationship facets
        |     +-- Extension facets
        |     +-- derived read-only projections
        |
        +-- Picker / reference control
        |
        +-- Import / bulk-management workspace
        |
        +-- Agent capability/tool surface
~~~

These are multiple experiences over one governed object, not multiple copies of the
object.

## 5. Field ownership model

EVO MUST classify a requested field before adding it.

### 5.1 Core identity fields

Properties needed to keep a stable, reusable identity across applications.

Counterparty examples:

~~~text
counterpartyId
code
displayName
subjectType
status
legalName?
core identifiers?
~~~

Core fields are intentionally small.

### 5.2 Relationship Role / Profile fields

Fields only meaningful because the object has a particular relationship to the
Enterprise.

Examples:

~~~text
CUSTOMER
  customer classification
  sales ownership
  customer-specific commercial defaults

SUPPLIER
  procurement ownership
  supplier-specific commercial defaults
~~~

A role/profile may have its own lifecycle and effective period.

### 5.3 Related resource/facet fields

Repeatable or separately governed structures MUST NOT be flattened into the object
payload merely for form convenience.

Examples:

~~~text
Addresses[]
Contacts[]
BankAccounts[]
Certificates[]
Attachments[]
TaxRegistrations[]
ResponsibilityAssignments[]
~~~

### 5.4 Enterprise custom extension fields

A customer implementation may require fields not justified as shared EVO semantics.

Such fields should live in an enterprise-scoped extension definition/namespace rather
than modifying Counterparty core for every customer.

Candidate conceptual shape:

~~~text
ObjectExtensionDefinition
  targetObjectType
  extensionNamespace
  fields[]
  validation
  displayFacet
  applicability
~~~

This is a design direction, not yet a frozen public contract.

Promotion rule:

> Repeated enterprise custom fields may become a shared role/profile/facet only after
> cross-enterprise evidence proves common semantics. Frequency alone is insufficient.

### 5.5 Projection/read-model fields

Calculated, aggregated or current-state values remain outside master data.

Examples:

~~~text
annualSales
annualPurchase
openReceivable
openPayable
aging
lastOrderDate
currentMonthShipmentCapacity
riskScore
onTimeDeliveryRate
~~~

They may appear on the same Object Page, but they remain read-only projections.

### 5.6 Presentation-only state

Visibility, order, width, collapsed/expanded state, saved filters and dashboard
placement are presentation state and MUST NOT mutate business data.

## 6. Visibility and applicability resolution

EVO should avoid project-by-project manual hiding as the primary mechanism.

The effective Human experience should be resolved through layers:

~~~text
1. Is the contributing capability/plugin installed?
2. Is the facet/profile applicable to this Enterprise?
3. Is it applicable to this object's current relationship roles?
4. Does the current Principal have permission to read/edit it?
5. Does the current record actually have applicable content?
6. What shared Enterprise/role projection is selected?
7. What personal presentation preference exists?
8. What does the current device/surface support?
~~~

A field that fails an earlier layer should normally never enter the rendered page.

Important:

> Hidden is not permission.

Security filtering must happen before presentation. A user personalization cannot
restore data that authorization removed.

## 7. Counterparty Human experience target

### 7.1 Registry is an administrative surface

The global **往来对象 / Counterparty Registry** is primarily for:

- master-data administrators;
- implementation/migration users;
- authorized finance/shared-service users;
- data-quality/dedup governance;
- bulk operations.

It should not be the default daily entry point for every salesperson or buyer.

### 7.2 Minimal Object Page header

Default header:

~~~text
ABC有限公司
C001
机构
[客户] [供应商]
ACTIVE
~~~

Only high-value identity facts belong in the initial viewport.

### 7.3 Facet-based details

Candidate facets:

~~~text
基本信息
关系角色
客户资料          -- only when CUSTOMER capability/role applies
供应商资料        -- only when SUPPLIER capability/role applies
联系人
地址
税务与开票
银行与结算
商业条款
附件
历史 / 数据来源
~~~

Installed capability + role + permission controls which facets exist.

Empty low-priority facets may be omitted/collapsed in read mode. Administrative edit
mode can expose available optional facets without forcing them on ordinary users.

### 7.4 Derived information cards

A detail page may compose read-only cards such as:

~~~text
应收余额
应付余额
账龄
近12月销售
近12月采购
最近订单
未完成任务
交付表现
风险/异常
~~~

These values are loaded from their owning projections/providers.

Canonical invariant:

> Visual co-location does not move data authority.

## 8. Manual creation versus import

Manual single-record creation remains necessary but is not the primary initialization
workflow.

### 8.1 Quick Create

Quick Create should request only the minimum needed to establish a valid identity:

~~~text
名称
主体类型
企业内编码 (or generated according to policy)
initial relationship role(s)?
minimum required jurisdiction/identifier only when policy requires
~~~

After creation, additional facets can be completed only when relevant.

### 8.2 Full edit

Full edit is a facet-based object editor, not a 100-field flat form.

### 8.3 Import-first project initialization

Counterparty vNext should have a dedicated Import Workspace.

Target pipeline:

~~~text
File/API/source
    ↓
Import Job
    ↓
Staging dataset
    ↓
Column mapping
    ↓
Normalization
    ↓
Validation
    ↓
Identity match / duplicate candidates
    ↓
Role/profile applicability validation
    ↓
Dry-run / preview
    ↓
Explicit commit
    ↓
Enterprise Resource writes
    ↓
Result + error report + provenance
~~~

Minimum capabilities:

- CSV/XLSX initially;
- downloadable generated template;
- source-column mapping;
- saved mapping presets per enterprise/source system;
- insert and controlled update modes;
- duplicate/code/identifier detection;
- role assignment during import;
- per-row validation result;
- dry-run before commit;
- deterministic import job ID;
- import provenance;
- bounded retry/idempotency;
- export of failed rows with reasons;
- no silent partial success;
- permission-gated import and commit.

The import template SHOULD be generated from the selected import scenario, for example:

~~~text
Counterparty Core
Customer
Supplier
Customer + Supplier
~~~

Do not export a universal template with every possible extension column by default.

## 9. Test-data architecture

Three separate data purposes must not be confused.

### 9.1 Deterministic CI fixture

Small, stable and committed to Git.

Proves:

- contracts;
- role combinations;
- import mappings;
- permissions;
- UI/projection behavior.

### 9.2 Enterprise demo seed

Realistic synthetic/anonymized data designed for Human product testing.

Counterparty target examples:

~~~text
1,000 records for normal demo
10,000 records for larger interactive/list/import demo
mix of:
  customer only
  supplier only
  customer + supplier
  service providers
  organizations/persons
  multiple addresses/contacts
  inactive entities
  duplicate candidates
  missing optional fields
~~~

### 9.3 Real-World Validation Corpus (RVC)

Large public evidence corpus defined by
FOUNDATION-OBJECTS-REAL-WORLD-VALIDATION-v0.1.md.

RVC is for architecture/performance pressure testing and is not a customer Enterprise
Context demo dataset.

## 10. Permission model for foundation objects

Foundation objects need more than page-level authorization.

Target permission dimensions:

~~~text
Object type
  Counterparty / Item / Warehouse

Operation
  read / create / update / archive / import / export / administer

Data scope
  own / team / organization / enterprise / explicit governed set

Relationship scope
  CUSTOMER / SUPPLIER / ...

Sensitive facet
  bank / tax / personal contact / credentials / ...

Field/action policy
  read-only / editable / hidden by authorization

Projection capability
  may read derived Sales / Finance / Procurement information?
~~~

"我的客户" MUST NOT be implemented merely as a UI filter on the full Counterparty
registry if the user is not authorized for the full registry.

Effective result:

~~~text
Authorized Counterparties
INTERSECT
CUSTOMER role
INTERSECT
responsibility assignment / governed data scope
=
My Customers
~~~

## 11. Responsibility is a relationship, not a Counterparty field

Legacy fields such as:

~~~text
经办人
经办组织
经办职位
负责人
~~~

should converge toward explicit responsibility/assignment relationships.

Candidate meaning:

~~~text
Counterparty cp-123
  -- SALES_OWNER --> User/Position/Organization
  -- PROCUREMENT_OWNER --> User/Position/Organization
  -- FINANCE_OWNER --> User/Position/Organization
~~~

This allows the same Counterparty to have different responsible parties for different
business roles.

It also provides the governed basis for projections such as:

~~~text
我的客户
我的供应商
我的重点客户
我负责但30天未联系的客户
我负责且存在逾期应收的客户
~~~

## 12. Projection architecture for business users

A Projection is a governed read model/view over authoritative objects and runtime
facts.

Counterparty examples:

~~~text
All Counterparties
Customers
Suppliers
My Customers
My Suppliers
Active Customers
Customers With Open Receivables
Suppliers With Open Payables
Customers With Recent Sales
Dormant Customers
High-Risk Customers
~~~

A Projection definition may include:

~~~text
source object type
relationship-role predicate
authorized data-scope intersection
filters
sort/group
visible columns
summary metrics
available actions
drill-down target
refresh/freshness metadata
~~~

Projection does not duplicate Counterparty identity.

## 13. Personal Workbench architecture

The personal home/workbench should be composed from governed Work, Projections and
Capabilities.

It is not one giant dashboard and not a personal copy of enterprise data.

### 13.0 Ownership: BI / Workbench is an optional plugin

Workspace is **not** App Platform Host Core and is **not** owned by Counterparty.

The permanent ownership rule is:

~~~text
App Platform Host
  minimal lifecycle / authorization / Contribution registry / routing
        |
        v
EVO BI Workbench plugin
  owns /workspace Experience
  owns Workbench composition semantics
  owns Enterprise/role workspace defaults
  owns Personal layout / Favorites / Recent presentation state
        ^
        |
        +-- Counterparty contributes My Customers / My Suppliers
        +-- Data Import contributes fixed Import capability
        +-- Personal Agent contributes My Work / Agent entry
        +-- future Finance / Inventory / Manufacturing / other plugins contribute their own items
~~~

This places Workspace in the **BI / Insight Experience Layer**: a compositional
decision/work surface over governed Work, Projections, metrics, exceptions and
deterministic Capabilities. It does not become the authority for the underlying
business objects, ledger facts or tasks.

The BI Workbench package is optional. A deployment that does not install/activate it
must not publish `/workspace`, initialize Workbench persistence, or require a
Workspace runtime merely to start App Host.

Current v0.1 loading rule:

~~~text
browser bootstrap
→ fetch lightweight effective Experience manifests
→ choose a default route from currently active Experiences
→ only if BI Workbench is installed + active + opened:
     load BI Workbench server runtime
     initialize its Personal Workbench state adapter
     compose authorized contributed items
~~~

The Host must never hard-code `/workspace` as an unconditional default route.
Card-/projection-level finer-grained lazy data loading is a later BI performance
optimization; plugin-level install/activate/open lazy loading is the current
required boundary.

Recommended composition:

~~~text
Personal Workbench
├─ My Work
│  ├─ approvals
│  ├─ follow-ups
│  └─ exceptions
│
├─ My Business Objects
│  ├─ My Customers
│  ├─ My Suppliers
│  └─ Recent / Favorites
│
├─ Operational Projections
│  ├─ overdue receivables I may access
│  ├─ purchase deliveries at risk
│  └─ customer orders requiring attention
│
├─ Shortcuts / Fixed Capabilities
│  ├─ Create ...
│  ├─ Import ...
│  └─ common deterministic actions
│
└─ Personal Agent
   └─ reason/search/compose/operate over the same authorized capabilities
~~~

### 13.1 Workspace configuration layers

~~~text
Package default
    ↓
Enterprise / role profile default
    ↓
User personal layout/view preference
    ↓
temporary session/Agent-generated view
~~~

Later layers may change presentation but MUST NOT expand data authority.

### 13.2 Where state lives

Canonical ownership:

- package default Workbench contributions: contributing Package/Feature definition;
- Workspace shell/composition semantics: optional EVO BI Workbench plugin;
- enterprise/relationship-role workspace defaults: BI Workbench-owned resources persisted through Enterprise Context;
- personal layout/Favorites/Recent: BI Workbench-owned Personal Workbench state keyed by Personal Context + Principal;
- business object and responsibility truth: Enterprise Context/domain plugins;
- derived runtime projections: owning domain/projection providers;
- authorization and active Package/Feature lifecycle: App Platform Host.

Presentation state never becomes business authority, and uninstalling/disabling BI
Workbench must not delete contributing business data or projection definitions.

## 14. List-first daily UX

Ordinary business users typically operate from relevant lists/worklists rather than
from master-data administration.

Examples:

### Sales user

~~~text
My Customers
Customer Search
Customers requiring follow-up
Open quotes/orders
Receivable exceptions (if authorized)
~~~

### Procurement user

~~~text
My Suppliers
Supplier Search
Deliveries due
Purchase exceptions
Payable/settlement information (if authorized)
~~~

### Master-data administrator

~~~text
Counterparty Registry
Import jobs
Data-quality exceptions
Duplicate candidates
Incomplete records
Bulk role/profile maintenance
~~~

The same Counterparty detail may be reached from all these views, but each entry
context should preserve the user's task and only surface relevant actions/facets.

## 15. Eidos implications

Eidos should provide reusable experience primitives, not Counterparty-specific hard
coding.

Candidate reusable capabilities:

~~~text
Object Page / Facet composition
List Report / Worklist
Saved Projection / Saved View
Role/workspace composition
progressive disclosure
bulk selection + bulk action
Import Job experience
field/facet contribution slots
responsive layout
personalization overlays
permission-aware rendering inputs
~~~

App Platform/domain plugins own semantics and authorization. Eidos owns deterministic
presentation/runtime behavior.

## 16. Agent implications

Agent does not replace deterministic data-management UX.

Fixed capabilities should exist for:

~~~text
Create Counterparty
Assign Customer/Supplier role
Import Counterparties
Validate Import
Commit Import
Open My Customers
Open My Suppliers
Add Address/Contact
...
~~~

Agent can then perform open-ended work such as:

~~~text
"把这个 Excel 的供应商字段映射一下，先检查不要导入"
"找出我负责的客户里最近90天没有订单、但去年销售额超过100万的"
"为什么这个客户被判定为高风险？"
~~~

The Agent calls governed capabilities/projections rather than inventing a parallel
write path.

## 17. Foundation-object field growth policy

When a new customer asks for a missing field:

~~~text
Step 1
Does it belong to existing core semantics?

Step 2
Does it belong to an existing role/profile/facet?

Step 3
Is it actually a derived projection?

Step 4
If none apply, create enterprise custom extension semantics.

Step 5
Observe cross-enterprise reuse.

Step 6
Promote only after common meaning and lifecycle are proven.
~~~

This replaces the legacy habit:

~~~text
new customer asks for field
→ add column to shared Counterparty
→ add control to universal form
→ everyone else hides it
~~~

## 18. Counterparty next-product slices

Current state:

~~~text
v0.1 stable Counterparty identity
v0.2 CUSTOMER/SUPPLIER relationship roles
~~~

Recommended next sequence after v0.2 Human validation:

### Slice A — Import-first Counterparty

- import job/staging/mapping/dry-run/commit;
- generated import templates;
- deterministic demo fixtures;
- error report and provenance.

### Slice B — Role projections and permissions

- Customers;
- Suppliers;
- My Customers;
- My Suppliers;
- responsibility relationship;
- permission/data-scope intersection.

### Slice C — Facet composition

Start only with business-proven facets, likely:

- Contact;
- Address;
- selected Customer/Supplier profile fields.

Do not copy all legacy fields.

### Slice D — Personal Workbench integration

- saved/shared Counterparty projections;
- role-default workspace cards/worklists;
- personal saved view/layout;
- Personal Agent opens/uses the same projections.

### Slice E — Counterparty RVC

Run the large real-world validation program before declaring the foundation object
mature.

## 19. Reuse for Item and Warehouse

The same architecture must work later without Counterparty-specific assumptions.

~~~text
Item
  one stable item identity
  sales / procurement / inventory / manufacturing facets
  inventory quantity remains projection
  import-first project initialization
  role/workspace-specific views

Warehouse
  one warehouse identity
  address/facility/location topology facets
  on-hand remains inventory projection
  operational worklists instead of giant warehouse master form
~~~

If this architecture cannot generalize to Item and Warehouse, it is not yet the right
foundation-object architecture.

## 20. Hard invariants

1. Core foundation-object payloads remain intentionally small.
2. New project fields MUST NOT automatically expand shared core schemas.
3. Role/profile/facet semantics are separate from stable identity.
4. Repeatable structures use related resources rather than flattened columns.
5. Derived metrics/state remain Projections/Read Models.
6. Manual creation is supported, but bulk import is a first-class initialization path.
7. Import uses staging, mapping, validation and explicit commit.
8. Presentation hiding is not authorization.
9. "My X" views are permission-aware governed projections, not cosmetic filters.
10. Enterprise shared workspace defaults and personal preferences are separate layers.
11. Personal Workbench composes governed Work/Projection/Capabilities; it does not own
    business truth.
12. Eidos provides reusable experience primitives; domain plugins own semantics.
13. Agent uses the same governed capabilities rather than a private write path.
14. Real-world and legacy evidence can falsify the model but do not dictate physical
    schema.
15. Visual co-location never transfers data authority.

## 21. Acceptance for this design baseline

This baseline is considered successfully adopted when:

- Counterparty import is designed/implemented as a first-class bulk path;
- Counterparty has clear Registry versus Customer/Supplier work views;
- at least one responsibility-backed "My Customers" or "My Suppliers" projection is
  proven with authorization;
- object detail can add facets without turning into a universal flat form;
- enterprise custom fields can be introduced without modifying Counterparty core;
- personal workspace composition uses the same governed projection definitions;
- deterministic demo/test data exists in addition to large RVC evidence;
- the same approach can be applied to Item and Warehouse.


## 22. LLM-native enterprise adaptation companion

The field-growth/import/facet/workbench model in this document is the first bounded
domain used to prove the broader architecture defined by:

`docs/architecture/LLM-NATIVE-ENTERPRISE-ADAPTATION-v0.1.md`

The important extension is that enterprise-specific requirements should not be
implemented manually across storage, UI, import, permission and Agent surfaces.

Target:

~~~text
customer evidence
→ LLM semantic classification
→ EnterpriseAdaptationPlan
→ ObjectExtension / Profile / Projection definition
→ deterministic compilation
→ storage + validation + import + Experience + permission + Agent + tests
→ Human review
→ enterprise software version
~~~

Counterparty is the first proof surface. Item/Product and Warehouse/Location should
reuse the same adaptation machinery instead of creating object-specific low-code
systems.

This companion architecture does not change the existing rule that truly new
deterministic runtime semantics require separate EVO runtime governance.
