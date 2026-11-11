# CV-03 / N1-05b-09 — Tokyo physical full archive restore (2026-11-11)

> EXECUTION PENDING. A merged workflow and its green CI cannot substitute for a real Tokyo restore log.

## Reused decisions and project evidence

**D — unchanged Option A:** Keep Eidos, Platform, PA05, AuthorizationProvider and Domain Owner. Saved View authority generation/epoch and immutable Outbox share one PostgreSQL ACID T0. Not a new framework.

**G — actual earlier original Actions logs consulted 2026-11-11:**
- [Backup evidence #43016695338](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43016695338) generated a private 17,744-byte logical archive verified by pg_restore --list on Tencent Tokyo. This did NOT prove full restore.
- [QA real T0 #43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251), after [merged #1224](https://github.com/jiangxng/EVO-App-Platform/pull/1224), actually installed PostgreSQL 17 DENY T0 and immutable outbox in separately created QA DB; SQL non-superuser session, idempotent replay, direct DML/SET ROLE denial, rollback, scope fence and original source DB schema isolation all emitted runtime PASS markers.
- Governing project documents: [N1 decision/acceptance](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md), [N1-05b initial engineering](CV03-N105B-01-APPROVED-A-DENY-T0-SEAM-20261111.md), [N1-05b-07 actual backup record](CV03-N105B-07-TOKYO-QA-BACKUP-GATE-20261111.md) and [N1-05b-08 real Tokyo PG17 T0](CV03-N105B-08-TOKYO-QA-PG17-PHYSICAL-T0-20261111.md). Historical external research is inherited from these records; no new external webpage was opened in preparing this bounded step.

## New and only implementation

The protected-main, exact-SHA, SSH-host-pinned [Tokyo full archive restore workflow](../../../.github/workflows/cv03-n105b-tokyo-qa-restore-proof.yml) reuses the existing evo-tokyo-dev GitHub Environment. It reads resource health, verifies the real source evo_dev and already-installed cv03_n105b_qa T0 functions, and rechecks the existing private backup without exporting its bytes.

It then creates a distinct temporary database cv03_n105b_restore_probe only after confirming that name is absent; executes the full pg_restore with --exit-on-error, --no-owner, --no-acl; queries the restored database; drops precisely that scratch database and confirms it is absent. Any partial failure leaves the job RED, with trap-based cleanup limited to the scratch DB that this run created. Terminal proof markers are verified after the SSH command returns. No source business data or secrets are logged.

**Critical anti-duplication:** Earlier proposed alternate #1222 QA DB/role provisioning was abandoned when #1224 already installed them. This change does not CREATE or DROP QA roles, alter live QA authority/outbox data, mutate evo_dev schema/tables/ACL, change Docker/Compose or restart services. No extra Tencent server.

## Limits and next acceptance

A successful logical restore on the same Tokyo PostgreSQL server is stronger than pg_restore --list, but still is NOT an offsite backup, PITR, KMS/workload identity, real PA05/AuthorizationProvider source migration, or two-Host failure recovery test. The QA #1224 producer currently uses PASSWORD NULL and local socket trust, which is not real production network workload authentication. Owner signoff [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN.

Next inspect actual main merge SHA and Tokyo Actions runtime markers FULL_ARCHIVE_EXECUTED, SCRATCH_REMOVED, ORIGINAL_AND_T0_DATABASES_PRESERVED and ALL_TERMINAL_MARKERS_ENFORCED before marking QA full restore PASS. Independently address real SQL principal, persistent authority source, concurrency/crash recovery and off-host resilience in subsequent bounded slices.

**Production unchanged:** N1=NOT_CERTIFIED; APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF; SAVE POST 403; unregistered Page GET 404. Do not modify PR #1184's three Owner-managed documents or project.status.json.


## Postmerge verified physical execution — G / 2026-11-11

**Latest independently checked merge baseline for this milestone:** [PR #1222](https://github.com/jiangxng/EVO-App-Platform/pull/1222) MERGED to main **7d3db597d903ad21fe2b65eaa5e6fc5dd057d5fd**. The PR HEAD **3bb360e1ee702afac9a1360aa8473d2f31a041d1** includes current prior main 3b2f5f896b797f7845b74075af94f46af1dd74bc, with 4/4 exact-head CI checks SUCCESS. The implementation adds only the standalone QA scratch restore workflow and this document; no duplicate QA role or database provision.

**Actual original Tokyo Actions log read:** [#43020836019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020836019), 2026-11-11 ~12:30 UTC, conclusively emitted:
- CV03_QA_RESTORE_TRUSTED_MAIN_AND_SSH_PASS
- CV03_QA_RESTORE_RESOURCE_HEALTH_PASS
- CV03_QA_RESTORE_EXISTING_T0_PRESERVED_PASS
- CV03_QA_RESTORE_PRIVATE_ARCHIVE_VALID_PASS
- CV03_QA_RESTORE_FULL_ARCHIVE_EXECUTED_PASS
- CV03_QA_RESTORE_SCRATCH_REMOVED_PASS
- CV03_QA_RESTORE_ORIGINAL_AND_T0_DATABASES_PRESERVED_PASS
- CV03_QA_RESTORE_NO_SOURCE_DATABASE_DDL_DML_PASS
- CV03_QA_RESTORE_ALL_TERMINAL_MARKERS_ENFORCED_PASS

This proves an actual **same-Tokyo-host PostgreSQL custom archive full logical restore** into the isolated transient database cv03_n105b_restore_probe, which was subsequently removed, while the existing qa T0 functions and evo_dev source remained. It does **not** validate a remote/offsite backup, PITR or restart-based disaster recovery.

**Branch retirement G:** [Branch Hygiene run #43020837434](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020837434) SUCCESS. Job log explicitly recorded *DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv03-n105b-07-tokyo-qa-resource-preflight-20261111 @ 3bb360e1ee702afac9a1360aa8473d2f31a041d1*. Active branch search then returned no match. Despite the historical branch name, the final merged PR was N1-05b-09 restore, not an alternative N1-05b-07 migration.

**Cross-index:** same evidence and remaining blockers were written as factual (non-signoff) comment on [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6795889353). Do not close #1212 based on QA success.

**P remains:** actual PA05/AuthorizationProvider persisted source, authenticated password-backed workload producer/KMS, physical principal security, off-host restore/PITR, dual Host retry/crash/outbox recovery, independent PA05/DB/Security owner approvals and subsequent N1-05c–f are open. Release unchanged: N1=NOT_CERTIFIED; SAVE_MODE OFF; SAVE POST 403; unregistered GET 404.
