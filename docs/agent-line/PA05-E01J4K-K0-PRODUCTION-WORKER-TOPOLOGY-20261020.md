# PA05 / E01J4K K0 — Production Worker Topology & Stop-Authority Inventory

**Observed:** 2026-10-20  
**Classification:** CURRENT_GATE_EVIDENCE / SOURCE-GROUNDED-INVENTORY  
**Status:** `PLATFORM_TOPOLOGY_PARTIALLY_OBSERVED / COMPLETE_WORKER_INVENTORY_NOT_SIGNED / PRODUCTION_AUTHORITY_DECISIONS_REQUIRED`  
**Parent decision:** [E01J4K trusted multi-Worker stop and credential governance](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)  
**Scope:** PA05-05 `evo-purchase-attention` READ Owner admission/lifecycle and any process that can change its protected authority. This is not a claim that the target plugin is currently enabled in production.

## 1. Exact source snapshot and production deployment

- Current `main` observed: `71d63ce6716c19d68e34e77dcd2fe0c185027e35`, merged [PR #1062](https://github.com/jiangxng/EVO-App-Platform/pull/1062).
- The final PR #1062 head passed its applicable checks before merge. On the merged main SHA, GitHub currently exposes two successful `continuity` runs ([#39365243787](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39365243787), [#39364722123](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39364722123)), one later `continuity` run marked CANCELLED ([#39365923782](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39365923782), cause not asserted), and `lightweight-host` SUCCESS ([#39364722179](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39364722179)). These are distinct check-run records on the same SHA; do not convert the cancelled record to PASS or invent its cause.
- Railway Ledger Configurator deployment `ed44128a-c5ef-419b-a0e8-3af71acfd5c3` reports `SUCCESS` for the exact same `main` SHA. Current environment status: Online, 1 running / 0 crashed / 1 configured replica, 0 warnings, 0 criticals, no pending work.
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
