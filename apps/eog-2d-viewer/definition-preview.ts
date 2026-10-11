import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  definition2dEditorRouteV010,
  type DefinitionProjectionArtifactSourceV010
} from "../../contracts/definition-projection.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceSelectionInspectionV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  edgeInspectionV010,
  nodeInspectionV010,
  parseReadOnly2dSelectionTargetV010,
  projectReadOnly2dArtifactStateV010
} from "./template-preview.js";
import {
  EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_ID,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_PACKAGE_ID
} from "./package.js";

export {
  EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE
} from "./package.js";

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value)) as JsonValue
  };
}

function failure(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "DEFINITION_2D_PREVIEW_FAILED",
      message
    }
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`DEFINITION_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function integerValue(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`DEFINITION_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value;
}

function optionalString(
  values: Record<string, JsonValue>,
  key: string
): string | undefined {
  const value = values[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`DEFINITION_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function artifact(
  source: DefinitionProjectionArtifactSourceV010,
  values: Record<string, JsonValue>
) {
  const value = source.get({
    enterpriseId: stringValue(values, "enterpriseId"),
    definitionId: stringValue(values, "definitionId"),
    definitionRevision: integerValue(values, "definitionRevision"),
    ...(optionalString(values, "projectionId")
      ? { projectionId: optionalString(values, "projectionId")! }
      : {})
  });
  if (!value) throw new Error("DEFINITION_2D_PREVIEW_NOT_FOUND");
  return value;
}

export function createEnterpriseDefinition2dPreviewPageV010(input: {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId?: string;
  title: string;
  camera?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  canEditProjection?: boolean;
  contextNavigation?: DiagramWorkspacePageV010["contextNavigation"];
  locale?: string;
}): DiagramWorkspacePageV010 {
  const zh = (input.locale ?? "").toLowerCase().startsWith("zh");
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_ID,
    title: `${zh ? "关系图" : "Relationship map"} · ${input.title}`,
    resourceId:
      `enterprise-definition:${input.enterpriseId}:${input.definitionId}@${input.definitionRevision}`
      + (input.projectionId ? `#${input.projectionId}` : ""),
    readCommand: {
      code: EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION,
      inputVersion: "0.1.0"
    },
    selectionReadCommand: {
      code: EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      enterpriseId: input.enterpriseId,
      definitionId: input.definitionId,
      definitionRevision: input.definitionRevision,
      ...(input.projectionId ? { projectionId: input.projectionId } : {})
    },
    ...(input.contextNavigation
      ? { contextNavigation: input.contextNavigation }
      : {}),
    ...(input.canEditProjection && input.projectionId
      ? {
          toolbarActions: [{
            id: "edit-projection",
            label: zh ? "编辑投影" : "Edit projection",
            route: definition2dEditorRouteV010({
              definitionId: input.definitionId,
              definitionRevision: input.definitionRevision,
              projectionId: input.projectionId
            }),
            primary: true
          }]
        }
      : {}),
    ...(input.camera ? { initialCamera: { ...input.camera } } : {}),
    viewInteraction: {
      zoom: true,
      pan: true
    },
    emptyMessage: zh
      ? "选择节点或关系查看属性。"
      : "Select a node or relation to inspect definition properties."
  };
}

export function createEnterpriseDefinition2dPreviewReadActionV010(input: {
  source: DefinitionProjectionArtifactSourceV010;
}): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const value = artifact(input.source, request.values);
        return success(
          request,
          projectReadOnly2dArtifactStateV010({
            resourceId:
              `enterprise-definition:${value.enterpriseId}:${value.definitionId}@${value.definitionRevision}`
              + (value.projectionId ? `#${value.projectionId}` : ""),
            revision: value.definitionRevision,
            lifecycleState: "ENTERPRISE_DEFINITION_PREVIEW",
            title: value.title,
            ...(value.diagram2d ? { diagram2d: value.diagram2d } : {}),
            notice:
              `Read-only Enterprise Context projection: ${value.title}.`
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export function createEnterpriseDefinition2dPreviewSelectionReadActionV010(
  input: { source: DefinitionProjectionArtifactSourceV010 }
): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const value = artifact(input.source, request.values);
        if (!value.diagram2d) {
          throw new Error("DEFINITION_2D_PREVIEW_NOT_AVAILABLE");
        }
        const target = parseReadOnly2dSelectionTargetV010(
          request.values.target
        );
        let inspection: DiagramWorkspaceSelectionInspectionV010;
        if (target.kind === "node") {
          const node = value.diagram2d.nodes.find(item => item.id === target.id);
          if (!node) throw new Error("DEFINITION_2D_PREVIEW_NODE_NOT_FOUND");
          inspection = nodeInspectionV010(node);
        } else {
          const edge = value.diagram2d.edges.find(item => item.id === target.id);
          if (!edge) throw new Error("DEFINITION_2D_PREVIEW_EDGE_NOT_FOUND");
          inspection = edgeInspectionV010(edge);
        }
        return success(request, inspection);
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
