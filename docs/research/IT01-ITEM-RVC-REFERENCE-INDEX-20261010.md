# IT-01 / Item Real-World RVC — Research Sources and Decision Index

**Prepared:** 2026-10-10  
**Repository:** https://github.com/jiangxng/EVO-App-Platform  
**Companion short entry:** `docs/roadmap/IT01-ITEM-RVC-RESEARCH-HANDOFF-20261010.md`  
**Purpose:** preserve the external research, actual real-data evidence, source-status
classification, decisions, rejected alternatives, unresolved questions and exact
project integration points from the long IT-01 window.

## 1. Scope and user requirements inherited in this window

The user explicitly asked this window to act as the mainline coordination window after
parallel ChatGPT windows caused project-state drift.

The working requirements were:

- repository state must win over chat memory;
- inspect current main / PR / production evidence before continuing;
- avoid duplicate work when another window has already merged an equivalent slice;
- keep shared architecture object-neutral rather than copying Counterparty assumptions;
- use real external Item data, not synthetic examples only, before deciding
  Product/SKU/variant/GTIN/UOM/category semantics;
- preserve source provenance and distinguish source fact from architecture judgment;
- do not download/commit a huge public dataset merely to claim scale;
- do not hide real implementation problems by shrinking the pressure sample;
- use CI + production evidence before closing a gate;
- leave durable repository evidence so a new model/window can continue without the
  original transcript.

## 2. External reference index

### R1 — Open Food Facts product database (Hugging Face)

**Title:** openfoodfacts/product-database  
**Original URL:** https://huggingface.co/datasets/openfoodfacts/product-database  
**Checked:** 2026-10-10  
**Status:** **已读原文 + 实际读取官方数据/API/Parquet**  
**Topic:** real-world product corpus / schema pressure / provenance

What was directly confirmed:

- the dataset is published under the Open Food Facts organization;
- it is a tabular/text dataset with millions of rows;
- the viewer exposes fields used by the RVC including `code`, `brands`,
  `categories_tags`, `countries_tags`, `product_name`, `quantity`,
  `product_quantity` and `product_quantity_unit`;
- the page exposes ODbL among its licenses;
- the dataset is available through Parquet.

What the project actually used:

- dataset API endpoint:
  https://huggingface.co/api/datasets/openfoodfacts/product-database
