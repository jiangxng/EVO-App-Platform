# EVO Counterparty / 往来对象 Plugin — Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-06; v0.2 relationship refinement 2026-10-07  
**Owner:** evo-counterparty  
**Storage:** Enterprise Context Resource Library  
**Namespace:** `evo.counterparty`

## 1. Product definition

**往来对象 / Counterparty** is the enterprise-scoped identity of another party
with which the enterprise may have business, economic, settlement, funding or
other accountable relationships.

Canonical distinction:

```text
往来对象 / Counterparty
= 谁

客户 / 供应商 / 员工 / 股东 / 关联方 / 加工商 / 服务商 ...
= 这个往来对象在某类业务中的关系角色

销售 / 采购 / 借款 / 押金 / 收付款 ...
= 与这个对象发生了什么业务

Ledger / Open Item / Settlement
= 这些业务形成了什么发生、余额与结清关系
```

The Counterparty plugin MUST NOT become Accounts Receivable, Accounts Payable,
cash settlement, matching, open-item accounting or a generic CRM.

### Object admission rule

Entity type alone does not make something a Counterparty.

An employee, internal company, government body, bank, person or other entity becomes
a Counterparty only when the current Enterprise needs to manage that entity as a
business/economic/settlement counterparty.

~~~text
exists elsewhere in enterprise data
!= automatically Counterparty

participates in a governed counterparty relationship for this Enterprise
-> Counterparty identity/relationship is justified
~~~

This prevents Counterparty from becoming an indiscriminate universal Party table.

## 2. Legacy archaeology

Asloop's historical `Dealer / 往来` was one of the early base objects
(`OBJ03`) alongside Inventory, Warehouse, Fund, Cost and Facility.

Recovered design intent is important:

> customers, suppliers, employees, processors, distributors and other parties
> were represented through one shared Dealer identity plus labels/relationship
> roles rather than one physical master table per role.

This is preserved as design lineage, not copied mechanically.

Legacy evidence also shows `dealerCode` as a recurring Ledger dimension and
the old bookkeeping/account metadata using dealer as an object dimension across
both financial and operational ledgers.

## 3. Legacy → EVO field convergence

| Legacy Dealer field / concept | EVO target | v0.1 |
| --- | --- | --- |
| `dealerCode` / 往来编码 | Counterparty `code` | CORE |
| `dealerName` / 往来名称 | Counterparty `displayName` | CORE |
| `mianTypes` / 主体类型 | `subjectType = ORGANIZATION | PERSON` | CORE |
| status | `status` | CORE |
| taxNo | identity/tax profile | CORE optional |
| dealerLabelName / 关系标签 | Relationship Role resources/capability | NOT a core column |
| dealerType / dealerSubclass | classification extension | FUTURE |
| country/province/city/county/address | Address resources | FUTURE |
| dealerPhone/mobile/mail | Contact Point resources | FUTURE |
| officialWebsite | organization/contact profile | FUTURE |
| depositBank/accountName/bankAccount | Bank Account resources | FUTURE |
| dealerCurrency | Commercial Profile | FUTURE |
| paymentTerm/wayOfPayment/pamentDays | Settlement/Commercial Profile | FUTURE |
| methodOfPayment | Settlement/Commercial Profile | FUTURE |
| dealerLogisticsTerms | Logistics/Commercial Profile | FUTURE |
| creditLine | Credit Profile | FUTURE |
| dealerPic | media/avatar attachment | FUTURE |

Important convergence rule:

> `dealerLabelName` is historical evidence for relationship roles. It MUST NOT
> be reintroduced as a comma-separated master-data field that defines identity.

## 4. v0.1 domain model

The first Counterparty Subject is deliberately small:

```text
CounterpartySubjectV010
  counterpartyId
  code
  displayName
  subjectType
    ORGANIZATION
    PERSON
  status
    ACTIVE
    INACTIVE
  legalName?
  taxIdentifier?
  countryOrRegion?
  phone?
  email?
  notes?
```

The optional contact/tax fields above are convenience identity/contact facts for
the first usable slice. They do not prevent later normalization into separate
resources.

The canonical key used by business facts is `counterpartyId`.
`code` is an enterprise business identifier and may be shown/snapshotted in
transactions but is not the immutable technical identity.

## 5. Enterprise Context persistence

Counterparty data is enterprise-owned content and MUST live in the selected
Enterprise Context.

```text
Enterprise Context
└─ Enterprise Resource Library
   └─ namespace: evo.counterparty
      └─ collection: counterparties
         └─ resourceType: counterparty.subject
            ├─ cp-...
            ├─ cp-...
            └─ cp-...
```

Resource contract:

```text
namespace      = evo.counterparty
collectionId   = counterparties
resourceType   = counterparty.subject
schemaRef      = evo.counterparty/0.1.0
ownerPackageId = evo-counterparty
storageKind    = DOCUMENT
```

Uninstalling the plugin does not delete these resources.

## 6. Resource Library dependency

Counterparty is the first real domain consumer of the canonical Enterprise
Context Resource Library.

The plugin requires:

