# PA05-05/E01A — real Host plugin readiness audit, not Human/Provider signoff

**2026-10-16 · DECISION_RECORD / engineering candidate**. PA-05 `IN_PROGRESS / NOT_SIGNED`, #979 and #913 OPEN, production WRITE OFF. This record describes a *non-production certification preflight*, not installation in Railway or actual company data.

## Original-source inspection (direct repository files, this session)

- [Actual default Host catalog](../../manager/server.ts) includes `tradingReferencePackageV010` but not `purchaseAttentionPackageV010`; the Host does not register `createPurchaseAttentionActionHandlerV010`. This is a **source-level observation at the working main commit**, not a claim about persisted production installations, deployed SHA, or private live plugin choices. [Catalog seed](../../catalog/seed.ts) exports Trading Reference and existing ledger read but not Purchase Attention.
- [Independent Purchase Attention package](../../apps/purchase-attention/package.ts) publishes a real versioned `purchase.attention.read` READ operation exposed to Human/Personal Agent; [business Owner](../../apps/purchase-attention/operation.ts) composes the actual Trading Reference Action Host under per-operation Host/Owner permissions. [Owner guidance](../../apps/purchase-attention/README.md) explicitly excludes default production registration, real datasets and Human browser.
- [PA05-03 test](../../tests/agent-line/pa05-independent-purchase-attention.test.mjs) already proves deterministic real package manifest, AppManager dependency, dynamically discovered Agent capability and Human-vs-AI parity using fixture EVO rows and test policy. It **does not prove** actual authenticated users, a true production Handler registry, an ERP/EVO dataset or Provider/model response. Do not redo that proof as though it is new.
- [Actual Host Action router](../../actions/router.ts) is a closed construction-time Handler map; a Capability Operation's manifest presence alone does not register its Action handler. The optional E01A inspector accepts an *explicit real Host composition inventory*, not a model-provided list, but this inventory has no independent physical attestation. [Certification baseline §5](PA05-CERTIFICATION-BASELINE-20261015.md), [Blueprint §21.1–21.3](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md), [PA05-05 Issue #979](https://github.com/jiangxng/EVO-App-Platform/issues/979).

These are **direct repository original files**, not new external-web research or evidence of the currently deployed Railway environment. Prior D14C13 PG18 certificate proof is a different, separate Owner; its **12/12** is not inherited E01 Human/Provider acceptance.

## Decision

Introduce a **read-only, opt-in, certification-only composition preflight** in [`certification/pa05-e01-host-readiness.mjs`](../../certification/pa05-e01-host-readiness.mjs), with dedicated [tests](../../tests/agent-line/pa05-e01-host-readiness.test.mjs) and the existing PA05 READ CI.

For actual manager snapshot, inspect independent target and source operations: unique active owner/package, exact READ + Human/Agent exposure + ACTION_HOST binding/version; source/target handlers must both exist under their **exact respective package and Feature**, with a callable execute method; zero handler and duplicate/forged-owner cases must report precise blockers. Remove either active operation and the preflight must downgrade. A static source audit confirms that the production Host code currently has no Purchase Attention wiring. A deliberately isolated composition of *real Owner handler factories* may pass the **composition** portion but must always return `e01ProductionCertified:false`, `pa05Signed:false`, and `productionWriteEnabled:false`, even with both handlers present. The inspector does not install/register/execute/write; no live tenant, real Browser or Provider ID may be fabricated.

**Rejected alternatives:** adding Purchase Attention to `manager/server.ts` or `catalog/seed.ts` without explicit owner/Human approval; assuming `manager.install` alone binds a real business owner; treating the old fake EVO reader, in-memory authorization provider or fabricated Agent principal as live; signing E01 from a Host-supplied list of handlers; building a second routing registry or rewriting Agent Core. This slice is a **readiness inventory**, not an extra plugin abstraction or a release migration.

## Target acceptance and evidence ceiling

The new `PA05_E01_HOST_COMPOSITION_PREFLIGHT` marker must contain source-observed `defaultHostHandlerRegistered:false`, in-test `isolatedHostCompositionReady:true`, and permanent `e01ProductionCertified:false`, `productionWriteEnabled:false`. Tests must deny non-installed catalog, missing source handler, wrong handler Owner, duplicate commands and disabled package. Require exact HEAD CI with zero skips. This marker does not replace a real identity session, complete data/Host bridge, current authorization or Human acceptance.

**Mandatory pending real gates** (Issue #979): approved installation; attested live Host registration and effective package/Feature version; actual enterprise data binding and authorized source result; distinct valid Human/Agent identities and revoked consent; real Provider/model environment; browser and Human signoff. Also Issue #913 original Owner/lifecycle/global partition and CA/PKI production governance remain NOT_SIGNED. No production deployment or WRITE enablement.

## Narrow implementation files

- `certification/pa05-e01-host-readiness.mjs` — pure candidate read-only preflight.
- `tests/agent-line/pa05-e01-host-readiness.test.mjs` — negative real-manifest and Handler-composition cases.
- `.github/workflows/agent-pa05-cross-business-read.yml` — focused CI marker/zero-skip guard.
- This record, PA05 certification baseline and Agent HANDOFF as the durable window handoff.

Until the final accurate PR HEAD is CI green and merged, **no PASS asserted**. Even after merge, **E01 NOT_SIGNED** without actual owner and Human/Provider data.
