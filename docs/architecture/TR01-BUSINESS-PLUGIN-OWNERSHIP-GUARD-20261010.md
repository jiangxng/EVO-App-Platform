# TR-01 Business / Plugin / EVO ownership guard (2026-10-10)

**State:** Small nonfunctional engineering increment; independently reviewable PR; keep TR-01B2D3 production acceptance OPEN.  
**Parent authorities:** [Extension Boundary Constitution](EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md), [EVO Ecosystem Project Boundaries](EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md), [Foundation Object Architecture](FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md), and [TR-01 Trading Reference Loop](../roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md).

## User-confirmed long-term rule

> Business is owned by installable Application plugins; App Platform Core only hosts, authorizes, resolves, composes and governs reusable cross-plugin mechanisms; EVO owns the deterministic BusinessData → Posting / Ledger / Balance / replay runtime, while higher-order Cost / Valuation / Allocation is owned by its properly admitted owner plugin, **not silently absorbed into EVO minimal Core**.

| Concern | Owner | Non-ownership |
| --- | --- | --- |
| Counterparty, Item, Warehouse/Location identities and applicable enterprise extension semantics | Their independent object/application plugins; extension definitions and values in Object Extension over Enterprise Context | Trading Reference does not copy master-data authority |
| Supplier→Purchase→Receipt and Customer→Sales→Production→Shipment→Cash process meaning | Opt-in Trading Reference **APPLICATION** plugin for the current bounded reference; future full purchasing, sales, inventory, production business modules should be independent app owners using shared capabilities | Generic Host Core is not an ERP domain implementation |
| Identity/session, enterprise trust, feature lifecycle, authorization, public capability binding and Action Host | App Platform Host Core or replaceable Provider plugin as classified by the existing Constitution | Does not directly own transaction, cost or balance truth |
| Immutable posting facts, inventory/payable/receivable/cash balances, Work/Position and deterministic replay | EVO runtime through public versioned BusinessData/Read contracts | Host and Eidos must not maintain independent mutable shadow ledgers |
| Cost/Valuation/Allocation calculation and privileged lifecycle | Independently authorized EVO-side plugin owner over EVO deterministic public mechanisms; compatible internal implementations do not by themselves certify a production plugin | Neither Host preflight nor a /demo route is financial write admission |
| Field review and Human experience | Owning business plugin contributes Eidos Experience; optional Workbench/Personal Agent share governed operations | UI/Agent cannot reinterpret or self-authorize accounting facts |

### Executable bounded enforcement

`architecture.boundary-policy.json.businessPluginOwnership.tr01` registers the actual paths/owners for this reference phase.

`tools/tr01-business-plugin-ownership-guard.mjs` checks:

1. Counterparty, Item, Warehouse and Trading Reference remain install-scoped **APPLICATION** package manifests.
2. Trading Reference Human Experience is a plugin contribution, and the exposed B2D3 reference operation remains READ-only.
3. Purchase and Sales fact composition stays in the owned app files, using `contracts/evo-business-data.ts` and `EvoBusinessDataAdapterV010.submit`, with explicit known immutable fact identities.
4. The scoped Application fact composers and Host finance preflight do not directly import database drivers / Host manager internals / private EVO cost-allocation-valuation modules or issue direct ledger/financial-table mutations using the covered patterns.
5. B2D3 Host preflight remains owner-gated and `executionAllowed:false`.

The guard is invoked by the **existing** `tools/architecture-boundary-validate.mjs` path, already part of `npm run test:platform`; `tests/protocol/tr01-business-plugin-ownership-guard.test.mjs` supplies positive/negative controls to prove the guard actually fails on unsafe source/policy changes.

### Scope, proof limits and upgrade rule

- This is a **TR-01 focused static architecture tripwire**, not a complete whole-repository dependency analyzer, not a runtime sandbox, not an EVO source-code validation and not a real credential/production deployment check. An undiscovered unsafe pattern could escape static matching; ordinary security review and B2D3 PostgreSQL/HTTP negative-control CI remain required.
- Existing `apps/trading-reference` is a bounded reference Application, not a decree that all future procurement/sales/warehouse/financial semantics must live inside one monolith. A mature app may split ownership into separately installable apps with public shared contracts and documented migration.
- Current `apps/trading-reference/package.ts` is intentionally READ-only. When future B2D4 **owner-authorized** financial mutation is explicitly admitted, revise the policy, tests and guard in an owner-reviewed PR that demonstrates actual execution-time authorization, idempotency, audit, replay and plugin installation; do not weaken this gate ahead of certification.
- A successful Platform CI is **evidence that this scoped guard passed**, not proof that live production Host→EVO TLS/OIDC/secrets/DB-role controls passed. The B2D3 trusted delegation Drafts [App Platform #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) and [EVO #108](https://github.com/jiangxng/EVO/pull/108) remain independently gated.
- `project.status.json` and generated `docs/roadmap/HANDOFF-LATEST.md` must remain unchanged unless a new live acceptance gate actually closes. Never backfill a B2D3 production PASS from this architecture-only change.

## Next bounded implementation gate

Continue B2D3 *on its existing dedicated Draft PRs* with real tenant/identity proof, TLS and production security deployment prerequisites, separated operator credentials, cross-process revocation/clock/nonce and no write. No new parallel ledger in App Platform, no accidental official completion of B2D4/B2E, and no conflicting edits to Agent or 2D Designer branches.
