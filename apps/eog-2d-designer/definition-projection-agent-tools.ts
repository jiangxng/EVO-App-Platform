import type {
  AgentToolDescriptorV010
} from "../../agents/enterprise-agent/contracts.js";
import type {
  EnterpriseAgentToolRegistrationV010
} from "../../agents/enterprise-agent/host-tool-catalog.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  DefinitionProjectionArtifactSourceV010,
  DefinitionProjectionSelectionV010,
  DefinitionProjectionSessionStoreV010
} from "../../contracts/definition-projection.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  DefinitionProjectionStoreV010
} from "../../providers/enterprise-context/definition-projection-store.js";
import {
  cropDefinitionProjectionToVisibleItemsV010
} from "./definition-projection-editor.js";
import {
  EOG_2D_DESIGNER_PACKAGE_ID
} from "./package.js";

function descriptor(
  input: Omit<AgentToolDescriptorV010, "contractVersion">
): AgentToolDescriptorV010 {
  return {
    contractVersion: "0.1.0",
    ...input
  };
}

function sessionKeys(principal: PlatformPrincipalV010): string[] {
  return [
    principal.sessionId?.trim(),
    principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function activeEnterpriseId(context: ResolvedContextSetV010): string {
  if (
    context.activeContext.kind !== "ENTERPRISE"
    || !context.activeContext.enterpriseId?.trim()
  ) {
    throw new Error("DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return context.activeContext.enterpriseId.trim();
}

function currentSelection(
  sessions: DefinitionProjectionSessionStoreV010,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010
): DefinitionProjectionSelectionV010 {
  const enterpriseId = activeEnterpriseId(context);
  for (const key of sessionKeys(principal)) {
    const selection = sessions.get(key);
    if (
      selection
      && selection.enterpriseId === enterpriseId
      && selection.projectionId?.trim()
    ) {
      return selection;
    }
  }
  throw new Error("CURRENT_DEFINITION_PROJECTION_EDITOR_REQUIRED");
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function searchableNodeText(node: {
  label: string;
  typeLabel?: string;
  detail?: string;
  properties?: Array<{ key: string; label: string; value: unknown }>;
}): string {
  return normalize([
    node.label,
    node.typeLabel ?? "",
    node.detail ?? "",
    ...(node.properties ?? []).flatMap(property => [
      property.key,
      property.label,
      String(property.value ?? "")
    ])
  ].join(" "));
}

function resolveNodeByTerm(
  nodes: Array<{
    id: string;
    label: string;
    typeLabel?: string;
    detail?: string;
    properties?: Array<{ key: string; label: string; value: unknown }>;
  }>,
  term: string
) {
  const query = normalize(term);
  if (!query) throw new Error("DEFINITION_PROJECTION_FOCUS_TERM_REQUIRED");

  const scored = nodes
    .map(node => {
      const label = normalize(node.label);
      const text = searchableNodeText(node);
      const score = label === query
        ? 100
        : label.includes(query)
          ? 90
          : text.includes(query)
            ? 70
            : query.includes(label) && label.length >= 2
              ? 50
              : 0;
      return { node, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || a.node.label.localeCompare(b.node.label)
      || a.node.id.localeCompare(b.node.id)
    );

  if (scored.length === 0) {
    throw new Error(
      "DEFINITION_PROJECTION_FOCUS_TERM_NOT_FOUND:" + term
    );
  }
  const best = scored[0]!;
  const tied = scored.filter(item => item.score === best.score);
  if (tied.length > 1) {
    throw new Error(
      "DEFINITION_PROJECTION_FOCUS_TERM_AMBIGUOUS:"
      + term
      + ":"
      + tied.slice(0, 5).map(item => item.node.label).join("|")
    );
  }
  return best.node;
}

function directedShortestPath(input: {
  nodes: Array<{ id: string }>;
  edges: Array<{ id: string; source: string; target: string }>;
  startId: string;
  endId: string;
}): { nodeIds: string[]; edgeIds: string[] } {
  if (input.startId === input.endId) {
    return { nodeIds: [input.startId], edgeIds: [] };
  }

  const adjacency = new Map<string, Array<{ id: string; target: string }>>();
  for (const edge of input.edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push({ id: edge.id, target: edge.target });
    adjacency.set(edge.source, list);
  }
  for (const list of adjacency.values()) {
    list.sort((a, b) =>
      a.target.localeCompare(b.target) || a.id.localeCompare(b.id)
    );
  }

  const queue = [input.startId];
  const visited = new Set(queue);
  const previous = new Map<string, { nodeId: string; edgeId: string }>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of adjacency.get(current) ?? []) {
      if (visited.has(edge.target)) continue;
      visited.add(edge.target);
      previous.set(edge.target, {
        nodeId: current,
        edgeId: edge.id
      });
      if (edge.target === input.endId) {
        const nodeIds = [input.endId];
        const edgeIds: string[] = [];
        let cursor = input.endId;
        while (cursor !== input.startId) {
          const step = previous.get(cursor);
          if (!step) {
            throw new Error("DEFINITION_PROJECTION_FOCUS_PATH_NOT_FOUND");
          }
          edgeIds.unshift(step.edgeId);
          nodeIds.unshift(step.nodeId);
          cursor = step.nodeId;
        }
        return { nodeIds, edgeIds };
      }
      queue.push(edge.target);
    }
  }

  throw new Error("DEFINITION_PROJECTION_FOCUS_PATH_NOT_FOUND");
}

export function createDefinitionProjectionAgentToolRegistrationsV010(input: {
  repository: BusinessDefinitionRepositoryV010;
  projectionStore: DefinitionProjectionStoreV010;
  source: DefinitionProjectionArtifactSourceV010;
  sessions: DefinitionProjectionSessionStoreV010;
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
  locale?: string;
  isDesignerActive?: () => boolean;
  canManageEnterpriseContext?: (
    principal: PlatformPrincipalV010,
    contextId: string
  ) => boolean;
  onProjectionUpdated?: (input: {
    selection: DefinitionProjectionSelectionV010;
    resourceId: string;
    visibleNodeIds: readonly string[];
    visibleEdgeIds: readonly string[];
  }) => void;
  now?: () => Date;
}): EnterpriseAgentToolRegistrationV010[] {
  const now = input.now ?? (() => new Date());
  const currentAvailable = () => {
    if (!(input.isDesignerActive?.() ?? true)) return false;
    if (input.context.activeContext.kind !== "ENTERPRISE") return false;
    try {
      currentSelection(input.sessions, input.principal, input.context);
      return true;
    } catch {
      return false;
    }
  };

  const readCurrent = () => {
    const selection = currentSelection(
      input.sessions,
      input.principal,
      input.context
    );
    const latest = input.repository.getLatest({
      enterpriseId: selection.enterpriseId,
      definitionId: selection.definitionId
    });
    if (!latest) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
    if (latest.revision !== selection.definitionRevision) {
      throw new Error("DEFINITION_PROJECTION_REVISION_CONFLICT");
    }
    const artifact = input.source.get({
      enterpriseId: selection.enterpriseId,
      definitionId: selection.definitionId,
      definitionRevision: selection.definitionRevision,
      projectionId: selection.projectionId,
      includeHidden: true
    });
    if (!artifact?.diagram2d) {
      throw new Error("DEFINITION_PROJECTION_DIAGRAM_NOT_AVAILABLE");
    }
    const gallery = input.projectionStore.get({
      enterpriseId: selection.enterpriseId,
      definitionId: selection.definitionId,
      definitionRevision: selection.definitionRevision
    }) ?? latest.projectionGallery;
    if (!gallery) {
      throw new Error("DEFINITION_PROJECTION_GALLERY_REQUIRED");
    }
    return { selection, latest, artifact, gallery };
  };

  return [{
    descriptor: descriptor({
      id: "enterprise.definition_projection.current.get",
      modelName: "enterprise_definition_projection_current_get",
      title: "Current 2D Projection material",
      description: "Read the complete material behind the currently open 2D Definition Projection Editor, including nodes and relations currently hidden from the projection. Use this when the Human refers to 'current', 'this diagram', 'this projection', or asks to crop/focus the open editor.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      effect: "READ",
      ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
      capability: "enterprise.business-definition.projection.read"
    }),
    available: currentAvailable,
    execute() {
      const { selection, artifact } = readCurrent();
      const hiddenNodes = new Set(artifact.hiddenNodeIds ?? []);
      const hiddenEdges = new Set(artifact.hiddenEdgeIds ?? []);
      return {
        selection,
        projection: {
          projectionId: selection.projectionId,
          title: artifact.title,
          definitionId: artifact.definitionId,
          definitionRevision: artifact.definitionRevision
        },
        nodes: artifact.diagram2d!.nodes.map(node => ({
          id: node.id,
          label: node.label,
          kind: node.kind,
          ...(node.typeLabel ? { typeLabel: node.typeLabel } : {}),
          ...(node.detail ? { detail: node.detail } : {}),
          ...(node.properties ? { properties: node.properties } : {}),
          hidden: hiddenNodes.has(node.id)
        })),
        edges: artifact.diagram2d!.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          kind: edge.kind,
          ...(edge.label ? { label: edge.label } : {}),
          hidden: hiddenEdges.has(edge.id)
        }))
      };
    }
  }, {
    descriptor: descriptor({
      id: "enterprise.definition_projection.current.focus_path",
      modelName: "enterprise_definition_projection_current_focus_path",
      title: "Focus current 2D Projection on a path",
      description: "Directly crop the currently open 2D Definition Projection to the deterministic directed path between two Human business terms found in the current material. Use for requests such as '裁剪出从销售到收款的投影' or 'focus this diagram from order to cash'. This changes only Projection presentation state, never the Business Definition.",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Human term identifying the start node, for example 销售 or Sales."
          },
          to: {
            type: "string",
            description: "Human term identifying the end node, for example 收款 or Cash collection."
          }
        },
        required: ["from", "to"],
        additionalProperties: false
      },
      effect: "WRITE",
      ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
      capability: "enterprise.business-definition.projection.write"
    }),
    available: currentAvailable,
    execute(args) {
      const from = typeof args.from === "string" ? args.from.trim() : "";
      const to = typeof args.to === "string" ? args.to.trim() : "";
      if (!from || !to) {
        throw new Error("DEFINITION_PROJECTION_FOCUS_TERM_REQUIRED");
      }

      const active = input.context.activeContext;
      if (
        active.kind !== "ENTERPRISE"
        || !input.canManageEnterpriseContext?.(
          input.principal,
          active.contextId
        )
      ) {
        throw new Error("DEFINITION_PROJECTION_MANAGE_ROLE_REQUIRED");
      }

      const { selection, latest, artifact, gallery } = readCurrent();
      const diagram = artifact.diagram2d!;
      const start = resolveNodeByTerm(diagram.nodes, from);
      const end = resolveNodeByTerm(diagram.nodes, to);
      const path = directedShortestPath({
        nodes: diagram.nodes,
        edges: diagram.edges,
        startId: start.id,
        endId: end.id
      });

      const nextGallery = cropDefinitionProjectionToVisibleItemsV010({
        gallery,
        projectionId: selection.projectionId!,
        diagram,
        visibleNodeIds: path.nodeIds,
        visibleEdgeIds: path.edgeIds,
        locale: input.locale
      });
      const recordedAt = now().toISOString();
      input.projectionStore.put({
        enterpriseId: latest.enterpriseId,
        definitionId: latest.definitionId,
        definitionRevision: latest.revision,
        gallery: nextGallery,
        updatedAt: recordedAt,
        updatedBySubjectId: input.principal.subjectId
      });

      const nextSelection: DefinitionProjectionSelectionV010 = {
        ...selection,
        selectedAt: recordedAt
      };
      for (const key of sessionKeys(input.principal)) {
        input.sessions.set(key, nextSelection);
      }

      const resourceId =
        `enterprise-definition:${selection.enterpriseId}:${selection.definitionId}@${selection.definitionRevision}#${selection.projectionId}`;
      input.onProjectionUpdated?.({
        selection: nextSelection,
        resourceId,
        visibleNodeIds: path.nodeIds,
        visibleEdgeIds: path.edgeIds
      });

      const byNodeId = new Map(diagram.nodes.map(node => [node.id, node]));
      return {
        changed: true,
        projectionId: selection.projectionId,
        definitionId: selection.definitionId,
        definitionRevision: selection.definitionRevision,
        from: {
          id: start.id,
          label: start.label
        },
        to: {
          id: end.id,
          label: end.label
        },
        visibleNodes: path.nodeIds.map(id => ({
          id,
          label: byNodeId.get(id)?.label ?? id
        })),
        visibleEdgeIds: path.edgeIds,
        hiddenNodeCount: diagram.nodes.length - path.nodeIds.length,
        hiddenEdgeCount: diagram.edges.length - path.edgeIds.length,
        resourceId
      };
    }
  }];
}
