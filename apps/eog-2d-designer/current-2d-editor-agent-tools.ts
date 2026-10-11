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
  Current2dEditorSessionStoreV010,
  Current2dEditorTargetV010
} from "../../contracts/current-2d-editor.js";
import type {
  DefinitionProjectionArtifactSourceV010
} from "../../contracts/definition-projection.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewStateV010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  DefinitionProjectionStoreV010
} from "../../providers/enterprise-context/definition-projection-store.js";
import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../eog/diagram-projection.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
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

function currentTarget(
  store: Current2dEditorSessionStoreV010,
  principal: PlatformPrincipalV010
): Current2dEditorTargetV010 {
  for (const key of sessionKeys(principal)) {
    const target = store.get(key);
    if (target) return target;
  }
  throw new Error("CURRENT_2D_EDITOR_REQUIRED");
}

function exactStringArray(
  value: unknown,
  code: string,
  required = true
): string[] {
  if (value === undefined && !required) return [];
  if (!Array.isArray(value)) throw new Error(code);
  const result = value.map(item => {
    if (typeof item !== "string" || !item.trim()) throw new Error(code);
    return item.trim();
  });
  if (new Set(result).size !== result.length) {
    throw new Error(code + "_DUPLICATE");
  }
  if (required && result.length === 0) throw new Error(code);
  return result;
}

function ensureRetainedSet(input: {
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  nodes: readonly { id: string }[];
  edges: readonly { id: string; source: string; target: string }[];
}): void {
  const allNodeIds = new Set(input.nodes.map(node => node.id));
  const allEdgeIds = new Set(input.edges.map(edge => edge.id));
  if (input.nodeIds.some(id => !allNodeIds.has(id))) {
    throw new Error("CURRENT_2D_EDITOR_VISIBLE_NODE_NOT_FOUND");
  }
  if (input.edgeIds.some(id => !allEdgeIds.has(id))) {
    throw new Error("CURRENT_2D_EDITOR_VISIBLE_EDGE_NOT_FOUND");
  }
  const visibleNodeIds = new Set(input.nodeIds);
  const edgeById = new Map(input.edges.map(edge => [edge.id, edge] as const));
  for (const id of input.edgeIds) {
    const edge = edgeById.get(id)!;
    if (
      !visibleNodeIds.has(edge.source)
      || !visibleNodeIds.has(edge.target)
    ) {
      throw new Error("CURRENT_2D_EDITOR_VISIBLE_EDGE_ENDPOINT_HIDDEN");
    }
  }
}

function completeOperatingGraphDiagram(input: {
  graph: ReturnType<EnterpriseOperatingGraphHostServiceV010["get"]>;
  view: EnterpriseOperatingGraphViewStateV010;
  locale?: string;
}) {
  return projectEnterpriseOperatingGraphDiagramBaseV010({
    graph: input.graph,
    view: {
      ...structuredClone(input.view),
      hiddenNodeIds: [],
      hiddenEdgeIds: []
    },
    locale: input.locale,
    readOnly: false
  });
}

