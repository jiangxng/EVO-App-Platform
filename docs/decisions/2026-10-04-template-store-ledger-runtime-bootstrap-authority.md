# Decision Record — Template Store Bootstrap Uses Ledger Runtime Configurator Export

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-04

## Context

An earlier bootstrap export incorrectly used EVO `enterpriseCoreV1` as if it
were the complete current Ledger Runtime configuration. That reference template
contains only a small semantic subset and is not the Ledger Runtime
Configurator's complete executable baseline.

The actual Configurator default library is already certified as a complete
in-boundary MVP configuration.

## Decision

The built-in Template Store Ledger Runtime seed is generated from:

`createLedgerRuntimeConfiguratorService().exportTemplate()`

Production baseline:

- 141 ledgers/accounts;
- 143 applications;
- 106 dictionary entries;
- 912 active Posting Rules;
- 401 unique expressions;
- all 912 rules compile;
- burn-ready with no blockers.

The 587 rules sourced from `记账规则.sql` remain a separate REFERENCE library
and MUST NOT be silently merged into the active template.

## Runtime independence

Template Store stores a generated build-time snapshot of the exported Ledger
Runtime Template. It does not import or execute the Configurator plugin at
Template Store runtime.

## Upgrade

The incomplete built-in seed remains historical v1 where already persisted.
The corrected complete production seed is v2.

Template Store bootstrap merges exact missing seed versions rather than only
missing template IDs. Therefore existing stores preserve v1, gain v2, and
resolve v2 as latest.

## Validation gate

CI compares the generated production JSON to the live Configurator
`exportTemplate()`, imports it back, validates burn readiness, compiles all 912
rules, validates the TemplateTransfer digest, and verifies v1-to-v2 durable
Store migration.
