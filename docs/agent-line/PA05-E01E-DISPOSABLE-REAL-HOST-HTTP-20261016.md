# PA05-05/E01E — actual disposable Node Host HTTP admin registration and original install/disable

**Date:** 2026-10-16. **Class:** DECISION_RECORD / engineering candidate, **NOT** actual enterprise Human/Provider certification. PA-05/W06 IN_PROGRESS / NOT_SIGNED; Issue #979 and #913 OPEN; production WRITE OFF.

## Inherited original-source evidence and no-repeat boundary

[E01A readiness](PA05-E01A-HOST-COMPOSITION-READINESS-20261016.md), [E01B plugin-owned lazy adapter](PA05-E01B-OPTIN-REAL-HOST-PURCHASE-READ-20261016.md), [E01C trusted deferred Catalog/Router late registration](PA05-E01C-TRUSTED-ON-DEMAND-HOST-REGISTRATION-20261016.md), and [E01D administrator endpoint](PA05-E01D-ADMIN-HOST-READ-ADMISSION-20261016.md) are complete *engineering* PRs #980/#982/#983/#985 on `main@3395fe276c27528684caecfcd546cd9aab27ee8a`. E01D final accurate-head 44/44 workflows including true three-PG18 12/12, no skips, succeeded. Do not retest its internal authorization mocks as new source evidence.

Directly inspected GitHub originals: [`manager/server.ts`](../../manager/server.ts) serves `/v1/admin/pa05/read-plugin/admit`, `/v1/catalog`, `/v1/platform/snapshot`, `/v1/install/plan`, `/v1/install`, `/v1/disable`. [`providers/authorization/runtime.ts`](../../providers/authorization/runtime.ts) parses explicit, default-deny static authorization policies and resolves live `AuthorizationProvider` through the original Provider registry. [`manager/provider-governance.ts`](../../manager/provider-governance.ts) handles the bootstrap admin token with constant-time comparison, with authorization requiring the independent Provider decision.

## Narrow next evidence step

Run the actual compiled `dist/manager/server.js` in **disposable new OS processes** from Node's `child_process.spawn`, on temporary dynamic loopback ports and temporary HOME. Crucially, do **not inherit any real platform environment variables or credentials**: allow only `PATH`, disposable `PORT`, `HOME`, `NODE_ENV=test`, a test-only bootstrap token, E01D mode, and explicit tiny static policy rule. No production URL, database connection, actual Agent, provider secret, external integration or deployment. Require a health/readiness check on the real `GET /v1/catalog` before sending HTTP requests. Terminate spawned Hosts after tests, remove temporary HOME, enforce timeouts.

The tests are **real HTTP transport and actual Host lifecycle operations**, not in-process Handler mocks:
1. Mode `OFF`: real HTTP returns 404 for the admin route, and catalog has no Purchase Attention.
2. Mode `OPT_IN`: no bearer, wrong bearer, wrong confirmation and injected module path rejected; catalog remains unchanged. Correct bearer **plus independently active authorized policy** registers one exact first-party READ plugin. HTTP result `AVAILABLE_NOT_INSTALLED`; `/v1/catalog` reflects the new package while `/v1/platform/snapshot` still reports *not installed*. Existing `/v1/install/plan` sees the dependency. A second admit cannot overwrite the original package. Then run the separate original AppManager `/v1/install` and `/v1/disable` in the **same disposable process**, verifying installed/active lifecycle.
3. Mode `OPT_IN`, empty policy: a correct admin bearer still fails to register.
4. CI must require `PA05_E01E_REAL_HOST_HTTP` and exact 3/3 PASS, 0 skipped, preserving E01A–E01D and the Platform/Lightweight Host/PG18 security regressions.

This is the **smallest materially new evidence** after E01D, which only checked the internal authorizer in isolation and statically inspected the Host route. No new HTTP API, no widening admin rights and no hardcoded startup plugin import. Excluded alternatives: Railway test/deploy without permission; pretend-Provider output; static-only source assertions; introducing a second router; disabling Host startup ratchet; storing a CI test token in persistent resources; or claiming an HTTP localhost admin token is a genuine logged-in Human principal.

## Evidence ceiling and remaining certification

Successful E01E proves only code-level **real process and HTTP reachability**, **test-only** administrator Authorization Provider and local AppManager lifecycle. It does NOT prove an authorized production administrator account, a real actual enterprise-to-EVO business source, independently authenticated Human and Personal Agent, actual live Provider/model output, browser acceptance or owner signoff. The test's use of `/v1/install` may expose separate installer authorization risks; E01E does not certify unrelated global install authorization. Document any such finding; do not mask it.

P05-E01 real production/owner signoff and E02–E05 remain NOT_SIGNED; W06 #913 global lifecycle PKI/partitions remain OPEN; production material WRITE OFF. Never modify `project.status.json`, generated `HANDOFF-LATEST.md`, or parallel BEX/CP03/Eidos/2D changes.

**Evidence status when authored:** candidate until accurate PR HEAD CI, observed actual process logs, merger and branch retirement are verified.
