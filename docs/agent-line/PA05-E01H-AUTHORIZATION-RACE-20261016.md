# PA05-05/E01H — deny stale lifecycle permission or changed AppManager impact during asynchronous Host admission

**Class:** SECURITY_DECISION / 2026-10-16 / engineering candidate. NOT real Human/Provider/production certification. Stage PA-05/W06 IN_PROGRESS / NOT_SIGNED, issues #988/#979/#913 OPEN, production material WRITE OFF.

## Inherited original-source findings (direct GitHub reads, not newly fetched external sources)

- [E01F PR #990](https://github.com/jiangxng/EVO-App-Platform/pull/990) proved that actual Host HTTP lifecycle routes and plugin-store Action commands can refuse unauthenticated target mutations. [E01G PR #992](https://github.com/jiangxng/EVO-App-Platform/pull/992), merged `main@e8f39d6668904e464483bdb336a7d4ecde3ecf6e` with **44/44** exact-head GitHub CI and 6/6 plan tests/0 skipped, extends exact protected `evo-purchase-attention` authority through another requested package's `AppManager.planInstall` dependencies. [E01G decision](PA05-E01G-TRANSITIVE-READ-LIFECYCLE-20261016.md).
- Actual [Host `manager/server.ts`](../../manager/server.ts) `authorizePa05E01fLifecycle` awaits a live `authorizeHostAdministration` decision after calculating transitive effect. [Existing manager impact](../../manager/pa05-protected-read-lifecycle-impact.ts) reads `planInstall` and `activateFeatures` from the current Manager; [AppManager](../../manager/service.ts) may change installed/active state independently in the same Host while a policy Provider waits.
- This creates a bounded time-of-check-to-time-of-use concern: a positive asynchronous policy result is not a proof that a permission is still granted or that a dependency plan is unchanged. This is a security judgment derived from source execution ordering, **not evidence of a demonstrated production race exploit**. Existing PA05 WRITE has separate SQL durable fencing for its *WRITE owners*; it cannot be silently reused as proof of READ-plugin cross-Worker atomicity.

## Decision

For the **already protected** exact Purchase Attention READ Owner or any INSTALL/ENABLE that would newly install/reactivate it transitively, reuse the existing Host Bootstrap administrator + independent live Authorization Provider operation policy and the real E01G Manager impact. The new tiny function `pa05AuthorizeStableProtectedReadLifecycleV010`:
1. Reads the current side-effect-free impact; unaffected operation returns on the original unchanged path.
2. Requires one current policy decision, **re-reads actual impact**, and refuses any changed dependency impact.
3. Requires a **second fresh** live policy decision; denies revocation/provider failure; re-reads the impact again and refuses a changed plan before returning success.
4. Is called through the **same existing** HTTP and plugin-store Action Host guard, with the manager helper dynamically imported **inside** the lifecycle request. No new startup Owner package modules, install/revoke endpoints, policy bypass or production WRITE.

The two-phase check is deliberately fail closed on any exception from the planner or provider, and rejects a changed plan instead of silently allowing a different operation. Both `TRANSITIVE_INSTALL → TRANSITIVE_ACTIVATION` and an in-flight revoked permission are recognized. Positive stable plans still use the existing AppManager original installation lifecycle.

**Explicit limitation:** this is not an atomic lock across `authorizePa05E01fLifecycle` return and a later Manager mutation. Catalog/Manager changes immediately after the final synchronous check, ABA-like plan state changes, a second OS Worker, durable PostgreSQL session epochs, startup restore, and real authority revocation cannot be signed by these deterministic tests. A future distributed lifecycle admission needs a single durable owner/epoch/lock with trustworthy principal/session binding; do not claim global safety from the two-phase local check.

**Rejected:** assuming one Provider ALLOW response stays valid indefinitely; retrying changed plans without reauthorization; using a caller-provided `trustApproved` or `confirmed` as real identity; creating a second Agent-only AppManager; disabling original installer behavior; weakening current full Host/PG18 CI; starting default business plugin imports or touching unrelated BEX/CP03/Eidos/2D code.

## Test plan and evidence ceiling

[`pa05-e01h-authorization-race.test.mjs`](../../tests/agent-line/pa05-e01h-authorization-race.test.mjs) uses **genuine** first-party Purchase Attention and Trading Reference manifests and the real AppManager with an isolated synthetic dependent manifest. Its controlled asynchronous Provider fixture proves:
- First approval then second denial → **no permission**.
- While the first Provider answer waits, the real Manager changes the protected dependency from not-installed to installed-and-disabled, so impact changes `TRANSITIVE_INSTALL → TRANSITIVE_ACTIVATION` → **deny**.
- A plan change during the second decision → **deny**.
- Direct and transitive unchanged operation need *two* distinct positive decisions.
- Throwing policy, throwing plan → **deny**; unaffected packages still don't require a newly invented policy.
- Host source keeps deferred on-request import and existing authorization route, with explicit evidence marker `PA05_E01H_AUTHORIZATION_RACE`, `crossWorkerAtomicityCertified:false`, `realProductionHumanCertified:false`, `productionWriteEnabled:false`.

The PA05 READ workflow must require six passing new tests, 0 skipped. Existing E01A–G Owner/Agent and **real spawned Host HTTP** regression plus 3 physical PostgreSQL18, governed WRITE, Host lightweight architecture, identity and cross-project jobs remain the authoritative exact-head gates. No Railway deployment or live credential/enterprise data is introduced. See baseline §51 and Agent HANDOFF.

**State when drafted:** engineering candidate, accurate PR HEAD CI and merge to be verified; issues #988/#979/#913 stay open and PA-05/W06 NOT_SIGNED.


## First verified engineering head (2026-10-16)

**Direct actual GitHub Actions evidence:** exact first PR HEAD `fb1381ad9af3abd5fc44cb29e26a366835787d54` passed **44/44 change-triggered workflows SUCCESS**. [PA05 Cross-business READ run #38912510540](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38912510540) ran E01H deterministic in-process races **6/6 PASS / 0 skipped**; marker `PA05_E01H_AUTHORIZATION_RACE` attests testing both mid-policy revocation and changing real AppManager impact while waiting for first and second approvals. E01A–G and spawned actual Host HTTP regressions remained green. [Lightweight Host #38912510368](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38912510368), Platform Core, Governed WRITE and physical 3-PG18 workflows also succeeded. An unrelated BEX browser CI update advanced main during this run with no overlap. **Final merged-main HEAD still requires separate exact-CI validation after sync.** This is CI-only local Host evidence, not production signing.
