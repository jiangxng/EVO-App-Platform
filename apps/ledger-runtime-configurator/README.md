# EVO Ledger Runtime Configurator

**Version:** 0.1 MVP  
**Package:** `evo-ledger-runtime-configurator`

The Configurator is the development/configuration tool for EVO Ledger Runtime.

Mental model:

```text
Configurator
  source configuration
  → validate
  → compile
  → Ledger Runtime Template
  → burn/deploy

Ledger Runtime
  installed template
  + BusinessData
  → Posting
  → Ledger / Balance
```

## MVP principle

MVP means **minimal functions, not incomplete configuration content**.

v0.1 imports all known bookkeeping configuration defaults:

- 141 accounts/ledger definitions;
- 143 applications;
- 106 dictionary entries;
- 912 conditional posting rules from `policy.sql` as the active baseline;
- 587 rules from `记账规则.sql` as a separate reference rule set.

The two rule sets are never silently merged.

## Explicit exclusions

The Configurator does not import implementation SQL such as:

- views;
- stored procedures/functions;
- balance algorithms;
- cost algorithms;
- recalculation procedures;
- voucher-number procedures;
- schema migrations;
- report SQL;
- qigan database snapshots;
- test/diagnostic SQL.

## Burn status

The bookkeeping formula DSL is preserved losslessly as source configuration.

Burn is intentionally blocked until those expressions are compiled to the executable EVO Ledger Runtime rule contract. The MVP exposes the blocker explicitly instead of silently changing rule semantics.

## Completeness rule

> If a capability belongs to the configurable surface of EVO Ledger Runtime, the Configurator must be able to represent and export it completely.


## Bookkeeping expression semantics

The source rules use an Aviator-style expression language. In the original bookkeeping implementation, conditions and ordinary quantity/amount formulas were executed dynamically with `AviatorEvaluator`.

Examples include:

```text
==
!=
>
<
>=
<=
&&
||
()
include(string.split(...), field)
```

These expressions are **configuration** and must remain editable/exportable.

Direction semantics are also configuration:

```text
Financial ledger: Dr / Cr (借方 / 贷方)
Business ledger:  add / sub (增加 / 减少)
Negative correction forms: -Dr / -Cr
```

Dr/Cr must not be collapsed into add/sub. They can share internal balance-sign mechanics while retaining distinct ledger semantics.

### Runtime built-ins are not configuration

The original bookkeeping engine declares server-side formula symbols including:

```text
成本
成本合计
借方成本
贷方成本
成本入库
借方
贷方
贷方合计
借方合计
分摊成本
跨库成本
```

These names may appear inside configurable amount expressions, but their implementation is a Ledger Runtime calculation capability. Configurator preserves and validates the expression reference; it does not configure the algorithm behind the symbol.


## Agent-neutral capability operations

The Configurator now owns one semantic callable Capability:

~~~text
ledger.runtime.configuration
~~~

with two READ operations:

~~~text
ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
~~~

The first returns template identity, digest, counts, source libraries, burn
compatibility and section metadata without dumping the full configuration.

The second reads bounded pages from:

~~~text
accounts
applications
dictionaries
postingRules
~~~

Default page size is 50 and maximum page size is 100.

Paging cursors are bound to the current configuration semantic digest. If the
configuration changes, an old cursor fails with
`LEDGER_CONFIGURATION_CURSOR_STALE` instead of mixing revisions.

These operations are defined under the Ledger plugin and projected through the
generic `platform.capability-operation` contract. They are not ChatGPT- or
MCP-specific APIs.

EA-2B does not expose them publicly yet. External discovery/invocation still
requires the platform identity, delegation, authorization and protocol layers.

See:
`docs/architecture/LEDGER-RUNTIME-CONFIGURATION-CAPABILITY-OPERATIONS-EA2B-v0.1.md`.


## Agent-neutral Capability Operations

The Configurator publishes its machine-callable business semantics through Plugin Protocol `platform.capability-operation` Contributions.

These are not ChatGPT-, Claude-, MCP- or Personal-Agent-specific APIs.

### Describe current configuration

```text
evo.ledger-runtime.configurator.describe
```

Effect:

```text
READ
```

Returns a bounded semantic overview:

- template/configuration identity;
- display name;
- semantic digest;
- expression language;
- account/application/dictionary/posting-rule counts;
- burn readiness;
- required runtime capabilities;
- source libraries;
- available detailed sections.

It deliberately does **not** inline all accounts, applications, dictionaries or 912 posting rules.

### Read a configuration section

```text
evo.ledger-runtime.configurator.section.read
```

Effect:

```text
READ
```

Sections:

```text
accounts
applications
dictionaries
postingRules
```

Input:

```text
section
cursor?   opaque
limit?    1..100, default 50
```

The result includes:

```text
semanticDigest
items[]
page:
  offset
  limit
  returned
  total
  nextCursor
```

The cursor is opaque to clients and is bound to:

```text
section
+ offset
+ current semanticDigest
```

If the configuration changes while a client is paging, the old cursor fails with:

```text
LEDGER_CONFIGURATION_CURSOR_STALE
```

The client must restart reading that section.

This prevents an Agent from silently assembling one logical template from multiple configuration revisions.

### Why bounded reads

Agent-native does not mean dumping the whole domain object into a model context.

The canonical pattern is:

```text
describe
→ understand shape/size/version
→ select relevant section
→ page only what is required
```

This supports:

- smaller context;
- deterministic pagination;
- cache/revalidation;
- future authorization/redaction;
- large future templates;
- protocol-neutral projection.

### Execution path

Both operations bind to ordinary Host Actions:

```text
Capability Operation
→ ACTION_HOST
→ Ledger Configurator service
```

No External-Agent-specific business execution path exists.

Future MCP/OpenAPI/Product Adapters project these same operations after Principal/Context/Grant authorization.
