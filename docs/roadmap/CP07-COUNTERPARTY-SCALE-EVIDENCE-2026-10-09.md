# CP-07 Counterparty Scale Evidence — 2026-10-09

**Status:** PASS  
**Program:** Foundation Object Program / CP-07 Counterparty maturity gate  
**Purpose:** retain durable scale evidence after GitHub Actions artifacts expire.

## Scope distinction

This document records two different kinds of evidence:

- **100k real-world RVC integration pressure:** official UK Companies House public company data;
- **1M synthetic performance pressure:** deterministic generated Counterparty-shaped data.

The 1M run is not a substitute for real-world semantic diversity. The 100k Companies House run is the real-world schema/data-shape pressure proof; the 1M run proves bounded scale/resource behavior of the same streaming analyzer.

## 100k real-world Companies House RVC

Workflow: `.github/workflows/cp07-counterparty-real-rvc.yml`  
Validation PR: #516  
Workflow run: `37912406474`  
Result: **PASS**

Source snapshot:

- source: UK Companies House Free Company Data Product;
- source shard: `BasicCompanyData-2026-10-01-part1_7.zip`;
- downloaded size observed by CI: ~69.7 MB ZIP;
- source archive SHA-256:
  `7249da9c557f3d381b7b86f6f3284fd33fe84441e957a86df7612c2ca3286d89`;
- raw source data was not committed to Git.

Observed evidence:

| Metric | Result |
| --- | ---: |
| total rows | 100,000 |
| validation band | INTEGRATION |
| valid subjects | 100,000 |
| invalid subjects | 0 |
| duplicate external IDs | 0 |
| duplicate name candidates | 17 |
| missing country/region | 21,504 |
| throughput | 79,202 rows/sec |

Interpretation:

- repeated legal names are treated as identity-review candidates, not identity matches;
- missing country/region remains source-data evidence and does not redefine EVO required-field semantics;
- Companies House lifecycle/status values do not directly become EVO lifecycle authority;
- the source schema pressures the Counterparty contract but does not become canonical EVO schema.

The first failed workflow attempts were CI shell-selection defects before RVC execution. The successful run used the same source, mapping, thresholds and RVC analyzer after the CSV archive-entry selector was made `pipefail` safe.

## 1M performance pressure

Workflow: `.github/workflows/cp07-counterparty-1m-performance.yml`  
PR: #517  
Workflow run: `37912688857`  
Result: **PASS**

Corpus:

- deterministic synthetic Counterparty-shaped CSV;
- 1,000,000 unique external IDs and names;
- controlled country/jurisdiction/status variation;
- source data generated only inside the CI runner and not retained.

Observed evidence:

| Metric | Result |
| --- | ---: |
| total rows | 1,000,000 |
| validation band | PERFORMANCE |
| valid subjects | 1,000,000 |
| invalid subjects | 0 |
| duplicate external IDs | 0 |
| duplicate name candidates | 0 |
| missing country/region | 200,000 |
| analyzer elapsed time | 3,189.04 ms |
| throughput | 313,574 rows/sec |
| maximum RSS | 248,480 KB |

Guardrails used by the evidence workflow:

- analyzer elapsed time <= 180,000 ms;
- throughput >= 5,000 rows/sec;
- maximum RSS <= 2,000,000 KB.

These are deliberately broad maturity guardrails rather than a microbenchmark SLO.

## What this proves

- the CP-07 Counterparty RVC analyzer handles >=100k real-world records with auditable provenance;
- the same streaming analysis path handles 1M records within bounded time and memory on a standard GitHub-hosted Ubuntu runner;
- identity-shape validation, duplicate-ID detection and distribution evidence remain operational at these scales;
- large raw public or synthetic corpora do not need to be committed into the repository.

## What this does not prove

- 1M Counterparty records committed into a production Enterprise Context database;
- 1M interactive browser rows rendered at once;
- production PostgreSQL query latency at 1M Counterparty rows;
- arbitrary future public-data schemas without an explicit adapter/manifest;
- that source legal-name equality is sufficient for identity matching.

Those are separate workload/database/UI concerns and should be validated only when a real product gate requires them.
