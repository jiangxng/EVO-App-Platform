# CV-03 / N1-05c-06 — Tokyo real SQL Producer concurrent ACK-loss replay proof

> **STATE: REAL TOKYO CONCURRENT QA REPLAY VERIFIED — PRODUCTION N1 NOT CERTIFIED.** 2026-11-11. This is a bounded replay acceptance on the existing frozen QA PostgreSQL database, not N1 production authority integration.

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

Verified main/CI/Actions physical evidence is appended below. Branch Hygiene is verified separately; do not infer multi-Host certification.

## G / verified Tokyo protected-main real concurrency and replay (2026-11-11)

- [Implementation PR #1242](https://github.com/jiangxng/EVO-App-Platform/pull/1242) merged into `main@06271948bb065af5e509338def299bb595f2d902` after **exact-head** source Bash syntax, Project Continuity, Lightweight Host and Human UI gates succeeded.
- Actual main-triggered [Tokyo Actions #43044527299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43044527299) job `130604837619` concluded **SUCCESS**, with its original job log inspected. The script was SHA256 pinned, remote terminal proofs enforced and public preview independently checked.
- Runtime physical markers: `CV03_N105C06_PRIOR_FENCE_AND_TRUSTED_MAIN_PASS`, `CV03_N105C06_REAL_QA_SCRAM_AND_ORIGINAL_DB_FENCE_PASS`, `CV03_N105C06_PRIOR_RECEIPT_AND_FROZEN_SOURCE_FINGERPRINT_PASS`, `CV03_N105C06_REAL_PG_ROW_LOCK_HOLDER_READY_PASS`.
- The real PG activity catalog reported **two simultaneous distinct TCP SQL sessions waiting for a feature row lock**: `CV03_N105C06_TWO_DISTINCT_AUTHENTICATED_TCP_SESSIONS_CONTENDING_PASS`. This is concrete database concurrency evidence, not a sequential test claim.
- After lock release both sessions returned exactly the existing receipt/event ID with `replayed=true`, epoch 1; comparison of event payload, immutable Outbox, receipt, scope and Feature fingerprints showed **no mutation**: `CV03_N105C06_ACK_LOSS_CONCURRENT_REPLAY_SAME_RECEIPT_NO_OUTBOX_PASS`.
- A changed Actor+subject, forged Host ID and stale source-generation all failed; original business object count and QA state preserved: `CV03_N105C06_CROSS_ACTOR_HOST_GENERATION_DENIED_SOURCE_UNCHANGED_PASS`.
- Real EVO app fresh original SQL session plus health, and public HTTPS/unauthorized 401 succeeded: `CV03_N105C06_REAL_EVO_RUNTIME_HEALTH_AND_ORIGINAL_PRESERVED_PASS`, `CV03_N105C06_PHYSICAL_CONCURRENT_ACK_REPLAY_TERMINAL_PASS`, `CV03_N105C06_ALL_TOKYO_TERMINAL_PROOFS_ENFORCED_PASS`, `CV03_N105C06_INDEPENDENT_PUBLIC_HTTPS_HEALTH_AND_401_PASS`.

**Strict interpretation / remaining P:** neither a separate Host identity nor a real lost-network-ACK fault was injected. The two distinct SQL sessions used the **same** QA Producer identity and already-committed synthetic authority receipt. No real PA05 or AuthorizationProvider source migration, KMS-backed signed write receipt, independent Host deployment or multi-Host partition recovery is implied. N1 remains NOT_CERTIFIED, SAVE remains OFF, formal SAVE POST 403, unregistered GET 404, [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) OPEN. This docs-only PR changes no runtime, SQL or Owner-managed #1184 files.
