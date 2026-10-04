import type {
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import type {
  EnterpriseOperatingGraphViewStateV010
} from "../contracts/enterprise-operating-graph-view.js";
import type {
  DiagramWorkspaceStateV010
} from "../vendor/eidos/src/2d/index.js";

function relationLabels(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      guidance: "指导关系",
      confirmed: "企业确认关系"
    };
  }
  return {
    guidance: "Guidance",
    confirmed: "Confirmed"
  };
}

function semanticLabel(refId: string): string {
  const tail = refId.split(":").filter(Boolean).at(-1) ?? refId;
  return tail
    .replaceAll(/[-_.]+/gu, " ")
    .replaceAll(/\b\w/gu, value => value.toUpperCase());
}

function positions(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010
): Map<string, { x: number; y: number }> {
  const explicit = new Map(
    view.placements.map(item => [
      item.nodeId,
      { x: item.x, y: item.y }
    ])
  );
  let applicationIndex = 0;
  let ledgerIndex = 0;
  for (const node of graph.nodes) {
    if (explicit.has(node.nodeId)) continue;
    if (node.kind === "APPLICATION") {
      explicit.set(node.nodeId, {
        x: 80,
        y: 70 + applicationIndex * 120
      });
      applicationIndex += 1;
    } else {
      explicit.set(node.nodeId, {
        x: 420,
        y: 70 + ledgerIndex * 120
      });
      ledgerIndex += 1;
    }
  }
  return explicit;
}

export function projectEnterpriseOperatingGraphDiagramBaseV010(input: {
  graph: EnterpriseOperatingGraphV010;
  view: EnterpriseOperatingGraphViewStateV010;
  locale?: string;
  readOnly?: boolean;
}): DiagramWorkspaceStateV010 {
  const { graph, view } = input;
  if (
    view.graphId !== graph.graphId
    || view.enterpriseId !== graph.enterpriseId
    || view.kind !== "DIAGRAM_2D"
  ) {
    throw new Error("EOG_VIEW_PROJECTION_IDENTITY_MISMATCH");
  }

  const labels = relationLabels(input.locale);
  const hiddenNodeIds = new Set(view.hiddenNodeIds ?? []);
  const hiddenEdgeIds = new Set(view.hiddenEdgeIds ?? []);
  const nodePositions = positions(graph, view);
  const confirmedPairs = new Set(
    graph.enterpriseRelations.map(relation =>
      relation.applicationNodeId + "->" + relation.ledgerNodeId
    )
  );

  const nodes = graph.nodes
    .filter(node => !hiddenNodeIds.has(node.nodeId))
    .map(node => {
    const position = nodePositions.get(node.nodeId)!;
    return {
      id: node.nodeId,
      kind: node.kind === "APPLICATION" ? "application" : "ledger",
      label: semanticLabel(node.semanticRef.refId),
      shape: node.kind === "APPLICATION"
        ? "rectangle" as const
        : "rounded-rectangle" as const,
      x: position.x,
      y: position.y,
      width: 168,
      height: 68,
      readOnly: input.readOnly ?? false,
      detail: [
        node.kind,
        node.semanticRef.authority,
        node.semanticRef.kind,
        node.semanticRef.refId
      ].join(" · "),
      properties: [
        { key: "node.kind", label: "Node type", value: node.kind },
        {
          key: "semantic.authority",
          label: "Authority",
          value: node.semanticRef.authority
        },
        {
          key: "semantic.kind",
          label: "Reference type",
          value: node.semanticRef.kind
        },
        {
          key: "semantic.ref",
          label: "Reference",
          value: node.semanticRef.refId
        },
        {
          key: "semantic.version",
          label: "Reference version",
          value: node.semanticRef.versionRef ?? null
        }
      ]
    };
  });
  const visibleNodeIds = new Set(nodes.map(node => node.id));

  const guidanceEdges = graph.guidanceRelations
    .filter(relation =>
      !confirmedPairs.has(
        relation.applicationNodeId + "->" + relation.ledgerNodeId
      )
      && !hiddenEdgeIds.has("guidance-edge:" + relation.relationId)
      && visibleNodeIds.has(relation.applicationNodeId)
      && visibleNodeIds.has(relation.ledgerNodeId)
    )
    .map(relation => ({
      id: "guidance-edge:" + relation.relationId,
      source: relation.applicationNodeId,
      target: relation.ledgerNodeId,
      kind: "guidance",
      label: labels.guidance,
      style: "dashed" as const,
      detail: relation.source.kind + " · " + relation.source.sourceRef,
      properties: [
        { key: "authority", label: "Authority", value: "GUIDANCE" },
        { key: "relation.kind", label: "Relation type", value: relation.kind },
        {
          key: "applicationNodeId",
          label: "Application node",
          value: relation.applicationNodeId
        },
        {
          key: "ledgerNodeId",
          label: "Ledger node",
          value: relation.ledgerNodeId
        },
        { key: "source.kind", label: "Source type", value: relation.source.kind },
        {
          key: "source.ref",
          label: "Source reference",
          value: relation.source.sourceRef
        }
      ]
    }));

  const confirmedEdges = graph.enterpriseRelations
    .filter(relation =>
      !hiddenEdgeIds.has("enterprise-edge:" + relation.relationId)
      && visibleNodeIds.has(relation.applicationNodeId)
      && visibleNodeIds.has(relation.ledgerNodeId)
    )
    .map(relation => ({
    id: "enterprise-edge:" + relation.relationId,
    source: relation.applicationNodeId,
    target: relation.ledgerNodeId,
    kind: "enterprise-confirmed",
    label: labels.confirmed,
    style: "solid" as const,
    detail: [
      "Confirmed by " + relation.confirmedBySubjectId,
      relation.confirmedFromGuidanceRelationId
        ? "From " + relation.confirmedFromGuidanceRelationId
        : undefined
    ].filter(Boolean).join(" · "),
    properties: [
      { key: "authority", label: "Authority", value: "ENTERPRISE" },
      { key: "relation.kind", label: "Relation type", value: relation.kind },
      {
        key: "applicationNodeId",
        label: "Application node",
        value: relation.applicationNodeId
      },
      {
        key: "ledgerNodeId",
        label: "Ledger node",
        value: relation.ledgerNodeId
      },
      {
        key: "confirmedBy",
        label: "Confirmed by",
        value: relation.confirmedBySubjectId
      },
      {
        key: "confirmedAt",
        label: "Confirmed at",
        value: relation.confirmedAt
      },
      {
        key: "confirmedFromGuidanceRelationId",
        label: "Guidance source",
        value: relation.confirmedFromGuidanceRelationId ?? null
      }
    ]
  }));

  return {
    contractVersion: "0.1.0",
    resourceId: graph.graphId,
    revision: view.revision,
    lifecycleState: graph.state === "PUBLISHED"
      ? "SEMANTIC_PUBLISHED"
      : "DRAFT",
    nodes,
    edges: [...guidanceEdges, ...confirmedEdges],
    actions: []
  };
}
