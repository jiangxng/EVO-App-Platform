# EOG Agent Tool Ownership Split — Semantic and Observatory v0.1

**Status:** IMPLEMENTED — VIEW SPLIT COMPLETE  
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

evo-eog-2d-designer
├── enterprise.operating_graph.view.get
└── enterprise.operating_graph.view.apply
    (stable generic IDs retained as the DIAGRAM_2D compatibility path)

evo-eog-3d-viewer
├── enterprise.operating_graph.spatial_view.get
└── enterprise.operating_graph.spatial_view.apply
```

No EOG Agent View tool remains owned by `evo-app-platform`. The stable generic View IDs are explicitly 2D-only; SPATIAL_3D uses explicit spatial tool IDs owned by the 3D Viewer.

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

## View split invariants

- `enterprise.operating_graph.view.get/apply` is the stable DIAGRAM_2D compatibility path owned by EOG 2D Designer;
- 2D mutation cannot set camera state;
- `enterprise.operating_graph.spatial_view.get/apply` is the explicit SPATIAL_3D path owned by EOG 3D Viewer;
- spatial placement/camera remain presentation state and do not change semantic graph revision;
- no EOG Agent tool descriptor remains generically owned by `evo-app-platform`.


## Physical implementation ownership

The tool descriptor ownership above is now mirrored by source ownership:

- `apps/eog-2d-designer/agent-tools.ts` owns semantic and DIAGRAM_2D Agent tool implementations;
- `apps/eog-3d-viewer/agent-tools.ts` owns SPATIAL_3D Agent tool implementations;
- `manager/enterprise-operating-graph-agent-tools.ts` is compatibility composition only.

The compatibility composer preserves the existing Host call site and stable tool catalog while preventing 3D tool implementation from living inside the Designer package.