- the workflow resolved the current dataset revision to the exact snapshot:
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`;
- resolved file used by the RVC:
  https://huggingface.co/datasets/openfoodfacts/product-database/resolve/65ceac3fa350b90dc3abea5cddbaa2a2370e73de/food.parquet
- selected columns were read remotely with bounded Parquet access rather than
  downloading the entire dataset;
- the ephemeral 20,000-row sample digest was:
  `sha256:6b8793b66bed44de09f158605e5ca6f7e9c040294d1ad3814c64082244a30218`.

Project use:

- real-world semantic pressure for Item identity and trade-profile boundaries;
- 20k evidence sample;
- 1k generic Data Import pressure;
- source version and content digest retained in CI report.

Volatility note:

The Hugging Face dataset page and latest row count will change. The snapshot SHA and
sample digest above are the reproducibility anchors for this window.

---

### R2 — Open Food Facts exported data fields

**Title:** openfoodfacts-server/html/data-fields.txt  
**Original URL:** https://github.com/openfoodfacts/openfoodfacts-server/blob/main/html/data-fields.txt  
**Checked:** 2026-10-10  
**Status:** **仅看搜索摘要（官方 GitHub source result）** during handoff verification;
direct page opening through the current web reader returned an internal error.  
**Topic:** meaning of OFF `code`, quantity and descriptive fields

The official-source search result exposed these relevant statements:

- `code` is the product barcode;
- it can be EAN-13 or internal codes for some food stores;
- for products without a barcode, Open Food Facts assigns a number using the reserved
  200 prefix;
- `product_name` is the product name;
- `quantity` is quantity and unit;
- `brands`, `categories`, `categories_tags`, `countries_tags` are exported
  descriptive/classification fields.

Project use:

This source was the factual basis for **not** equating OFF `code` with a universal
EVO Item primary key and for preserving package quantity / brand / category as source
evidence instead of core identity.

Verification caution:

Do not mark this source as “已读原文” solely from this handoff. The current handoff
reader could not open the original page directly; the content above came from the
official GitHub search result. Re-open the original source if future work depends on
new fields or changed definitions.

---

### R3 — GS1: What is the Global Trade Item Number (GTIN)?

**Title:** What is the Global Trade Item Number (GTIN)?  
**Original URL:** https://support.gs1.org/support/solutions/articles/43000734404-what-is-the-global-trade-item-number-gtin-  
**Checked:** 2026-10-10  
**Status:** **已读原文**  
**Topic:** GTIN semantics / trade item identity

Directly confirmed from GS1:

- GTIN uniquely identifies trade items — products or services — that may be priced,
  ordered or invoiced in a supply chain;
- a trade item that is different from another receives its own separate GTIN;
- GTIN supports lookup and supply-chain operations such as price, sale, delivery and
  order identification.

Project use:

Source fact:

```text
GTIN identifies a trade item in supply-chain/commercial use.
```

Architecture judgment derived from that fact plus the OFF evidence:

```text
GTIN is not automatically the enterprise Item primary key.
It belongs in an external/trade identifier layer unless a concrete enterprise model
explicitly chooses otherwise.
```

The project therefore did not add mandatory `gtin` to Item core identity.

---

### R4 — UN/CEFACT Recommendation 20

**Title:** UN/CEFACT-Rec20 / Codes for Units of Measure Used in International Trade  
**Original URL:** https://unece.org/trade/documents/2021/06/uncefact-rec20-0  
**Checked:** 2026-10-10  
**Status:** **仅看搜索摘要（官方 UNECE result）** during handoff verification;
direct page opening through the current web reader returned an internal error.  
**Topic:** governed unit-of-measure code system

The official UNECE result confirms:

- Recommendation 20 provides three-character alphabetic/alphanumeric codes for units
  of measurement;
- it covers quantities such as length, area, volume/capacity, mass, time and other
  quantities used in international trade;
- the codes are intended for manual and automated information exchange;
- the code list is organized into annexes including common codes.

Project use:

The research supports the decision that `baseUomCode` should be a governed code
reference rather than arbitrary display text.

Important precision:

The RVC harness used a deliberately bounded mapping including `GRM`, `KGM`,
`MLT`, `LTR` and `C62`. This handoff verification confirmed the Rec20 code-system
purpose from UNECE, but did **not** independently reopen the current Rec20 XLSX and
verify every individual code mapping. Before a production UOM catalog is built, fetch
and validate the authoritative current code list.

## 3. Real-data evidence retained from the window

### Exact dataset/run anchors

Final real-data PR:

- PR #538 — `IT-01E: run real Open Food Facts Item RVC`
- PR head:
  `4f63a4d26035585daebcaaa7cd3c19f33381197b`
- main merge:
  `139ad94c13909a1f47c73d081742a5a6a870eef5`
- production deployment:
  `ca33d2da-7de7-483a-b584-1d71d38f84d1` — SUCCESS

Final workflow:

- workflow: `IT-01E Open Food Facts Item RVC`
- workflow run: `37931771139`
- job: `113823975111`
- final artifact ID: `11615994565`
- artifact URL:
  https://github.com/jiangxng/EVO-App-Platform/actions/runs/37931771139/artifacts/11615994565
- artifact retention configured by the workflow: 7 days.

The artifact is expected to expire; this is why the durable summary is committed to:

- `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`

No screenshot was used for this evidence. The volatile evidence was the Actions
manifest/report artifact and job log.

### Exact source/sample

- source snapshot:
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`;
- retrieval in the first retained run:
  `2026-10-09T12:35:10.054339Z`;
- sampling:
  `FIRST_N_NONEMPTY_CODE`, limit 20,000;
- sample SHA-256:
  `6b8793b66bed44de09f158605e5ca6f7e9c040294d1ad3814c64082244a30218`.

### Raw evidence

Observed in 20,000 rows:

| Metric | Result |
| --- | ---: |
| total rows | 20,000 |
| distinct external codes | 20,000 |
| duplicate external codes | 0 |
| duplicate display-name candidates | 5,291 |
| missing product name | 0 |
| missing quantity | 6,897 |
| missing brand | 346 |
| missing category | 1,087 |
| missing country evidence | 0 |
| numeric codes | 20,000 |
| non-numeric codes | 0 |
| GTIN-shape candidates | 20,000 |
| valid GTIN checksum candidates | 19,984 |
| invalid GTIN checksum candidates | 16 |
| observed OFF 200-prefix candidate | 1 |
| 13-digit numeric codes | 19,157 |
| 8-digit numeric codes | 843 |

This sample must **not** be generalized into “all OFF records are numeric/GTIN-like”.
It was the first 20,000 rows with non-empty code at one pinned snapshot.

