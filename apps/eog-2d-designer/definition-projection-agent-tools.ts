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
    const stored = input.projectionStore.getVersioned({
      enterpriseId: selection.enterpriseId,
      definitionId: selection.definitionId,
      definitionRevision: selection.definitionRevision
    });
    const gallery = stored.gallery ?? latest.projectionGallery;
    if (!gallery) {
      throw new Error("DEFINITION_PROJECTION_GALLERY_REQUIRED");
    }
    return { selection, latest, artifact, gallery, writeToken: String(stored.version) };
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
      const { selection, artifact, writeToken } = readCurrent();
      const hiddenNodes = new Set(artifact.hiddenNodeIds ?? []);
      const hiddenEdges = new Set(artifact.hiddenEdgeIds ?? []);
      return {
        selection,
        writeToken,
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
      id: "enterprise.definition_projection.current.crop",
      modelName: "enterprise_definition_projection_current_crop",
      title: "Crop current 2D Projection",
      description: "Directly update the currently open 2D Definition Projection to keep only the node and relation IDs selected from the current material. Read enterprise.definition_projection.current.get first, reason over the Human request and current material, then pass the exact visible IDs. This changes only Projection presentation state, never the Business Definition. No mouse interaction is required.",
      inputSchema: {
        type: "object",
        properties: {
          visibleNodeIds: {
            type: "array",
            items: { type: "string" },
            description: "Exact node IDs to keep visible in the current Projection."
          },
          visibleEdgeIds: {
            type: "array",
            items: { type: "string" },
            description: "Exact relation IDs to keep visible. Every kept relation must connect two kept nodes."
          },
          rationale: {
            type: "string",
            description: "Short explanation of how the retained material matches the Human request."
          },
          expectedWriteToken: {
            type: "string",
            description: "Exact writeToken from current.get, required for conflict-safe editing."
          }
        },
        required: ["visibleNodeIds", "visibleEdgeIds", "expectedWriteToken"],
        additionalProperties: false
      },
      effect: "WRITE",
      ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
      capability: "enterprise.business-definition.projection.write"
    }),
    available: currentAvailable,
    execute(args) {
      if (typeof args.expectedWriteToken !== "string"
        || !/^(0|[1-9][0-9]*)$/.test(args.expectedWriteToken)
        || !Number.isSafeInteger(Number(args.expectedWriteToken))) {
        throw new Error("DEFINITION_PROJECTION_WRITE_TOKEN_REQUIRED");
      }
      const visibleNodeIds = Array.isArray(args.visibleNodeIds)
        ? args.visibleNodeIds.map(value =>
            typeof value === "string" ? value.trim() : ""
          ).filter(Boolean)
        : [];
      const visibleEdgeIds = Array.isArray(args.visibleEdgeIds)
        ? args.visibleEdgeIds.map(value =>
            typeof value === "string" ? value.trim() : ""
          ).filter(Boolean)
        : [];
      if (visibleNodeIds.length < 1) {
        throw new Error("DEFINITION_PROJECTION_VISIBLE_NODES_REQUIRED");
      }
      if (
        visibleNodeIds.length !== new Set(visibleNodeIds).size
        || visibleEdgeIds.length !== new Set(visibleEdgeIds).size
      ) {
        throw new Error("DEFINITION_PROJECTION_VISIBLE_ITEMS_DUPLICATE");
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

      const { selection, latest, artifact, gallery, writeToken } = readCurrent();
      if (args.expectedWriteToken !== writeToken) {
        throw new Error("DEFINITION_PROJECTION_WRITE_CONFLICT");
      }
      const diagram = artifact.diagram2d!;
      const nextGallery = cropDefinitionProjectionToVisibleItemsV010({
        gallery,
        projectionId: selection.projectionId!,
        diagram,
        visibleNodeIds,
        visibleEdgeIds,
        locale: input.locale
      });
      const recordedAt = now().toISOString();
      input.projectionStore.putIfVersion({
        enterpriseId: latest.enterpriseId,
        definitionId: latest.definitionId,
        definitionRevision: latest.revision,
        gallery: nextGallery,
        updatedAt: recordedAt,
        updatedBySubjectId: input.principal.subjectId
      }, Number(args.expectedWriteToken));

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
        visibleNodeIds,
        visibleEdgeIds
      });

      const nodeById = new Map(diagram.nodes.map(node => [node.id, node]));
      const edgeById = new Map(diagram.edges.map(edge => [edge.id, edge]));
      return {
        changed: true,
        projectionId: selection.projectionId,
        definitionId: selection.definitionId,
        definitionRevision: selection.definitionRevision,
        visibleNodes: visibleNodeIds.map(id => ({
          id,
          label: nodeById.get(id)?.label ?? id
        })),
        visibleRelations: visibleEdgeIds.map(id => {
          const edge = edgeById.get(id);
          return {
            id,
            ...(edge
              ? {
                  source: edge.source,
                  target: edge.target,
                  ...(edge.label ? { label: edge.label } : {})
                }
              : {})
          };
        }),
        hiddenNodeCount: diagram.nodes.length - visibleNodeIds.length,
        hiddenEdgeCount: diagram.edges.length - visibleEdgeIds.length,
        ...(typeof args.rationale === "string" && args.rationale.trim()
          ? { rationale: args.rationale.trim() }
          : {}),
        resourceId
      };
    }
  }];
}
