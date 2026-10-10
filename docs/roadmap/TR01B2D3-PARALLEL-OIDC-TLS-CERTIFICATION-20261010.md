# TR-01B2D3 — Doubled-Pace Parallel Verification: OIDC and TLS

**Date:** 2026-10-10. **State:** two **CI-certified** subtracks; neither is production Google SSO, public ingress, mTLS, or finance execution.  
**Feature branch only:** App Platform draft [PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594), dependent EVO draft [PR #108](https://github.com/jiangxng/EVO/pull/108). Both unmerged; no `project.status.json` update.

## Scope / "2×" engineering decision

Instead of addressing only one acceptance gap per iteration, two independently falsifiable end-to-end tracks were added to the **same already-proven original Sales→Production→Shipment→Cash→EVO PostgreSQL** CI. Keep earlier B2D1/B2D2/B2D3 facts, policy pins, immutable financial digests and evidence unchanged. Every signed finance call remains `executionAllowed:false`; no finance mutation, Human/Agent finance tool or Workbench admission.

### A. Real OIDC protocol, synthetic local issuer — Host Session — original EVO finance

New source: [`tools/certify-tr01b2d3-oidc-login-owner.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/feat/tr01b2d3-host-owner-delegation-20261010/tools/certify-tr01b2d3-oidc-login-owner.mjs). Actual separately listening local HTTP OpenID Provider emulator serves discovery, Authorization Code, one-use code, an RSA/JWKS endpoint and signed RS256 ID Token. It asserts **S256 PKCE** (verifier hashes to the original challenge), state, nonce, client ID, redirect URI and issuer/audience. Host `/auth/login` redirects to that IdP, Host `/auth/callback` exchanges the code through the existing **installed Generic OIDC Identity Provider**, validates the signed ID Token, and issues a real persisted Host Managed Session HttpOnly cookie.

The test uses this **OIDC-derived stable subject** (not a caller-supplied actor/identity) and an explicit Host enterprise grant/policy to invoke the **actual Host finance HTTP endpoint**, then the independently running EVO Owner verifies immutable original shipment/FIFO/valuation fact pins from PostgreSQL. After logout, the revoked cookie is rejected by the finance endpoint. Replayed authorization callback is rejected. Additional negative attempts use validly signed but **wrong nonce**, **wrong issuer**, and **wrong audience**; no Host session cookie is minted for any.

The user-facing/Google tenant is **not** involved: this is a protocol-true, disposable issuer and CI enrollment, not real Google authorization or enterprise membership lifecycle. CI IdP uses loopback HTTP (`localhost`) only.

### B. Actual Host → local HTTPS ingress → EVO Owner trust / hostname

New source: [`tools/certify-tr01b2d3-host-https-identity.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/feat/tr01b2d3-host-owner-delegation-20261010/tools/certify-tr01b2d3-host-https-identity.mjs). The test creates a **temporary self-signed local certificate with SAN=DNS:localhost** via OpenSSL, serves a TLS ingress process that forwards only the read-only finance route to the existing EVO API (private loopback upstream), then starts an actual App Platform Host HTTP process with its remote finance Provider endpoint set to `https://localhost:3443`.

Three independent Host processes exercise:
1. Trusted temporary CA + correct `localhost` hostname: **success**, original signed fact verifies and EVO nonce increases by one.
2. Trust is present but endpoint uses `127.0.0.1` not in the cert SAN: **TLS hostname mismatch denied**, EVO nonce unchanged.
3. Correct hostname but Host does not trust the temporary issuer: **untrusted-root denied**, EVO nonce unchanged.

There is **no global TLS-verification bypass** (`NODE_TLS_REJECT_UNAUTHORIZED=0` forbidden). Positive certificate trust is injected only into the isolated Host child process through `NODE_EXTRA_CA_CERTS`. The signed remote owner Transport's production `https:` endpoint validation is enforced (test-only HTTP override off).

This models TLS termination at a **local ingress**, not TLS to the EVO backend itself or proof of a production domain, public ingress, WAF, service mTLS, cert expiry/renewal or HSM/KMS deployment.

## CI, raw read depth and empirical outcomes

- [First combined OIDC + TLS proof, CI #38025964811](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38025964811): one original Sales→Cash PostgreSQL job passed, with `TR01B2D3_EXTERNAL_STYLE_OIDC_TO_REAL_FINANCE_HOST_PROOF.status=PASS` and `TR01B2D3_HOST_HTTPS_TLS_IDENTITY_PROOF.status=PASS`, followed by existing audited PostgreSQL key rotation PASS. Real job log inspected.
- [Expanded OIDC issuer/audience rejection CI #38026113772](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38026113772): **cross-project job PASS** after adding two more negative RS256 claim cases (nonce + issuer + audience), while retaining original Hosted Session, TLS and live EVO key-rotation gates.
- The original source for Host `manager/authentication-flow.ts`, `providers/oidc/runtime.ts`, `providers/oidc/host-runtime.ts`, `manager/server.ts` and previous B2D3 Host transport was **read directly** 2026-10-10; no reference list or CI-log summary was mistaken for external IdP or deployed TLS access.
- Programmatic security assertions are local and scoped; the real business records, finance mutations and immutable digests remain governed by pre-existing cross-project gates. New proofs add network, PKCE and TLS assertions, not permission to execute accounting.

## Explicitly open acceptance gaps / sequence

1. **Real external OIDC tenant:** obtain authorized non-production Google/OIDC test client and test actual HTTPS provider discovery, authorization, callback and controlled enterprise membership, including denied login and logout on the same Host installation. Never commit secrets or tokens.
2. **Production-like TLS ingress:** provision controlled HTTPS hostname and CA chain, rotate/expire certificate and validate across at least two Host/EVO service instances. Confirm proxy-to-EVO hop/mTLS or equivalent network policy separately.
3. **Host-side live signing rotation:** EVO's Postgres trust operator can revoke/grant without EVO restart (already CI-proved), but the *Host* still has an operator-pinned key ID loaded at server start. Certify a governed Host key-pointer rotation/revocation process that does not require Host restart and retains audit.
4. **Operational roles:** database read-only runtime identity vs separate trusted operator grant/revoke credentials, backup/restore and immutable audit access; production deployment observability and rate limits.
5. **Guardrail:** Do not open B2D4 finance mutations or B2E installed finance Human/Agent/Workbench on success of protocol/TLS CI alone. **Main TR-01B2D3 production acceptance OPEN.**

## Proof references and handoff continuity

Prior retained decisions and evidence: [Trusted Owner delegation](TR01B2D3-TRUSTED-OWNER-DELEGATION-20261010.md), [installed Host Managed Session](TR01B2D3-INSTALLED-HOST-MANAGED-SESSION-CI-20261010.md), [EVO live key revocation](TR01B2D3-LIVE-POSTGRES-KEY-ROTATION-20261010.md), original [source index](TR01-RESEARCH-SOURCE-INDEX-20261010.md) and [decisions/gaps](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md). Evidence should remain usable in future new chat sessions without repeating already validated research.