### Quantity / UOM evidence

- 13,003 rows had a quantity unit token recognized by the bounded parser;
- 12,450 rows mapped to the bounded Rec20 evidence map;
- top observed tokens:
  - `g`: 11,055;
  - `ml`: 1,312;
  - `oz`: 467;
  - `fl oz`: 57;
  - `l`: 41;
  - `kg`: 36;
  - `lb`: 16;
  - `cl`: 13;
  - count/unit: 6.

This mixture was used as evidence that external package quantity is a separate measure
from the enterprise's operational base UOM.

### Generic EVO pressure path

The actual 1,000-row path was:

```text
Open Food Facts source evidence
→ explicit RVC adapter
→ generic Data Import
→ dry-run
→ schema digest
→ atomic batch commit
→ Item Enterprise Resource
→ Enterprise Extension values
→ receipt
```

Result:

- requested: 1,000;
- dry-run valid: 1,000;
- invalid: 0;
- commit state: COMMITTED;
- committed: 1,000;
- failed: 0;
- Item resources: 1,000;
- extension value sets: 1,000.

The final head run measured roughly 6.62 seconds / 151 rows per second.
A prior equivalent post-fix run measured roughly 6.56 seconds / 152 rows per second.
Treat this as approximate design-pressure throughput, not an SLO.

## 4. Performance finding and correction

### Finding

The first successful 1,000-row real-data import took approximately:

```text
32.5 seconds
31 rows/sec
```

The cause identified in this window was the Item repository's per-row uniqueness
validation: each save scanned the enterprise Item collection, producing near-O(n²)
behavior for a batch.

### Adopted correction

Added `ItemRepositoryV010.saveMany`:

- read the existing Item/code ownership set once;
- validate batch IDs and codes once;
- preserve active/archived identity rules;
- persist through Enterprise Resource bulk write when available;
- let Item atomic import use the batch repository boundary.

After correction:

```text
~6.6 seconds
~151–152 rows/sec
~4.9x improvement
```

Archive/code reservation and atomic batch behavior remained covered by tests.

### Rejected alternative

Do **not** reduce the real-data import pressure to hide the slow path. The window
explicitly chose to fix the repository boundary instead.

## 5. Source facts versus architecture judgments

### Source facts retained

From OFF / GS1 / UNECE and the pinned RVC:

- OFF exposes barcode/product code, names, quantity, brand/category/country evidence.
- OFF code may include standard barcodes as well as store/internal/OFF-assigned cases.
- GS1 GTIN identifies trade items that may be priced, ordered or invoiced.
- different trade items receive separate GTINs.
- Rec20 is a governed international-trade unit-code system.
- the pinned 20k sample contained missing package quantity/category/brand data and a
  small number of invalid GTIN checksum candidates.
- the same human-facing product name can occur repeatedly.

### Architecture judgments made by this project

These are project decisions, not claims made directly by the external sources:

- enterprise Item identity stays separate from external trade identifiers;
- GTIN is modeled as `scheme + value + provenance` evidence/relationship rather than
  mandatory Item primary key;
- Product/SKU/variant are introduced only when concrete enterprise semantics require
  grouping/sellable/stock/channel relationships;
- category is a governed taxonomy/classification relation, not scalar Item identity;
- brand is descriptive/commercial evidence, not Item identity;
- package quantity and enterprise base UOM are separate concepts;
- `baseUomCode` should be a governed Rec20-compatible reference;
- external source schema never becomes EVO schema authority.

## 6. Option comparison preserved from the window

### Item identity

**Adopted:** enterprise-owned `itemId + code + displayName + itemKind + baseUomCode`.

Reason:

- stable internal identity is required regardless of external source coverage;
- external codes have different governance/provenance;
- real data contains repeated names and imperfect external identifier evidence.

**Rejected:** OFF code / barcode / GTIN as universal Item primary key.

Reason:

- OFF itself has multiple code origins;
- GS1 GTIN identifies a trade item, not necessarily the enterprise's internal master
  identity;
- enterprise service/non-GTIN Items must remain representable.

### Product / SKU / variant

**Adopted:** defer universal core fields and model relationships when trading/business
requirements prove them.

**Rejected:** add `productId`, `sku`, `variantId` merely because product datasets
contain product-like concepts.

Reason:

Those labels mean different things across enterprises and channels. The external
dataset does not define the enterprise's internal grouping/stock/sellable-unit model.

### Category

**Adopted:** future governed taxonomy/classification relation, potentially multiple.

