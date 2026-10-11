# Template Store Plugin v0.1

**Document class:** CURRENT_AUTHORITY  
**Status:** Active architecture baseline  
**Date:** 2026-10-04  
**Owner repository:** EVO-App-Platform  
**Package:** `evo-template-store`

## 1. Purpose

Template Store is the shared-content browsing surface for reusable enterprise templates.

The first product rule is intentionally simple:

> A Template Store entry is shared content that can be copied. It is not a live dependency from one enterprise to another.

Template Store is implemented as an ordinary EVO App Platform **APPLICATION Plugin**. It is not built into Enterprise Context and it is not part of EOG Core.

## 2. Ownership boundary

The canonical ownership model is:

```text
2D Designer Plugin
  = edit template-oriented Enterprise Graph / visual definition content

Enterprise Context
  = authoritative enterprise definition + revision/lifecycle + share decision

Template Store Plugin
  = browse shared template metadata/content + initiate copy

Eidos
  = reusable Catalog Browser rendering, including thumbnail presentation
```

Template Store and Enterprise Context are independently installable/replaceable concepts.

Template Store MUST NOT become the authority for enterprise definitions.

Enterprise Context MUST NOT depend on Template Store in order to operate.

Removing or disabling Template Store MUST NOT invalidate enterprise definitions or copies that already exist.

## 3. Authoring lifecycle

The accepted interaction vocabulary is:

```text
2D Designer
  Save
    -> save work in progress

2D Designer
  Submit
    -> submit the designed definition/content to Enterprise Context
    -> may generate/update the thumbnail

Submit != Publish
Submit != Share

Enterprise Context
  Publish / lifecycle governance
    -> governed enterprise-definition lifecycle

Enterprise Context
  Share
    -> explicitly make selected content available to Template Store
```

The exact Draft/Published rules remain owned by Enterprise Context. Template Store does not reinterpret them.

## 4. Copy semantics

The installation/use model is copy-only:

```text
Template Store
  -> Copy
  -> Enterprise Context
  -> new enterprise-owned content
```

After copy:

- the target enterprise owns its copy;
- the copy may be edited independently;
- the source template may evolve independently;
- no runtime parent/child linkage is required;
- updating or removing the source does not rewrite the enterprise copy.

Future explicit upgrade/merge semantics would require a separate design. They are not implied by v0.1.

## 5. Store card v0.1

The user-facing template card has exactly three primary content fields:

1. thumbnail;
2. name;
3. description.

Stable internal identity may exist for routing/copy operations, but it is not an additional user-facing template field.

The first seed entry is:

**Name:** EVO 账本运行时基线

**Description:** 基于当前 EVO Ledger Runtime 的首个共享模板，展示 `BusinessData -> Posting -> LedgerEntry -> LedgerBalance` 的核心运行链路，作为后续企业复制与二次设计的起点。

The v0.1 thumbnail is a temporary deterministic SVG preview. Later 2D Designer Submit may provide the real generated thumbnail.

## 6. Eidos dependency

Template Store does not implement a private card renderer.

It consumes Eidos Catalog Browser.

The reusable Eidos contract adds optional:

```ts
thumbnail?: {
  src: string;
  alt: string;
}
```

Thumbnail is presentation metadata only. Eidos does not own template truth.

## 7. v0.1 implementation slice

Included now:

- `evo-template-store` APPLICATION package;
- one Feature: `evo-template-store.default`;
- capability: `template.store.browse`;
- route: `/templates`;
- Eidos Catalog Browser Experience;
- deterministic search;
- one built-in Ledger Runtime baseline card;
- thumbnail/name/description rendering;
- plugin-focused CI;
- no dependency on Enterprise Context for browsing;
- neutral `TemplateTransferBundleV010` public contract;
- Enterprise Context `enterprise.template-transfer` Provider capability;
- exact-revision Share export for both Draft and Published definitions;
- Template Store-owned immutable shared snapshot repository;
- copy-into-enterprise adapter that always creates a new enterprise-owned Draft;
- `TEMPLATE_COPY` provenance without a live source dependency;
- SHA-256 bundle digest validation across the transfer boundary;
- governed Human Copy Action handler that auto-resolves the single Enterprise Context in v0.1 while preserving optional `targetContextId` for future multi-context use, plus explicit confirmation and authorization before invoking the public transfer Provider;
- durable Host Template Store repository using `APP_PLATFORM_TEMPLATE_STORE_FILE` or the main state directory;
- built-in Ledger Runtime seed represented as a real versioned `TemplateTransferBundleV010` record;
- Template Store card `Use template` action wired through the App Host command path;
- system-generated target Business Definition identity so the Human does not manage internal IDs;
- optional 2D Preview action backed by the public `visual.viewer.2d` capability;
- Preview remains read-only and does not create an Enterprise Context copy;
- when no 2D Viewer provider is active, Preview is disabled with an explicit install hint;
- Template Store page/Action/Repository implementation is lazy-loaded only after its Feature is active and actually used.

