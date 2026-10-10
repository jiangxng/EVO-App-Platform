# B2D3 — Real restricted Postgres LOGIN + isolated EVO Finance Owner listener

**Date:** 2026-10-11. Stacked onto [App Platform B2D3 Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594), paired with [EVO owner PR #110](https://github.com/jiangxng/EVO/pull/110) and parent [EVO Draft #108](https://github.com/jiangxng/EVO/pull/108). **Not a deployed production acceptance.**

## Why a separate listener

The existing independently authenticated runtime/operator DB-role [CI proof](TR01B2D3-DISTINCT-DB-LOGINS-LIVE-OWNER-CI-20261010.md) runs a real restricted runtime database identity but starts the general EVO `main.js`, which mounts numerous demonstration, command, BusinessData and administrative routes. Even though those lack DB mutation grants, endpoint isolation remains unproven.

This step pins exact EVO **`8fa737ca97de8472f89f806f866b9fbf7c71985f`** from #110 and starts **`finance-owner-readonly-main.js`** on port 3002 using a freshly authenticated non-superuser PostgreSQL runtime login with explicitly granted narrow fact/nonce/key-lock rights. The route is still the EVO Finance Owner plugin, not Host Core or minimal Ledger Core.

## End-to-end assertions

- Exclusive finance owner service startup requires `EVO_FINANCE_OWNER_ISOLATED_READONLY=true`, `EVO_FINANCE_TRUST_AUTHORITY=POSTGRES`, explicit DB URL and bind address; no startup trust JSON fallback.
- Five general command/demo/BusinessData/enterprise-template mutation URLs and `/api/v1/apps` must all return **404**, not merely PostgreSQL permission failures.
- Existing original immutable Sales→Production→Shipment→Cash, valuation pins and runtime boundary must still be verified over actual signed Host→EVO HTTP on the dedicated service, `executionAllowed:false`.
- The separate authenticated operator login grants and revokes the public signing key with two immutable audit entries; the runtime identity cannot alter trust, audit or CostRun, operator cannot access business_data, and the dedicated running process immediately denies revoked keys.
- Original economic and replay-input digests and CostRun/AllocationInstruction counts must not change.

The existing `tools/certify-tr01b2d3-distinct-db-logins.mjs` is extended; prior tests are preserved in the same cross-project PostgreSQL workflow. Marker `TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF.status=PASS` remains necessary, and **new** `financeOwnerProcessIsolatedFromCommandsAndDemo=true` must be visible on matching-head green CI.

## Production fences

This demonstrates **one additional isolated Finance Owner process in disposable CI** alongside the general EVO API and Worker, **not** an independently deployed pod/machine, real ingress/DNS/TLS/OIDC/mTLS, secret manager, KMS, external operator DB identity or deployment rollback. The normal EVO API still has its own routes and privileges; deployment separation must give the isolated Finance Owner a private network listener and restricted DB credential distinct from the general EVO API. No B2D4 write operation is admitted, no key gets public execution grants, and no Agent may bypass the plugin owner. Keep B2D3 OPEN and both parent PRs Draft.

## CI evidence

Pending exact EVO #110 head CI and matching App Platform cross-project CI. No production claims before those finish.