```text
enterprise.resource.repository
```

The Resource Library understands addressing, schema reference, provenance,
storage and lifecycle. It MUST NOT understand what a Counterparty means.

Canonical boundary:

> Context is the container; Counterparty plugin is the semantics.

## 7. Role model direction

Customer and Supplier are not separate identities.

Example:

```text
Counterparty: ABC Limited
  stable identity: cp-123

relationships
  sales/customer
  procurement/supplier
  affiliate
```

A later Sales plugin may assign/use a Customer relationship against `cp-123`.
A Procurement plugin may independently assign/use Supplier against the same
`cp-123`.

Do not duplicate ABC into a Customer master and Supplier master merely because
two applications need different business settings.

Role-specific settings belong with the relationship/profile that owns their
meaning. Examples:

- sales credit limit;
- sales payment terms;
- supplier settlement terms;
- procurement lead-time defaults;
- logistics defaults.

## 8. Transaction snapshot rule

Counterparty master data is current-state reference data.

Business transactions must preserve both identity and relevant historical
snapshot values when facts are committed.

```text
counterpartyId
+
counterpartyCodeSnapshot
counterpartyNameSnapshot
paymentTermSnapshot
deliveryAddressSnapshot
...
```

Changing the current Counterparty MUST NOT rewrite historical BusinessData or
change historical replay meaning.

## 9. Ledger dimension rule

Legacy `dealerCode` usage converges to explicit Counterparty dimension
semantics.

Preferred machine identity:

```text
dimension = counterparty
value     = counterpartyId
```

Display/business snapshots may carry code/name.

Do not infer Customer versus Supplier from account name or from the Counterparty
record itself. Business role must be explicit where a rule requires it.

## 10. v0.1 Human experience

First usable slice:

```text
往来对象
  ├─ 往来对象目录
  ├─ 新建往来对象
  ├─ 往来对象详情
  ├─ 编辑往来对象
  └─ 归档
```

Editing preserves the stable `counterpartyId` and updates the same enterprise
resource. It must not create a second Counterparty merely because code/name,
contact facts, tax identity or subject presentation changes.

Directory is a management list, not a card marketplace.

Initial search dimensions:

- code;
- display name;
- subject type;
- status.

The UI should remain mobile-friendly from the first slice.

The generic Eidos UIDL form contract supports initial values for edit journeys.
Counterparty must reuse that platform form behavior rather than inventing a
plugin-private edit-form renderer.

## 11. v0.1 non-goals

Not in the first slice:

- AR/AP balances;
- open items;
- settlement/matching;
- customer/supplier-specific workflow;
- credit control engine;
- bank account verification;
- tax validation;
- deduplication/party resolution;
- global cross-enterprise identity;
- contacts hierarchy;
- addresses hierarchy;
- role-specific commercial profiles;
- importing the entire legacy Dealer table.

These are extension slices after the core identity and storage boundary are
proven.

## 12. Hard invariants

1. The product/domain name is **往来对象 / Counterparty**.
2. Counterparty identity is enterprise-scoped in v0.1.
3. Data persists in Enterprise Context Resource Library.
4. Customer/Supplier/etc. are roles/relationships, not duplicate identities.
5. The plugin owns Counterparty semantics; Enterprise Context remains thin.
6. Historical BusinessData does not dynamically dereference mutable master data.
7. Counterparty plugin does not own receivable/payable balances or settlement.
8. Plugin uninstall does not delete enterprise-owned Counterparty resources.
9. Legacy Dealer is archaeological evidence, not a schema to copy.
10. Stable `counterpartyId` is the canonical reference key; business code/name
    are mutable/displayable master facts and transaction snapshots where needed.


## 13. v0.1 acceptance

The v0.1 core is complete only when all of the following hold:

- the product/navigation name is **往来对象 / Counterparty**;
- Directory → Create → Detail → Edit → Archive forms one coherent Human journey;
- create and edit both write into the current Enterprise Context Resource Library;
- editing retains the same stable `counterpartyId`;
- `code` is unique only within one Enterprise Context;
- the same code may exist independently in another Enterprise Context;
- archived resources remain as Enterprise Resource evidence but disappear from the ACTIVE directory;
- no AR/AP balance, settlement, matching, open-item or account logic is introduced;
- Customer/Supplier remain future relationship roles, not separate identity records;
- legacy Dealer fields beyond the core identity stay classified as extension resources instead of expanding the v0.1 subject payload.

## 14. v0.2 Relationship Role resource

The first relationship-role implementation keeps identity and relationship state as
separate Enterprise Context resources.

~~~text
namespace      = evo.counterparty

Counterparty Subject
  collectionId = counterparties
  resourceType = counterparty.subject

Relationship Role
  collectionId = counterparty-roles
  resourceType = counterparty.relationship-role
  schemaRef    = evo.counterparty.relationship-role/0.1.0
~~~

Initial governed role codes are CUSTOMER and SUPPLIER.

Logical shape:

~~~text
CounterpartyRelationshipRoleV010
  roleId
  counterpartyId
  roleCode
