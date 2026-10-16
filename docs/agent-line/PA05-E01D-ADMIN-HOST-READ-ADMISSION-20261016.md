# PA05-05/E01D — default-off authenticated Host administrator READ plugin admission

**2026-10-16 · DECISION_RECORD · engineering candidate / NOT real-environment PA05-05 signoff.** No production deployment, installer approval, enterprise data, actual Provider/model or Human browser evidence. PA-05/W06 IN_PROGRESS / NOT_SIGNED, Issues #979/#913 OPEN, production material WRITE OFF.

## Reused verified sources (direct original repository reading)

- [E01C / PR #983](https://github.com/jiangxng/EVO-App-Platform/pull/983) merged `main@a3044ec10517e4295dac7feb6049eaf8a6058f83`, exact synchronized HEAD seven relevant CI SUCCESS, E01C 8/8 and prior PG18 regression: [E01C decision](PA05-E01C-TRUSTED-ON-DEMAND-HOST-REGISTRATION-20261016.md). E01C created generic and trusted `createOnDemandHostReadAdmissionV010`, **not** a production entrypoint.
- [Existing Host `manager/server.ts`](../../manager/server.ts): `authorizeHostAdministration()` already enforces `authenticateBootstrapAdministratorV010` (configured Bootstrap administrator Bearer credential with constant-time equality), plus a real dynamically resolved `AuthorizationProviderV010` policy for a scoped action/resource. Missing/wrong configured credentials, unavailable/denying provider fail closed. [Provider governance original](../../manager/provider-governance.ts). No new secret storage, bearer scheme, Actor impersonation, or magic user session.
- [Original AppManager install lifecycle](../../manager/service.ts) already has plan/permission checks; Host `/v1/install/plan`, `/v1/install` and plugin-store actions use `pa05WriteLifecycleHost`. These existing install flows are **not** replaced or silently invoked. Late registration only makes a reviewed package available in the existing catalog and Router.
- [Plugin-owned Purchase Attention adapter](../../apps/purchase-attention/host-optin.ts) is already proven in isolated E01B. It remains the only allowed deferred plugin module; source Trading Reference Action is still dispatched by the original router.
- [Lightweight Host ratchet evidence](PA05-E01B-OPTIN-REAL-HOST-PURCHASE-READ-20261016.md): *startup* conditional dynamic imports expand the eager dependency graph. E01D imports the generic admission and business adapter **only inside a request handler after successful administrator authentication/policy check**, and remains **OFF** by default.

The statements above derive from actual GitHub original source and prior exact-head CI already checked, not a new external internet search or any claim about current Railway credentials.

## Selected smallest secure integration

The trusted Host exposes only `POST /v1/admin/pa05/read-plugin/admit`, behind `APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION=OPT_IN` (default `OFF`, unexpected values reject startup). Mode OFF returns 404, performs no plugin import and no registration. The only accepted exact request payload is `{"packageId":"evo-purchase-attention","confirmed":true}` (4096-byte limit; unknown keys rejected). Never take a file path/module name/permission/provider/actor/tenant from a client.

Authorization requires the existing Host configured Bootstrap administrator Bearer credential **and** a separate live Authorization Provider approval of action `host.plugin.read.admit` on resource `plugin-package:evo-purchase-attention` with `effect=READ`, `admission=REGISTER_ONLY`. Both must be satisfied **before** deferred import and again within E01C admission **after** asynchronous import. No token in URL or JSON body. The opt-in plus token alone cannot replace provider policy; absence of explicit policy must be denied. This authority is not delegated to ordinary Agent or plugin modules.

After admission only, return stage `AVAILABLE_NOT_INSTALLED` and the original side-effect-free `planInstall` digest. Do **not** call `manager.install`, `bootstrapActivation`, `admitActivation`, Provider/model or business read. Subsequent actual installation still requires an independently confirmed operator/Human decision in the existing lifecycle. Existing Handler’s Feature and per-target/source authorization checks continue to guard invocation. Duplicate registration/replay fails closed.

**Rejected:** broad public plugin upload/import endpoints; automatically installing after admission, arbitrary dynamic paths, token-only opt-in bypass of policy, accepting client-supplied Human role or fabricated enterprise data, eager startup import, new Action Router, weakening lightweight CI, and production WRITE enablement. New evidence would be necessary to change these choices.

## Focused negative and acceptance evidence

- [E01D tests](../../tests/agent-line/pa05-e01d-host-admin-admission.test.mjs): wrong/missing credential, missing or revoked Host policy and unavailable Provider deny **without loading**; approved operator can register a single first-party READ Package/Handler only; AppManager still reports **not installed** and exact source dependency; policy revocation between authorization and import return denies and leaves both registry surfaces untouched; default-OFF explicit confirmation and post-authorization dynamic import inspected in real Host source.
- [E01D CI gate](../../.github/workflows/agent-pa05-cross-business-read.yml): `PA05_E01D_ADMIN_HOST_ADMISSION` marker, 0 skipped, exact PR HEAD relevant checks for Platform Core, Lightweight Host startup, PA05 READ/WRITE, three physical PG18, Continuity and Human UI.
- **Acceptance ceiling:** a code-level admin entrypoint and deterministic isolation security checks; not a live authenticated Railway trial. No actual production credentials, real administrator use, installed plugin, tenant-source mapping, two independent live Human/Agent sessions, Provider/model output, or Human browser acceptance was inspected. #979 remains OPEN for P05-E01–E05; #913 remains OPEN for W06/global partition and PKI.

**Before merge:** all relevant exact final PR HEAD CI SUCCESS, unchanged parallel BEX/CP03/Eidos/2D paths, safe merged branch retirement; preserve mainline project status files and generated HANDOFF-LATEST.
