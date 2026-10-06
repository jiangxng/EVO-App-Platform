import type {
  Template2dPreviewV010
} from "../contracts/template-preview.js";
import type {
  DiagramWorkspaceActionV010,
  DiagramWorkspaceStateV010
} from "../vendor/eidos/src/2d/index.js";

export function projectDefinition2dWorkspaceStateV010(input: {
  resourceId: string;
  revision: number;
  lifecycleState: string;
  diagram2d?: Template2dPreviewV010;
  actions?: DiagramWorkspaceActionV010[];
  notice: string;
}): DiagramWorkspaceStateV010 {
  const diagram = input.diagram2d;
  if (!diagram) {
    return {
      contractVersion: "0.1.0",
      resourceId: input.resourceId,
      revision: input.revision,
      lifecycleState: input.lifecycleState,
      nodes: [],
      edges: [],
      actions: input.actions ? structuredClone(input.actions) : [],
      notice: input.notice
    };
  }

  return {
    contractVersion: "0.1.0",
    resourceId: input.resourceId,
    revision: input.revision,
    lifecycleState: input.lifecycleState,
    nodes: diagram.nodes.map(node => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      shape: node.shape ?? "rounded-rectangle",
      ...(node.typeLabel ? { typeLabel: node.typeLabel } : {}),
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      // Projection editing changes presentation only. Nodes remain
      // semantically read-only so drag stays client-local until Save.
      readOnly: true,
      ...(node.detail ? { detail: node.detail } : {}),
      ...(node.properties
        ? { properties: node.properties.map(property => ({ ...property })) }
        : {})
    })),
    edges: diagram.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
      ...(edge.label ? { label: edge.label } : {}),
      ...(edge.arrow ? { arrow: edge.arrow } : {}),
      ...(edge.detail ? { detail: edge.detail } : {}),
      ...(edge.properties
        ? { properties: edge.properties.map(property => ({ ...property })) }
        : {})
    })),
    actions: input.actions ? structuredClone(input.actions) : [],
    notice: input.notice
  };
}
