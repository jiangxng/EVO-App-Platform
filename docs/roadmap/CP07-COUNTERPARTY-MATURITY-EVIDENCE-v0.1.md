# CP-07 Counterparty Maturity Evidence v0.1

**Status:** ACTIVE
**Date:** 2026-10-09
**Authority:** `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`
**Current gate:** CP-07 Counterparty maturity gate

## Purpose

CP-07 does not reopen accepted Counterparty semantics. It turns the already accepted
vertical into maturity evidence before Item/Product becomes the materially different
second-object proof.

## Inherited evidence

| Area | Current evidence | CP-07 posture |
| --- | --- | --- |
| Stable Counterparty identity | CP-02 / PR #419 Human pass | keep closed |
| Customer/Supplier relationship roles | CP-02 / PR #419 Human pass | keep closed |
| EffectiveObjectSchema + extensions | FO-01 / PR #427 | keep closed |
| Bulk import | CP-03 / PRs #431/#433/#439 | keep closed |
| 1k full atomic import | PR #433 | PASS |
| 10k stage + dry-run | CP-03 | PASS |
| 10k governed projection | CP-04 / PR #458 test coverage | PASS |
| Record + field authorization before Eidos | CP-04 / PR #458 test coverage | PASS |
| Contact/Address/Profile facets | CP-05 / PRs #488/#491/#492 Human pass | keep closed |
| Workbench + Agent composition | CP-06 / PRs #497-#504 and Human pass | keep closed |
| Plugin lazy resource loading | PR #509 | platform authority |

The existing 10k evidence is retained instead of being reimplemented under a new test
name. CP-07 adds evidence only where maturity is still genuinely open.

## Open maturity evidence

- >=100k real-world RVC integration pressure test;
- 1M+ performance pressure test where practical;
- upgrade/version compatibility evidence.

## CP-07B — Sensitive-field + legacy transformation evidence

Sensitive-field pressure extends the earlier tax-field proof across core identity,
Customer/Supplier Profiles, Contact and Address data. The protocol test denies those
field IDs at the existing server authorization boundary and proves their values never
reach the Eidos detail payload. Denying `displayName` also fails the Counterparty
read closed rather than returning a partially identifying record.

Protocol evidence:

`tests/protocol/cp07-counterparty-sensitive-fields.test.mjs`

Legacy transformation evidence:

`docs/roadmap/CP07-COUNTERPARTY-LEGACY-TRANSFORMATION-v0.1.md`

The legacy report classifies the accepted Asloop archaeology into identity, roles,
profiles, child resources, responsibilities, peer facets, projections and governed
extension/review paths. It explicitly does not claim that customer production data
has already been migrated or that the currently unindexed legacy repository received
a new exhaustive full-tree census.

## CP-07A — RVC executable evidence harness

The first CP-07 slice establishes an executable, auditable path for real public
Counterparty identity data without committing large source datasets to Git.

Implemented boundary:

```text
external GLEIF Golden Copy CSV
+ source manifest
        ↓
streaming CSV adapter
        ↓
Counterparty identity validation projection
        ↓
distribution / exception / throughput report
        ↓
architecture evidence
```

The runner is:

`npm run rvc:counterparty:gleif -- --manifest <manifest.json> --input <file.csv> --report <report.json>`

The runner deliberately does **not**:

- import GLEIF data into an Enterprise Context;
- make GLEIF columns canonical EVO fields;
- treat duplicate names as identity matches;
- treat GLEIF lifecycle status as direct EVO business lifecycle authority;
- commit the large source file to Git.

CI uses only a tiny deterministic fixture to verify the adapter, provenance contract
and report semantics. A real >=100k run must use an external source file and a
fully populated source manifest.

## Closure rule

CP-07 closes only when the remaining real-volume, sensitive-data, migration and
compatibility evidence is recorded. Passing the harness CI is not the same as passing
the >=100k RVC gate.
