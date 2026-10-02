# EOG Agent Tool Ownership Split — Semantic and Observatory v0.1

**Status:** IMPLEMENTED / CI GATE  
**Date:** 2026-10-02  
**Parent authority:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Scope

This slice removes generic App Platform ownership from the EOG semantic and Observatory Personal Agent tools without changing their stable tool IDs, model names, schemas or authority rules.

## Ownership

```text
evo-eog-2d-designer
├── enterprise.operating_graph.list
├── enterprise.operating_graph.get
├── enterprise.operating_graph.create
└── enterprise.operating_graph.proposal.apply

evo-eog-2d-viewer
├── enterprise.operating_graph.observe
└── enterprise.operating_graph.analyze

compatibility debt for next slice
├── enterprise.operating_graph.view.get
└── enterprise.operating_graph.view.apply
    (currently mixed DIAGRAM_2D / SPATIAL_3D)
```

The mixed View tools remain temporarily owned by `evo-app-platform` so this PR does not mis-assign 3D behavior to a 2D package.

## Lifecycle gating

Semantic tools are available only when:

- the active Context is Enterprise; and
- `evo-eog-2d-designer.default` is active.

Observatory tools are available only when:

- the active Context is Enterprise;
- `evo-eog-2d-viewer.default` is active; and
- the required Runtime Fact / Analysis Provider candidate exists.

## Authority invariants

No Agent authority is widened.

The proposal tool still rejects:

- `ENTERPRISE_RELATION_CONFIRM`;
- `ENTERPRISE_RELATION_REMOVE`;
- `PUBLISH`.

Those remain Human authority.

Observatory tools still call peer Provider-backed Runtime Fact / Analysis services. Moving tool ownership does not move calculation ownership into the Viewer.

## Compatibility

Preserved:

- semantic tool IDs;
- semantic model names;
- observatory tool IDs;
- observatory model names;
- input schemas;
- capabilities;
- Agent action-receipt / material-write authorization behavior.

## Next slice

Split the remaining generic View tools by visual responsibility:

- DIAGRAM_2D -> EOG 2D ownership;
- SPATIAL_3D -> EOG 3D Viewer ownership.

That slice may add explicit spatial tool IDs while preserving the existing generic 2D IDs as the compatibility path.
