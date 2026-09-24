# Official Apps

Official Apps maintained by this project will live here.

Initial migration order is intentionally not fixed until App Manifest and lifecycle contracts are stable.

Candidate first proof: `trading-lite`.
Candidate later migrations: Finance Accounting, Finance Reporting, Workflow, Manufacturing.


## EVO Ledger Runtime Configurator

`evo-ledger-runtime-configurator` is an installable configuration/development tool for EVO Ledger Runtime.

MVP rule:

> Minimal functionality, complete default configuration content.

v0.1 owns:

- bookkeeping-derived default accounts/ledger configuration;
- bookkeeping applications/application IDs;
- bookkeeping dictionary configuration;
- the full runtime-used `policy.sql` conditional posting-rule baseline;
- the alternate `记账规则.sql` rule set as a separate reference library;
- source configuration import/export;
- structural/reference validation;
- burn readiness checks.

It does **not** copy SQL procedures, database functions, balance algorithms, cost algorithms, replay procedures, voucher-number logic, schema migrations, reports, views, or database snapshots.

The Ledger Runtime remains the execution target; Configurator is the development/configuration tool.
