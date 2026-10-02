import type {
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import type {
  EnterpriseOperatingGraphInspectorPropertyResolverV010,
  EogInspectorTargetV010
} from "../contracts/enterprise-operating-graph-inspector.js";
import type {
  DiagramWorkspaceSelectionInspectionV010
} from "../vendor/eidos/src/2d/index.js";
import type {
  Eog2dWorkspaceRoleV010
} from "./2d-workspace-capabilities.js";
import {
  projectEog2dInspectorPropertiesV010
} from "./2d-inspector-contributions.js";

export type Eog2dSelectionTargetV010 = {
  kind: "node" | "edge";
  id: string;
};

export function resolveEogInspectorTargetV010(
  graph: EnterpriseOperatingGraphV010,
  target: Eog2dSelectionTargetV010
): EogInspectorTargetV010 {
  if (target.kind === "node") {
    const node = graph.nodes.find(item => item.nodeId === target.id);
    if (!node) throw new Error("EOG_2D_INSPECTOR_NODE_NOT_FOUND");
    return {
      kind: "NODE",
      nodeId: node.nodeId,
      nodeKind: node.kind,
      semanticRef: structuredClone(node.semanticRef)
    };
  }

  if (target.id.startsWith("guidance-edge:")) {
    const relationId = target.id.slice("guidance-edge:".length);
    const relation = graph.guidanceRelations.find(
      item => item.relationId === relationId
    );
    if (!relation) throw new Error("EOG_2D_INSPECTOR_RELATION_NOT_FOUND");
    return {
      kind: "RELATION",
      authority: "GUIDANCE",
      relationId: relation.relationId,
      relationKind: relation.kind,
      applicationNodeId: relation.applicationNodeId,
      ledgerNodeId: relation.ledgerNodeId
    };
  }

  if (target.id.startsWith("enterprise-edge:")) {
    const relationId = target.id.slice("enterprise-edge:".length);
    const relation = graph.enterpriseRelations.find(
      item => item.relationId === relationId
    );
    if (!relation) throw new Error("EOG_2D_INSPECTOR_RELATION_NOT_FOUND");
    return {
      kind: "RELATION",
      authority: "ENTERPRISE",
      relationId: relation.relationId,
      relationKind: relation.kind,
      applicationNodeId: relation.applicationNodeId,
      ledgerNodeId: relation.ledgerNodeId
    };
  }

  throw new Error("EOG_2D_INSPECTOR_EDGE_ID_INVALID");
}

export async function inspectEog2dSelectionV010(input: {
  graph: EnterpriseOperatingGraphV010;
  target: Eog2dSelectionTargetV010;
  role: Eog2dWorkspaceRoleV010;
  resolver: EnterpriseOperatingGraphInspectorPropertyResolverV010;
}): Promise<DiagramWorkspaceSelectionInspectionV010> {
  const target = resolveEogInspectorTargetV010(
    input.graph,
    input.target
  );
  const contributions = await input.resolver.inspect({
    enterpriseId: input.graph.enterpriseId,
    graphId: input.graph.graphId,
    target
  });

  return {
    contractVersion: "0.1.0",
    target: structuredClone(input.target),
    properties: projectEog2dInspectorPropertiesV010(
      contributions,
      input.role
    )
  };
}
