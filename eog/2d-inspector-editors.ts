import type {
  DiagramWorkspaceStateV010,
  DiagramWorkspaceInspectorPropertyEditorV010
} from "../vendor/eidos/src/2d/index.js";

export interface Eog2dInspectorEditorBindingV010 {
  target: {
    kind: "node" | "edge";
    id: string;
  };
  propertyKey: string;
  editor: DiagramWorkspaceInspectorPropertyEditorV010;
}

export function attachEog2dInspectorEditorsV010(
  state: DiagramWorkspaceStateV010,
  bindings: readonly Eog2dInspectorEditorBindingV010[]
): DiagramWorkspaceStateV010 {
  const next = structuredClone(state);

  for (const binding of bindings) {
    const target = binding.target.kind === "node"
      ? next.nodes.find(item => item.id === binding.target.id)
      : next.edges.find(item => item.id === binding.target.id);

    if (!target) {
      throw new Error("EOG_2D_INSPECTOR_EDITOR_TARGET_NOT_FOUND");
    }

    const property = target.properties?.find(
      item => item.key === binding.propertyKey
    );
    if (!property) {
      throw new Error("EOG_2D_INSPECTOR_EDITOR_PROPERTY_NOT_FOUND");
    }
    if (property.editor) {
      throw new Error("EOG_2D_INSPECTOR_EDITOR_DUPLICATE");
    }

    property.editor = structuredClone(binding.editor);
  }

  return next;
}