export function createCurrent2dEditorAgentToolRegistrationsV010(input: {
  currentEditors: Current2dEditorSessionStoreV010;
  graphService: EnterpriseOperatingGraphHostServiceV010;
  graphViewService: EnterpriseOperatingGraphViewStateProviderV010;
  definitionRepository: BusinessDefinitionRepositoryV010;
  definitionProjectionStore: DefinitionProjectionStoreV010;
  definitionProjectionSource: DefinitionProjectionArtifactSourceV010;
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
  locale?: string;
  isDesignerActive?: () => boolean;
  canAccessEnterprise?: (
    principal: PlatformPrincipalV010,
    enterpriseId: string
  ) => boolean;
  canManageEnterprise?: (
    principal: PlatformPrincipalV010,
    enterpriseId: string
  ) => boolean;
  onEditorUpdated?: (input: {
    target: Current2dEditorTargetV010;
    resourceId: string;
    version?: string | number;
    visibleNodeIds: readonly string[];
    visibleEdgeIds: readonly string[];
  }) => void;
  now?: () => Date;
}): EnterpriseAgentToolRegistrationV010[] {
  const now = input.now ?? (() => new Date());
  const available = () => {
    if (!(input.isDesignerActive?.() ?? true)) return false;
    try {
      const target = currentTarget(input.currentEditors, input.principal);
      return input.canAccessEnterprise?.(
        input.principal,
        target.enterpriseId
      ) ?? true;
    } catch {
      return false;
    }
  };

  const read = () => {
    const target = currentTarget(
      input.currentEditors,
      input.principal
    );
    if (
      input.canAccessEnterprise
      && !input.canAccessEnterprise(input.principal, target.enterpriseId)
    ) {
      throw new Error("CURRENT_2D_EDITOR_ENTERPRISE_ACCESS_REQUIRED");
    }

    if (target.kind === "OPERATING_GRAPH") {
      const graph = input.graphService.get({
        enterpriseId: target.enterpriseId,
        graphId: target.graphId
      });
      const view = input.graphViewService.ensure({
        enterpriseId: target.enterpriseId,
        graphId: target.graphId,
        viewId: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
        kind: "DIAGRAM_2D"
      });
      const diagram = completeOperatingGraphDiagram({
        graph,
        view,
        locale: input.locale
      });
      return {
        target,
        kind: target.kind,
        graph,
        view,
        diagram,
        hiddenNodeIds: [...(view.hiddenNodeIds ?? [])],
        hiddenEdgeIds: [...(view.hiddenEdgeIds ?? [])]
      } as const;
    }

    const latest = input.definitionRepository.getLatest({
      enterpriseId: target.enterpriseId,
      definitionId: target.definitionId
    });
    if (!latest) throw new Error("CURRENT_2D_EDITOR_DEFINITION_NOT_FOUND");
    if (latest.revision !== target.definitionRevision) {
      throw new Error("CURRENT_2D_EDITOR_DEFINITION_REVISION_CONFLICT");
    }
    const artifact = input.definitionProjectionSource.get({
      enterpriseId: target.enterpriseId,
      definitionId: target.definitionId,
      definitionRevision: target.definitionRevision,
      projectionId: target.projectionId,
      includeHidden: true
    });
    if (!artifact?.diagram2d) {
      throw new Error("CURRENT_2D_EDITOR_DIAGRAM_NOT_AVAILABLE");
    }
    const stored = input.definitionProjectionStore.getVersioned({
      enterpriseId: target.enterpriseId,
      definitionId: target.definitionId,
      definitionRevision: target.definitionRevision
    });
    const gallery = stored.gallery ?? latest.projectionGallery;
    if (!gallery) throw new Error("CURRENT_2D_EDITOR_GALLERY_REQUIRED");
    return {
      target,
      kind: target.kind,
      latest,
      artifact,
      gallery,
      writeToken: String(stored.version),
      diagram: artifact.diagram2d,
      hiddenNodeIds: [...(artifact.hiddenNodeIds ?? [])],
      hiddenEdgeIds: [...(artifact.hiddenEdgeIds ?? [])]
    } as const;
  };

  return [{
    descriptor: descriptor({
      id: "enterprise.current_2d_editor.get",
      modelName: "enterprise_current_2d_editor_get",
      title: "Current 2D editor material",
      description: "Read the complete material behind the 2D editor the Human most recently opened in the current Workbench session. The current editor supplies its own enterprise resource scope even when Personal Agent conversation/memory context is Personal. The Host resolves whether it is an Enterprise Operating Graph editor or a Definition Projection editor. Includes currently hidden nodes/relations so the model can reason about a requested crop.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      effect: "READ",
      ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
      capability: "enterprise.operating-graph.designer.2d"
    }),
    available,
    execute() {
      const current = read();
      const hiddenNodeIds = new Set(current.hiddenNodeIds);
      const hiddenEdgeIds = new Set(current.hiddenEdgeIds);
      return {
        currentEditor: structuredClone(current.target),
        writeToken: current.kind === "DEFINITION_PROJECTION"
          ? current.writeToken : String(current.view.revision),
        nodes: current.diagram.nodes.map(node => ({
          id: node.id,
          label: node.label,
          kind: node.kind,
          ...(node.typeLabel ? { typeLabel: node.typeLabel } : {}),
          ...(node.detail ? { detail: node.detail } : {}),
          ...(node.properties ? { properties: node.properties } : {}),
          hidden: hiddenNodeIds.has(node.id)
        })),
        edges: current.diagram.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          kind: edge.kind,
          ...(edge.label ? { label: edge.label } : {}),
          ...(edge.detail ? { detail: edge.detail } : {}),
          ...(edge.properties ? { properties: edge.properties } : {}),
          hidden: hiddenEdgeIds.has(edge.id)
        }))
      };
    }
  }, {
    descriptor: descriptor({
      id: "enterprise.current_2d_editor.crop",
      modelName: "enterprise_current_2d_editor_crop",
      title: "Crop current 2D editor",
      description: "Directly change only the projection/visibility state of the Human's current 2D editor. Read enterprise.current_2d_editor.get first, reason over the Human request and complete material, then send the exact node and relation IDs to keep visible. Never simulates mouse actions and never rewrites semantic business truth.",
      inputSchema: {
        type: "object",
        properties: {
          visibleNodeIds: {
            type: "array",
            items: { type: "string" },
            description: "Exact current-material node IDs to keep visible."
          },
          visibleEdgeIds: {
            type: "array",
            items: { type: "string" },
            description: "Exact current-material relation IDs to keep visible."
          },
          rationale: {
            type: "string",
            description: "Short explanation of why the retained material matches the Human request."
          },
          expectedWriteToken: {
            type: "string",
            description: "Opaque token returned by enterprise.current_2d_editor.get; required to avoid overwriting edits made after the model read."
          }
        },
        required: ["visibleNodeIds", "visibleEdgeIds", "expectedWriteToken"],
        additionalProperties: false
      },
      effect: "WRITE",
      ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
      capability: "enterprise.operating-graph.designer.2d"
    }),
    available,
    execute(args) {
      if (typeof args.expectedWriteToken !== "string"
        || !/^(0|[1-9][0-9]*)$/.test(args.expectedWriteToken)
        || !Number.isSafeInteger(Number(args.expectedWriteToken))) {
        throw new Error("CURRENT_2D_EDITOR_WRITE_TOKEN_REQUIRED");
      }
      const visibleNodeIds = exactStringArray(
        args.visibleNodeIds,
        "CURRENT_2D_EDITOR_VISIBLE_NODES_REQUIRED"
      );
      const visibleEdgeIds = exactStringArray(
        args.visibleEdgeIds,
        "CURRENT_2D_EDITOR_VISIBLE_EDGES_INVALID",
        false
      );
      const current = read();
      ensureRetainedSet({
        nodeIds: visibleNodeIds,
        edgeIds: visibleEdgeIds,
        nodes: current.diagram.nodes,
        edges: current.diagram.edges
      });

      if (
        input.canManageEnterprise
        && !input.canManageEnterprise(
          input.principal,
          current.target.enterpriseId
        )
      ) {
        throw new Error("CURRENT_2D_EDITOR_MANAGE_ROLE_REQUIRED");
      }

      let version: number | undefined;
      if (current.kind === "OPERATING_GRAPH") {
        if (Number(args.expectedWriteToken) !== current.view.revision) {
          throw new Error("CURRENT_2D_EDITOR_WRITE_CONFLICT");
        }
        const hiddenNodeIds = current.diagram.nodes
          .filter(node => !visibleNodeIds.includes(node.id))
          .map(node => node.id);
        const hiddenEdgeIds = current.diagram.edges
          .filter(edge =>
            !visibleEdgeIds.includes(edge.id)
            || !visibleNodeIds.includes(edge.source)
            || !visibleNodeIds.includes(edge.target)
          )
          .map(edge => edge.id);
        const next = input.graphViewService.apply({
          enterpriseId: current.target.enterpriseId,
          graphId: current.target.graphId,
          viewId: current.view.viewId,
          expectedRevision: current.view.revision,
          mutation: {
            type: "PROJECTION_VISIBILITY_REPLACE",
            hiddenNodeIds,
            hiddenEdgeIds
          },
          occurredAt: now().toISOString()
        });
        version = next.revision;
      } else {
        if (args.expectedWriteToken !== current.writeToken) {
          throw new Error("DEFINITION_PROJECTION_WRITE_CONFLICT");
        }
        const nextGallery = cropDefinitionProjectionToVisibleItemsV010({
          gallery: current.gallery,
          projectionId: current.target.projectionId,
          diagram: current.diagram,
          visibleNodeIds,
          visibleEdgeIds,
          locale: input.locale
        });
        const recordedAt = now().toISOString();
        const committed = input.definitionProjectionStore.putIfVersion({
          enterpriseId: current.latest.enterpriseId,
          definitionId: current.latest.definitionId,
          definitionRevision: current.latest.revision,
          gallery: nextGallery,
          updatedAt: recordedAt,
          updatedBySubjectId: input.principal.subjectId
        }, Number(args.expectedWriteToken));
        version = committed.version;
      }

      input.onEditorUpdated?.({
        target: structuredClone(current.target),
        resourceId: current.target.resourceId,
        ...(version === undefined ? {} : { version }),
        visibleNodeIds,
        visibleEdgeIds
      });

      const nodeById = new Map(
        current.diagram.nodes.map(node => [node.id, node] as const)
      );
      return {
        changed: true,
        currentEditor: structuredClone(current.target),
        visibleNodes: visibleNodeIds.map(id => ({
          id,
          label: nodeById.get(id)?.label ?? id
        })),
        visibleEdgeIds,
        hiddenNodeCount: current.diagram.nodes.length - visibleNodeIds.length,
        hiddenEdgeCount: current.diagram.edges.length - visibleEdgeIds.length,
        ...(typeof args.rationale === "string" && args.rationale.trim()
          ? { rationale: args.rationale.trim() }
          : {})
      };
    }
  }];
}
