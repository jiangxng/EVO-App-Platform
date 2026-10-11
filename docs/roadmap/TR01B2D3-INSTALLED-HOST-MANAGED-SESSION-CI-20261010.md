# TR-01B2D3 — Actual Installed Host Managed Session HTTP/PostgreSQL Certification

**Date:** 2026-10-10  
**Status:** **BOUNDED CI PASS**, not an externally authenticated, production-deployed financial capability.  
**Scope:** Complements the previous [trusted Host→EVO candidate](TR01B2D3-TRUSTED-OWNER-DELEGATION-20261010.md); B2D1/B2D2 and original trading reference evidence remain authoritative within their proved limits.

## Why this follow-on mattered

Before this slice [EVO PR #108](https://github.com/jiangxng/EVO/pull/108) and [App Platform PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) had confirmed a real cross-process Ed25519 Host→EVO network assertion and PostgreSQL one-time nonce on the original immutable Sales/Shipment/Receipt. The former network proof still synthesized the PlatformRequestContext and a test policy; that was insufficient to claim the live Host request boundary.

This follow-on executes an actual `node dist/manager/server.js` HTTP process (port 4100), independently running EVO Fastify API + worker (port 3000), and PostgreSQL 18, with **actually issued and persisted Host Managed Identity Sessions**, the **actual installed/enabled Platform Provider** and **Host encrypted AES-256-GCM SecretsProvider**. The Host resolves principal and Enterprise Context via the same request-bound path used in the product; caller body contains only intent.

## Files and exact evidence

- `tools/create-tr01b2d3-installed-host-ci.mjs`: ephemeral first-party Platform package catalog/installation, persisted lifecycle state, encrypted PKCS8 Ed25519 signing secret, real Managed Identity Session service issuance/revocation, active Enterprise Context and explicit two-principal grants. The original App-generated immutable EVO enterprise remains the only finance DB.
- `tools/certify-tr01b2d3-installed-host-session.mjs`: actual HTTP calls to the Host's new `/api/v1/trading-finance/readonly-owner-verify`, positive Human and AI sessions; negative missing/forged/revoked/expired session, absent Context grant, denied authorized resource, bad Context header, user-supplied actor/enterprise JSON, and wrong original customer. Requires strict identical canonical financial digests, CostRun count, AllocationInstruction count.
- `tools/run-tr01b2d3-installed-host-ci.mjs`: three **actual Host process phases**, reloading lifecycle state and encrypted secret store. First active plugin/key; second Provider feature disabled (fail-closed before EVO); third feature re-enabled but PKCS8 secret removed (fail-closed before EVO). Each phase independently reconnects to original PostgreSQL and compares finance state. Private secrets and bearer tokens remain isolated under `/tmp`; none committed or logged.
- `manager/server.ts`: CI-only loopback HTTP permit requires `NODE_ENV=test` *and* `APP_PLATFORM_FINANCE_OWNER_CI_LOOPBACK_HTTP=true`; it cannot bypass the production HTTPS restriction.
- `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml`: original Sales→Production→Shipment→Cash, FIFO/COGS, formal Allocation, B2D2 read-only and B2D3 signer runs first; this new Host product HTTP gate runs last.
- **Primary reproducible CI:** [Cross Project TR01B run #38023569941](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38023569941), commit `a927a1a4b3118876ed62d5b28d50a6fd86933a42`. GitHub job conclusion **success**; raw log markers:
  - `TR01B2D3_INSTALLED_HOST_MANAGED_SESSION_POSTGRESQL_PROOF={"status":"PASS","mode":"active",...}`
  - `...={"status":"PASS","mode":"disabled",...}`
  - `...={"status":"PASS","mode":"missing-key",...}`
  - `TR01B2D3_HOST_PRODUCT_ALL_THREE_PHASES=PASS`
  - Existing `TR01B2D3_HOST_EVO_SIGNED_HTTP_POSTGRESQL_PROOF.status=PASS` is also preserved in that same run.
- On the same code SHA, **37 of 38 App Platform CI workflows** had already succeeded when this note was written, with one additional unrelated Host Enterprise Relationship Provider run still in progress. Do not inflate to full 38/38 until final verification.

## Proven and not proven

**Proven in isolated process-backed CI:** request-bound Managed Session and active Enterprise Context grant; per-resource Host authorization for Human/AI; separately installed/enabled Provider; server-side encrypted signing key; independently verified EVO issuer/enterprise/immutable facts; expiry/revocation/non-granted subjects and missing installed or secret protections; dedicated HTTP transport and durable PostgreSQL one-use nonce; no CostRun/AllocationInstruction increment and no economic/input digest change; all read-only results keep `executionAllowed:false`.

**Not yet proven:** live Google/OIDC human login issuance (the CI credentials were issued by the actual Host Managed Session service, not by an external identity provider); production TLS, public ingress/WAF, service name/certificate chain and operational key rotation/revocation without restart; multiple Host/EVO instances and scaling behaviour; full sales Workbench/Agent tooling (B2E); any real finance write capability (B2D4), concurrent finance execution or multi-order/FX.

**Decision:** preserve B2D3 in **bounded validated** state; do not claim production-grade financial execution, change `executionAllowed`, or prematurely advance `project.status.json`. Update authority only after the explicitly required real production trust/deployment gate is satisfied or after an owner-approved scope declaration.
