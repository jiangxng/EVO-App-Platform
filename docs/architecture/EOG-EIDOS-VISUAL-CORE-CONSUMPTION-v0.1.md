# EOG → Eidos Visual Core Consumption v0.1

**Status:** IMPLEMENTED / CI GATE  
**Date:** 2026-10-02  
**Eidos authority:** `jiangxng/eidos#76`

## Decision

EOG application code consumes Eidos through explicit visual-core boundaries:

```text
EOG 2D Designer ─┐
                 ├─> Eidos 2D Core
EOG 2D Viewer  ──┘    @eidos/reference/2d

EOG 3D Viewer  ─────> Eidos 3D Core
                      @eidos/reference/3d
```

In the current source-vendored App Platform integration, the equivalent pinned
facades are:

```text
vendor/eidos/src/2d/index.ts
vendor/eidos/src/3d/index.ts
```

## Compatibility

The facades reuse the existing Eidos implementation assets:

- 2D Core → `src/diagram/**`
- 3D Core → `src/spatial/**`

There is no second renderer/runtime and no rewrite.

Existing Eidos root exports remain compatibility assets upstream.

## Boundary rule

EOG application code must not import the Eidos `diagram` or `spatial`
implementation folders directly.

Eidos internals may use their own private implementation modules. The restriction
applies at the product/application boundary.

This preserves the intended frontend/backend-like dependency direction:

```text
EOG product semantics
        ↓
stable Eidos public Core boundary
        ↓
replaceable Eidos implementation
```

## Source pin

The App Platform Eidos snapshot is pinned to:

```text
jiangxng/eidos@860658902b76fd0b1e5b9bd5faa01f17d4ca7920
```

which contains the explicit public 2D Core and 3D Core entrypoints.

## Next

With semantic authority, Experience ownership, Agent-tool ownership and visual
Core consumption separated, the remaining convergence work is physical EOG
implementation extraction from mixed `manager/enterprise-operating-graph-*`
locations into the three owning application packages without changing contracts.
