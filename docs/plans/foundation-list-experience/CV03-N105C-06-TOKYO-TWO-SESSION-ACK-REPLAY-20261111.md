# CV-03 / N1-05c-06 — Tokyo real SQL Producer concurrent ACK-loss replay proof

> **STATE: SOURCE PR — TOKYO PHYSICAL RUN PENDING.** 2026-11-11. This is a bounded replay acceptance on the existing frozen QA PostgreSQL database, not N1 production authority integration.

## G / inherited exact source, no duplicated deployment

- Protected baseline: `main@a78140a60cd1cf30f9ea044d44205a76ea9274b4`; [#1240](https://github.com/jiangxng/EVO-App-Platform/pull/1240) completed actual [Tokyo HBA physical #43042027579](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43042027579). QA role `cv03_n105c_qa_tcp_producer` is SCRAM-authenticated and can access `cv03_n105b_qa` but is rejected from original `evo_dev` by HBA. Legitimate EVO runtime SQL/HTTPS remained working.
- Existing QA schema `deploy/tencent-tokyo/cv03-n105b-qa-t0.sql` has session_user-to-Host binding and a single ACID owner-owned `cv03_n105b_commit_deny_t0` SECURITY DEFINER, a committed operation receipt `qa-deny-operation-0001`, immutable Outbox, and a frozen Feature. These are **synthetic QA owner facts**, not deployed PA05/AuthorizationProvider persistence or production Signed DML.
- The previously verified [authenticated Producer #43034999556](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43034999556) checked sequential idempotent replay. **Unproven until this task:** two genuinely independent password-authenticated TCP sessions simultaneous on the *same* persisted receipt under database lock contention.

## D / implementation and strict acceptance

- [Protected-main physical workflow](../../../.github/workflows/cv03-n105c06-tokyo-two-session-ack-replay.yml) uses exact live main, a known successful HBA prior run, SSH pinned host key, a SHA256-confirmed staged source and private `evo-tokyo-dev` Environment. PR triggers only syntax/contract inspection, not database execution.
- [Bounded remote shell](../../../tools/cv03-n105c06-tokyo-two-session-replay.sh) checks PG17.11, the same existing QA login + source generation + frozen Feature, existing receipt epoch 1, correctly enforced original DB HBA, actual valid SCRAM authentication and wrong-password rejection. It never re-creates QA databases, roles, grants, credentials, Source rows or HBA rules.
- Retains a complete database QA fingerprint over immutable Outbox payloads, receipts, scope epochs and Feature source state. A separate PostgreSQL session holds the existing Feature row lock in `BEGIN ... SELECT FOR UPDATE ... pg_sleep(8) ... ROLLBACK` **without DML**. Two independent genuine TCP Producer processes invoke the exact already-committed T0 operation during lock contention; PostgreSQL's own `pg_stat_activity` must observe both sessions waiting on a lock simultaneously.
- After their responses, both must return the **same** `authenticated_host_id`, `epoch=1`, `replayed=true` and the **one original** Outbox event ID; all fingerprints and receipt/event counts must remain *exactly* unchanged (no new DENY/outbox mutation, despite loss of an earlier ACK).
- Cross-Actor Human→AI scope/subject, spoofed Host ID and stale generation replays with the same operation key must all reject. Original `evo_dev` schema inventory and QA authoritative fingerprints remain unchanged. Real `evo` container must still open an independent fresh legitimate original-DB connection and PG/EVO health/HTTPS and unauthorized 401 must continue to PASS.
- The test can leave short-lived QA row locks for up to 8 seconds. The cleanup trap kills child clients on any failure; the PostgreSQL transaction is rolled back. No persistent data mutations, no external QA data leak, no source schema DDL, no production SAVE/HTTP route change. Failures/partial remote execution are RED; terminal markers enforced by the GH runner.

## P / explicitly not proved by this test

- **Two SQL sessions are NOT two independently authenticated Host identities**, nor separate PostgreSQL primaries, distributed delivery workers, network partitions, forced backend crash or independent persistent PA05/AuthorizationProvider source. These remain Owner scope, not to be misrepresented as certified. The existing QA role allows only three SQL connections and expires on `2026-12-01`.
- There is no actual lost network ACK injection here; both consumers voluntarily re-request a known completed operation while held at a DB lock. It proves one important idempotent-replay *subcase*, not T0-B across multiple Hosts.
- A future real Owner-authored migration, independent Host/KMS/Signed DML proof, multi-Host crash/recovery/real ACK loss and production cross-actor authority must be separately approved/tested. No SQL SUPERUSER DML or source-of-truth backfill is authorized.
- Hard invariants: `N1=NOT_CERTIFIED`; `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`; formal SAVE POST 403; unregistered GET 404; [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) OPEN; do not edit #1184 Owner-controlled documents.

## Physical acceptance (fill only from actual Tokyo logs)

Pending: exact PR HEAD/CI, merged main SHA, Actions run and job, all terminal markers, source drift, Branch Hygiene. Do not claim PASS from PR merge alone.
