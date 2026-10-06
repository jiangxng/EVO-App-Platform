# EVO Counterparty / 往来对象 Plugin — Architecture v0.1

**Status:** ACTIVE DESIGN BASELINE  
**Date:** 2026-10-06  
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
  └─ 往来对象详情
```

Directory is a management list, not a card marketplace.

Initial search dimensions:

- code;
- display name;
- subject type;
- status.

The UI should remain mobile-friendly from the first slice.

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
