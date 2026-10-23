# Certification

Installation certification proves more than data correctness.

Planned baseline:

- AP-IC-00 Bare platform discovery
- AP-IC-01 Install first definition app
- AP-IC-02 Dependency planning
- AP-IC-03 Activate/deactivate visibility
- AP-IC-04 Upgrade
- AP-IC-05 Uninstall/reinstall
- AP-IC-06 External runtime extension
- AP-IC-07 Eidos App Host discovery


## CI separation

Certification is intentionally separate from ordinary plugin development.

- Platform PR: protocol/core tests only.
- Plugin PR: owning plugin tests only.
- Full portfolio: scheduled/manual/release Ecosystem Certification.
- Material Plugin Protocol changes: run Ecosystem Certification before release/acceptance.

The certification layer may become broader over time without making ordinary plugin feedback slower.

## PA-05 schema conformance fixture (subset, not a runtime guard)

The reusable `certification/capability-operation-schema-fixture.mjs` tests published `platform.capability-operation` input/output examples against an explicitly bounded JSON Schema keyword subset: `type`, `properties`, `required`, `additionalProperties` (boolean), `items`, `const`, `enum`, string/number/array bounds. Unknown keywords and unsupported schema forms return **not conformant**, never an implicit PASS. This fixture does **not** claim complete JSON Schema Draft 2020-12 support; only configured operation schemas and instance examples covered by tests are certified.

`tests/agent-line/pa05-schema-cert-fixture.test.mjs` feeds **actual owner output** from the Ledger Configurator and Trading Reference via their existing business services/actions; it tests malformed values and false-success receipts separately. `.github/workflows/agent-pa05-cross-business-read.yml` reruns the existing 24-case parity and owner suite plus this fixture.

**Critical separation:** this is an offline SDK/certification helper, NOT an execution-time input/output validator inserted into `manager/capability-operation-access.ts` or `actions/router.ts`. Tests validating one sample do not prove the runtime rejects all bad inputs/outputs. Full 2020-12 semantics, source/resource freshness, real model, producer contract drift, universal Host validation and WRITE recovery remain pending separate gates. Do not certify arbitrary future plugin schemas from this subset.

## PA05-02B opt-in READ execution gateway (isolated certification only)

`certification/pa05-read-action-gateway.mjs` uses an **exact operation-ID allowlist** and the existing Host Action Router, authorization and Package/Feature lifecycle. It checks the complete declared supported-schema tree before admission, validates request instances before owner dispatch, validates successful READ output before returning it, and rechecks live Host authorization and Feature/operation fingerprint after a pending READ. Any unsupported schema, WRITE, unavailable/changed operation, revoked access, unfulfilled approval obligation or invalid output is refused. It never exposes the rejected output or forwards an unknown operation to a broad generic router.

This wrapper is a genuine **execution-time guard for a caller that opts into this wrapper**, not a global `manager/server.ts` or production registration. It relies on a deliberately bounded subset of JSON Schema, not full Draft 2020-12. Its owner authority and current policy rechecks cannot replace actual Owner read authorization, trusted Host request/session resolution, network egress policy or persistent Run recovery; tests use fake data/identity. No generic plugin, production WRITE, external Agent or real-model certification is implied.

`tests/agent-line/pa05-read-runtime-guard.test.mjs` verifies real Ledger/Trading READs via Human and Personal Agent, corrupt input/output rejection, unknown/WRITE denial, late authorization revocation, mid-READ disable, and optional-unvisited unsupported keywords. It is focused CI evidence for an opt-in profile only. Owner/Human activation and a standards-complete runtime JSON Schema engine must be separately reviewed before making it the Host-wide default.
