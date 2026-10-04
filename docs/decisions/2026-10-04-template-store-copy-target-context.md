# Decision Record — Template Store Copy Requires Explicit Target Context

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-04

## Context

EVO App Platform may host multiple Enterprise Context instances for the same user/principal.

Template Store is an installation-wide plugin, so a template Copy action cannot assume that the currently active Enterprise Context is the intended destination.

## Decision

Template Store Copy requires an explicit `targetContextId`.

The Host resolves that Context from the Principal's authorized Context registry and derives the canonical `enterpriseId` from the resolved Enterprise Context.

The action does not accept an arbitrary destination `enterpriseId` from the client.

## UX

```text
Template Store
  -> Use template
  -> Select target Enterprise Context
  -> Confirm destination
  -> Authorization
  -> Enterprise Context creates independent Draft
```

Rules:

- zero eligible Enterprise Contexts: Copy disabled;
- one eligible Enterprise Context: it may be preselected, but destination remains visible in confirmation;
- multiple eligible Enterprise Contexts: explicit user selection is required;
- active Context may be suggested but is never silently treated as destination.

## Ownership

- Template Store owns the interaction and selected template.
- Host Context resolution owns destination authority.
- Enterprise Context owns the created definition.
- The resulting copy remains independent from Template Store.

## Consequence

The Template Store page must gain a destination-selection interaction before Copy is considered a complete page experience.
