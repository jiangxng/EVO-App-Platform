# Legacy platform capability functional convergence (2026-10-11)

Four older independent branches are retired by their *feature* outcome, not by reverting their outdated source files. These source heads are attached as additional parents so the original commits remain in `main` history:

- `feat/ea2b-ledger-capability-operations-20260930-v2`: `0cb910386a2e8c91584d7283c210127dc81b1e91`
- `integration/evo-explicit-runtime-scope-proof`: `18db6c1744b4ad20ea44c46cde513b1c6728638e`
- `integration/evo-runtime-observation-adapter`: `2f939dc67a4bfbd30aac8bff2a0ca003b608daf7`
- `fix/template-store-eidos-compliance-v0.1`: `ecf196d2c439a1ead243f7d13a3e94a449bf2e09`

**Ledger read capabilities:** Old `evo-ledger-runtime-configurator.describe` / `section.read` handlers were superseded by `apps/ledger-runtime-configurator/capability-action-handlers.ts` and `capability-operations.ts` with **package-owned read-only operations**, paging, stale-digest rejection and lifecycle gating. Eight modern tests already exist at `tests/configurator/capability-operations.test.mjs`. Keep the current registered action codes and do not reintroduce old Host registration.

**EVO authority:** Older `scopeKey` observation adapter was replaced by the `enterpriseId`-bound, typed, public EVO query contract and cross-project certificate. We do not re-add legacy compatibility endpoints or independent Ledger/FIFO/Allocation authority to Platform.

**Template Store / Eidos:** The modern `experience-assets.ts` supports catalog/detail, projection gallery and guarded copy; vendored Eidos renderer is newer. Do not overwrite vendor renderer or CSS with the original branch. Cross-module acceptance now verifies a catalog renders via Eidos.

**Scope:** No modifications to finance engine, runtime source, static authorization, Host Core, Agent, 2D Designer, Eidos code or `project.status.json`. Changes are only tests + source-history convergence.
