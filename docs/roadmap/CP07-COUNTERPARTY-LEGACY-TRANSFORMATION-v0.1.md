# CP-07 Counterparty Legacy Transformation Report v0.1

**Status:** COMPLETE SEMANTIC TRANSFORMATION EVIDENCE  
**Date:** 2026-10-09  
**Gate:** CP-07 Counterparty maturity gate  
**Primary archaeology authority:** `docs/architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md`

## 1. Purpose

This report records how the historical Asloop Counterparty/Dealer-style master-data
screen is transformed into the current EVO Counterparty model.

It is a semantic migration report, not a claim that old production data has been
physically migrated. Historical screen fields are evidence of business requirements;
they are not automatically fields of the canonical Counterparty identity.

## 2. Evidence boundary

The accepted project archaeology already records the observed legacy field families
and is the authority used by this report.

The legacy repository `jiangxng/Asloop-Backend` remains accessible, but its current
GitHub code-search index is unavailable. This CP-07 pass therefore does **not** claim
a new exhaustive full-repository field census. Any future physical customer-data
migration must additionally inspect the exact source schema/version and produce a
source-specific mapping manifest before writes occur.

## 3. Transformation classes

| Class | Meaning |
| --- | --- |
| DIRECT_IDENTITY | maps to stable Counterparty identity where semantics match |
| RELATIONSHIP | maps to explicit Customer/Supplier/other relationship role |
| CHILD_RESOURCE | becomes repeatable Contact/Address/etc. resource |
| PROFILE | belongs to a role-specific relationship profile |
| RESPONSIBILITY | becomes governed responsibility relation |
| PEER_FACET | belongs to another explicit domain/facet, not Counterparty core |
| PROJECTION | derived/read-model value; never migrated as Counterparty truth |
| EXTENSION_REVIEW | enterprise-specific semantic requiring governed extension/review |
| SOURCE_ONLY | retained as migration evidence unless a valid owner is established |

## 4. Legacy field-family transformation

| Legacy family | Observed examples | EVO transformation | Current maturity posture |
| --- | --- | --- | --- |
| Stable identity | 往来编码, 主体类型, 往来名称, 往来简称 | DIRECT_IDENTITY. Preserve stable source key/code; display/legal naming is separated where known. | Core identity implemented |
| Relationship classification | 关系标签 | RELATIONSHIP. Customer/Supplier are roles over one identity, never duplicate masters. | Implemented + Human passed |
| Geographic/address | 国家或地区, 省, 市, 区, 详细地址 | CHILD_RESOURCE for repeatable addresses; identity-level country remains only where it truly describes the party identity/primary business location. | Address resource implemented |
| Customer/sales profile | 客户等级, 客户来源, 销售区域, 小区域, 报价浮动系数 | PROFILE when it describes the customer relationship; enterprise-only semantics use governed extension slots rather than core expansion. | Core profile subset implemented; enterprise additions remain governed |
| Supplier/procurement profile | 年度采购额, 采购额增量, 返利率 | PROFILE only for genuine supplier settings; historical/aggregate purchase values are PROJECTION rather than master truth. | Supplier profile boundary implemented |
| Organization facts | 注册资本, 员工人数, 厂房性质, 经营年限 | PEER_FACET or EXTENSION_REVIEW. Not Counterparty identity by default. | Deliberately outside core |
| Responsibility | 经办人, 经办组织, 经办职位, 负责人 | RESPONSIBILITY relation with governed data scope. | Implemented + Human passed |
| Tax/invoice | 是否开票, 发票类型, 税率, 开票地区 | PEER_FACET: tax/invoicing/commercial semantics. Tax identifier alone may remain an identity field; invoice policy does not. | Tax identifier implemented; richer tax/invoice facet deferred to owning domain |
| Bank/settlement | 开户银行, 户名, 银行账号, 币种, 默认支付方式 | PEER_FACET: Bank Account / Settlement / Commercial Profile. Never flatten into identity. | Deferred to owning domain |
| Logistics | 默认物流条款 | PEER_FACET: logistics/commercial relationship profile. | Deferred to owning domain |
| Contact | 联系人, 手机, 电子邮件, 职位, 称谓 | CHILD_RESOURCE. Repeatable Contact resources; legacy flattened phone/email may be compatibility input only. | Contact resource implemented |
| Address list | 地址名称, 联系人, 联系方式, 邮编 | CHILD_RESOURCE plus address usage/purpose. | Address resource implemented |
| Certificate | 证件名称, 证件号, 到期时间 | PEER_FACET / child credential resource. | Deferred to owning capability |
| Attachments | 附件 | PEER_FACET: attachment capability/reference. | Deliberately outside Counterparty core |
| Notes | 往来说明 | DIRECT_IDENTITY only for bounded descriptive notes; structured business semantics must not be hidden in notes. | Bounded notes supported |
| Derived operating state | 年度销售额, 当月可发货总额 and similar totals | PROJECTION. Rebuild/read from governed business facts; never migrate as authoritative Counterparty master fields. | Explicitly excluded from core |

## 5. Migration invariants

A physical migration must obey all of the following:

1. One source business party becomes one stable Counterparty identity before roles are attached.
2. Customer and Supplier labels do not create separate identities.
3. Repeatable contacts and addresses are materialized as child resources rather than numbered/flattened columns.
4. Role-specific settings are written only to the applicable role Profile or governed Extension destination.
5. Derived balances, annual/monthly totals, open amounts and other operating state are not copied into Counterparty master truth.
6. Bank, tax/invoicing, logistics, credential and attachment semantics wait for an explicit owning contract; they are not forced into `notes` or custom identity fields.
7. Unknown legacy columns are SOURCE_ONLY / EXTENSION_REVIEW until a Human-approved semantic destination exists.
8. Source identifiers and provenance remain traceable so transformation can be replayed and audited.
9. Migration must use dry-run/explicit commit and the current Data Import semantic-destination path rather than direct repository writes.
10. No migration may silently turn field-name similarity into semantic equivalence.

## 6. Compatibility implication

The transformation demonstrates that current Counterparty identity + roles + profiles
+ related resources can absorb the accepted legacy business semantics without
recreating the historical mega-record.

It does **not** mean every historical field now has a Counterparty implementation.
Fields owned by future tax, settlement, logistics, credential, attachment or
projection capabilities remain intentionally outside Counterparty until their owning
contracts exist.

## 7. CP-07 conclusion

The CP-07 legacy-field transformation requirement is satisfied at the semantic
architecture level.

A future source-specific production migration still requires its own exact schema
inventory, source-version manifest, dry run, exception report and Human-approved
commit. This report must not be used as evidence that any customer production data
has already been migrated.
