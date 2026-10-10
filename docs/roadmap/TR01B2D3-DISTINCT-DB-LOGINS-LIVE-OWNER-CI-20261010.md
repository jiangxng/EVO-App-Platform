# B2D3: Distinct PostgreSQL LOGIN credentials + real read-only Owner HTTP (2026-10-10)

**Stage:** staged independent add-on to [App Platform B2D3 Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594), whose EVO owner is [Draft #108](https://github.com/jiangxng/EVO/pull/108). **Not** a production security certification, and **not** B2D4 mutating finance operation admission.

## Exact gap

Previously `TR01B2D3_FINANCE_POSTGRES_ROLE_SEPARATION_PROOF` used `SET LOCAL ROLE` under a PostgreSQL bootstrap/superuser account, even though it tested real database privilege enforcement. That does not prove either component could authenticate with separate restricted credentials, nor that the actual running EVO API could read original sales facts using a restricted login.

## Increment

In the **disposable existing original Sales→Production→Shipment→Cash/PostgreSQL CI**:

1. Generate two random, secret, independent PostgreSQL passwords and issue separate `LOGIN NOINHERIT` accounts: `tr01b2d3_runtime_login_ci` and `tr01b2d3_operator_login_ci`. Never commit or print these passwords; CI PostgreSQL is ephemeral.
2. Grant runtime read access to precisely the known immutable business facts, posting status, runtime boundary and pinned valuation/allocation policies required by the *B2D3 bounded owner verifier*, plus active trust-key lookup and replay nonce insert. Deny trust modification, audit mutation and CostRun writes.
3. Grant operator access only to key grant/revoke and immutable audit trigger prerequisites. Deny original business facts, financial execution and nonce insertion. Validate **`session_user = current_user` equals each role**, proving actual authentication, not `SET ROLE`.
4. Use the **existing EVO operator CLI** with the new operator `DATABASE_URL` to grant a fresh Ed25519 key; the runtime LOGIN cannot use the same CLI to revoke it.
5. Start an **additional independent EVO API Node process** with `DATABASE_URL` containing the restricted runtime login and `EVO_FINANCE_TRUST_AUTHORITY=POSTGRES`; sign a fresh Host-style finance assertion from the App Platform public remote owner contract; get actual `OWNER_DATABASE_READ_ONLY` success over HTTP against original Sales Shipment facts.
6. Revoke that key using only the operator login; the same **unrestarted restricted-runtime EVO process** must deny freshly signed requests.
7. Assert durable `GRANT/REVOKE` audit, unchanged original deterministic economic + replay-input digests and CostRun/AllocationInstruction counts, and `financialExecutionAllowed:false`.

Implementation: `tools/certify-tr01b2d3-distinct-db-logins.mjs`, triggered in `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml` **after** the prior role/separation proof. Marker `TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF.status=PASS` is valid **only after this branch's matching GitHub Actions check succeeds**.

## Explicit limits

- This proves a **restricted, real database LOGIN for a dedicated additional read-only finance-verifier API process in isolated CI**, not that the full production EVO API / worker / migration system uses this credential. A single general API image still exposes other compatibility routes; production must design endpoint/process isolation and complete SQL privileges accordingly.
- Production Google/OIDC tenant, HTTPS ingress, workload identity/mTLS, database Secret Manager, actual production DB accounts, multi-machine concurrency and operational key custody remain **NOT CERTIFIED**.
- No credential provisioned outside disposable CI; original mainline `project.status.json` and generated handoff unchanged; do not merge #594/#108 or enable B2D4 finance writes from this test.
- Principle retained: **business semantics in installable plugins; App Platform provides shared authorization/hosting, EVO and its authorized owner plugins control deterministic Ledger/Cost/Allocation**. No parallel Host-owned ledger or direct production finance SQL.

## Review and acceptance

CI must report the marker plus successful Platform / Project Continuity and original TR-01B cross-project PostgreSQL stages. If the new restricted API fails because broader API bootstrap requires extra rights, fix its **minimal genuine SELECT requirements** with explicit rationale; never grant `SUPERUSER`, `CREATEROLE`, `pg_write_all_data`, blanket `ALL ON ALL TABLES`, or relax the owner fact/pin validation. Update evidence after actual head CI, not before.
