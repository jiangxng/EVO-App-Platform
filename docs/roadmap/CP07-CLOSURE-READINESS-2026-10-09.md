# CP-07 Counterparty Closure Readiness — 2026-10-09

**Status:** READY_TO_CLOSE_AFTER_STACK_INTEGRATION  
**Program:** EVO Foundation Object Program  
**Current authoritative main state:** CP-07 remains ACTIVE until the evidence stack is merged and final mainline CI/continuity is recorded.

## Closure assessment

All CP-07 acceptance areas now have implementation or evidence coverage:

| Acceptance area | Evidence | Result |
| --- | --- | --- |
| Identity / role semantics | CP-02 / PR #419 | CLOSED_HUMAN_PASS |
| Extension + import | FO-01 / CP-03 | CLOSED_HUMAN_PASS |
| Responsibility / projection / permission | PR #458 | CLOSED_HUMAN_PASS |
| Facets / profiles / Contact / Address | PRs #488/#491/#492 | CLOSED_HUMAN_PASS |
| Workbench / Agent composition | PRs #497-#504 + Human pass | CLOSED_HUMAN_PASS |
| Install/use-driven plugin lazy loading | PR #509 | PASS / platform authority |
| RVC evidence harness | PR #511 | CI PASS |
| Sensitive-field pressure | PR #512 | CI PASS |
| Legacy transformation report | PR #512 | COMPLETE |
| Package upgrade compatibility | PR #513 | CI PASS |
| Real-world >=100k RVC | PR #516 validation of #514 | PASS |
| 10k full committed Demo continuity | PR #515 | Platform CI + Continuity CI PASS |
| 1M+ performance pressure | PR #517 | PASS |

## Scale evidence

Durable evidence:

- `docs/roadmap/CP07-COUNTERPARTY-SCALE-EVIDENCE-2026-10-09.md`

Observed 100k real-world Companies House result:

- 100,000 total rows;
- 100,000 valid subjects;
- 0 invalid subjects;
- 0 duplicate external IDs;
- 17 duplicate-name candidates;
- 21,504 missing country/region source values;
- 79,202 rows/sec.

Observed 1M deterministic performance result:

- 1,000,000 total rows;
- 1,000,000 valid subjects;
- 0 invalid subjects;
- 0 duplicate external IDs;
- 3,189.04 ms analyzer elapsed time;
- 313,574 rows/sec;
- 248,480 KB maximum RSS.

The 100k run is real-world RVC evidence. The 1M run is scale/resource evidence only and does not claim production database or browser rendering performance.

## Safe integration route

A reconciled complete Draft integration candidate now exists as **PR #519** targeting `main`. It contains the full stacked lineage plus the sibling PR #515 10k proof that was not present in the #516/#517/#518 ancestry. The preferred route is to validate #519 as the complete candidate and let the mainline owner window decide the actual merge. The original stack remains the audit trail.

Original evidence lineage:

1. PR #510 — close CP-06 Human gate / activate CP-07 continuity;
2. PR #511 — CP-07A RVC evidence harness;
3. PR #512 — CP-07B sensitive fields + legacy transformation;
4. PR #513 — CP-07C package upgrade compatibility;
5. PR #514 — CP-07D Companies House 100k RVC workflow;
6. PR #516 — bounded #514 workflow pipefail/CSV-selector correction;
7. PR #515 — CP-07E 10k full committed Demo continuity;
8. PR #517 — CP-07F 1M performance proof + durable scale evidence;
9. final CP-07 continuity closure PR after final mainline CI.

Do not mechanically merge the original stack one by one if PR #519 has already been validated as the reconciled candidate. If the mainline owner chooses the original stack instead, retarget each child to the actual current mainline and re-run CI as needed.

## Final closure actions after integration

Only after the stack is present on `main` and final CI passes:

- set CP-07 to `CLOSED` / `CLOSED_EVIDENCE_PASS` according to the project continuity convention in force at that time;
- record the final main commit and deployment/CI evidence in `project.status.json`;
- regenerate `docs/roadmap/HANDOFF-LATEST.md`;
- change Foundation Object Program current gate from CP-07 to IT-01;
- keep shared Foundation Object contracts EXPERIMENTAL until Item/Product provides the materially different second-object proof.

## Do not do yet

- do not start IT-01 before CP-07 evidence is integrated into main and closure continuity is recorded;
- do not rerun closed CP-02 through CP-06 gates;
- do not reinterpret the 1M synthetic performance proof as a production PostgreSQL or browser-rendering benchmark;
- do not move Workbench ownership back into App Platform Host or Counterparty;
- do not merge `main` from this B-class improvement window unless the Human explicitly changes the division of work.

No additional CP-07 product feature is required by the currently defined maturity gate.
