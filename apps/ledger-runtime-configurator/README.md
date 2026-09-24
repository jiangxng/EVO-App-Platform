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