Deliberately deferred to the next slice:

- Human/Agent ActionHost Share command;
- Agent projection of Share/Copy operations;
- Designer-generated thumbnail persistence;
- template detail page;
- categories, ratings, popularity, comments or marketplace economics.

## 7.1 2D preview experience

Template Store may ask an installed 2D Viewer extension to visualize a template
snapshot before Copy.

```text
Template Store card
  -> Preview
  -> visual.viewer.2d
  -> read-only 2D Workspace
```

Preview rules:

- Preview does not create a Draft;
- Preview does not write Enterprise Context;
- node/edge inspection is allowed;
- Template Store depends on the public `visual.viewer.2d` capability, not a
  concrete Viewer package implementation;
- if the capability is absent, the Preview control remains visible but disabled
  with the message “未安装 2D Viewer 扩展插件，无法预览。”;
- Viewer implementation resources are not loaded merely to render Template
  Store.

The first Ledger Runtime seed projects
`BusinessData -> Posting -> LedgerEntry -> LedgerBalance` into the neutral
2D preview artifact contract.

## 8. Dependency direction

Current allowed direction:

```text
Template Store Experience
  -> Eidos public Catalog Browser

Enterprise Context transfer adapter
  -> neutral Template Transfer contract

Template Store repository
  -> neutral Template Transfer contract
```

Forbidden:

```text
Template Store
  -> Enterprise Context private store

Enterprise Context
  -> Template Store required runtime dependency

2D Designer
  -> Template Store private persistence
```

## 9. Share/Copy transfer boundary

The cross-plugin payload is a neutral immutable `TemplateTransferBundleV010`.

```text
Enterprise Context
  exact definition revision
  + explicit Share metadata
  -> TemplateTransferBundle

TemplateTransferBundle
  -> Template Store repository
  -> immutable Store version

Template Store record
  -> TemplateTransferBundle
  -> Enterprise Context transfer Provider
  -> new target Enterprise Context Draft
```

Rules:

- Share pins an exact Enterprise Context definition revision; it never means "whatever is latest later".
- Share MAY export either a Draft or a Published revision. This preserves the established rule that `Submit != Publish != Share`.
- the bundle carries template name, description and thumbnail plus the exact business-definition payload;
- the bundle carries source enterprise/definition/revision metadata for provenance;
- the bundle is integrity-protected by a deterministic SHA-256 digest;
- Template Store persists a cloned snapshot and never reads Enterprise Context private storage;
- Enterprise Context copy accepts the neutral bundle and creates revision 0 in state `DRAFT` for the target enterprise;
- copied definitions record `origin.type = TEMPLATE_COPY` and a source reference for audit;
- provenance is not synchronization: source and target remain independently editable after the copy.

Physical dependency regression tests MUST keep both implementation directions absent:

```text
apps/template-store/**
  X providers/enterprise-context/**

providers/enterprise-context/template-transfer.ts
  X apps/template-store/**
```

Both sides may depend on `contracts/template-transfer.ts`.

## 9.1 Enterprise Context cardinality

Product v0.1 deliberately supports **one Enterprise Context repository per current product experience**.

The architecture MUST NOT assume this is permanently singular.

Current UX:

```text
Template Store card
  -> Use template
  -> resolve the one available Enterprise Context
  -> confirm
  -> authorization
  -> copy into Enterprise Context
```

Long-term multi-context architecture is preserved through:

- stable `ActiveContextRefV010` / `contextId` identity;
- Principal-scoped Host Context Registry;
- optional `targetContextId` on the Copy command;
- Host-side resolution from `contextId` to canonical `enterpriseId`;
- refusal of ambiguous writes when multiple Enterprise Contexts exist and no target is supplied.

Rules:

