import type {
  EnterpriseOperatingGraphV010,
  EogGuidanceSourceKindV010
} from "../../contracts/enterprise-operating-graph.js";
import type {
  Eog2dInspectorEditorBindingV010
} from "../../eog/2d-inspector-editors.js";

const guidanceSourceKinds: EogGuidanceSourceKindV010[] = [
  "LEGACY_POSTING_RULE_TEMPLATE",
  "ACCOUNTING_GUIDANCE",
  "APQC",
  "INDUSTRY_TEMPLATE",
  "ENTERPRISE_TEMPLATE"
];

function nodeConnected(
  graph: EnterpriseOperatingGraphV010,
  nodeId: string
): boolean {
  return graph.guidanceRelations.some(relation =>
    relation.applicationNodeId === nodeId
    || relation.ledgerNodeId === nodeId
  ) || graph.enterpriseRelations.some(relation =>
    relation.applicationNodeId === nodeId
    || relation.ledgerNodeId === nodeId
  );
}

function guidanceConfirmed(
  graph: EnterpriseOperatingGraphV010,
  relationId: string
): boolean {
  return graph.enterpriseRelations.some(
    relation => relation.confirmedFromGuidanceRelationId === relationId
  );
}

export function createEogOwnedInspectorEditorBindingsV010(
  graph: EnterpriseOperatingGraphV010
): Eog2dInspectorEditorBindingV010[] {
  if (graph.state !== "DRAFT") return [];

  const result: Eog2dInspectorEditorBindingV010[] = [];

  for (const node of graph.nodes) {
    if (nodeConnected(graph, node.nodeId)) continue;

    result.push(
      {
        target: { kind: "node", id: node.nodeId },
        propertyKey: "semantic.ref",
        editor: {
          kind: "TEXT",
          actionId: "eog.node.semantic-ref.set:" + node.nodeId,
          valueField: "refId",
          operation: {
            type: "NODE_SEMANTIC_REF_PATCH",
            semanticRevision: graph.revision,
            nodeId: node.nodeId
          }
        }
      },
      {
        target: { kind: "node", id: node.nodeId },
        propertyKey: "semantic.version",
        editor: {
          kind: "TEXT",
          actionId: "eog.node.semantic-version.set:" + node.nodeId,
          valueField: "versionRef",
          operation: {
            type: "NODE_SEMANTIC_REF_PATCH",
            semanticRevision: graph.revision,
            nodeId: node.nodeId
          }
        }
      }
    );
  }

  for (const relation of graph.guidanceRelations) {
    if (guidanceConfirmed(graph, relation.relationId)) continue;

    const edgeId = "guidance-edge:" + relation.relationId;
    result.push(
      {
        target: { kind: "edge", id: edgeId },
        propertyKey: "source.kind",
        editor: {
          kind: "SELECT",
          actionId: "eog.guidance.source-kind.set:" + relation.relationId,
          valueField: "sourceKind",
          operation: {
            type: "GUIDANCE_SOURCE_PATCH",
            semanticRevision: graph.revision,
            relationId: relation.relationId
          },
          options: guidanceSourceKinds.map(value => ({
            label: value,
            value
          }))
        }
      },
      {
        target: { kind: "edge", id: edgeId },
        propertyKey: "source.ref",
        editor: {
          kind: "TEXT",
          actionId: "eog.guidance.source-ref.set:" + relation.relationId,
          valueField: "sourceRef",
          operation: {
            type: "GUIDANCE_SOURCE_PATCH",
            semanticRevision: graph.revision,
            relationId: relation.relationId
          }
        }
      }
    );
  }

  return result;
}
