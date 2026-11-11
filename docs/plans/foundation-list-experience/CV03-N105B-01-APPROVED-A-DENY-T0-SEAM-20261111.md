# CV-03 N1-05b-01 — User-selected A / deny-only PostgreSQL T0 integration seam

> 2026-11-11. Based on verified `main@74c25b5958086b99d0c2dafa45127358cf248c28` and an explicit project-user reply **“同意方案 A”**. This is a chosen **architecture direction** (D), not a DBA/Security/PA05 production authorization (P) or N1 certification. See [existing N1 owner gate](CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md), [full production acceptance matrix](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md) and [tracked Owner obligations](https://github.com/jiangxng/EVO-App-Platform/issues/1212).

## Decision and module boundary

- **Chosen A**: one PostgreSQL T0 commit for authoritative PA05 Saved View scope/epoch/generation **and immutable outbox**. Preserve existing `manager/service.ts`, `AuthorizationProviderV010`, Eidos/Platform Domain Owner command and list/page APIs. The alternative B cross-store eventual protocol is not selected.
- Existing `manager/store.ts` remains local file/memory and existing `manager/server.ts` installs file/memory Enterprise Resources and static policy. **Neither source now shares the necessary DB transaction**. We must not replace all enterprise resources as a side effect.
- **New first scoped engineering component**: `manager/cv03-n105b-authority-t0-pg.ts` is an **unmounted, deny-only PG client** for one DBA-owned `cv03_n105b_commit_deny_t0` stored function. It is additive inside the existing Manager boundary, cannot GRANT, cannot create tables or roles and is not imported by the production Host. Its Node test checks strict Host/enterprise/actor/epoch/outbox binding and failure on outage, undefined function, ambiguous receipt or stale epoch.
- It is intentionally **not** a standalone authority framework, not PA05 `disable` or `uninstall` activation, not an AuthorizationProvider, not the real committed T0 SQL implementation and not a successful end-to-end write. It supplies the narrow caller contract to be confirmed by the actual DB Owner.

## Proposed DBA-owned function contract (D; NOT installed)

`"<approved-schema>".cv03_n105b_commit_deny_t0(host_id text, operation_key text, context_id text, enterprise_id text, principal_subject_id text, actor_type text, source_generation text, expected_epoch bigint, deny_reason text, operation_id text)`

Expected **single row**: `authenticated_host_id,operation_key,context_id,enterprise_id,principal_subject_id,actor_type,operation_id,source_generation,authority_epoch,enabled,outbox_event_id,replayed`.

Contract for a future independent DB Owner review:
1. PostgreSQL `SESSION_USER` must map to one authentic installed Host Producer with explicit SQL LOGIN/EXECUTE-only privileges and no direct authority/outbox or Resource/Receipt DML; Host ID input is merely a claimed identifier and not proof.
2. In **one locked ACID transaction**, authorize the supplied scope against trusted, persistent `AuthorizationProvider` and PA05 Feature/lifecycle sources (not a caller-supplied JSON claim); fence the expected generation and epoch; perform DENY/tombstone and append immutable outbox with a durable unique operation key. Missing identity, gap, drift or DB failure must DENY and roll back both.
3. Repeat of the *same* operation key + same input returns the same prior commit receipt; modified key/scope conflicts are DENY. An ACK lost after T0 must remain replayable, with no new epoch. The example client validates echo/epoch but **cannot verify the atomicity or privilege isolation of a nonexistent/unprovisioned DB function**.
4. The DB Owner must independently approve the primary/schema, source-of-truth migration, default-deny READ, role GRANT/REVOKE, unsigned DML denial, double-Producer fencing, operator-run rollback and recovery SLO. Do not copy isolated `cv03_n104f_test_*` tables, CI keys or self-provision production resources.

## Exact validation and status

- CI job: `npm ci`, `npm run build`, `node --test tests/agent-line/cv03-n105b-authority-t0-contract.test.mjs` (no PG18 fixture, no credentials).
- Coverage: fixed trusted function call, no Host direct DML/DDL, scope/ActorType binding, bad/absent/stale DB receipt, replay idempotence shape, unavailable SQL and unchanged **SAVE OFF + command 403**.
- This is **N1-05b-01 developer implementation preparation only**. Real N1-05b DB transaction + actual PA05/AuthorizationProvider integration, forced kill and replay, genuine PostgreSQL LOGIN/roles, Human/Agent UI and production deployment still **OPEN**.
- The concurrency PR #1184 controls three older files: no modifications. SAVE POST 403, unregistered Page GET 404, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, `N1=NOT_CERTIFIED` preserved.

## Next implementation after legitimate DB/Security signoff

Have PA05/Authorization/DB/Security Owners approve the exact source-of-truth and `SESSION_USER`-authenticated function schema, grant/revoke strategy, immutable outbox and rollback. Then implement the DBA-owned function/migration in the approved environment, wire a **Host-only** revocation-before-ACK path to existing PA05 Manager/Provider, and run real two-Host/Pg18 fault injection on production-compatible roles. **Never treat a green contract unit test or the user's A selection as this evidence.**


## N1-05b-02 — full-scope deny-first PA05 Host operation (2026-11-11)

**G (actual source):** `manager/service.ts` uses synchronous local `LifecycleStore.deleteActiveFeature()` before the in-process lifecycle callback; the file store and the detached single-actor T0 client in N1-05b-01 cannot certify multi-actor/multi-enterprise revocation. `manager/agent-plugin-write-host-lifecycle.ts` and `manager/pa05-read-owner-host-lifecycle.ts` contain existing revoke-first Host composition patterns; the CV03 operator reuses their trust ordering without replacing them.

**D (implementation, UNMOUNTED):**
- Extend `manager/cv03-n105b-authority-t0-pg.ts` with `fencePackage()` issuing exactly **one** call to a *proposed*, DBA-owned `cv03_n105b_fence_package_t0` function, fixed to `host-enterprise-context-provider.personal-saved-views`. Never call `commitDeny()` in a loop to revoke a package. A successful DB function must lock/atomically revoke **all current scopes**, persist a package-level DENY tombstone blocking future scopes and append immutable batch outbox atomically. It must authenticate `SESSION_USER`, validate all generations, reject stale/missing authority and enforce operation-key idempotence. The current code **does not install or prove** this function.
- Add `manager/cv03-n105b-pa05-host-lifecycle.ts` as an opt-in **Host-only** adapter for the existing `AppManagerService.planDisable/disable` and `planUninstall/uninstall`. The trusted Host must supply an independently current operator AuthorizationProvider decision and Owner generation; no request parameter is authorized to choose them. The adapter refuses missing/disabled Saved View Feature on new calls, denied operator, an ambiguous/unavailable or incomplete scope-fence acknowledgement, and concurrent local operations **before** calling the real Manager mutation.
- After a confirmed all-scope database DENY it calls the real Manager. If local file mutation fails or crashes, PostgreSQL must remain **FROZEN**, not revert; `recover()` replays the exact idempotency key with the DB Owner and resumes only after a new authoritative proof. The onLifecycleEvent callback is not a durable transport.
- Reuse the existing N1-05b workflow; build the TypeScript and execute scoped tests against **the actual Manager and Host Static AuthorizationProvider** with an injected database executor. Verify ordering, no mutation on SQL failure, partial-reply refusal, crash+replay and Human SAVE refusal. This does **not** simulate physical DB functions to claim proof of atomicity.
- The experimental N1-05b Host composition **is not imported or mounted by manager/server.ts**. It cannot be used to admit Saved View Feature in the existing production startup because that route is still hard blocked.

**P (missing, must not fabricate):** actual production PA05/AuthorizationProvider canonical persistent state, complete authorized scope inventory including offline accounts/enterprises, DBA-reviewed SQL function and LOGIN/EXECUTE/REVOKE grants, Producer identity/KMS, signed source generation, independent SQL READ/WRITE role denial, dual-Host replay, SLO and rollback. A false `FROZEN_ALL_SCOPES` test row cannot meet these conditions. All N1-05b physical acceptance, N1-05c–f and release OFF/403/404 gates remain OPEN. PR #1184 documents remain untouched.
