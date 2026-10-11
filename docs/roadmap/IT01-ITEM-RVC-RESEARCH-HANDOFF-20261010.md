# IT-01 / Item Real-World RVC Research Handoff — Short Entry

**Date:** 2026-10-10  
**Repository:** https://github.com/jiangxng/EVO-App-Platform  
**This handoff branch:** `docs/it01-research-handoff-20261010`  
**Branch base:** `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`  
**Detailed reference index:** `docs/research/IT01-ITEM-RVC-REFERENCE-INDEX-20261010.md`

> This file preserves the research and decisions produced in the long ChatGPT window
> that carried IT-01 through real-world Item RVC. It is **not** the authoritative
> milestone tracker. A fresh session must still start from `AI-BOOTSTRAP.md`,
> `project.status.json`, and `docs/roadmap/HANDOFF-LATEST.md`.
>
> Repository state wins over this dated handoff when they differ.

## 1. Why this handoff exists

The user explicitly made this window the mainline coordination window after parallel
chat windows repeatedly advanced the same repository. The practical lesson from this
window is that chat state must never be treated as project state.

Two concrete multi-window collisions occurred:

- a continuity transition had to be rebuilt after another window advanced `main`;
- PR #536 was closed as superseded when PR #535 had already merged the same
  IT-01E qualifier-import state transition.

The rule for the next window is therefore:

```text
before every material branch / PR / merge decision:
read current main
+ project.status.json
+ HANDOFF-LATEST
+ open/recent PRs
+ current production evidence when relevant
```

If another window has already completed the same transition, close the duplicate work
instead of competing with it.

## 2. Current repository reality at handoff time

This long window originally focused on IT-01, but other windows continued the
repository after IT-01 closed.

At handoff time:

- current `main`: `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`;
- PR #551 is merged: **TR-01A1 purchase reference loop**;
- PR #551 head `1de23c70e26c1c45653115ac6abc805d4f70f681` has:
  - Project Continuity CI PASS;
  - Platform CI PASS;
  - Cross Project CI - Trading Lite EVO PostgreSQL PASS;
- Railway production deployment for current main:
  `b1d141c6-858d-4ee3-8422-0efbe7147396` — SUCCESS.

However, continuity documentation is slightly behind the actual code/production state:

- `project.status.json` still describes TR-01A as the open gate and its
  `productionPreview` still points to the earlier WH-01D deployment;
- `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md` still labels
  TR-01A1 as CI-pending even though #551 has merged, CI has passed and Railway is
  successful;
- TR-01A2 Purchase Receipt correction/reversal is explicitly
  **REQUIRED / NOT YET IMPLEMENTED** in App Platform.

### Immediate next task

Do **not** restart Item/WH work.

The next mainline task should be:

1. record PR #551 / TR-01A1 as merged + CI + production PASS in authoritative
   continuity state;
2. regenerate `HANDOFF-LATEST.md`;
3. then implement **TR-01A2 Purchase Receipt correction/reversal** as a new immutable
   business occurrence;
4. do not start TR-01B sales loop until TR-01A2 closes.

EVO already has pinned reversal/replay certification evidence referenced by the TR-01
document, but App Platform still needs its own purchase-receipt reversal composition
slice.

## 3. What this window completed and decided

IT-01 is fully closed in the repository. The durable authority is:

- `docs/roadmap/IT01-ITEM-SECOND-OBJECT-EVIDENCE-v0.1.md`
- `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`
- PR #538
- merge commit `139ad94c13909a1f47c73d081742a5a6a870eef5`
- Railway deployment `ca33d2da-7de7-483a-b584-1d71d38f84d1` — SUCCESS
- PR #539 formally closed IT-01 and activated WH-01.

The accepted Item identity remains deliberately small:

```text
itemId
code
displayName
itemKind = GOODS | SERVICE
baseUomCode
description?
```

Confirmed semantic boundaries:

- enterprise Item identity is owned by the enterprise;
- Open Food Facts code / barcode / GTIN evidence is **not** the enterprise Item ID;
- GTIN belongs in an external/trade identifier layer (`scheme + value + provenance`)
  unless later trading requirements justify promotion to a reusable related resource;
- Product / SKU / variant are not universal Item core fields and must be introduced
  only when enterprise business semantics prove their relationships;
- category is classification/taxonomy, potentially many-to-many, not Item identity;
- brand is commercial/descriptive evidence, not Item identity;
- package quantity is not the enterprise operational base UOM;
- `baseUomCode` should converge on a governed code reference compatible with
  UN/CEFACT Recommendation 20.

## 4. Generic platform decisions proven by Item

The materially different Item object exposed and resolved several first-object leaks.

Accepted generic decisions:

- Foundation Object applicability uses object-neutral qualifier dimensions.
  Counterparty `relationshipRoles` remains compatibility semantics, not the universal
  applicability model.
- Data Import shared target parameters are object-neutral; Counterparty-specific
  relationship role parameters are interpreted by the Counterparty target only.
