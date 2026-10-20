# PA05 / E01J4K K0 — Production Worker Topology & Stop-Authority Inventory

**Observed:** 2026-10-20  
**Classification:** CURRENT_GATE_EVIDENCE / SOURCE-GROUNDED-INVENTORY  
**Status:** `PLATFORM_TOPOLOGY_PARTIALLY_OBSERVED / COMPLETE_WORKER_INVENTORY_NOT_SIGNED / PRODUCTION_AUTHORITY_DECISIONS_REQUIRED`  
**Parent decision:** [E01J4K trusted multi-Worker stop and credential governance](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)  
**Scope:** PA05-05 `evo-purchase-attention` READ Owner admission/lifecycle and any process that can change its protected authority. This is not a claim that the target plugin is currently enabled in production.

## 1. Exact source snapshot and production deployment

- Current `main` observed after the separate [PR #1063](https://github.com/jiangxng/EVO-App-Platform/pull/1063): `1f2a7bbd717cca4547d68680a51733966457d41c`. PR #1062 had merged at `71d63ce6716c19d68e34e77dcd2fe0c185027e35`; that prior time slice had two successful `continuity` runs ([#39365243787](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39365243787), [#39364722123](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39364722123)), one later `continuity` run CANCELLED ([#39365923782](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39365923782), cause not asserted), and `lightweight-host` SUCCESS ([#39364722179](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39364722179)).
- Current `main@1f2a7bb...` exposes **38/39 SUCCESS, 1 FAILURE**. The failing check is `Installed Eidos Human + AI Action + Workbench -> EVO PostgreSQL` ([run #39366107835](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39366107835)); it belongs to the separate EOG/Host integration work and is not changed or repaired by this PA05-only branch. It must not be reported as green.
- Current Railway Ledger Configurator deployment `f238ad0b-6ffc-4a8c-82e0-3909976d1104` reports `SUCCESS` for exact `main@1f2a7bb...`. Current environment status: Online, 1 running / 0 crashed / 1 configured replica, 0 warnings, 0 criticals, no pending work.
- No production action was taken for this inventory: no service restart, scale, redeploy, variable mutation, production HTTP mutation, database query, secret read or lock cleanup.

## 2. What the connected Railway production inventory actually shows

The Railway connector currently exposes one project, **EVO Ledger Runtime MVP**, and five live services in its production environment. This is an inventory of the connected Railway account/project only; it does not prove that no external cloud, runner, queue consumer, separate workspace or organization-owned service exists.

| Service | Observed configuration/state | PA05 interpretation |
| --- | --- | --- |
| **Ledger Configurator** | Source `jiangxng/EVO-App-Platform`, branch `main`; start command `npm start`; one SFO replica; mounted `/data` volume (500 MB); current deployment `ed44128a-c5ef-419b-a0e8-3af71acfd5c3` on `71d63ce...`; Online, 1 running / 0 crashed | The main App Platform Host process. One configured replica is not a full Worker inventory: it does not count dynamically forked child processes or other services that can call Host lifecycle APIs. |
| **Ledger Configurator App Host Validator** | Image `ghcr.io/railwayapp/function-bun:1.4.0`; `restartPolicyType=NEVER`; last deployment `70e97cb9-8e48-4aa8-b490-9246fbe821e9` SUCCESS on 2026-10-08; current replica status 0 running / 0 crashed | Not a currently running persistent Worker, but a re-runnable one-shot Host caller; details in §5. Do not run it during this gate. |
| **EVO Runtime** | Separate `jiangxng/EVO` service; one running replica; variable-name inventory includes `DATABASE_URL` | Not assumed to be a PA05 Host Worker. Its actual database role grants and ability to call protected Host lifecycle routes have not been proven absent; keep it as an unresolved boundary until the EVO/runtime owner confirms them. |
| **Experience Compiler** | Separate service; one running replica; variable-name inventory includes `EC_SQLITE_PATH` and `PORT`, not a PA05-specific database variable | Separate advisory/knowledge service, not currently evidenced as a PA05 Worker. Its lack of a listed PA05 URL is not proof of all network/credential paths being impossible. |
| **Postgres** | One running PostgreSQL service with a persistent volume | Authority/session evidence source, not an application Worker. Actual PA05-specific production roles and live session identities have not been inspected. |

All five services report `isCronJob=false` in the current Railway environment status. No separate PA05 worker service or Railway cron service appears in this connected project. This does not cover external schedulers or services outside this project.

## 3. Source-level Host execution inventory

The following are **code facts read from GitHub `main@71d63ce...`**, not observations of live process IDs or persisted production state.

| Execution path | Source fact | Current evidence ceiling |
| --- | --- | --- |
| Main Host | `manager/server.ts` is the `npm start` entry path and registers SIGTERM/SIGINT handlers. Shutdown stops the Context Memory scheduler and managed runtime hosts, closes optional async readers/worker resources and the PA05 write-lifecycle Host, calls `processRuntimeHost.shutdown()`, then closes the HTTP server. | The shutdown function is source evidence, not proof it completed in a production stop. |
| PROCESS plugin children | `manager/plugin-runtime-host.ts` uses Node `fork()` to start PROCESS plugin children lazily and stores active children in an in-memory runtime map. Normal `shutdown()` iterates the tracked runtime map, requests child shutdown and sends SIGKILL after a 750 ms child-stop timer if needed. `manager/plugin-runtime-process-child.ts` handles the IPC shutdown message and invokes plugin deactivation. | The live number and identities of active children are unknown because the production runtime map and persisted Host state were not read. A parent crash/SIGKILL does not produce a per-child stop receipt in the current contract. |
| Optional PA-02 async read Worker | `manager/server.ts` defaults `APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE` to `OFF`; `manager/agent-async-read-worker-runtime.ts` also returns undefined in `OFF`. The variable is absent from the current Ledger Configurator variable-name inventory. | No evidence of this optional worker being configured in current production; do not infer that every possible in-process background task is absent. |
| Optional async Run reader | `manager/agent-async-run-host-mode.ts` defaults `APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE` to `OFF`; this variable is absent from the current service variable-name inventory. | No separately configured async read-through connection is evidenced by the exposed configuration. |
| Context Memory scheduler | `manager/server.ts` owns an in-process schedule driver and scheduler; `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS` defaults to `0` and is absent from the exposed variable-name inventory. | The configured periodic interval is not evidenced as enabled. The scheduler is still part of the main process shutdown inventory. |
| Other in-process runtime hosts | `manager/server.ts` starts and stops managed Counterparty, Responsibility, Data Import, Object Extension and Bottleneck runtime hosts, alongside the PROCESS runtime host. | These are in-process lifecycle components, not separate Railway replicas. Any operation that can reach PA05-protected state must be enumerated by capability/role rather than assumed to be a standalone Worker. |

The source architecture explicitly disables `WORKER/WORKER` as a security boundary and treats `PROCESS/PROCESS` as a supervised child-process runtime for trusted/verified packages. See [Plugin Runtime Isolation](../architecture/PLUGIN-RUNTIME-ISOLATION-v0.1.md). PROCESS children are lazy; manifest readiness is not evidence that a child is currently resident.

## 4. Current PA05 activation boundary (not a production certification)

The current source and exposed variable-name inventory show:

- `APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION` is absent; `manager/server.ts` defaults it to `OFF`.
- `APP_PLATFORM_PA05_E01J4D_READ_LIFECYCLE` is absent; `manager/server.ts` defaults it to `OFF`.
- `APP_PLATFORM_PA05_E01J4J_COOPERATIVE_HOST_LOCK` is absent; `manager/server.ts` defaults it to `OFF`.
- `APP_PLATFORM_PA05_E01J4D_DATABASE_URL`, `APP_PLATFORM_PA05_E01J4D_SCHEMA` and `APP_PLATFORM_PA05_E01J4D_HOST_ID` are absent from the exposed variable-name inventory.
- `apps/purchase-attention/host-optin.ts` states that this opt-in module is not referenced by default production Host startup. The package is dynamically admitted only through the separately gated `/v1/admin/pa05/read-plugin/admit` route; its default admission mode is OFF.
- Host startup in `manager/server.ts` rejects a restored persisted `evo-purchase-attention` installed/active state rather than silently reactivating it.

These facts are consistent with the explicit decision to keep production material WRITE OFF and the PA05 path disabled. **They do not certify the actual `/data` snapshot, a production identity provider, DBA grants, or the absence of all external callers.** No secret values were read. The exposed service variable-name list also includes static/managed-session configuration names; names alone do not establish which identity provider is active or whether it is an organization-approved production Human IdP.

## 5. Re-runnable Host Validator is an external lifecycle-capable caller

The live Railway configuration for **Ledger Configurator App Host Validator** contains a one-shot Bun script. Its source sends POST requests to the private Host's `/v1/actions` endpoint for `app-platform.plan-install` and `app-platform.install-package`, targeting `evo-ledger-runtime-configurator`. The request helper sets `Content-Type: application/json`; no Authorization header is present in the configured script. The service has `restartPolicyType=NEVER` and currently has no running replica.

Bounded conclusions:

- It is **not** evidence of a currently running persistent Worker.
- It is a deployable/re-runnable external caller capable of requesting a generic package lifecycle action.
- Its intended target is the Ledger Runtime Configurator, not `evo-purchase-attention`.
- The script's lack of an Authorization header does **not**, by itself, prove that the production route accepts the request; no production request was made and no route behavior was tested.
- Because it is deployed in the production environment, the platform/runtime owner must decide whether it remains a production validation tool, is moved to a non-production environment, or receives a documented and tested authorization boundary. Do not trigger it to test this question.

## 6. Railway stop semantics — source fact vs. unresolved guarantee

Official Railway pages were opened and read on 2026-10-20:

| Original source | Reading grade | Source fact | PA05 consequence |
| --- | --- | --- | --- |
| [Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) | **Original page opened/read**, “Draining time” | When an old deployment is replaced, Railway sends SIGTERM and allows a configured drain interval before forcefully stopping it with SIGKILL. | A SIGTERM handler is only an opportunity to shut down; it is not a stop receipt by itself. |
| [Deployments reference](https://docs.railway.com/deployments/reference) | **Original page opened/read**, deployment lifecycle / singleton deploys | Railway manages deployment/container lifecycle and sends SIGTERM to the old deployment before removal. | The source documents deployment-level behavior, not a per-child-process inventory or a signed exit receipt for every forked child. |
| [Variables reference](https://docs.railway.com/variables/reference) | **Original page opened/read**, user-provided configuration variables | `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` is the SIGTERM-to-SIGKILL buffer; its documented default is **0 seconds**. | The current service variable-name list does not include this variable, and the returned service config exposes no `drainingSeconds` field. The connector does not expose enough evidence to certify whether a Dashboard-only override exists; therefore the effective production drain budget is **UNVERIFIED**, and must not be assumed non-zero. |

The current `manager/server.ts` shutdown path awaits several operations before calling `server.close()`. If Railway's effective drain interval is zero, the code cannot rely on graceful shutdown completing before the forced stop. No setting was changed. Before using Railway as a trusted stop authority, verify the effective deployment teardown setting through an authorized operator and exercise shutdown in a non-production environment. Choose a drain interval only after measuring worst-case scheduler/runtime shutdown and obtaining production change approval.

## 7. K0 decision: partial inventory, not STOP_CONFIRMED

**K0 is not signed.** This pass narrows the unknowns but cannot yet assert that every process capable of protected work has stopped or even enumerate every possible production caller.

Still missing:

1. **Complete infrastructure boundary:** confirm whether Railway is the sole production orchestrator, and identify external runners, queues, scheduled jobs, manual operator tools, additional workspaces/projects and any service outside the connected Railway project.
2. **Complete live Host process inventory:** an authorized, read-only method to report exact service/deployment/replica identity, Host process-start nonce, current in-process schedulers, active PROCESS child package/PID/parent PID and runtime state, plus an authoritative persisted lifecycle-state summary without exposing secrets.
3. **Protected operation reachability:** establish which services and database roles can reach the PA05 lifecycle tables/functions or the protected Host routes. In particular, confirm the EVO Runtime database role grants and the Validator's permitted route scope; do not infer from variable names alone.
4. **Trusted stop authority:** the named organization/operator who can freeze scaling/restarts, stop every exact instance, attest termination, and authorize maintenance. The actual effective Railway drain interval must be verified; Railway service status alone is not a per-child receipt.
5. **Production Human IdP:** approved issuer/audience, Human operator role/group, assurance/MFA requirement and revocation SLA. Do not substitute `APP_PLATFORM_STATIC_SESSION_JSON`, a bootstrap token, test fixture or environment boolean.
6. **DBA and secrets:** named DBA/credential owner, least-privilege role/grant migration, approved production `secrets.resolve` provider or broker, short-lived credential issuance, rotation/revocation and existing-session invalidation.
7. **Audit and signoff:** durable non-secret audit sink, retention/integrity requirements and the identity, DBA and runtime owners who will independently sign the real evidence.

### Next engineering step after K0 decisions

Do not implement a generic distributed lock or enable production PA05 flags yet. First define an explicit, read-only inventory contract with negative tests for missing/duplicate/unreachable workers and a per-instance stop receipt. Bind its provider to the organization-approved orchestrator. Then implement fencing → drain → external termination evidence → PostgreSQL session re-query → maintenance authorization, followed by restart/scale exclusion and per-Host reattestation. A lease timeout, a local file lock, a zero-replica dashboard, an empty `pg_stat_activity` query or a SIGTERM log must not independently produce `STOP_CONFIRMED`.

## 8. Preserved boundaries

- Full E01J4, PA05-05 E01–E05 and W06 remain **NOT_SIGNED**.
- Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988), [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) and [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) remain OPEN.
- Production material WRITE remains OFF.
- No automatic stale-lock cleanup, production stop, service restart/scale/redeploy, secret retrieval, or identity/DBA configuration change.
- `project.status.json` and generated `docs/roadmap/HANDOFF-LATEST.md` were not modified. The overall project continuity snapshot still tracks the separate TR-01 mainline; this PA05 record does not attempt to overwrite that global snapshot.
- This K0 note is additive evidence. The accepted J4K decision record remains intact; its design baseline is not being rewritten.


## 9. 2026-10-20 post-merge revalidation

This section supersedes only the earlier main/deployment snapshot in §1; it does not change the K0 acceptance boundary or claim a complete inventory.

- PR [#1065](https://github.com/jiangxng/EVO-App-Platform/pull/1065) merged as `36a3ee4ec2385c8e3657d509f382649144f4857d`. The latest main pointer at verification was the same SHA.
- The seven exact-HEAD checks for #1065 were all SUCCESS. Applicable post-merge checks were [continuity #39368628659](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39368628659) and [lightweight-host #39368628796](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39368628796), 2/2 SUCCESS.
- Railway deployment [`6e13ca5a-8096-4be4-8663-f22df8c958f1`](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601/service/a8622238-480e-4da3-be6f-60fd0f3e18db?id=6e13ca5a-8096-4be4-8663-f22df8c958f1&environmentId=98b8b20c-d791-4073-a11d-bb1f7f0a1cb3) corresponds to exact `main@36a3ee4...` and reports SUCCESS / Online, 1 running / 0 crashed, no warnings/criticals/pending work.
- Read-only Railway configuration recheck found no staged changes, Host configured for one SFO replica, and no effective draining interval exposed in the service config response. The current Host variable-name list omits the PA05 E01D/J4D/J4J opt-in flags and dedicated J4D DB URL/schema/Host ID. No variable values were read.
- **Still unresolved:** whether infrastructure outside the connected Railway project exists; live PROCESS child inventory and per-child exit receipts; authority to freeze/restart/scale every instance; effective Railway drain interval; EVO Runtime database grants and Validator route scope; approved production Human IdP issuer/audience/revocation SLA; least-privilege DBA and secrets broker/rotation; durable audit sink and named signers.
- No production stop/restart/scale/redeploy, Validator run, secret read, database query, stale-lock cleanup, or identity/DBA configuration change occurred. K0 remains NOT_SIGNED and production material WRITE remains OFF.


## 10. 2026-10-20 — Account-scoped orchestration and external caller recheck

### Directly observed through the connected Railway account

- Current source snapshot: `main@2735edb72f2b44297466cbd53feda3892f84385b`.
- Account-level project inventory: one personal workspace (`jiangxing's Projects`) and one accessible project (`EVO Ledger Runtime MVP`).
- Project webhooks: **0**.
- Environment: five services; no pending deployment work; no reported service issues. This is the connected account/project view only and is not an organization-wide cloud inventory.
- Validator service: `restartPolicyType=NEVER`, 0 running / 0 crashed / 1 configured replica, last deployment SUCCESS on 2026-10-08. Its variable-name inventory exposes only `DATABASE_URL`; no values were read.

### Validator command evidence and ceiling

The current service configuration contains `./run.sh` with an embedded script. Decoding the command locally for inspection (without running it) confirms requests to Host `/v1/actions` for `app-platform.plan-install` and `app-platform.install-package`, targeting `evo-ledger-runtime-configurator`. The configured script contains no Authorization header and no `evo-purchase-attention` target. This is a re-runnable external lifecycle-capable caller to include in the authority inventory, **not** evidence of a currently running persistent Worker or a proven unauthenticated production exploit. No production HTTP request was sent and the Validator was not executed.

### What this does not prove

- The connected Railway account has one accessible project, but that does not prove the user/organization has no other Railway workspace/account, cloud provider, external runner, queue consumer, scheduler or service with network/credential access to Host lifecycle routes.
- A previous local Docker Compose validation guide is not evidence that an API/Worker stack is deployed in production.
- No explicit user/organization decision has been found confirming Railway as the sole production orchestrator or naming the authoritative stop actor.

**Status remains:** `PLATFORM_TOPOLOGY_PARTIALLY_OBSERVED / COMPLETE_WORKER_INVENTORY_NOT_SIGNED / PRODUCTION_AUTHORITY_DECISIONS_REQUIRED`. Do not begin K1/K2 production-facing implementation until the organization confirms the complete topology and stop authority. Full E01J4, PA05-05 E01–E05 and W06 remain NOT_SIGNED; production material WRITE stays OFF. No production service action, Validator execution, secret read or configuration change occurred.


## 11. 2026-10-20 — Deployed process and caller inventory (read-only)

### Visible Railway production topology

| Service | Deployed configuration | What the evidence supports |
| --- | --- | --- |
| EVO Runtime | `npm start` → `node dist/apps/api/src/main.js` at EVO main `d5ce051325c4572c7a5fd713560d7d7d06e4b401` | API process only. Repo separately defines `start:worker` and a local Compose Worker, but no Worker service exists in this connected Railway project. |
| Postgres | PostgreSQL 18 service + persistent volume | Database service, not a Worker. |
| Experience Compiler | `Dockerfile.api` → `uvicorn ec.api:app` at EC main `5f06a6224b6ffe434a9a3c0793b0384943121ac9` | API process only; no dedicated Worker/Cron service. |
| Ledger Configurator | `npm start` → `node dist/manager/server.js` at Platform main `2735edb72f2b44297466cbd53feda3892f84385b` | Single Host service, one configured/running replica. It has in-process background-capable modules; current source defaults make the context-memory scheduler interval `0`, optional Agent async read worker `OFF`, and J4J lock `OFF`. The corresponding env var names are absent from the production variable-name list. |
| Ledger Configurator App Host Validator | One-shot function, `restartPolicyType=NEVER`; 0 running / 0 crashed / 1 configured replica; last SUCCESS deployment 2026-10-08 | Not a persistent Worker. Its embedded script is lifecycle-capable: it POSTs `app-platform.plan-install` and `app-platform.install-package` to Host `/v1/actions`, targeting `evo-ledger-runtime-configurator`, with no Authorization header. It was not executed. |

The environment has no Cron-configured service, no project webhooks, no TCP proxies and no staged changes. The connected account shows one personal workspace and one project; this is not proof that no other account, cloud, runner, queue consumer or service exists outside this scope.

### Bounded Host HTTP-log observation

The returned Host HTTP log sample contains 501 entries, including 10 `POST /v1/actions` calls. All 10 displayed a browser user-agent. The log view provides no request body, so the commands, consent context and complete caller identity cannot be inferred. This sample is not a full historical audit and does not prove absence of external callers.

### Source-grade links

- [EVO package.json](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/package.json) — `start` is API; `start:worker` is a separate entry point.
- [EVO worker main](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/worker/src/main.ts) — drains posting work for active enterprises and publishes outbox batches.
- [EVO Docker Compose](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docker-compose.yml) — local validation topology with a distinct Worker; not production deployment proof.
- [Experience Compiler API Dockerfile](https://github.com/jiangxng/Experience-Compiler/blob/5f06a6224b6ffe434a9a3c0793b0384943121ac9/Dockerfile.api) — API process.
- [Platform package.json](https://github.com/jiangxng/EVO-App-Platform/blob/2735edb72f2b44297466cbd53feda3892f84385b/package.json) — `start` maps to Host server.
- [Platform manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/2735edb72f2b44297466cbd53feda3892f84385b/manager/server.ts) and [cooperative lock implementation](https://github.com/jiangxng/EVO-App-Platform/blob/2735edb72f2b44297466cbd53feda3892f84385b/manager/pa05-read-owner-cooperative-host-lock.ts) — scheduler/async worker/J4J defaults and opt-in lock boundary.

### Consequence for J4J / K0

- J4J remains **ENGINEERING_BOUNDED_PASS** from isolated exact-HEAD CI, but the production flag is absent and the source default is `OFF`; no production Host lock is claimed to be held.
- The Validator is a known lifecycle-capable caller whose route authorization still needs source-grade coverage. Issue #988 remains OPEN; do not rerun it against production.
- A separate production EVO Worker is **not observed in the connected Railway project**. Whether one exists elsewhere, and who can stop all real Writers/Workers, remain unresolved. This evidence narrows the connected-project scope but cannot certify the organization-wide topology.

No production service action, Validator execution, secret read, database query, stale-lock cleanup, identity/DBA change or configuration mutation occurred. Status remains `PLATFORM_TOPOLOGY_PARTIALLY_OBSERVED / COMPLETE_WORKER_INVENTORY_NOT_SIGNED / PRODUCTION_AUTHORITY_DECISIONS_REQUIRED`; full E01J4, PA05-05 E01–E05 and W06 remain NOT_SIGNED; production material WRITE remains OFF.


## 12. 2026-10-20 — Post-main / post-deployment confirmation

This K0 documentation PR remained Draft and unmerged while main advanced to `1acd04a8f9bb13082a03d755a81f2227fbf838d4` through unrelated [PR #1072](https://github.com/jiangxng/EVO-App-Platform/pull/1072). Railway subsequently reported Host deployment `5fd9bc96-b282-4c0b-b336-d425695b1c52` SUCCESS / Online, 1 running / 0 crashed, no reported issues and no pending work. This PR did not cause that deployment.

The latest read-only environment recheck remains five services, no dedicated Worker or Cron service, no staged changes, no project webhooks, no TCP proxies and no buckets. EVO and Experience Compiler main remain at `d5ce051325c4572c7a5fd713560d7d7d06e4b401` and `5f06a6224b6ffe434a9a3c0793b0384943121ac9`. Host variable names still omit the J4J lock, optional async read-worker and context-memory schedule flags; current source defaults remain `OFF`, `OFF` and `0`. Validator remains `restartPolicyType=NEVER`, 0 running / 1 configured replica, last SUCCESS 2026-10-08, and was not run.

**K0 remains NOT_SIGNED.** No evidence has been added for an organization-wide Worker inventory, external caller inventory, effective drain budget or authoritative stop actor. No production mutation, Validator execution, secret/DB read, stale-lock cleanup, identity/DBA change or configuration mutation occurred.


## 13. 2026-10-20 — Official Railway shutdown/drain evidence

### Original sources read

| Title / original URL | Read status / key source facts | Project use and limits |
| --- | --- | --- |
| [Railway — Deployment Teardown, “Draining time”](https://docs.railway.com/deployments/deployment-teardown#draining-time) | Original page fetched/read 2026-10-20. Once the new deployment is active, the previous deployment receives `SIGTERM` and is forcefully stopped with `SIGKILL` after the configured graceful-shutdown interval. The interval can be set in service Settings, config-as-code, or `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`. | Defines the platform shutdown sequence and configuration locations. Does not reveal this project's actual Settings-pane value. |
| [Railway — Deployments reference, “Singleton deploys”](https://docs.railway.com/deployments/reference#singleton-deploys) | Original page fetched/read 2026-10-20. Default graceful shutdown is 0 seconds; Railway says it does not send other signals. | The default is a conservative assumption, not proof that a service has no Settings-pane override. |
| [Railway — Variables Reference, user-provided configuration variables](https://docs.railway.com/variables/reference#user-provided-configuration-variables) | Original page fetched/read 2026-10-20. `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` controls the SIGTERM-to-SIGKILL buffer; documented default 0. | Host and EVO Runtime variable-name lists omit this variable. Postgres lists it, but its value was not read and is not evidence for Host/EVO. |
| [Railway — NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | Original page fetched/read 2026-10-20. Starting Node through npm/yarn/pnpm may leave the package manager as main process and intercept the signal; recommendation is to start Node directly. | Host and EVO Runtime use `npm start`. Therefore direct delivery of SIGTERM to the Node application and clean lock release are not proven. |

### Source facts versus project assessment

- **Source facts:** documented Railway default drain time is 0 seconds; the old deployment gets SIGTERM then SIGKILL; start-command process topology can affect signal handling.
- **Project facts:** current Railway start commands for EVO Runtime and Ledger Configurator are `npm start`; neither visible variable-name list includes `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`; service config returned by the connector does not expose a Settings-pane override. Postgres has a variable of that name, but no value was read. No production service config was modified.
- **Assessment:** effective drain duration and whether Node receives SIGTERM directly remain **unverified**. Plan conservatively as if no graceful-drain budget is guaranteed until an authorized operator confirms the per-service Settings/config value and an isolated shutdown test verifies process behavior. This is not a claim that the actual Settings-pane value is definitely 0.

### Gate impact

K0 remains NOT_SIGNED. Do not treat successful deployment, a timer expiry, the current single replica, or J4J's opt-in POSIX lock as proof of graceful termination or global Worker stop. No production setting/start command was changed; any such change requires explicit authorization and a separate exact-HEAD validation plan.


## 14. GitHub Actions: bounded production-caller inventory

At Platform `main@eaa5e813b1e86a6460d988c76eb2076512c35127`, the `.github/workflows` directory contained 153 workflow files. All 153 were content-scanned for explicit live Railway host/configuration patterns; 10 workflow files explicitly target the production host and were source-reviewed with their referenced scripts. This does not cover dynamically constructed URLs, other repositories/accounts, or the whole GitHub organization.

### Verified production callers

- [Browser lifecycle workflow](https://github.com/jiangxng/EVO-App-Platform/blob/b5ccbddc4501555207f9795fac48781c18451317/.github/workflows/browser-lifecycle-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/202b190c6687149d3b9485147d280899a19507de/tools/browser-lifecycle-production-proof.mjs): manual and path-filtered PR; opens live Enterprise Agent; observes `POST /v1/actions` and `/v1/events`; does not construct a direct action body. Page-generated POSTs may occur; request bodies are not captured.
- [Web version skew/RUM workflow](https://github.com/jiangxng/EVO-App-Platform/blob/70f9ceba123162836d4e1b175627de95a6c4f52e/.github/workflows/web-version-skew-rum-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/b6e75a0e2ed3d9739fb61bb70f2c9aa23d9513b1/tools/web-version-skew-rum-production-proof.mjs): manual and path-filtered PR; GET health/diagnostics/assets; explicitly POSTs a synthetic sample to `/v1/web-performance` with no Authorization header in the script. This is a production telemetry write, distinct from governed business WRITE.
- [Web security delivery](https://github.com/jiangxng/EVO-App-Platform/blob/653a237a116376a0364f1f034505c0b1956d2ee6/.github/workflows/web-security-delivery-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/60038a36a7f840ccd45ce28e4c146d7669a2d959/tools/web-security-delivery-production-proof.mjs): manual, path-filtered PR and path-filtered main push; live root/CSS/cache requests and browser observe route; no direct business/lifecycle mutation in the inspected harness.
- [Mobile task inbox](https://github.com/jiangxng/EVO-App-Platform/blob/bd47d8b17cb4424be1d16a9503025e054d569bf1/.github/workflows/mobile-task-inbox-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/395cdd67dfb3e1d96cbc09290218e18d1fb4399e/tools/mobile-task-inbox-production-proof.mjs): manual, path-filtered PR and path-filtered main push; live browser route and DOM/cold/warm check; no direct lifecycle request in harness; frontend requests remain possible.
- [EOG Mobile READ](https://github.com/jiangxng/EVO-App-Platform/blob/756e65e81332653dffe42e8799e6be7abebbc73d/.github/workflows/eog-mobile-read-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/bf0c45a4c00227e3cecae21ab0de28752a11e497/tools/eog-mobile-read-production-proof.mjs): manual, path-filtered PR and path-filtered main push; live EOG route; records browser-generated `POST /v1/actions` counts/statuses but does not construct those request bodies.
- [Mobile review](https://github.com/jiangxng/EVO-App-Platform/blob/4be107b242ed7c57ed12da5a362ba33a2b9fe39e/.github/workflows/mobile-review-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/66709c9a32aa7d582d62f2239fdc020dd7ba217f/tools/mobile-review-production-proof.mjs): manual, path-filtered PR and path-filtered main push; live Agent memory review queue and DOM/cold/warm checks; no direct lifecycle request in harness; frontend requests remain possible.
- [Real Browser RUM Budget Proof](https://github.com/jiangxng/EVO-App-Platform/blob/ab5db08667f68233a7b80af81443a7e85f3265ea/.github/workflows/real-browser-rum-budget-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/0e003248b666c1b7413b73e27bc62069d6e4769c/tools/real-browser-rum-budget-proof.mjs): manual, path-filtered PR, and path-filtered main push (push also watches three browser/web performance runtime files); live desktop/mobile pages wait for the client RUM reporter to flush one sample and verify it via diagnostics. The harness does not directly POST, but the browser page generates a production telemetry write.
- [Web delivery](https://github.com/jiangxng/EVO-App-Platform/blob/b9d84eaba86747c78657260ee7bb901f9139dc9c/.github/workflows/web-delivery-production-proof.yml): manual and path-filtered PR; GET/conditional GET of root and asset paths.
- [Surface browser](https://github.com/jiangxng/EVO-App-Platform/blob/3263adb9cede0b0b323066e7e290c40d97dad309/.github/workflows/surface-production-browser-proof.yml): manual and path-filtered PR; headless live Surface navigation and `/v1/events` observation.
- [Surface scoped loading](https://github.com/jiangxng/EVO-App-Platform/blob/9f353776e02e8efa33835a2d038ac5107d2cf093/.github/workflows/surface-scoped-loading-production-proof.yml) + [script](https://github.com/jiangxng/EVO-App-Platform/blob/7e19492d34ac4a434cee2cdc4fc60c5d67ddb0f2/tools/browser-surface-network-proof.mjs): manual and path-filtered PR; live browser network measurements; no direct lifecycle mutation found in harness, but app-generated requests are not fully ruled out.

Five reviewed workflows include `push: main` triggers additionally path-filtered; four watch their own workflow/script, and the Real Browser RUM Budget Proof also watches three browser/web performance runtime files; they do not run on every main push. All listed probes include manual dispatch and path-filtered PR triggers. The reviewed YAML does not declare a protected GitHub Environment approval gate; repository-level environment rules were not inspected.

### Related repositories reviewed

- [EVO workflows at pinned main](https://github.com/jiangxng/EVO/tree/d5ce051325c4572c7a5fd713560d7d7d06e4b401/.github/workflows): CI and branch hygiene.
- [Experience Compiler workflows at pinned main](https://github.com/jiangxng/Experience-Compiler/tree/5f06a6224b6ffe434a9a3c0793b0384943121ac9/.github/workflows): CI and legacy-ref retirement.
- Eidos workflow directory: CI, branch hygiene, legacy-ref retirement and UI review.

No separate production deploy/Worker workflow was found in these reviewed files. This is not proof that no other repository, account, cloud or external orchestration exists.

### Decision

GitHub-hosted runners are transient external production callers and must be included in the K0 caller inventory; they are not evidence of a persistent queue Worker. RUM POST is an explicit telemetry write. Browser-generated `/v1/actions` requests require payload/authorization/side-effect evidence before being classified harmless. The complete external caller inventory and authoritative stop actor remain NOT_SIGNED.

No workflow was dispatched and no production HTTP request was made during this source audit.


## 15. Current main / Railway deployment recheck

While this documentation PR remained Draft and unmerged, main advanced to `eaa5e813b1e86a6460d988c76eb2076512c35127` via unrelated [PR #1073](https://github.com/jiangxng/EVO-App-Platform/pull/1073). Railway deployed that commit to Ledger Configurator as `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9`, SUCCESS / Online, 1 running / 0 crashed, zero reported warnings/criticals, no pending work. All five connected services currently report latest deployment SUCCESS; no staged changes exist. This PR did not cause the deployment.

The current Host and EVO Runtime still use `npm start`, one configured replica each. Neither visible variable-name inventory includes `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`. Host variable names still omit the J4J lock, optional Agent async worker and context-memory schedule flags; source defaults remain `OFF`, `OFF`, and `0`. No variable values were read. Validator remains `restartPolicyType=NEVER`, was not executed, and its configured script still contains Host `POST /v1/actions` plan-install/install-package calls without an Authorization header.

**K0 remains NOT_SIGNED.** The current recheck does not prove organization-wide Worker inventory, external caller completeness, effective drain time, or authoritative global stop control. No production action or configuration mutation occurred.


## 16. Host shutdown-handler source evidence

Current main `manager/server.ts` at [exact blob](https://github.com/jiangxng/EVO-App-Platform/blob/d1c50cc2c4c52bd251146ce84dfc6acfeca45e53/manager/server.ts) registers one-time SIGTERM/SIGINT handlers. The shutdown function disposes the context-memory schedule driver, awaits scheduler stop, stops managed runtimes, closes optional Agent async workers/Owner and the PA05 lifecycle Host, shuts down the process runtime Host, closes the HTTP server, and schedules a 5-second fail-fast exit.

**Source fact:** a graceful shutdown routine exists. **Remaining gap:** production still uses `npm start`, and effective Railway draining time is not exposed by the current configuration response. The source code does not prove direct SIGTERM delivery or completion before SIGKILL. No production process was signalled or restarted.


## 17. 2026-10-20 — Shutdown error-path static finding

### Exact source read
- [`manager/server.ts` at blob `d1c50cc2c4c52bd251146ce84dfc6acfeca45e53`](https://github.com/jiangxng/EVO-App-Platform/blob/d1c50cc2c4c52bd251146ce84dfc6acfeca45e53/manager/server.ts), lines 10224–10259.

### Observation
The shutdown routine has local error handling around Context Memory scheduler stop and a grouped set of managed-runtime stops. Later operations are awaited sequentially without equivalent local catches: optional Agent async reader, optional Agent async read worker, optional PA-02 Object Extension Owner, PA05 write-lifecycle Host close, and process runtime Host shutdown. The call to `server.close()` and creation of the 5-second fail-fast timer occur only after those awaits.

### Assessment / limitation
A rejected close/shutdown promise can short-circuit subsequent cleanup and keep the routine from reaching HTTP server closure and its explicit fail-fast timer. This is a **static source-level risk**, not a reproduced runtime failure. The cooperative lock is released only on clean process exit; an abnormal path must retain the lock for independent Human review. This remains fail-closed but does not provide a per-resource stop receipt.

### Safe next engineering task
Before relying on the shutdown handler for any maintenance/stop attestation, add disposable exact-head tests that inject a rejection at every cleanup boundary and assert:
1. every remaining cleanup action is attempted;
2. HTTP admission is closed even if a resource cleanup fails;
3. shutdown exits nonzero on incomplete cleanup;
4. J4J lock release is not attempted on failed shutdown; and
5. a clean path releases only after all required cleanup completes.

Do not change production start commands, drain settings, production identity, DBA credentials, or material WRITE in this task. It is a bounded source/CI improvement, not a K1/K2 global stop proof. K0 remains NOT_SIGNED; external topology, effective drain interval and stop authority remain unresolved.


## 18. 2026-10-20 — Shutdown error-path engineering fix

### PR / exact evidence

- [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074), branch `agent/pa05-host-shutdown-error-path-20261020`, head `f38fd18bb007b0af1ae24b337f92cbe19377b5c7`.
- Status: Draft, unmerged, not deployed.
- Exact-head CI: **45/45 SUCCESS**, 0 failures, 0 cancelled. Relevant [Lightweight Host run #39377872162](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377872162) passed.
- Test step reported 200 tests / 200 pass / 0 fail, including:
  - new injected shutdown-cleanup failures at every declared boundary, multiple failures, and clean completion;
  - existing real separate Node Host J4J test: second cooperating Host denied, clean SIGTERM exit releases its exact lock, SIGKILL/nonzero exit retains ambiguous lock and blocks restart.
- No PostgreSQL18 28/28 claim is made for the new head; that earlier PG18 result belongs to its own exact historical HEAD. This run is process-level Host shutdown regression evidence, not a global stop or production identity proof.

### Bounded implementation

- HTTP admission starts closing at shutdown entry; requests on an existing keep-alive connection receive HTTP 503 with `Connection: close`.
- A referenced 5-second fail-fast timer starts before awaiting resource cleanup.
- Every declared cleanup step is attempted in order even if earlier steps reject; failures are named and recorded.
- Process exits nonzero if any cleanup step or HTTP server closure fails. Existing J4J exit hook therefore leaves the cooperative lock for independent review instead of certifying a failed shutdown.

### Remaining acceptance boundary

This improves the local Host shutdown contract, but does not prove Railway delivers SIGTERM directly through the configured `npm start` command, establish the actual per-service drain interval, prove organization-wide Worker/caller inventory, or certify production IdP/DBA stop authority. No production service action, config mutation, secret/database access or lock cleanup occurred. K0 remains NOT_SIGNED; production material WRITE remains OFF.


## 14. 2026-10-20 — Host shutdown error-path fix: exact-head rerun record

[PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074), branch `agent/pa05-host-shutdown-error-path-20261020`, now at `caccb1b60358b453ef471eaf6abecf1593e4965c`, remains Draft/unmerged/un deployed.

- Latest exact-head CI: **45/45 SUCCESS / 0 failure / 0 cancelled**, including [three-PG18 cross-database reservation run #39378563669](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563669) and Lightweight Host/J4J process test.
- The initial attempt of the cross-database job failed at `PA05_E01J2_TIMEOUT:readResult` after about 20.46 seconds against a 20-second IPC wait. Only that failed job was rerun; it passed. Retain both facts for auditability: transient timeout observed, retry succeeded.
- The fix covers all cleanup failures, request admission closure (503 / Connection: close for existing keep-alive requests), a fail-fast deadline started before cleanup, nonzero exit for incomplete shutdown, and preserving the cooperative lock on unsuccessful exit.
- The source/CI fix does not certify the actual Railway draining setting, direct Node SIGTERM delivery, the full Worker/caller inventory, the authoritative stop actor, production IdP/DBA, or production material WRITE. No production process was stopped/restarted/scaled/redeployed; no Validator, secret or database access occurred.

Status remains `K0 NOT_SIGNED`; full E01J4, PA05-05 E01–E05 and W06 remain NOT_SIGNED; production material WRITE remains OFF.


## 14. 2026-10-20 — Current PR #1074 exact-HEAD evidence

Current head `caccb1b60358b453ef471eaf6abecf1593e4965c`, base `main@eaa5e813b1e86a6460d988c76eb2076512c35127`: **45/45 applicable GitHub Actions SUCCESS**. [Lightweight Host run #39378563738](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563738) reports **201 tests / 201 pass / 0 fail**, including `pa05-host-shutdown-error-path.test.mjs` and `pa05-e01j4j-cooperative-host-pg.test.mjs`. This supersedes the earlier 200-test count recorded above; both are different exact runs.

The reviewed shutdown patch closes HTTP admission before asynchronous cleanup, adds a referenced five-second fail-fast deadline, attempts all cleanup steps despite individual rejection, and exits nonzero on cleanup or listener-close failure so J4J preserves its lock on ambiguous shutdown. It is source/CI improvement only: the configured Railway draining interval and signal delivery remain unverified, J4J remains OFF by default and absent from the current Host variable-name list, and no global Worker inventory/stop authority is signed. PR #1074 remains Draft/unmerged/un-deployed.


## 19. 2026-10-20 — New-window production/CI refresh and bounded process inventory

**Evidence class: ORIGINAL_CONNECTOR_READ_THIS_WINDOW / SOURCE_GROUNDED / K0 NOT_SIGNED.** The previous §15 snapshot is historical; this section records a later read-only observation and does not change any accepted safety gate.

### Accurate GitHub and Railway revision

- GitHub [main branch](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) now points to `102319de812ce65682f0c6ccb1a930e10b4e22d4`, advanced by unrelated [PR #1076](https://github.com/jiangxng/EVO-App-Platform/pull/1076). Its [exact-head check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/102319de812ce65682f0c6ccb1a930e10b4e22d4/check-runs) show **3/3 success** (Platform protocol-and-core, lightweight-host, continuity). These *are not* the full scheduled Ecosystem Certification suite.
- Railway connected project `aee4643e-912b-4ca1-ae95-fe4ec64f5601` / production environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`: Ledger Configurator newest deployment `dffc4413-07e5-4302-95ac-adcf737fbdfb`, **SUCCESS / Online**, exact deployed commit `102319de812ce65682f0c6ccb1a930e10b4e22d4`, one running and zero crashed replicas. Prior deployment `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9` is now `REMOVED`. These are deployment lifecycle facts, **not** per-Worker termination receipts.
- All five services remain present, no separately configured Cron service, no pending staged work, one configured Host and EVO Runtime replica each; Validator remains configured one-shot with **0 running**. Connected-project scope only. The present evidence does not assert full organizational topology, complete active child-process/PID inventory or fully enumerated GitHub-hosted/browser external callers.
- PR [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) at archived HEAD `bd5945c0bbd0d1c3b5522bc94a7e915c617d9fea`: **7/7 exact-HEAD check-runs SUCCESS**; PR [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) at `caccb1b60358b453ef471eaf6abecf1593e4965c`: **45/45 SUCCESS**, 201/201 Lightweight Host tests as previously recorded. Both remain separate **Draft / unmerged**; any checks on the *new* documentation commit must be re-read at its own SHA.
- Outstanding main negative evidence remains [scheduled Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) on `eaa5e813...`: **1815 total / 1723 pass / 10 fail / 82 skipped**. No newer full-suite run was found among the latest 30 main workflow runs in this read. The later 3/3 main push does not prove these failures were fixed. Independent open issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988), [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) and [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) were directly rechecked: all **OPEN**.

### Draining, executable entrypoint and process-stop chain

- **Actual Railway config read** via `describe_service`: Ledger Configurator and EVO Runtime both have live `deploy.startCommand = npm start`, one SFO replica each. There is no `drainingSeconds`/equivalent effective override in the exposed service config, no staged change, and neither visible variable-name list contains `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`; the Railway Settings-pane effective teardown value remains **NOT_VERIFIED**, not proven zero.
- **New precise source read:** Platform [`package.json` at current main](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/package.json) maps `npm start` to `node dist/manager/server.js`. This proves the script ultimately starts Node, **but not** that it is the container's PID 1 or directly receives Railway SIGTERM through the npm wrapper.
- Current main [`manager/server.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/server.ts) registers SIGTERM/SIGINT handlers and calls `processRuntimeHost.shutdown()` before HTTP listener close. Current main `plugin-runtime-host.ts` uses `fork()` for optional PROCESS children and a 750 ms SIGKILL fallback. Neither source establishes an externally verified termination receipt for each child when the parent is killed; live child PID/process-start nonce and current package inventory remain unknown.
- Railway official [Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) and [NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) were **opened as original Markdown again** on 2026-10-20. Official facts: SIGTERM then configurable drain before SIGKILL; npm/yarn/pnpm wrapper may intercept signals, and direct Node startup is recommended. Prior [variables-reference default 0 seconds](https://docs.railway.com/variables/reference#user-provided-configuration-variables) remains an **inherited previously read original**, not a current effective-setting observation. Do not change the production start command or drain time without explicit production change approval and an isolated signal test.

### Consequence / bounded next gate

Require organization attestation of (1) all account/cloud/Runner/queue/manual callers and protected entrypoints, (2) every live Host and plugin child identity and responsible external supervisor, (3) exact effective per-service drain/overlap and direct SIGTERM PID delivery, (4) restart/scale freeze ownership, and (5) independently reconciled PG sessions and Human IdP/DBA/credential/audit owners. Until those exist, `STOP_CONFIRMED` must be refused; K0, complete E01J4, PA05-05 E01–E05 and W06 remain **NOT_SIGNED**; production material WRITE remains **OFF**. No service, secret, database, deployment, Validator or stale lock was touched in this inspection.
