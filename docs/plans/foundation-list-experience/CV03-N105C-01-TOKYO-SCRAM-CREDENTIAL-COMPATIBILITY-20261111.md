# CV-03 / N1-05c — Tokyo SCRAM credential compatibility preflight

> 2026-11-11, executable stage DRAFT / live Actions evidence PENDING. **Strictly read-only**, not an HBA migration or production N1 certification.

## Why this is urgent (G, actually inspected originals)
- Main `83e1a7da229c808fa1d8c00a085f938d04485da7` introduced a read-only SQL/HBA preflight. [Tokyo Actions #43023951994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43023951994) FAILED with a QA `PASSWORD NULL` producer accepting an intentionally wrong password over `127.0.0.1` TCP.
- The bounded forensic [PR #1229](https://github.com/jiangxng/EVO-App-Platform/pull/1229), merged main `8dcfae75c5e1e809e115da26b3c069d83bd9de32`, repeated the read-only test. [Actions #43024760363](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43024760363) output `CV03_N105C_HBA_FILE_HOST_TRUST_COUNT=4`, `LOCAL_TRUST_COUNT=2`, `PARSE_ERRORS=0`, `ORIGINAL_EVO_LOGIN_HAS_PASSWORD_HASH=true`, and critically `CV03_N105C_ORIGINAL_EVO_SUPERUSER_WRONG_PASSWORD_TCP_ACCEPTED`. The job stayed RED, correctly; SQL authentication cannot be called healthy.
- [Tokyo bootstrap](../../../deploy/tencent-tokyo/bootstrap.sh) **source** generates the private PostgreSQL password with `openssl rand -hex 32`. [Compose](../../../deploy/tencent-tokyo/compose.yaml) **source** supplies this credential to EVO via `APP_PLATFORM_CONVERSATION_DATABASE_URL`. Those files do NOT demonstrate the current password matches PostgreSQL's existing SCRAM verifier.

## New bounded physical proof

[The main-only SCRAM compatibility workflow](../../../.github/workflows/cv03-n105c-tokyo-scram-compatibility.yml) uses existing pinned Tokyo SSH secrets, obtains the existing `evo` database role's SCRAM verifier **inside Tokyo**, pipes it to a transient Node process inside the already deployed EVO container, and locally derives PBKDF2-HMAC-SHA256 (SCRAM StoredKey and ServerKey) from EVO's current in-container database connection password. It compares both keys with timing-safe equality and emits only boolean PASS markers. Neither password nor verifier is logged, written to files, returned to GitHub, or included in an artifact.

This is an **offline cryptographic compatibility check**, not an actual password-authenticated PostgreSQL connection: the current HBA host trust configuration prevents a positive authentication proof. A successful match would mean an HBA switch to `scram-sha-256` is more plausible for the existing EVO credential but **does not authorize a blind change**. The current app/public health and HTTP 401 are tested without changing runtime.

**No SQL DDL/DML, no `ALTER ROLE`, no HBA edit, no reload/restart, no new QA principal, no business data access/output.** A mismatch fails the job; secrets remain private and no workaround overrides the safety check.

## Limits, rollback and next real engineering

A separately scoped, reviewed HBA repair must preserve the exact existing HBA file before edit; verify its active rule order, production-compatible app credentials and a bounded rollback; change only authenticated TCP host rules; reload rather than restart when appropriate; retest both original app `evo` and restricted QA SQL producer, public preview health, DB session recovery and the 403/404 release gate. Otherwise revert without modifying business data. An unverified or mismatching SCRAM credential is a hard stop.

This is still Tencent Lighthouse Tokyo **preview**, not production-certified PA05/AuthorizationProvider authority. [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6796503417) is OPEN. New [N1-05c Producer PR #1227](https://github.com/jiangxng/EVO-App-Platform/pull/1227) remains deliberately Draft, with an independent function-ACL source bug; do not merge until HBA is safe and code fixed.

**Source grades:** Above GitHub Actions logs, bootstrap/Compose files and Issue are original material read in this window; prior PostgreSQL 17 [HBA configuration](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html) and [pg_hba_file_rules view](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html) official originals were opened 2026-11-11. The proposed cutover steps are engineering judgment, not tested state.

**Production gates remain:** N1=NOT_CERTIFIED; APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF; formal SAVE POST 403; unregistered GET 404. No PR #1184 Owner document changes.
