# CV-03 / N1-05c-05 — Tokyo QA Producer original database HBA fence

> **STATE: SOURCE CUTOVER PR; REMOTE PHYSICAL EXECUTION PENDING.** Preview-only mitigation, not production Host authentication certification or a blanket privilege migration.

## G / verified basis — 2026-11-11

- Protected-main baseline: `f658385fad9d8ad8c8ef9df01dbf026558cd4259`, PRs [#1238](https://github.com/jiangxng/EVO-App-Platform/pull/1238), [#1239](https://github.com/jiangxng/EVO-App-Platform/pull/1239) merged.
- Physical [Tokyo #43039723598](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43039723598) proved the existing restricted QA TCP Producer can authenticate to the original `evo_dev` due to `PUBLIC CONNECT=true`; this Producer has no tested table, column, sequence or FDW/server business privilege, but original database CONNECT/TEMP remain allowed. The original EVO app SQL login must **not** be impaired.
- [Prior SCRAM host cutover #43028414842](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43028414842) established 4+ TCP host SCRAM rules, 0 TCP trust, and 2 local recovery trust rules, with actual invalid-password rejection and original app SQL/HTTPS success.
- Official PostgreSQL 17 documentation read 2026-11-11: [Client authentication / HBA](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html) first-match semantics; [pg_hba_file_rules](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html) exposes currently written file, not necessarily the last loaded policy. Therefore test actual new SQL sessions **after** reloading.

## D / bounded implementation

- [Main-only SHA-pinned Tokyo job](../../../.github/workflows/cv03-n105c-tokyo-qa-original-db-hba-fence.yml) requires exact live main, pinned SSH host key, old credential proof, syntactically valid and SHA256-verified transfer. PRs test Bash syntax but **do not** access Tokyo or change HBA.
- [One-shot rollback-gated script](../../../tools/cv03-n105c-tokyo-qa-original-db-hba-fence.sh) requires healthy real PG17.11, EVO, existing isolated QA T0, existing restricted password-backed Producer, existing HBA 0 host trust / 2 local trust, and no pre-existing matching reject rule. It proves **before change** that correct QA password connects to both QA DB and original DB, the QA socket can reach original DB, and the EVO container can open a fresh legitimate original DB SQL session.
- Creates a **private** exact-name in-volume backup; atomically prepends only these first-match rules while preserving original HBA numeric file owner/group and mode:
  ```text
  local evo_dev cv03_n105c_qa_tcp_producer reject
  host evo_dev cv03_n105c_qa_tcp_producer 0.0.0.0/0 reject
  host evo_dev cv03_n105c_qa_tcp_producer ::0/0 reject
  ```
  No broad `REVOKE CONNECT FROM PUBLIC`, no change to other users/databases or existing HBA rules, no role/password/secret rotation, no application deployment or PostgreSQL restart. A failed post-edit check triggers an attempted restoration of the private backup and reload; a failed rollback is **RED/manual recovery**, never silently green.
- Requires clean HBA parse, first-three matching reject records, `pg_reload_conf()`, genuine previously-valid QA login **now rejected** over IPv4 TCP and Unix socket, genuine QA DB Producer TCP session **still succeeds**, original `evo` TCP and EVO runtime new SQL sessions **still succeed**, PG/EVO healthy, private QA outbox/receipts unchanged, original business object schema count unchanged, original QA schema absent.
- Independently requires preview public HTTPS health and unauthorized root 401; all substantive physical pass markers are checked on the runner. The IPv6 reject rule is parsed and first-matched by PostgreSQL, but this check does **not** claim an independent IPv6 socket test on an IPv6-enabled listener. Local recovery `trust` remains available for other roles, including superuser access to the Docker host; only the named QA Producer/original-DB pairing is fenced.

## Acceptance and limits

- PR exact-head source syntax, continuity, lightweight-host, human-ui CI required before merge. After protected main push, record actual Tokyo job logs (PASS or failure/rollback), exact main SHA, Branch Hygiene and **never** equate source merge with physical approval.
- The original `evo_dev` SQL ACL `PUBLIC CONNECT/TEMP` may remain true after HBA reject; this is intentional. **SQL grant is not the same as an allowed live connection.** HBA is a preview mitigation, not a complete answer for tenant isolation, workload KMS, credential replay or bypass by privileged container/SSH principals.
- Full canonical PA05/AuthorizationProvider production persistent T0 source, multi-Host adversarial replay, network partitions, offsite/PITR and independent named PA05/DB/Security Owners remain pending under [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212).
- **Hard gates:** `N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal SAVE POST 403 and unregistered GET 404. Do not modify #1184 Owner-managed files or touch `evo_dev` business data.