- Data Import target discovery is lifecycle-aware and install/use-driven. Do not
  statically register optional Item implementations in Host.
- schema compilation supports generic `DISCOVERY` and `EFFECTIVE` modes for
  row-dynamic qualifier imports.
- Item ACTIVE / ARCHIVED lifecycle is owned by Enterprise Resource; the Item payload
  does not duplicate lifecycle state.
- archived Item identity cannot be silently reactivated by ordinary save, and an
  archived code cannot be silently reused by another Item identity.
- projections remain derived read models; Responsibility is a business assignment,
  not authorization.
- Human Eidos and Agent/Automation reads use the same governed projection authority.

## 5. Open Food Facts RVC result that must not be lost

The final real-data run used:

- dataset: `openfoodfacts/product-database`;
- resolved snapshot:
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`;
- sample SHA-256:
  `6b8793b66bed44de09f158605e5ca6f7e9c040294d1ad3814c64082244a30218`;
- 20,000 rows with non-empty external code;
- 1,000 unique usable rows exercised through generic Item Data Import.

Observed raw evidence included:

- 20,000 distinct source codes;
- 19,984 valid GTIN check-digit candidates;
- 16 invalid GTIN check-digit candidates;
- 5,291 duplicate display-name candidates;
- 6,897 missing package quantity values;
- 346 missing brand values;
- 1,087 missing category values;
- 13,003 quantity rows with a parsed unit token;
- 12,450 rows mapped by the bounded Rec20 evidence mapping.

The 1,000-row EVO pressure path completed:

```text
OFF evidence
→ explicit RVC adapter
→ generic Data Import
→ dry-run
→ schema digest
→ atomic batch commit
→ Item Enterprise Resource
→ Enterprise Extension trade-profile evidence
→ receipt
```

1,000 / 1,000 rows committed successfully.

A real performance defect was found and fixed instead of reducing the sample:

- before Item batch persistence:
  about 32.5 s / 31 rows per second;
- after `ItemRepositoryV010.saveMany`:
  about 6.6 s / 151–152 rows per second;
- improvement: about 4.9x;
- archive/code-reservation and atomicity invariants remained intact.

Do not treat this in-memory RVC throughput as a production database SLO.

## 6. Foundation Object maturity decision

IT-01 did **not** declare every Foundation Object contract STABLE.

The accepted status is **STABLE_CANDIDATE** for object-neutral mechanisms proven by
Counterparty + Item, later also reused unchanged by Warehouse/Location:

- descriptor / object-slot ownership;
- core/effective schema separation;
- object-neutral applicability qualifiers;
- DISCOVERY/EFFECTIVE compilation;
- Object Extension definition/value boundaries;
- generic Data Import contract and stage/dry-run/schema-digest/atomic-commit/receipt;
- Enterprise Resource persistence boundary;
- Projection + Responsibility + Authorization separation pattern.

Still domain-owned / experimental:

- Counterparty relationship-role compatibility keys as universal semantics;
- Item/Product/SKU/variant/trade-identifier semantics;
- Item UOM/catalog/classification domain model;
- source-specific RVC adapters;
- object-specific Responsibility codes.

Repository `project.status.json` currently keeps selected contracts at
STABLE_CANDIDATE through TR-01 and says promotion to STABLE requires the real trading
loops not to expose incompatible cross-object or BusinessData/Ledger requirements.

## 7. Important do-not-repeat rules

- Do not reopen IT-01A through IT-01E.
- Do not make GTIN/OFF code the universal Item primary key.
- Do not copy package quantity into `baseUomCode`.
- Do not add Product/SKU/variant/category to Item core merely because an external
  product dataset contains those concepts.
- Do not create Item-only Data Import infrastructure.
- Do not statically expose inactive plugin import targets.
- Do not reintroduce Counterparty vocabulary into shared Foundation Object contracts.
- Do not make Warehouse own inventory quantity.
- Do not start TR-01B before the required TR-01A2 reversal/correction slice closes.
- Do not edit `HANDOFF-LATEST.md` independently; update structured continuity state
  and regenerate it.

## 8. Parallel work / conflict boundary

At the time this handoff was created, separate 2D Designer work remained open in
other PRs, including #552/#553 and related diagram branches.

This research handoff branch intentionally touches only new handoff/reference
documents. It does **not** modify:

- `project.status.json`;
- `HANDOFF-LATEST.md`;
- TR-01 implementation files;
- 2D Designer files;
- any existing parallel PR branch.

New-window work must re-check open PRs before editing shared files.

## 9. Read next

For project continuation, read in this order:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. `docs/roadmap/HANDOFF-LATEST.md`
4. `LLM.md`
5. `llm.foundation-map.json`
6. `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md`
7. this file
8. `docs/research/IT01-ITEM-RVC-REFERENCE-INDEX-20261010.md`

For IT-01 historical evidence only:

- `docs/roadmap/IT01-ITEM-SECOND-OBJECT-EVIDENCE-v0.1.md`
- `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`

