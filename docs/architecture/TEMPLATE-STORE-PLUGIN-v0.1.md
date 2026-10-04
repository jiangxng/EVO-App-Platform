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
- no dependency on Enterprise Context for browsing.

Deliberately deferred to the next slice:

- Enterprise Context share/export contract;
- Template Store shared-content repository;
- Copy command into a selected Enterprise Context;
- authorization around Share/Copy;
- Designer-generated thumbnail persistence;
- template detail page;
- categories, ratings, popularity, comments or marketplace economics.

## 8. Dependency direction

Current allowed direction:

```text
Template Store Experience
  -> Eidos public Catalog Browser

future Share/Copy adapter
  -> Enterprise Context public contracts
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

## 9. Next implementation gate

The next smallest real gate is:

> Define the public Enterprise Context template-share/copy boundary so a shared item can be copied into a target Enterprise Context without Template Store owning or directly mutating Enterprise Context storage.

That gate must preserve the copy-only invariant and Enterprise Context authority.
