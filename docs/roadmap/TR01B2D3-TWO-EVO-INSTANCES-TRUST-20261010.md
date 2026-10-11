# TR-01B2D3 — Two Independent EVO API Instances, Shared PostgreSQL Revocation

**2026-10-10 | bounded CI PASS.** [Cross-project run #38056537802](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38056537802) completed successfully on implementation commit `0210efd2541a2e4a40032bf908a69e795207a04d`.

## What changed

The existing `tools/certify-tr01b2d3-hot-trust-rotation.mjs` now starts an **independent second EVO API Node process** on port 3001 with `EVO_FINANCE_TRUST_AUTHORITY=POSTGRES`, while the original EVO API remains listening on port 3000. Both are backed by the **same real PostgreSQL database** holding the original App Platform Sales→Shipment→Cash, Cost/COGS/Allocation pins, trust keys and replay-control nonces.

The script checks that:
- Original Ed25519 key independently verifies original immutable finance facts on **both API processes**.
- Operator irrevocably revokes the old public key while both API processes stay alive; each process denies fresh old-key signed assertions.
- Operator grants a distinct fresh public key ID; **both** processes admit a newly signed request. Neither falls back to the old key.
- Operator revokes the new ID; both running instances deny it.
- Audit record counts and reasons remain `GRANT/REVOKE/GRANT/REVOKE` as before. Read-only economic and replay-input digests and CostRun/AllocationInstruction row counts remain unchanged; `executionAllowed:false` throughout.

The successful run includes the complete original Sales→Cash, Host Managed Session, Generic OIDC protocol emulator, HTTPS local certificate/hostname trust, Host signing key pointer rollover and PostgreSQL role-separation CI before and after this new cross-instance proof as applicable. The extra instance is owned by the proof script and terminated on completion/failure.

## Scope boundary

**Demonstrated:** two separate EVO processes against one PostgreSQL, active trust lookup on each request and key revocation visibility to both, with no EVO restart.

**Not demonstrated:** independently deployed machines or regions, separate database replicas or replication lag, real ingress load balancing, simultaneous in-flight revocation serialization under induced contention, production TLS/Google OIDC, HSM/KMS custody or live user Finance operations.

This is a CI scaling-security result, **not a B2D3 production acceptance signoff**. Draft PRs [EVO #108](https://github.com/jiangxng/EVO/pull/108) and [App Platform #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) remain unmerged, `main` and `project.status.json` unchanged, no B2D4/B2E finance execution.