- v0.1 UI does not expose a Context selector;
- zero available Enterprise Contexts disables Copy;
- exactly one available Enterprise Context is resolved automatically;
- if a future deployment exposes multiple Enterprise Contexts, Copy fails closed unless an explicit authorized `targetContextId` is supplied;
- a future selector can be added without changing Enterprise Context storage, Template Transfer, or Copy ownership semantics;
- callers MUST NOT inject an arbitrary destination `enterpriseId`.

This preserves the long-term split:

> Template Store owns the Copy interaction; Enterprise Context owns the resulting repository content; Host Context resolution owns destination authority.

## 10. Next implementation gate

The next smallest real gate is:

> Validate the new 2D Preview experience online, then add the symmetric Enterprise Context Share Action and dynamic projection of newly shared repository records.

The current v0.1 paths are:

```text
Template Store -> Preview -> 2D Viewer read-only Workspace
Template Store -> Use template -> confirm -> authorization -> Enterprise Context Draft
```

The Host owns lifecycle admission and transient preview selection, while plugin
implementation resources remain lazy-loaded. The next architecture gate is
Share plus dynamic Store refresh without introducing direct cross-plugin
persistence access.


## Production bootstrap baseline correction

The built-in Ledger Runtime template MUST be exported from the actual
`evo-ledger-runtime-configurator` default library, not from the broader
`enterpriseCoreV1` reference Enterprise Template.

The production validation baseline is:

- 141 account / ledger definitions;
- 143 applications;
- 106 dictionary entries;
- 912 active Posting Rules from bookkeeping `policy.sql`;
- 401 unique expressions, all compiled to EVO Expression IR;
- `burn.ready = true`;
- 587 rules from `记账规则.sql` retained separately as REFERENCE and never
  merged into the active baseline.

The Template Store carries a build-time snapshot of
`LedgerRuntimeConfiguratorService.exportTemplate()`. It does not runtime-import
or require the Configurator plugin.

The first incomplete v1 Store seed is preserved only as historical state in
already-persisted deployments. The corrected production snapshot is built-in
Template Store record version 2. Repository bootstrap merges missing exact seed
versions, so an existing v1 store gains v2 without rewriting history and
`getLatest()` resolves the corrected production template.

CI MUST prove:

1. generated production template JSON deep-equals the current Configurator
   `exportTemplate()`;
2. import/validation remains burn-ready;
3. all 912 rules compile;
4. Template Store v2 TransferBundle is digest-valid;
5. the 587-rule reference library remains separate;
6. existing persisted v1 + built-in v2 converges to latest=v2.


## Eidos Productive Design Language compliance

Template Store is an Eidos Experience, not a plugin-specific visual system.

The page uses the public Eidos `catalog-browser` capability and inherits Host
design tokens, Productive Workbench CSS, keyboard focus behavior, responsive
card layout and action hierarchy.

Required action hierarchy:

```text
supporting action(s)                  primary action
Preview                               Use template
                                      ^ trailing edge
```

The Eidos Catalog Browser implementation pinned by this repository includes the
upstream fix from Eidos commit
`7bf486cd6770f141e62d23a878bfde687751653d`, which ensures secondary actions
render before the single trailing primary action and provides standard disabled
and help-text styling.

Template Store MUST NOT add private CSS to override this hierarchy.

The Experience is also registered in the App Platform Experience Architecture
Registry as `evo-template-store` with:

- archetype: `collection`;
- task mode: `exploration`;
- Human goal: discover, preview and copy reusable templates;
- deterministic direct `Preview` and `Use template` actions;
- one primary action (`Use template`);
- localized system chrome;
- Eidos Design Language compliance.

Chinese locale covers page title, description, search chrome, empty/no-result
states, action labels, help text and Viewer-unavailable explanation.

## Production Ledger Runtime bootstrap content

The built-in Ledger Runtime card is backed by the Ledger Runtime Configurator's
own deterministic `exportTemplate()` result.

Current v2 production seed contains:

- 143 applications;
- 141 accounts / ledgers;
- 106 dictionary entries;
- 912 active `policy.sql` Posting Rules;
- validation result `burnReady = true`;
- zero compatibility blockers.

The separate 587-rule `记账规则.sql` corpus is preserved as a REFERENCE
library and is deliberately not merged into the active 912-rule baseline.

CI requires the checked-in production template snapshot to be exactly equal to
`createLedgerRuntimeConfiguratorService().exportTemplate()`. Template Store
therefore distributes the Configurator-owned snapshot and does not become the
authority for Ledger Runtime configuration semantics.
