# CV-03 / N1-05c-02 — Tencent Tokyo PostgreSQL host SCRAM authentication hardening

> **STATE: DRAFT CODE, TOKYO PHYSICAL CUTOVER PENDING.** This is preview infrastructure repair only, not production N1 certification.

## Verified G and why a controlled host rule repair is necessary
- [Physical QA TCP auth failure #43023951994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43023951994) had a real wrong-password loopback TCP connection accepted.
- [Forensic Tokyo run #43024760363](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43024760363) observed **4 host trust**, **2 local trust**, **0 HBA parse errors** and confirmed even the original `evo` PostgreSQL superuser accepts a wrong password on 127.0.0.1 TCP. Not merely an isolated QA fixture.
- [SCRAM compatibility #43026057536](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43026057536) on main `9753bf6f73d8905e29bd260950ea01a212da3ec5` physically proved the existing EVO in-container database URL password matches **both** stored SCRAM keys of the current `evo` role, without ever exposing secrets or modifying auth. Existing PG/EVO containers and public HTTPS/401 healthy.
- Source official PostgreSQL 17 [HBA matching and reload](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html), [HBA file view](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html), both read 2026-11-11. **The view describes file contents, not necessarily last-loaded rules**; actual new correct/wrong credential TCP connection proves active behavior after reload.

## Actual bounded code and execution gates (D)
- [SHA-pinned main-only workflow](../../../.github/workflows/cv03-n105c-tokyo-hba-scram-cutover.yml) refuses a noncurrent main, requires previously successful real Tokyo SCRAM compatibility #43026057536, uses only the existing `evo-tokyo-dev` SSH Environment, checks staged shell script SHA256 and runs independent PR-time `bash -n`.
- [Rollback-gated Bash cutover](../../../tools/cv03-n105c-tokyo-host-scram-cutover.sh) checks **exact** PG17.11, original and QA DB presence, HBA path, prior HBA file shape (4 host trust and 2 local trust), persisted SCRAM hash and health before touching configuration. Creates a private exact-name backup of `pg_hba.conf` within the existing PG data volume. No shared Docker volume deletion or image rebuild.
- Only 4 existing **host TCP** trust entries are replaced with `scram-sha-256`, while original local Unix socket trust entries are unchanged for recovery. Any unexpected original rule count or parse error refuses modification. Calls `pg_reload_conf()` (no PostgreSQL process restart).
- Verifies a new TCP login with the **existing** original DB password succeeds; wrong-password TCP login for both original superuser and QA role fails; existing EVO container itself creates a new authenticated DB session; PG/EVO services remain healthy, local and external HTTP and unauthorized 401 are checked.
- A failed post-edit check triggers an attempt to restore the exact backed-up HBA and reload it immediately, leaving the job RED. The private backup is retained for manual recovery. Do not equate an attempted rollback marker with independently certified rollback. The exact HBA backup location is named in the checked-in Bash, not copied into CI artifacts.
- No ALTER ROLE, no password rotation, no database DDL/DML, no changes to `evo_dev` business data, resource/outbox tables, current PA05 lifecycle or authorization source, no SAVE enablement. Project runtime modules and #1184 Owner docs are untouched.

## Limits and distinct certification obligations (P)
This repair removes the observed insecure **TCP host** trust path on the existing Tokyo preview. The two `local trust` rules remain deliberately unchanged for recovery; Docker host / superuser / SSH/Environment control are privileged and not a fully certified workload identity. It does not provision #1227's new Producer, KMS, key rotation or signed Resource/Receipt; does not prove a second Host, network partition or cross-database isolation. #1227 stays DRAFT until its cross-database function ACL bug is corrected and the physical HBA postmerge evidence is PASS.

Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN; even if the HBA cutover passes, official N1=NOT_CERTIFIED, APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF, SAVE POST 403, unregistered GET 404. **Do not call this a production security audit or release signoff.**

## After merge
Read full GitHub Actions original job: all strict preflight, host trust replaced, right-password/new app connection, both negative login tests, no data-change and public HTTPS/401 terminal markers. Record actual merge SHA, run ID and error/rollback outcomes here. Use Branch Hygiene to delete only exact SHA-pinned merged PR branch. Do not rerun a one-shot cutover against already-hardened HBA (the strict 4-host-trust precondition will fail rather than rewrite a second time).
