# TR-01B2D3 — Two EVO HTTP processes: concurrent nonce and revoke ordering

**Date:** 2026-10-11  
**Stage:** Isolated cross-project PostgreSQL CI extension; **NOT** deployed multi-machine, TLS/real OIDC, production trust ceremony or full B2D3 certification.  
**Owner boundary:** Host plugin requests finance fact/policy-pin read; EVO owner independently authenticates signed delegation over its plugin route. **Only immutable BusinessData / deterministic ledger truth belongs to EVO.** No financial mutation is authorized.

## Security gap targeted

Prior [two-EVO-instance key rotation](TR01B2D3-TWO-EVO-INSTANCES-TRUST-20261010.md) and [distinct runtime/operator DB login](TR01B2D3-DISTINCT-DB-LOGINS-LIVE-OWNER-CI-20261010.md) each passed actual PostgreSQL CI, but did not deliberately overlap two requests with identical `jti`, or hold an operator revoke transaction open while two independent EVO processes tried to admit new signed delegations.

This increment uses the **same original Sales→Production→Shipment→Cash** PostgreSQL database and exact published Cost/Allocation pins after the previously successful full replay and finance read-only proofs. It opens an additional independent EVO Fastify process (port 3003) alongside the original API (port 3000). A distinct ephemeral Ed25519 public key is admitted via the existing operator-only CLI; its private key never enters the repository.

## New runtime assertions

1. **Duplicate token across instances.** Send the *same signed assertion with one UUID `jti`* simultaneously to two independent EVO processes. Require exactly one `200 VERIFIED / executionAllowed:false`, exactly one `409 EVO_FINANCE_DELEGATION_REPLAY`, and exactly one PostgreSQL nonce row added. A per-process memory replay guard would fail this.
2. **Actual uncommitted revocation transaction.** An isolated CI operator uses an explicit PostgreSQL transaction to set the existing governance trigger's audited operator and reason, UPDATE one currently ACTIVE key to REVOKED, and **hold the row lock without committing**. Two *distinct freshly signed assertions* are then sent, one per EVO process. They must remain pending and cannot consume a nonce while the operator update is uncommitted.
3. **Revoke wins on commit.** Commit the operator transaction; both requests must return `401 EVO_FINANCE_INSTALLATION_NOT_ADMITTED` without new nonce consumption. This is a bounded deterministic order test for the fixed-search-path, non-PUBLIC active-key `SECURITY DEFINER` lock in EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108).
4. **No finance write effects.** Confirm exactly two operator GRANT/REVOKE audit entries, original immutable economic/replay input digest equality and original CostRun/AllocationInstruction counts unchanged.

**New marker** (only valid after matching-head CI): `TR01B2D3_TWO_EVO_CONCURRENT_NONCE_REVOKE_PROOF.status=PASS`.  
**Executable script:** `tools/certify-tr01b2d3-cross-instance-races.mjs`, invoked from `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml` after distinct-LOGIN certification.

## What this does NOT prove

- These are two independent Node processes sharing one local PostgreSQL server in disposable CI, **not** two deployed hosts behind a load balancer, distinct machines/regions, separate read replicas, network partitions or replication lag.
- The operator transaction uses the CI bootstrap database credential, not a deployed KMS/Secret Manager-backed operator identity; **independent runtime/operator PostgreSQL LOGIN credentials are verified separately by the preceding test**, not by this race script.
- This test serializes **revocation-before-finance-token-admission**. It does **not** claim that a read-only verification admitted before a later revocation can be canceled retroactively, nor that a future finance write may trust a prior read-only verdict. B2D4 must reauthorize at execution.
- The test does not execute Cost, Valuation, Allocation or other finance mutations. `executionAllowed:false` remains a hard boundary. B2D3 is OPEN until live production ingress/identity/credential governance, KMS custody and real multi-node tests are independently approved.
- B2D3 App Platform [Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) and EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108) remain unmerged from the main branch. This small increment lands only on the App Platform B2D3 feature branch if independent CI passes. Do not edit `project.status.json` or generated handoff while this gate is OPEN.

## CI evidence

Pending current-head cross-project PostgreSQL CI. Preserve the first failed run and fix the cause without broadening Host financial authority, removing negative controls or making the function publicly executable.
