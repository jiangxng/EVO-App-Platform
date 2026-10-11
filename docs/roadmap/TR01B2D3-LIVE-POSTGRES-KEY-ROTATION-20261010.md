# TR-01B2D3 — Live PostgreSQL Key Revocation and Rotation (2026-10-10)

**Status: BOUNDED CI PASS, not production trust release.** Independent draft PRs: [EVO #108](https://github.com/jiangxng/EVO/pull/108) and [App Platform #594](https://github.com/jiangxng/EVO-App-Platform/pull/594). Project status and `main` unchanged; `executionAllowed:false`.

## Decision and mechanism

Use explicit `EVO_FINANCE_TRUST_AUTHORITY=POSTGRES`, not immutable startup JSON, when live operator key revocation is required. Without an operator-granted key, the finance read-only verification endpoint has no admitted signer. Each request loads the ACTIVE trusted Ed25519 public key for **issuer + installation + key ID** from PostgreSQL, with `FOR SHARE` lock through one-use nonce admission. Revocation commits after outstanding in-flight admissions and new requests after the commit see `REVOKED`; there is no fallback to the startup list. The compatibility `STARTUP` mode **is not dynamically revocable**.

Operator-only (not public HTTP or Agent tool):
```sh
# EVO root; with restricted operational DB credentials; after migrations
node dist/scripts/finance-trust-operator.js grant /ops/public-installation.json operator-id CHANGE-123
node dist/scripts/finance-trust-operator.js revoke <issuer> <installation-id> <key-id> operator-id CHANGE-124
```
The grant file contains only public SPKI PEM and exact installation/enterprise/context scope. A PostgreSQL trigger requires actor and reason; writes an append-only grant/revoke audit entry; forbids key scope mutation, deletion, reactivating revoked IDs and audit modification. Rotate by granting a fresh key ID, changing Host signer credentials through its approved Secrets Provider and retiring the old key.

## Real validation, including failed-run provenance

[Successful App Platform / EVO original Sales→Shipment→Cash PostgreSQL CI #38025050327](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38025050327), App code SHA `0474c2bb254b9a436453ab301d9fcf6e6b07da0e`, pinned EVO `4ac61039046205dc9d0822a4ea7f054ab3992902`.

This run **passed the entire cross-project job**, including the preceding real Host Managed Session process tests. Then **without restarting EVO API** it:
1. Verified a signed read-only request using the originally granted ephemeral key.
2. Revoked that old key through the operator CLI; subsequent old-key request was denied.
3. Granted new distinct public key ID; fresh private-key signature was verified; old key remained invalid.
4. Refused old revoked-key regrant and repeated revocation.
5. Revoked the new key; its next request was denied.
6. Verified four committed audit events `GRANT, REVOKE, GRANT, REVOKE` with operator and change-ticket reason. Original economic and replay-input digests, `CostRun` and `AllocationInstruction` were unchanged; all requests remained read-only.

Exact marker in [CI #38025050327](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38025050327):
`TR01B2D3_LIVE_POSTGRES_SIGNER_ROTATION_PROOF={"status":"PASS","oldKeyRevokedWithoutEvoRestart":true,"newKeyAdmittedWithoutEvoRestart":true,...,"appendOnlyOperatorAuditEntries":4,...,"executionAllowed":false}`.

The *first* trial [#38024898986](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38024898986) **failed**: an over-escaped compact-JWS token separator regex erroneously rejected valid assertions. Corrected in EVO `4ac6103`; rerun #38025050327 passed. Never count failed attempt as successful.

**Source read depth:** original source for `migrations/schema/202610100030_finance_dynamic_trust.sql`, `scripts/finance-trust-operator.ts`, `apps/api/src/finance-owner-delegation-route.ts`, App `tools/certify-tr01b2d3-hot-trust-rotation.mjs`, and actual GitHub job log marker were inspected this date.

## Outstanding gates and limitations

Real external Google/OIDC login tied to this Host Managed Session; production TLS/ingress and service identity; Host-side no-restart configuration rotation; separately privileged DB operator vs API roles; backup/restore and audit access; multi-replica/in-flight semantics; production KMS/HSM custody and change process remain **NOT_CERTIFIED**. CI uses local loopback HTTP restricted to `NODE_ENV=test` with an explicit test flag. Proof is a **live EVO trust registry and revocation test**, not a production security signoff, not new finance write API (B2D4), and not installed finance Agent/Workbench (B2E).

Keep TR-01B2D3 production acceptance **OPEN**, both PRs DRAFT and `project.status.json` untouched.
