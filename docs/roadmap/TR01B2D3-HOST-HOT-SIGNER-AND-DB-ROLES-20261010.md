# TR-01B2D3 — Host No-Restart Key Selection and PostgreSQL Role Separation

**Evidence date:** 2026-10-10. **Disposition:** two more **bounded live-process CI PASS** results; **NOT production security certification**. Dependent drafts [App Platform PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) and [EVO PR #108](https://github.com/jiangxng/EVO/pull/108) remain unmerged. Keep original Sales→Shipment→Cash Postgres finance facts, B2D1/2D2 contract, B2D4/B2E fences and `project.status.json` unchanged.

## A — Host switch signer without Host/EVO restart

**Problem closed inside CI:** the prior verified [EVO key revocation](TR01B2D3-LIVE-POSTGRES-KEY-ROTATION-20261010.md) was dynamic in EVO's `POSTGRES` trust store, while Host's installed finance Provider still pinned its `keyId` at server startup. This follow-on admits an **optional, operator-owned nonsecret file pointer** at `APP_PLATFORM_FINANCE_OWNER_ACTIVE_KEY_ID_FILE`:

- Per verification the Host reads an actual regular, non-symlinked file with owner-only permissions and a strict key-ID value. The operator must perform an atomic rename to switch the active `keyId`. Unavailable, malformed, insecure or symlinked pointer **fails closed before signing**, never falls back to the startup key or caller request.
- In pointer mode, the Host's already-existing **AES-256-GCM encrypted Managed Secrets Provider** must resolve a preprovisioned, ID-specific private key: `namespace=evo-trading-finance-owner`, `key=host-ed25519-signing-pkcs8:<active-key-id>`, `scope=INSTALLATION`, `scopeId=<installationId>`. Missing key denies the request; the pointer cannot supply or upload private keys.
- Without pointer mode, the original key path and functionality remain unchanged. The EVO Owner is still authoritative for every public key's live `ACTIVE/REVOKED` admission, nonce and pinned finance facts. There is no Agent, browser or public route for pointer writes.

**Actual proof:** [App original Sales→EVO CI #38049355866](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049355866) **success**, with `TR01B2D3_HOST_NO_RESTART_SIGNING_KEY_ROTATION_PROOF.status=PASS` and `executionAllowed:false`. The CI starts **one actual Host process** with two distinct keys preprovisioned in its encrypted secret store, **one independently running EVO** and original Postgres facts, then asserts:

1. First key signs correctly; Host reads the owner-protected current-key pointer.
2. Operator atomically switches pointer to second key **without Host restart**, then valid original finance verification succeeds.
3. Operator revokes the first key in EVO Postgres; selecting it again is denied, and returns no Owner nonce.
4. Second key remains valid; an externally readable pointer and then a removed pointer are denied; replacing a secure pointer restores access.
5. Operator revokes the second key in EVO Postgres; no Host restart or old-key fallback is allowed. API is still alive; no CostRun/allocation write admission.

**Additional regression:** `tests/protocol/tr01b2d3-signing-pointer.test.mjs` exercises atomic rename, strict format, removed pointer, symlink and owner-only permission. This test was added after the cross-project proof and requires its own latest-SHA CI result before claiming code-head full green.

## B — PostgreSQL database privilege separation

**Actual proof in the same [run #38049355866](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049355866):** `TR01B2D3_FINANCE_POSTGRES_ROLE_SEPARATION_PROOF.status=PASS`. In **disposable PostgreSQL**, two separate roles are created. Authenticated `SET LOCAL ROLE` statements verify the restricted runtime identity can read current signer trust but **cannot** update/revoke grant rows, insert audit events, delete keys or insert CostRun rows. The separate operator role can insert and revoke a new public key and trigger two immutable operator/reason audit events, but **cannot** insert CostRun rows. Both use existing database trigger and effective PostgreSQL privileges.

**Important limitation:** the EVO production API still uses its configured DB credential; CI used the bootstrap DB user and temporarily switched roles to exercise the privilege matrix. This is **not** evidence that production workloads run under separate least-privilege credentials, nor that role-based API service wiring and all business-data SELECT grants were validated. Operator file ownership, provisioning change approvals, distributed Host replicas, key material expiry, production HSM/KMS, and audit recovery remain open.

## Connection to prior parallel lanes and handoff

The previous [OIDC + TLS dual-track proof](TR01B2D3-PARALLEL-OIDC-TLS-CERTIFICATION-20261010.md) separately certifies a **synthetic local OIDC authority** using real Authorization Code/PKCE/RS256 and Host Session/Finance request, and genuine local TLS certificate/hostname refusal. It must **not** be represented as real Google SSO or deployed HTTPS.

Source and decision references in this follow-on were **read original GitHub code and actual CI log**, rather than search summaries: `apps/trading-reference/finance-owner-key-pointer.ts`, `apps/trading-reference/finance-owner-remote.ts`, `manager/server.ts`, `tools/certify-tr01b2d3-host-hot-signing-key.mjs`, `tools/certify-tr01b2d3-postgres-role-separation.mjs`, and run #38049355866.

**Next prioritized acceptance:** authorized real external OIDC tenant and HTTPS ingress; active Host key-pointer file provisioning audit, atomic multi-instance rollout and runtime DB credential separation actually used by EVO; revocation propagation and TLS transport checks on at least two replicas; then owner-approved production trust admission. None allows B2D4 financial writes or B2E Agent/Workbench prematurely.
