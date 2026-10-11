import type {
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import type {
  EnterpriseOperatingGraphViewStateV010
} from "../contracts/enterprise-operating-graph-view.js";
import type {
  SpatialWorkspaceStateV010
} from "../vendor/eidos/src/3d/index.js";

function label(refId: string): string {
  return (refId.split(":").filter(Boolean).at(-1) ?? refId)
    .replaceAll(/[-_.]+/gu, " ")
    .replaceAll(/\b\w/gu, value => value.toUpperCase());
}

function placements(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010
): Map<string, { x: number; y: number; z: number }> {
  const explicit = new Map(
    view.placements.map(item => [
      item.nodeId,
      { x: item.x, y: item.y, z: item.z ?? 0 }
    ])
  );
  let applicationIndex = 0;
  let ledgerIndex = 0;

  for (const node of graph.nodes) {
    if (explicit.has(node.nodeId)) continue;
    if (node.kind === "APPLICATION") {
      explicit.set(node.nodeId, {
        x: (applicationIndex % 5) * 240 - 480,
        y: Math.floor(applicationIndex / 5) * 170 - 80,
        z: 180
      });
      applicationIndex += 1;
    } else {
      explicit.set(node.nodeId, {
        x: (ledgerIndex % 5) * 240 - 480,
        y: Math.floor(ledgerIndex / 5) * 170 + 80,
        z: -180
      });
      ledgerIndex += 1;
    }
  }

  return explicit;
}

export function projectEnterpriseOperatingGraphSpatialBaseV010(input: {
  graph: EnterpriseOperatingGraphV010;
  view: EnterpriseOperatingGraphViewStateV010;
}): SpatialWorkspaceStateV010 {
  if (
    input.view.kind !== "SPATIAL_3D"
    || input.view.graphId !== input.graph.graphId
    || input.view.enterpriseId !== input.graph.enterpriseId
  ) {
    throw new Error("EOG_SPATIAL_VIEW_IDENTITY_MISMATCH");
  }

  const positions = placements(input.graph, input.view);
  const confirmedPairs = new Set(
    input.graph.enterpriseRelations.map(
      relation => relation.applicationNodeId + "->" + relation.ledgerNodeId
    )
  );

  const objects = input.graph.nodes.map(node => ({
    id: node.nodeId,
    kind: node.kind === "APPLICATION" ? "application" : "ledger",
    label: label(node.semanticRef.refId),
    position: positions.get(node.nodeId)!,
    detail: [
      node.kind,
      node.semanticRef.authority,
      node.semanticRef.kind,
      node.semanticRef.refId
    ].join(" · ")
  }));

  const links = [
    ...input.graph.guidanceRelations
      .filter(relation =>
        !confirmedPairs.has(
          relation.applicationNodeId + "->" + relation.ledgerNodeId
        )
      )
      .map(relation => ({
        id: "guidance-edge:" + relation.relationId,
        source: relation.applicationNodeId,
        target: relation.ledgerNodeId,
        kind: "guidance",
        label: "Guidance",
        detail: relation.source.kind + " · " + relation.source.sourceRef
      })),
    ...input.graph.enterpriseRelations.map(relation => ({
      id: "enterprise-edge:" + relation.relationId,
      source: relation.applicationNodeId,
      target: relation.ledgerNodeId,
      kind: "enterprise-confirmed",
      label: "Confirmed",
      detail: [
        "Confirmed by " + relation.confirmedBySubjectId,
        relation.confirmedAt
      ].join(" · ")
    }))
  ];

  return {
    contractVersion: "0.1.0",
    resourceId: input.graph.graphId,
    revision: input.view.revision,
    objects,
    links,
    camera: input.view.camera ?? {
      position: { x: 900, y: 620, z: 1150 },
      target: { x: 0, y: 0, z: 0 }
    },
    notice: "Enterprise Operating Graph 3D Viewer. Spatial View State does not change enterprise semantic truth."
  };
}
