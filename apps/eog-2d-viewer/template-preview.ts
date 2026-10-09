import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  Template2dPreviewV010,
  TemplatePreviewArtifactSourceV010,
  TemplatePreviewArtifactV010,
  TemplatePreviewEdgeV010,
  TemplatePreviewNodeV010
} from "../../contracts/template-preview.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceSelectionInspectionV010,
  DiagramWorkspaceStateV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  EOG_2D_PACKAGE_ID as EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION
} from "../eog-2d/package.js";

export {
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE
} from "../eog-2d/package.js";

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
        : "TEMPLATE_2D_PREVIEW_FAILED",
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
    throw new Error(`TEMPLATE_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function optionalStringValue(
  values: Record<string, JsonValue>,
  key: string
): string | undefined {
  const value = values[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`TEMPLATE_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function positiveInteger(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 1
  ) {
    throw new Error(`TEMPLATE_2D_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value;
}

function artifact(
  source: TemplatePreviewArtifactSourceV010,
  values: Record<string, JsonValue>
): TemplatePreviewArtifactV010 {
  const templateId = stringValue(values, "templateId");
  const templateVersion = positiveInteger(values, "templateVersion");
  const projectionId = optionalStringValue(values, "projectionId");
  const value = source.get({
    templateId,
    templateVersion,
    ...(projectionId ? { projectionId } : {})
  });
  if (!value) throw new Error("TEMPLATE_2D_PREVIEW_NOT_FOUND");
  return value;
}

export function projectReadOnly2dArtifactStateV010(input: {
  resourceId: string;
  revision: number;
  lifecycleState: string;
  title: string;
  diagram2d?: Template2dPreviewV010;
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
      actions: [],
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
      ...(edge.pathKind ? { pathKind: edge.pathKind } : {}),
      ...(edge.detail ? { detail: edge.detail } : {}),
      ...(edge.properties
        ? { properties: edge.properties.map(property => ({ ...property })) }
        : {})
    })),
    actions: [],
    notice: input.notice
  };
}

function state(
  value: TemplatePreviewArtifactV010
): DiagramWorkspaceStateV010 {
  return projectReadOnly2dArtifactStateV010({
    resourceId:
      `template-store:${value.templateId}@${value.templateVersion}`
      + (value.projectionId ? `#${value.projectionId}` : ""),
    revision: value.templateVersion,
    lifecycleState: "TEMPLATE_PREVIEW",
    title: value.title,
    ...(value.diagram2d ? { diagram2d: value.diagram2d } : {}),
    notice:
      `Read-only Template Store preview: ${value.title}. `
      + "Preview does not copy or modify Enterprise Context."
  });
}

export function parseReadOnly2dSelectionTargetV010(
  value: JsonValue | undefined
): { kind: "node" | "edge"; id: string } {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw new Error("TEMPLATE_2D_PREVIEW_SELECTION_INVALID");
  }
  const target = value as Record<string, JsonValue>;
  const kind = target.kind;
  const id = target.id;
  if (
    (kind !== "node" && kind !== "edge")
    || typeof id !== "string"
    || !id.trim()
  ) {
    throw new Error("TEMPLATE_2D_PREVIEW_SELECTION_INVALID");
  }
  return { kind, id: id.trim() };
}

export function nodeInspectionV010(
  node: TemplatePreviewNodeV010
): DiagramWorkspaceSelectionInspectionV010 {
  return {
    contractVersion: "0.1.0",
    target: { kind: "node", id: node.id },
    properties: node.properties?.map(property => ({ ...property })) ?? [{
      key: "kind",
      label: "Kind",
      value: node.kind
    }, {
      key: "label",
      label: "Label",
      value: node.label
    }]
  };
}

export function edgeInspectionV010(
  edge: TemplatePreviewEdgeV010
): DiagramWorkspaceSelectionInspectionV010 {
  return {
    contractVersion: "0.1.0",
    target: { kind: "edge", id: edge.id },
    properties: edge.properties?.map(property => ({ ...property })) ?? [{
      key: "kind",
      label: "Kind",
      value: edge.kind
    }, {
      key: "relation",
      label: "Relation",
      value: `${edge.source} -> ${edge.target}`
    }]
  };
}

export function createTemplate2dPreviewPageV010(input: {
  templateId: string;
  templateVersion: number;
  title: string;
  projectionId?: string;
}): DiagramWorkspacePageV010 {
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID,
    title: `Template Preview · ${input.title}`,
    resourceId:
      `template-store:${input.templateId}@${input.templateVersion}`
      + (input.projectionId ? `#${input.projectionId}` : ""),
    readCommand: {
      code: EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION,
      inputVersion: "0.1.0"
    },
    selectionReadCommand: {
      code: EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      ...(input.projectionId ? { projectionId: input.projectionId } : {})
    },
    viewInteraction: {
      zoom: true,
      pan: true,
      localNodeDrag: true
    },
    emptyMessage: "Select a node or relation to inspect template properties."
  };
}

export function createTemplate2dPreviewReadActionV010(input: {
  source: TemplatePreviewArtifactSourceV010;
}): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return success(request, state(artifact(input.source, request.values)));
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export function createTemplate2dPreviewSelectionReadActionV010(input: {
  source: TemplatePreviewArtifactSourceV010;
}): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const value = artifact(input.source, request.values);
        const diagram = value.diagram2d;
        if (!diagram) {
          throw new Error("TEMPLATE_2D_PREVIEW_NOT_AVAILABLE");
        }
        const target = parseReadOnly2dSelectionTargetV010(request.values.target);
        if (target.kind === "node") {
          const node = diagram.nodes.find(item => item.id === target.id);
          if (!node) throw new Error("TEMPLATE_2D_PREVIEW_NODE_NOT_FOUND");
          return success(request, nodeInspectionV010(node));
        }
        const edge = diagram.edges.find(item => item.id === target.id);
        if (!edge) throw new Error("TEMPLATE_2D_PREVIEW_EDGE_NOT_FOUND");
        return success(request, edgeInspectionV010(edge));
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
