# Decision Record — Single-Context v0.1 with Multi-Context Architecture Reserved

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-04

## Context

Enterprise Context behaves as an enterprise-owned repository/authority boundary.

The long-term platform architecture may host multiple Enterprise Context repositories for one Principal, but the current product does not need the UI and operational complexity of multi-context selection.

Template Store must therefore remain simple now without hard-coding a permanently singular architecture.

## Decision

Product v0.1 supports one available Enterprise Context repository.

Template Store Copy automatically resolves that single authorized Enterprise Context through the Host Context Registry.

The Copy contract nevertheless preserves an optional `targetContextId` and the Host continues to use stable Context identity.

If multiple Enterprise Contexts are present:

- an explicit authorized `targetContextId` can disambiguate the operation at the architecture/API layer;
- an ambiguous Copy without a target fails closed;
- v0.1 does not expose the multi-context selector in the product UI.

The client never supplies a trusted destination `enterpriseId`; Host Context resolution derives it.

## Current UX

```text
Template Store
  -> Use template
  -> single Enterprise Context auto-resolved
  -> confirm
  -> authorization
  -> Enterprise Context creates independent Draft
```

No Enterprise Context selector is required in v0.1.

## Long-term extension

```text
Template Store
  -> Use template
  -> select targetContextId
  -> confirm
  -> authorization
  -> selected Enterprise Context repository
```

This can be enabled later without changing:

- Enterprise Context storage semantics;
- TemplateTransferBundle;
- independent-copy semantics;
- Template Store ownership;
- Host authorization boundary.

## Ownership

- Template Store owns the Copy interaction.
- Host Context Registry owns target resolution authority.
- Enterprise Context owns the resulting repository content.
- Multi-context selection is a future product capability, not a new storage model.
