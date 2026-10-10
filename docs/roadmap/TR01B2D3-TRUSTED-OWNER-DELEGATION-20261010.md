# TR-01B2D3 — Trusted Host → EVO Finance owner read-only delegation

**Date:** 2026-10-10  
**Status:** DRAFT IMPLEMENTATION + CROSS-REPOSITORY CI CANDIDATE. Not a production-certified installed finance capability.  
**Authority:** `project.status.json` (still B2D3 OPEN), `docs/roadmap/HANDOFF-LATEST.md`, B2D1/B2D2 and the accepted EVO minimal-Core ADR.

## Evidence preserved rather than reimplemented

- B2D1 Host guard (`apps/trading-reference/finance-intent-admission.ts`) independently checks active Enterprise Context, server-owned EVO enterprise mapping and Order/Customer/Item/Warehouse/Shipment/Receipt authorization, rejects conditional obligations.
- B2D2 EVO-owned `PostgresTradingFinanceFactVerifierV010` checks original immutable Sales/Shipment/Receipt, the exact POSTED sequence and policy/version pins. This was only a disposable in-process integration, **not a trusted HTTP boundary**.
- Original App-source Sales→Production→Shipment→Cash, FIFO/COGS, AllocationInstruction/Relation and Full Replay remain retained in the preceding ordered real PostgreSQL workflow steps. Never generate a parallel fixture and call it the original.

## Comparison and B2D3 candidate decision

| Mechanism | Decision | Evidence / limitations |
|---|---|---|
| Caller-declared actor / tenant over EVO demo or compatibility commands | **Rejected** | Owner cannot independently establish the authenticated Host or tenant |
| Direct process import of EVO internal verifier | **B2D2-only** | Confirms finance facts, not network-level identity; cannot satisfy B2D3 |
| Anonymous private-network HTTP | **Rejected** | Internal network reachability does not prove caller identity |
| mTLS service identity with separately signed business claims | **Reserved** | Operational certificate termination/rotation and user/tenant binding remain unknown; valuable future gateway defence-in-depth |
| Shared HMAC secret | **Not selected** | Gives both services signing authority and raises shared secret rotation risks; viable for tightly controlled deployments, not needed in this candidate |
| Dedicated Ed25519 assertion signed by the authenticated Host, verified in plugin owner | **Candidate implemented** | Public-key verification and one-time replay state. Trust/installation must be managed on both sides; mTLS/TLS remains a deployment responsibility |

**External primary standards, independently opened 2026-10-10:**

- [RFC 8725, JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html), particularly §3.1, §3.8–3.12: allow-list exact signature algorithm, validate trusted issuer/key, recipient audience and purpose-specific token profile. **Status:** official original text opened/selected sections read.
- [RFC 9864, Fully-Specified Algorithms for JOSE and COSE](https://www.rfc-editor.org/rfc/rfc9864.html), §2.2/§4.1: fully specified `Ed25519` JOSE `alg`, replacing deprecated polymorphic `EdDSA`. **Status:** official original opened, §2.2 and registry section read; this evidence changed our initial `EdDSA` candidate to exact `Ed25519`.
- [RFC 8037, OKP/EdDSA in JOSE](https://www.rfc-editor.org/rfc/rfc8037.html), §3.1: defines original JOSE EdDSA signature representation; updated by RFC 9864. **Status:** official search excerpt read, not a complete independent review of the RFC.

**Engineering decision** (not prescribed by these RFCs): business principal, Host Enterprise Context, EVO tenant, plugin installation, exact finance intent and correlation ID are all inside a 45-second purpose-locked signed assertion. EVO operator supplies allowed issuer, public key ID, installation ID, Host enterprise/context and EVO enterprise mapping via trusted configuration, *never from request data*. EVO route is not registered when no trusted installations are configured. Asserted Host identity cannot be used outside the explicitly admitted installation, and the key's private half must remain a Host-managed secret.

## Candidate implementation

### EVO PR #108

- `apps/api/src/finance-owner-delegation-route.ts`: dedicated versioned `/api/v1/plugins/trading-finance/readonly-verifications`. Exact JWT header `alg=Ed25519, typ=evo-finance-delegation+jwt`, trusted `kid+iss+installationId`, audience, request purpose, principal, tenant/context mapping, clock-window and uuid nonce; reject mismatched signature and uninstalled issuer before any finance query.
- `migrations/schema/202610100020_finance_delegation_nonce.sql`: PostgreSQL composite primary key on `issuer,jti`; atomic `INSERT ... ON CONFLICT DO NOTHING` consumes every authenticated assertion once across processes, including owner-fact denials.
- `apps/api/src/build-app.ts`/ `main.ts`: disabled by default; start only with explicitly configured trusted installation list. Does **not** alter the unauthenticated compatibility routes or claim they are secure.
- Existing `PostgresTradingFinanceFactVerifierV010` remains read-only; return `executionAllowed:false`, no financial mutation token.

### App Platform PR #594

- `apps/trading-reference/finance-owner-remote.ts`: server-side installed-provider client, resolves private key through Host's protected secrets boundary, demands HTTPS in production (loopback HTTP only under `NODE_ENV=test` and explicit opt-in), signs a fresh one-use assertion for each request, rejects non-read-only/mismatched owner responses.
- `tools/create-tr01b2d3-ci-keys.mjs` provisions ephemeral key pair and installation mapping against actual seeded EVO PostgreSQL tenant; no private key committed or printed.
- `tools/certify-tr01b2d3-trusted-owner-delegation.mjs` runs through real Fastify HTTP against preceding App Platform-created order, shipment, receipt and EVO policy/version pins; verifies Human/AI permission checks, replay, forged signature, expiry, missing/wrong tenant, wrong resource/pin/boundary and no change in canonical digests or CostRun/AllocationInstruction.
- Cross-project GitHub workflow pins **exact EVO candidate SHA** (never an unknown latest branch) for independent reproducible CI.

## Required gates still open

1. **Full CI results:** Both PRs draft pending successful EVO quality/migration/production-image CI and App original-facts Fastify + PostgreSQL CI; the current document does not assert PASS before actual check. Correct any concrete failures and preserve their run links.
2. **Actual Host product installation/session:** B2D1 currently receives a server-verified `PlatformRequestContextV010` through an injectable preflight. The isolated CI still constructs a representative Host principal and allows a scoped test policy. Production must wire that input to *real request-bound Human/AI session and active installed Provider*, not accept arbitrary caller context or merely `active:true` test objects. `resolveSigningPrivateKey` must use actual Host SecretsProvider. Until then this is **authenticated transport proof candidate**, not full B2D3 production admission.
3. **Deployment/key governance:** keyed rotation/revocation, dynamic installation disablement, audit retention for nonce rows, TLS and reverse-proxy handling, secret storage and server hostname allowlist require deployment verification. A static environment trust mapping is the MVP operator allowlist, not proof of app marketplace installation.
4. **TOCTOU:** read-only verdict never authorizes any write. B2D4 must freshly recheck Host authorization, EVO policy, POSTED boundary, concurrency, approval, idempotency and replay at execution.
5. **Do not advance project authority or merge drafts until required evidence is real.** B2D4 financial effects, B2E installed Sales UI/Agent/Workbench and Financial Account master-data modelling stay separate.

**Window isolation:** neither draft changes parallel 2D Designer or long-term Personal Agent branch; no `main` write, no `project.status.json`/generated HANDOFF edits.
