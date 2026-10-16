# PA05-05/E01I — fail-closed startup for persisted uncertified READ plugin Owner

**Date:** 2026-10-16 · **Class:** SECURITY_DECISION / engineering candidate, NOT multi-Worker or real Human/Provider signoff. Issues #988, #979 and #913 remain OPEN, PA-05/W06 IN_PROGRESS / NOT_SIGNED, production WRITE OFF.

## Existing primary code and CI evidence (direct GitHub inspection)

- Previous [E01H PR #994](https://github.com/jiangxng/EVO-App-Platform/pull/994) MERGED at `main@aa5bf6312e2a82cdba20e8a2b981021fdf25ad76`; final precise PR HEAD 44/44 CI SUCCESS, in-Host asynchronous policy/plan drift 6/6 PASS/0 skipped, prior disposable HTTP and three actual PostgreSQL18 security clusters 12/12. [E01H source-grade decision](PA05-E01H-AUTHORIZATION-RACE-20261016.md) explicitly **does not** fence after-return mutations or another Host Worker.
- [`manager/store.ts`](../../manager/store.ts): normal lifecycle persistence is either in-memory `createMemoryLifecycleStore()` or local file `createFileLifecycleStore(APP_PLATFORM_STATE_FILE)`. The file store reconstructs `installedPackages` and `activeFeatures` from a JSON file at process startup. It is **not** a shared PostgreSQL row lock, Worker-inventory, session-epoch table or transaction.
- [`manager/server.ts`](../../manager/server.ts) uses the LifecycleStore before AppManager and startup default installations; [E01D admin admission](PA05-E01D-ADMIN-HOST-READ-ADMISSION-20261016.md) dynamically makes Purchase Attention manifest/Action Handler available only after live configured bootstrap-operator + authorization Provider policy. This runtime on-demand Handler/certification authority **is not preserved by the local JSON LifecycleStore**.
- Existing PA05-04 WRITE Owner uses PostgreSQL row locks, Worker schemas, explicit identities and durable fencing; that is a separately scoped **WRITE Owner** and is not evidence of READ plugin production atomic authority. Reusing its presence to declare Purchase Attention cross-Worker safe would be incorrect.

## Concrete risk and bounded decision

A persisted `evo-purchase-attention` installed or active state might survive a process restart, while the actual dynamic E01D registration, current operator authorization decision and real business data identity do not. Startup could otherwise treat restored state as already certified or accept inconsistent state from an earlier process. This is a code-path safety assessment, **not a demonstrated real production exploit**.

**Smallest reversible security closure:** at `manager/server.ts` startup, immediately after creating the existing lifecycle store and before Manager, default installers or HTTP listening, inspect the persisted lifecycle snapshot. If `APP_PLATFORM_STATE_FILE` is configured and any `installedPackages.packageId` or `activeFeatures.packageId` is `evo-purchase-attention` (or the expected `evo-purchase-attention.default` Feature ID is active), reject startup with `PA05_E01I_RESTORED_READ_OWNER_RECERTIFICATION_REQUIRED`. Do not attempt automatic Handler import, automatic installed/active restoration, revocation bypass, silent reset/deletion or file mutation. **Even disabled but installed must not silently resume** without an explicit owner-controlled migration/recertification path. Processes with clean state or unrelated persisted plugins retain the original startup behavior.

This default fail-closed guard does not add startup business modules. It affects only the never-production-certified opted-in READ package. The owner must review the persisted state and use a separately approved future reset/recertification workflow; manually modifying the lifecycle file is not asserted as safe remediation.

**Rejected alternatives:** on restart automatically load optional first-party business code from a stored package ID, assume JSON installed == current operator grant, use an absent bootstrap bearer as a production Human consent, wipe installed owner records to make tests pass, force generic file store into fictitious multi-Worker atomic DB, or weaken the existing SQLite/PG18/Lightweight Host/WRITE gates. Note: no new PostgreSQL lifecycle transaction is claimed by this slice.

## Concrete acceptance and evidence levels

[`pa05-e01i-startup-restoration.test.mjs`](../../tests/agent-line/pa05-e01i-startup-restoration.test.mjs) builds actual LifecycleStore and AppManager persisted fixtures with **genuine first-party Trading Reference and Purchase Attention manifests**, then starts a real disposable `dist/manager/server.js` OS process with explicit temp HOME and `APP_PLATFORM_STATE_FILE`, no inherited Railway/network/cloud credentials. Real outcomes to assert:

1. Persisted **ACTIVE** installed Purchase Attention → Host exits before serving with exact error and state file bytes unchanged.
2. Persisted **INSTALLED_DISABLED** Purchase Attention → same fail-closed behavior.
3. Orphan `activeFeatures` Purchase Attention without installed package → reject startup before any restoration.
4. Persisted unrelated Trading Reference package → real Host boots and responds to HTTP `GET /v1/catalog`; no default Purchase Attention catalog exposure.

Focused PA05 READ CI requires `PA05_E01I_RESTART_QUARANTINE`, four tests PASS/zero skipped, and explicit `durableMultiWorkerAuthorityCertified:false`, `productionWriteEnabled:false` markers, while retaining previous E01A–H, real Host HTTP, governed WRITE, PostgreSQL18, Platform Core, Lightweight Host and identity CI on **the accurate final PR HEAD**.

## Remaining W06 / security blockers

This guards only **read of locally persisted state at process startup**. It is not a global Worker/DB transaction; Workers with separate files or local state are not automatically reconciled. Revocation after the final synchronous check and before AppManager mutation, ABA/plan changes, cross-Worker owner state, durable policy epochs, startup attestation by a real operator, actual Human/Personal Agent session, real Enterprise→EVO data, Provider/model and browser signoff all remain unverified. These require owner-approved shared durable READ plugin authority (not a copy of the WRITE schema), and actual separate-process PostgreSQL/policy tests before E01 live can be signed. This slice must not create production keys, real admin installs, a new deployment or global continuity edits.

**At authoring:** engineering candidate only; final PR HEAD CI, merger and branch retirement pending.