**Rejected:** single scalar `categoryId` in Item identity.

### UOM

**Adopted:** enterprise operational base UOM as governed code reference; source package
quantity preserved separately.

**Rejected:** infer base UOM directly from `400 g`, `154 ml`, etc.

### RVC acquisition

**Adopted:** pin the dataset snapshot, remotely read selected Parquet columns, use
20k ephemeral raw rows, retain only manifest/digest/derived report.

**Rejected:** download/commit the entire multi-GB OFF dataset or store raw sample in
Git.

Reason:

The goal is reproducible architecture pressure, not dataset mirroring.

### RVC identity adapter

**Adopted:** deterministic RVC-only surrogate enterprise Item code; external code
preserved as trade-profile evidence.

**Rejected:** silently use source barcode as enterprise Item code and later mistake a
test adapter for production semantics.

### Foundation Object maturity

**Adopted:** selected object-neutral contracts => `STABLE_CANDIDATE`.

**Rejected:** mark the whole Foundation Object stack STABLE after Item.

Reason:

Counterparty + Item is enough to distinguish many generic mechanisms from
first-object assumptions, but Warehouse and real trading loops still need to prove
structural/operational compatibility.

## 7. Generic platform findings produced before the final RVC

### Object-neutral applicability

Counterparty-first shared contracts exposed `relationshipRoles` semantics.

Resolution:

- introduce generic qualifier dimensions;
- keep Counterparty role behavior as compatibility semantics;
- do not add object-specific qualifier keys for new Foundation Objects.

### Object-neutral Data Import parameters

A shared Import parameter type still named Counterparty relationship roles.

Resolution:

- shared Import target parameters became an object-neutral key/value bag;
- Counterparty target owns interpretation of its own role parameters;
- Item uses the same generic Data Import service.

### Lifecycle-aware import target discovery

Static Host registration would make an Item import implementation visible while the
plugin was inactive/uninstalled and would violate the install/use-driven lazy-loading
rule.

Resolution:

- lightweight `platform.data-import-target` contributions;
- only active owning features appear in discovery;
- implementation factory resolves at Data Import use time;
- staged jobs fail closed if target is no longer active.

### Row-dynamic qualifier import

A mixed GOODS/SERVICE job could not expose conditionally applicable fields if schema
was compiled only once before row context existed.

Resolution:

```text
DISCOVERY
= show all potentially applicable governed fields for mapping

EFFECTIVE
= compile the fields actually valid for the current row qualifier context
```

Item owns `item.kind`; the shared compiler does not know GOODS/SERVICE.

## 8. Contract maturity decision

After Counterparty + Item, the following were classified
`STABLE_CANDIDATE`:

- `FoundationObjectDescriptorV010` ownership/slot model;
- core/effective schema separation;
- object-neutral applicability qualifiers;
- DISCOVERY/EFFECTIVE schema modes;
- Object Extension definition/value boundaries;
- generic Foundation Object Data Import pipeline;
- Enterprise Resource persistence boundary;
- Projection + Responsibility + Authorization separation.

Not promoted to universal stable semantics:

- Counterparty `relationshipRoles`;
- Product/SKU/variant/trade-identifier model;
- Item UOM/catalog/category model;
- Item-specific Responsibility codes;
- source-specific RVC adapters.

WH-01 later reused these STABLE_CANDIDATE contracts without an incompatible
third-object change. Current project status still requires real TR-01 trading loops
before promotion to STABLE.

## 9. Conflicts, caveats and unresolved questions

### External code vs enterprise identity

There is no source conflict here; the apparent conflict is semantic scope:

- OFF uses `code` as its product key/barcode field;
- GS1 defines GTIN at the trade-item level;
- EVO needs durable enterprise master identity across sources and workflows.

Resolution: separate internal Item identity from external identifier evidence.

### Package quantity vs base UOM

OFF `quantity` describes the package quantity/unit.
Rec20 supplies standardized UOM codes for information exchange.

Unresolved product work:

- build or bind a governed UOM catalog;
- verify the current authoritative Rec20 code list and versions;
- define conversions and dimensional compatibility;
- define whether base UOM changes are allowed and how history is preserved.

### External identifiers

Current accepted boundary is conceptual:
`scheme + value + provenance`.

Still unresolved:

- whether this remains Enterprise Extension data;
- or becomes a reusable related identifier resource;
- uniqueness scope by scheme;
- identifier lifecycle/supersession;
- GTIN normalization and leading-zero policy.