~~~

The role ID is deterministic inside the Enterprise Context for one counterpartyId +
roleCode pair. Assigning a role is idempotent current-state relationship management;
removing a role archives the relationship resource without archiving or replacing
the Counterparty Subject.

One subject may therefore be both Customer and Supplier at the same time.

This v0.2 role resource deliberately does not contain credit limits, payment terms,
pricing defaults, procurement lead time or other commercial settings. Those require
a clear role/profile owner and lifecycle before they are admitted.

## 15. Layered ownership — master data versus derived state

Authoritative separation:

~~~text
Counterparty Subject
        ↓
Relationship Role / future Profile
        ↓ referenced by
BusinessData + committed snapshots
        ↓
EVO Runtime / domain deterministic engines
        ↓
Ledger / Allocation / Settlement
        ↓
Projection / Read Model
        ↓
Report / BI / Management Intelligence
~~~

Counterparty owns current reference identity and relationship semantics. It does not
own receivable/payable balances, open-item amount, aging, settlement progress, cash
collected/paid, customer profitability or supplier-spend summaries.

Those are derived facts/projections/read models. A Human page may later compose such
values next to Counterparty identity, but visual co-location does not move data
authority into the Counterparty master record.

## 16. External architecture comparison

Mature enterprise architectures are comparison evidence, not EVO schema authority.
Oracle Trading Community Architecture separates Party from business relationships;
Customer is a Party with a selling relationship, while Customer Account carries
relationship terms. Official references:

- https://docs.oracle.com/en/cloud/saas/financials/26b/fairp/customer-and-party-structure.html
- https://docs.oracle.com/cd/E26401_01/doc.122/e48950/T172155T172158.htm

EVO adopts the useful identity-versus-relationship separation but does not introduce
a universal global Party registry. The current boundary remains enterprise-scoped
Counterparty -> explicit Relationship Role -> future role-owned Profile ->
BusinessData / EVO Runtime / Projection.

## 17. Real-world validation requirement

Counterparty and the next foundation objects are governed by
docs/architecture/FOUNDATION-OBJECTS-REAL-WORLD-VALIDATION-v0.1.md.

Counterparty design must be pressure-tested against large public legal-entity and
real relationship datasets rather than only hand-written fixtures. Initial evidence
families include GLEIF, Companies House, TED and USAspending.

The corpus is evidence, not schema authority. Large source datasets remain outside
Git; the repository stores source manifests, adapters, bounded deterministic
fixtures and validation reports.

## 18. v0.2 acceptance

Relationship Roles v0.2 is complete only when:

- one stable Counterparty can simultaneously hold CUSTOMER and SUPPLIER;
- role assignment/removal never duplicates or deletes Counterparty identity;
- roles are independent Enterprise Context resources keyed to counterpartyId;
- roles are isolated by Enterprise Context and removal archives role evidence;
- Counterparty detail exposes roles through Eidos without embedding Sales/Procurement workflow;
- role-specific commercial settings remain outside Counterparty Subject;
- AR/AP balances, aging, open items, settlement and reporting remain higher-layer derived concerns;
- integration tests prove the identity/role lifecycle;
- real-world validation can evolve without mirroring source schemas into production objects.


## 19. Import, projection and workbench direction

The first v0.1/v0.2 Counterparty UI proves identity and relationship-role semantics.
It is **not** the target final daily Human experience.

Legacy implementation evidence shows why a universal Counterparty edit form must not
become the long-term design: identity, customer/supplier settings, responsibility,
contacts, addresses, certificates, bank/tax data, logistics terms and derived annual
or monthly totals were historically accumulated into one page and then hidden per
implementation project.

Counterparty now follows the general foundation-object experience authority:

`docs/architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md`

Canonical direction:

~~~text
Counterparty Subject
  = stable identity

Relationship Role / Profile
  = Customer / Supplier / other business relationship

Related Facets
  = Contacts / Addresses / Bank / Tax / Certificates / Attachments / ...

Projection / Read Model
  = balances / aging / sales / purchase / activity / risk / ...

Experiences
  = Registry / Customers / Suppliers / My Customers / My Suppliers /
    Object Page / Import Workspace / Personal Workbench / Agent
~~~

Project initialization is expected to be import-first rather than manual-create-first.
Manual Quick Create remains available for exceptions and daily incremental additions.

The global Counterparty Registry is primarily an administrative/master-data surface.
Ordinary business users should normally enter through role- and responsibility-aware
projections such as Customers, Suppliers, My Customers and My Suppliers.

Visibility is resolved from capability installation, Enterprise applicability,
relationship role, authorization, shared projection and personal presentation state.
Manual field hiding per customer project is not the target implementation model.

"Hidden" is never a security boundary.

The next product slices after v0.2 Human validation should prioritize:

1. import/staging/mapping/dry-run/commit;
2. deterministic demo/test data;
3. responsibility relationships + role projections;
4. permission-aware My Customers/My Suppliers;
5. facet composition for business-proven Contact/Address/Profile needs;
6. personal-workbench composition from governed Work and Projections.
