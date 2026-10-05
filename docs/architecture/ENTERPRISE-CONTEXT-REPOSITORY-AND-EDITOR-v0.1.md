# Enterprise Context Repository and Editor Boundary v0.1

> **SUPERSEDED:** `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md` is the sole conceptual authority. This document is retained only for historical boundary decisions.

**Document class:** SUPERSEDED_REFERENCE  
**Status:** SUPERSEDED — retained for migration/history  
**Date:** 2026-10-04  
**Owner repository:** EVO-App-Platform

## 1. Canonical model

Enterprise Context is best understood as an **enterprise-owned repository / authority container**, not as an editing application.

```text
Enterprise Context Repository
  = enterprise identity + governed enterprise-owned definitions/state

Enterprise Context Editor
  = installable Application plugin that creates, inspects, edits and governs
    Enterprise Context repository content through public capabilities
```

The two MUST remain separable.

Uninstalling or replacing the Editor MUST NOT delete or invalidate Enterprise Context repository content.

## 2. Current repository responsibilities

Enterprise Context is the authority boundary for enterprise-scoped content such as:

- Enterprise Context identity and directory facts;
- Business Definitions;
- Draft / Published / Effective revisions;
- immutable definition history and provenance;
- Enterprise Graph Definition;
- template-copy results owned by the enterprise;
- template-transfer export/import boundary;
- enterprise relationships, grants and governance facts where the owning provider contracts place them.

Specialized domain editors remain peer plugins.

## 3. Editor responsibility

The current `evo-enterprise-context-governance` Application is an early Enterprise Context Editor/Governance Experience.

It owns Human-facing interaction such as:

- create Enterprise Context;
- browse/manage repository content;
- invoke governed lifecycle commands;
- later Share/Publish-to-Template-Store interactions.

It does not own Enterprise Context persistence.

Target product terminology may converge from “Enterprise Context Governance” toward “Enterprise Context Editor” as the experience expands beyond creation/governance.

## 4. Template Store relationship

Template Store and Enterprise Context are different repository roles.

```text
Enterprise Context Repository
  = enterprise-owned authoritative working repository

Template Store
  = shared/distribution repository for reusable snapshots/content
```

Template Store may preserve a provenance reference to the source Enterprise Context repository/revision, but shared content is a portable snapshot and MUST NOT require the source repository at runtime.

Publishing flow:

```text
Enterprise Context Repository
  -> Share/Publish snapshot
  -> Template Store
```

Use flow:

```text
Template Store
  -> Copy
  -> Enterprise Context Repository
  -> independent enterprise-owned Draft
```

A future product may allow a whole Enterprise Context repository snapshot to be published as a reusable template package. This is an extension of the same transfer model, not a live repository mount.

## 5. Cardinality

### Product v0.1

The current product experience supports one Enterprise Context repository.

No multi-context selector is required in v0.1.

### Long-term architecture

App Platform MUST preserve the ability to host multiple Enterprise Context repositories.

The architecture already uses stable:

- `contextId`;
- `enterpriseId`;
- `ActiveContextRefV010`;
- Principal-scoped Context Registry;
- Provider-based Enterprise Context directory.

Therefore future multi-context support is a product/selection extension rather than a storage-model rewrite.

Canonical future topology:

```text
App Platform
  ├─ Enterprise Context Repository A
  ├─ Enterprise Context Repository B
  ├─ Enterprise Context Repository C
  └─ Enterprise Context Editor
       -> selects/manages an authorized repository
```

The Editor is not duplicated conceptually for each repository; it operates against a selected authorized repository.

## 6. Invariants

1. Enterprise Context is repository/authority, not UI.
2. Enterprise Context Editor is UI/tooling, not authority.
3. Template Store is distribution/sharing, not Enterprise Context authority.
4. Copy creates independent enterprise-owned content.
5. Source references are provenance, not runtime dependency.
6. v0.1 may assume one available Enterprise Context in product UX.
7. contracts and Host identity MUST remain capable of distinguishing multiple Context repositories.
8. arbitrary client-supplied `enterpriseId` MUST NOT define authority; Host Context resolution is canonical.

## 7. Naming implication

Current implementation names are retained for compatibility:

- `host-enterprise-context-provider` = repository/provider-side capability package;
- `evo-enterprise-context-governance` = current Editor/Governance Experience package.

Future product-facing naming should distinguish:

- **Enterprise Context** — repository;
- **Enterprise Context Editor** — management application.

No “Enterprise Context Store” plugin is introduced in v0.1.