Do not solve these generically before transaction/product requirements need them.

### Product / SKU / variant

Still unresolved by design.

The next evidence should come from real enterprise/trading requirements, not another
generic product ontology exercise.

### Category / taxonomy

Still unresolved:

- taxonomy ownership;
- multiple taxonomies;
- hierarchy/versioning;
- enterprise-local versus external classification mappings.

### Performance

The 1k in-memory RVC improved ~4.9x, but it is not a database performance SLO.

If future production-scale Item imports are required, measure PostgreSQL-backed
resource persistence separately rather than extrapolating this test.

### Source accessibility

- OFF data-fields original page direct-open failed in the handoff reader;
- UNECE Rec20 original page direct-open failed in the handoff reader;
- both had official-domain/search results sufficient for the summaries above.

Future standards work should fetch the authoritative source documents directly.

## 10. Current project-state drift discovered while creating this handoff

Repository code has advanced beyond the state currently rendered in continuity files.

Actual current code/production evidence:

- `main`:
  `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`;
- PR #551 merged: TR-01A1 Purchase / Receipt composition;
- PR #551 head:
  `1de23c70e26c1c45653115ac6abc805d4f70f681`;
- CI on that head:
  - Project Continuity CI PASS;
  - Platform CI PASS;
  - Cross Project CI - Trading Lite EVO PostgreSQL PASS;
- current Railway deployment:
  `b1d141c6-858d-4ee3-8422-0efbe7147396` — SUCCESS.

But:

- `project.status.json` production preview is still the earlier WH-01D deployment;
- TR-01 evidence still labels TR-01A1 CI-pending;
- TR-01A2 reversal is required/not implemented.

Recommended immediate continuation:

```text
record TR-01A1 merged/CI/production PASS
→ update project.status
→ continuity:render / validate
→ implement TR-01A2 immutable Purchase Receipt reversal
→ prove EVO public-contract replay/economic effects
→ only then consider TR-01B sales loop
```

## 11. Multi-window coordination lessons

This window observed real collisions, not hypothetical ones.

The safe operating protocol is:

```text
read current repository authority
→ inspect recent/open PRs
→ inspect current deployment if production evidence matters
→ branch from current main
→ keep scope narrow
→ after any pause, recheck main before merge
```

When a parallel window already merged the same state transition:

- treat the merged repository as authority;
- close the duplicate PR as superseded;
- do not force/rebase competing state transitions merely to preserve chat-local work.

This handoff branch itself deliberately changes only new research handoff documents.

## 12. Project mapping

### Item domain

- `apps/item/foundation-object.ts`
- `apps/item/repository.ts`
- `apps/item/import-target.ts`
- Item projections/access/actions/pages/package under `apps/item/`

### Shared Foundation Object / Import

- `contracts/foundation-object/`
- `foundation/schema-compiler/index.ts`
- `foundation/import-values.ts`
- `apps/data-import/`
- `apps/object-extension/`

### RVC evidence

- `tools/item-rvc-open-food-facts.mjs`
- `tests/protocol/it01-item-open-food-facts-rvc.test.mjs`
- `.github/workflows/it01-item-open-food-facts-rvc.yml`
- `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`
- `docs/roadmap/IT01-ITEM-SECOND-OBJECT-EVIDENCE-v0.1.md`

### Current mainline after IT-01 / WH-01

- `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md`
- `project.status.json`
- `docs/roadmap/HANDOFF-LATEST.md`

## 13. Do not lose these exact identifiers

IT-01 final:

- PR #538
- merge:
  `139ad94c13909a1f47c73d081742a5a6a870eef5`
- production:
  `ca33d2da-7de7-483a-b584-1d71d38f84d1`

OFF RVC:

- source snapshot:
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`
- sample digest:
  `6b8793b66bed44de09f158605e5ca6f7e9c040294d1ad3814c64082244a30218`
- final workflow:
  `37931771139`
- final job:
  `113823975111`
- expiring artifact:
  `11615994565`

Current main at handoff:

- `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`
- PR #551 production:
  `b1d141c6-858d-4ee3-8422-0efbe7147396` — SUCCESS.

## 14. What was not saved as durable external material

- no raw 20k OFF sample was committed;
- no full OFF dump was downloaded/committed;
- no screenshots were used for the RVC;
- GitHub Actions artifacts are time-limited, so the durable metrics/provenance are in
  repository Markdown;
- no new Product/SKU/variant ontology was created;
- no production Rec20 code catalog was implemented.

Those omissions are intentional, not missing work.

