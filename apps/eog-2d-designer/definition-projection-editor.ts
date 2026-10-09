import { randomUUID } from "node:crypto";
import { diagramEdgeGeometryV010 } from "../../vendor/eidos/src/diagram/edge-paths.js";
import { diagramEdgeAnchorPointV010, diagramManualEdgeGeometryV010 } from "../../vendor/eidos/src/diagram/edge-waypoints.js";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  DefinitionProjectionStoreV010
} from "../../providers/enterprise-context/definition-projection-store.js";
import {
  definition2dEditorRouteV010,
  definition2dPreviewRouteV010,
  type DefinitionProjectionArtifactSourceV010,
  type DefinitionProjectionSessionStoreV010,
  type DefinitionProjectionSelectionV010
} from "../../contracts/definition-projection.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  TEMPLATE_PROJECTION_GALLERY_MAX_ITEMS_V010,
  type TemplateProjectionGalleryItemV010,
  type TemplateProjectionEdgePathV010,
  type TemplateProjectionGalleryV010,
  type TemplateProjectionPlacementV010,
  type TemplateProjectionThumbnailV010
} from "../../contracts/template-projection-gallery.js";
import type {
  Template2dPreviewV010
} from "../../contracts/template-preview.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceSelectionInspectionV010,
  DiagramWorkspaceStateV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_ID,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_PACKAGE_ID
} from "../eog-2d/package.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "编辑投影",
        back: "返回查看",
        save: "保存投影",
        saveAs: "另存投影",
        rename: "重命名投影",
        renamePrompt: "请输入投影名称",
        renamed: "投影已重命名。",
        setPrimary: "设为默认投影",
        primarySet: "已设为默认投影。",
        renameRequired: "投影名称不能为空。",
        renameDuplicate: "已存在同名投影，请使用其他名称。",
        thumbnailAltSuffix: "投影缩略图",
        restoreAll: "恢复全部",
        restoreAllNotice: "已恢复当前版本中的全部应用、账本和连线。尚未保存，可继续编辑。",
        autoLayout: "自动排版",
        autoLayoutNotice: "已按业务关系方向自动排版当前可见内容。尚未保存，可继续调整。",
        more: "更多",
        removeFromProjection: "从投影移除",
        removedFromProjection: "已从当前投影移除。保存投影后生效；应用、账本及业务定义不会被删除。",
        empty: "当前投影没有可编辑的图形内容。",
        ready: "可使用自动排版、拖动节点、调整缩放和视角，也可移除不需要的节点或连线来简化关系图；完成后点击“保存投影”。这些操作只修改当前投影，不修改应用、账本或业务定义。",
        saved: "投影已保存。应用、账本及业务定义内容未改变。",
        savedAs: "已另存为新投影。原投影保持不变。",
        galleryFull: "最多只能保存 9 个投影，请先整理已有投影。",
        copySuffix: "副本",
        manageRoleRequired: "需要企业所有者或管理员权限。"
      }
    : {
        title: "Edit projection",
        back: "Back to view",
        save: "Save projection",
        saveAs: "Save as projection",
        rename: "Rename projection",
        renamePrompt: "Projection name",
        renamed: "Projection renamed.",
        setPrimary: "Set as default projection",
        primarySet: "Default projection updated.",
        renameRequired: "Projection name is required.",
        renameDuplicate: "A projection with this name already exists.",
        thumbnailAltSuffix: "projection thumbnail",
        restoreAll: "Restore all",
        restoreAllNotice: "All applications, ledgers, and relations from this revision are visible again. Nothing has been saved yet.",
        autoLayout: "Auto layout",
        autoLayoutNotice: "Visible content was arranged by relationship direction. Nothing has been saved yet.",
        more: "More",
        removeFromProjection: "Remove from projection",
        removedFromProjection: "Removed from this projection. Save the projection to persist it; applications, ledgers, and business definitions are unchanged.",
        empty: "This projection has no editable diagram content.",
        ready: "Use Auto layout, drag nodes, adjust zoom/pan, or remove unnecessary nodes and relations to simplify the map; then choose Save projection. These changes affect only the current projection, not applications, ledgers, or business definitions.",
        saved: "Projection saved. Applications, ledgers, and business-definition content were not changed.",
        savedAs: "Saved as a new projection. The original projection is unchanged.",
        galleryFull: "A maximum of 9 projections is supported. Remove or consolidate an existing projection first.",
        copySuffix: "Copy",
        manageRoleRequired: "Enterprise owner or administrator permission is required."
      };
}

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
        : "DEFINITION_PROJECTION_EDITOR_FAILED",
      message
    }
  };
}

function sessionKeys(context: PlatformRequestContextV010): string[] {
  return [
    context.principal.sessionId?.trim(),
    context.principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function activeEnterprise(context: PlatformRequestContextV010): {
  contextId: string;
  enterpriseId: string;
} {
  const active = context.context?.activeContext;
  if (
    active?.kind !== "ENTERPRISE"
    || !active.enterpriseId?.trim()
    || !active.contextId?.trim()
  ) {
    throw new Error("DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("DEFINITION_PROJECTION_HUMAN_REQUIRED");
  }
  return {
    contextId: active.contextId.trim(),
    enterpriseId: active.enterpriseId.trim()
  };
}

function selectionFor(
  sessions: DefinitionProjectionSessionStoreV010,
  context: PlatformRequestContextV010
): DefinitionProjectionSelectionV010 {
  for (const key of sessionKeys(context)) {
    const selection = sessions.get(key);
    if (selection) return selection;
  }
  throw new Error("DEFINITION_PROJECTION_SELECTION_REQUIRED");
}

type DefinitionProjectionTargetV010 = Pick<
  DefinitionProjectionSelectionV010,
  "enterpriseId" | "definitionId" | "definitionRevision" | "projectionId"
>;

function targetForRequest(
  sessions: DefinitionProjectionSessionStoreV010,
  context: PlatformRequestContextV010,
  values: Record<string, JsonValue>
): DefinitionProjectionTargetV010 {
  const scope = activeEnterprise(context);
  const definitionId =
    typeof values.definitionId === "string" && values.definitionId.trim()
      ? values.definitionId.trim()
      : undefined;
  const definitionRevision =
    typeof values.definitionRevision === "number"
    && Number.isInteger(values.definitionRevision)
    && values.definitionRevision >= 0
      ? values.definitionRevision
      : undefined;
  const projectionId =
    typeof values.projectionId === "string" && values.projectionId.trim()
      ? values.projectionId.trim()
      : undefined;
  const explicitCount = [
    definitionId,
    definitionRevision,
    projectionId
  ].filter(value => value !== undefined).length;

  if (explicitCount > 0 && explicitCount < 3) {
    throw new Error("DEFINITION_PROJECTION_ROUTE_IDENTITY_INVALID");
  }
  if (
    values.enterpriseId !== undefined
    && (
      typeof values.enterpriseId !== "string"
      || values.enterpriseId.trim() !== scope.enterpriseId
    )
  ) {
    throw new Error("DEFINITION_PROJECTION_CONTEXT_MISMATCH");
  }
  if (
    definitionId !== undefined
    && definitionRevision !== undefined
    && projectionId !== undefined
  ) {
    return {
      enterpriseId: scope.enterpriseId,
      definitionId,
      definitionRevision,
      projectionId
    };
  }

  const selection = selectionFor(sessions, context);
  return {
    enterpriseId: selection.enterpriseId,
    definitionId: selection.definitionId,
    definitionRevision: selection.definitionRevision,
    projectionId: selection.projectionId
  };
}

function selectedArtifact(input: {
  source: DefinitionProjectionArtifactSourceV010;
  sessions: DefinitionProjectionSessionStoreV010;
  context: PlatformRequestContextV010;
  values: Record<string, JsonValue>;
}) {
  const scope = activeEnterprise(input.context);
  const selection = targetForRequest(
    input.sessions,
    input.context,
    input.values
  );
  if (selection.enterpriseId !== scope.enterpriseId) {
    throw new Error("DEFINITION_PROJECTION_CONTEXT_MISMATCH");
  }
  if (!selection.projectionId?.trim()) {
    throw new Error("DEFINITION_PROJECTION_ID_REQUIRED");
  }
  const artifact = input.source.get({
    enterpriseId: selection.enterpriseId,
    definitionId: selection.definitionId,
    definitionRevision: selection.definitionRevision,
    projectionId: selection.projectionId,
    includeHidden: true
  });
  if (!artifact) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
  return { artifact, selection, scope };
}

function targetFromValue(
  value: JsonValue | undefined
): { kind: "node" | "edge"; id: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("DEFINITION_PROJECTION_SELECTION_INVALID");
  }
  const target = value as Record<string, JsonValue>;
  if (
    (target.kind !== "node" && target.kind !== "edge")
    || typeof target.id !== "string"
    || !target.id.trim()
  ) {
    throw new Error("DEFINITION_PROJECTION_SELECTION_INVALID");
  }
  return { kind: target.kind, id: target.id.trim() };
}

function inspection(
  artifact: ReturnType<DefinitionProjectionArtifactSourceV010["get"]>,
  target: { kind: "node" | "edge"; id: string }
): DiagramWorkspaceSelectionInspectionV010 {
  if (!artifact?.diagram2d) {
    throw new Error("DEFINITION_PROJECTION_DIAGRAM_NOT_AVAILABLE");
  }
  if (target.kind === "node") {
    const node = artifact.diagram2d.nodes.find(item => item.id === target.id);
    if (!node) throw new Error("DEFINITION_PROJECTION_NODE_NOT_FOUND");
    return {
      contractVersion: "0.1.0",
      target,
      properties: node.properties?.map(item => ({ ...item })) ?? [{
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
  const edge = artifact.diagram2d.edges.find(item => item.id === target.id);
  if (!edge) throw new Error("DEFINITION_PROJECTION_EDGE_NOT_FOUND");
  return {
    contractVersion: "0.1.0",
    target,
    properties: edge.properties?.map(item => ({ ...item })) ?? [{
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

function editorState(input: {
  artifact: NonNullable<ReturnType<DefinitionProjectionArtifactSourceV010["get"]>>;
  locale?: string;
  saved?: boolean;
  notice?: string;
  isPrimary?: boolean;
}): DiagramWorkspaceStateV010 {
  const text = textFor(input.locale);
  const diagram = input.artifact.diagram2d;
  return {
    contractVersion: "0.1.0",
    resourceId:
      `enterprise-definition:${input.artifact.enterpriseId}:${input.artifact.definitionId}@${input.artifact.definitionRevision}`
      + (input.artifact.projectionId ? `#${input.artifact.projectionId}` : ""),
    revision: input.artifact.definitionRevision,
    lifecycleState: "DEFINITION_PROJECTION_EDIT",
    nodes: (diagram?.nodes ?? []).map(node => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      shape: node.shape ?? "rounded-rectangle",
      ...(node.typeLabel ? { typeLabel: node.typeLabel } : {}),
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      // Keep semantic content read-only. localNodeDrag edits only the
      // captured presentation state until the explicit Save projection action.
      readOnly: true,
      ...(node.detail ? { detail: node.detail } : {}),
      ...(node.properties
        ? { properties: node.properties.map(property => ({ ...property })) }
        : {})
    })),
    ...(input.artifact.hiddenNodeIds?.length
      ? { hiddenNodeIds: [...input.artifact.hiddenNodeIds] }
      : {}),
    ...(input.artifact.hiddenEdgeIds?.length
      ? { hiddenEdgeIds: [...input.artifact.hiddenEdgeIds] }
      : {}),
    edges: (diagram?.edges ?? []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
      ...(edge.label ? { label: edge.label } : {}),
      ...(edge.arrow ? { arrow: edge.arrow } : {}),
      ...(edge.pathKind ? { pathKind: edge.pathKind } : {}),
      ...(edge.waypoints?.length ? { waypoints: edge.waypoints.map(p => ({ ...p })) } : {}),
      ...(edge.sourceAnchor ? { sourceAnchor: edge.sourceAnchor } : {}),
      ...(edge.targetAnchor ? { targetAnchor: edge.targetAnchor } : {}),
      ...(edge.detail ? { detail: edge.detail } : {}),
      ...(edge.properties
        ? { properties: edge.properties.map(property => ({ ...property })) }
        : {})
    })),
    actions: [{
      id: "projection.rename",
      label: text.rename,
      operation: {
        type: "RENAME_PROJECTION"
      },
      textPrompt: {
        label: text.renamePrompt,
        valueKey: "title",
        defaultValue: input.artifact.title,
        required: true
      },
      placement: "OVERFLOW",
      target: { kind: "graph" }
    }, {
      id: "projection.save",
      label: text.save,
      operation: {
        type: "SAVE_PROJECTION_VIEW"
      },
      captureViewState: true,
      placement: "TOOLBAR",
      target: { kind: "graph" }
    }, {
      id: "projection.save-as",
      label: text.saveAs,
      operation: {
        type: "SAVE_PROJECTION_AS_NEW"
      },
      captureViewState: true,
      placement: "OVERFLOW",
      target: { kind: "graph" }
    }, ...(!input.isPrimary ? [{
      id: "projection.set-primary",
      label: text.setPrimary,
      operation: {
        type: "SET_PRIMARY_PROJECTION"
      },
      placement: "OVERFLOW" as const,
      target: { kind: "graph" as const }
    }] : [])],
    notice: input.notice ?? (input.saved ? text.saved : text.ready)
  };
}

export function createEnterpriseDefinitionProjectionEditorPageV010(input: {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId: string;
  title: string;
  camera?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  contextNavigation?: DiagramWorkspacePageV010["contextNavigation"];
  locale?: string;
}): DiagramWorkspacePageV010 {
  const text = textFor(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_ID,
    title: `${text.title} · ${input.title}`,
    resourceId:
      `enterprise-definition:${input.enterpriseId}:${input.definitionId}@${input.definitionRevision}#${input.projectionId}`,
    readCommand: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    operationCommand: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      inputVersion: "0.1.0"
    },
    selectionReadCommand: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      enterpriseId: input.enterpriseId,
      definitionId: input.definitionId,
      definitionRevision: input.definitionRevision,
      projectionId: input.projectionId
    },
    ...(input.contextNavigation
      ? { contextNavigation: input.contextNavigation }
      : {}),
    ...(input.camera ? { initialCamera: { ...input.camera } } : {}),
    toolbarOverflowLabel: text.more,
    viewInteraction: {
      zoom: true,
      pan: true,
      localNodeDrag: true,
      localEdgePathEdit: true,
      localSelectionHide: true,
      localSelectionHideLabel: text.removeFromProjection,
      localSelectionHideNotice: text.removedFromProjection,
      localVisibilityReset: true,
      localVisibilityResetLabel: text.restoreAll,
      localVisibilityResetNotice: text.restoreAllNotice,
      localVisibilityResetPlacement: "OVERFLOW",
      localAutoLayout: true,
      localAutoLayoutLabel: text.autoLayout,
      localAutoLayoutNotice: text.autoLayoutNotice,
      localAutoLayoutDirection: "RIGHT",
      localAutoLayoutPlacement: "TOOLBAR"
    },
    emptyMessage: text.empty
  };
}

function parsedHiddenIds(
  value: JsonValue | undefined,
  code: string
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(code);
  const ids = value.map(item => {
    if (typeof item !== "string" || !item.trim()) throw new Error(code);
    return item.trim();
  });
  if (new Set(ids).size !== ids.length) throw new Error(code);
  return ids;
}

function parsedViewState(value: JsonValue | undefined): {
  hiddenNodeIds: string[];
  hiddenEdgeIds: string[];
  edgePaths?: TemplateProjectionEdgePathV010[];
  viewport?: {
    width: number;
    height: number;
  };
  placements: TemplateProjectionPlacementV010[];
  camera: {
    scale: number;
    translateX: number;
    translateY: number;
  };
} {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("DEFINITION_PROJECTION_VIEW_STATE_REQUIRED");
  }
  const raw = value as Record<string, JsonValue>;
  const hiddenNodeIds = parsedHiddenIds(
    raw.hiddenNodeIds,
    "DEFINITION_PROJECTION_HIDDEN_NODE_IDS_INVALID"
  );
  const hiddenEdgeIds = parsedHiddenIds(
    raw.hiddenEdgeIds,
    "DEFINITION_PROJECTION_HIDDEN_EDGE_IDS_INVALID"
  );
  let edgePaths: TemplateProjectionEdgePathV010[] | undefined;
  if (raw.edgePaths !== undefined) {
    if (!Array.isArray(raw.edgePaths) || raw.edgePaths.length > 10000) {
      throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
    }
    edgePaths = raw.edgePaths.map(value => {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
      }
      const path = value as Record<string, JsonValue>;
      if (typeof path.edgeId !== "string" || !path.edgeId.trim()
        || !["straight", "orthogonal", "rounded-orthogonal", "curve"].includes(String(path.pathKind))) {
        throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
      }
      const kind = path.pathKind as TemplateProjectionEdgePathV010["pathKind"];
      const sideSet = ["auto", "left", "right", "top", "bottom"];
      if ((path.sourceAnchor !== undefined && !sideSet.includes(String(path.sourceAnchor)))
        || (path.targetAnchor !== undefined && !sideSet.includes(String(path.targetAnchor)))
        || (path.waypoints !== undefined && (!Array.isArray(path.waypoints)
          || path.waypoints.length > 24 || (kind === "straight" && path.waypoints.length > 0)))) {
        throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
      }
      const waypoints = (path.waypoints as JsonValue[] | undefined)?.map(p => {
        if (!p || typeof p !== "object" || Array.isArray(p)) {
          throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
        }
        const point = p as Record<string, JsonValue>;
        if (typeof point.x !== "number" || typeof point.y !== "number"
          || !Number.isFinite(point.x) || !Number.isFinite(point.y)
          || Math.abs(point.x) > 10000000 || Math.abs(point.y) > 10000000) {
          throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
        }
        return { x: point.x, y: point.y };
      });
      return {
        edgeId: path.edgeId.trim(),
        pathKind: kind,
        ...(waypoints?.length ? { waypoints } : {}),
        ...(path.sourceAnchor && path.sourceAnchor !== "auto"
          ? { sourceAnchor: path.sourceAnchor as TemplateProjectionEdgePathV010["sourceAnchor"] } : {}),
        ...(path.targetAnchor && path.targetAnchor !== "auto"
          ? { targetAnchor: path.targetAnchor as TemplateProjectionEdgePathV010["targetAnchor"] } : {})
      };
    });
    if (new Set(edgePaths.map(item => item.edgeId)).size !== edgePaths.length) {
      throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
    }
  }
  let viewport: { width: number; height: number } | undefined;
  if (raw.viewport !== undefined) {
    if (
      raw.viewport === null
      || typeof raw.viewport !== "object"
      || Array.isArray(raw.viewport)
    ) {
      throw new Error("DEFINITION_PROJECTION_VIEWPORT_INVALID");
    }
    const value = raw.viewport as Record<string, JsonValue>;
    if (
      typeof value.width !== "number"
      || !Number.isFinite(value.width)
      || value.width <= 0
      || typeof value.height !== "number"
      || !Number.isFinite(value.height)
      || value.height <= 0
    ) {
      throw new Error("DEFINITION_PROJECTION_VIEWPORT_INVALID");
    }
    viewport = { width: value.width, height: value.height };
  }
  if (!Array.isArray(raw.placements)) {
    throw new Error("DEFINITION_PROJECTION_PLACEMENTS_INVALID");
  }
  const placements = raw.placements.map(item => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("DEFINITION_PROJECTION_PLACEMENTS_INVALID");
    }
    const placement = item as Record<string, JsonValue>;
    if (
      typeof placement.nodeId !== "string"
      || !placement.nodeId.trim()
      || typeof placement.x !== "number"
      || !Number.isFinite(placement.x)
      || typeof placement.y !== "number"
      || !Number.isFinite(placement.y)
    ) {
      throw new Error("DEFINITION_PROJECTION_PLACEMENTS_INVALID");
    }
    return {
      nodeId: placement.nodeId.trim(),
      x: placement.x,
      y: placement.y
    };
  });
  if (new Set(placements.map(item => item.nodeId)).size !== placements.length) {
    throw new Error("DEFINITION_PROJECTION_PLACEMENTS_INVALID");
  }

  const rawCamera = raw.camera;
  if (
    rawCamera === null
    || typeof rawCamera !== "object"
    || Array.isArray(rawCamera)
  ) {
    throw new Error("DEFINITION_PROJECTION_CAMERA_INVALID");
  }
  const camera = rawCamera as Record<string, JsonValue>;
  if (
    typeof camera.scale !== "number"
    || !Number.isFinite(camera.scale)
    || camera.scale <= 0
    || typeof camera.translateX !== "number"
    || !Number.isFinite(camera.translateX)
    || typeof camera.translateY !== "number"
    || !Number.isFinite(camera.translateY)
  ) {
    throw new Error("DEFINITION_PROJECTION_CAMERA_INVALID");
  }
  return {
    hiddenNodeIds,
    hiddenEdgeIds,
    ...(edgePaths ? { edgePaths } : {}),
    ...(viewport ? { viewport } : {}),
    placements,
    camera: {
      scale: camera.scale,
      translateX: camera.translateX,
      translateY: camera.translateY
    }
  };
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function thumbnailFromCapturedView(
  diagram: Template2dPreviewV010,
  captured: ReturnType<typeof parsedViewState>,
  title: string,
  locale?: string
): TemplateProjectionThumbnailV010 {
  const viewport = captured.viewport ?? { width: 1280, height: 720 };
  const outputWidth = 640;
  const outputHeight = Math.max(
    240,
    Math.min(480, Math.round(outputWidth * viewport.height / viewport.width))
  );
  const scaleX = outputWidth / viewport.width;
  const scaleY = outputHeight / viewport.height;
  const hiddenNodes = new Set(captured.hiddenNodeIds);
  const hiddenEdges = new Set(captured.hiddenEdgeIds);
  const placements = new Map(
    captured.placements.map(item => [item.nodeId, item] as const)
  );
  const visible = diagram.nodes
    .filter(node => !hiddenNodes.has(node.id))
    .map(node => {
      const placement = placements.get(node.id);
      const x = (placement?.x ?? node.x) * captured.camera.scale
        + captured.camera.translateX;
      const y = (placement?.y ?? node.y) * captured.camera.scale
        + captured.camera.translateY;
      const width = node.width * captured.camera.scale;
      const height = node.height * captured.camera.scale;
      return { node, x, y, width, height };
    })
    .filter(item =>
      item.x + item.width >= 0
      && item.y + item.height >= 0
      && item.x <= viewport.width
      && item.y <= viewport.height
    );
  const visibleIds = new Set(visible.map(item => item.node.id));
  const byId = new Map(visible.map(item => [item.node.id, item] as const));

  const pathByEdgeId = new Map((captured.edgePaths ?? []).map(item => [item.edgeId, item] as const));
  const edgeSvg = diagram.edges
    .filter(edge =>
      !hiddenEdges.has(edge.id)
      && visibleIds.has(edge.source)
      && visibleIds.has(edge.target)
    )
    .map(edge => {
      const source = byId.get(edge.source)!;
      const target = byId.get(edge.target)!;
      const x1 = (source.x + source.width / 2) * scaleX;
      const y1 = (source.y + source.height / 2) * scaleY;
      const x2 = (target.x + target.width / 2) * scaleX;
      const y2 = (target.y + target.height / 2) * scaleY;
      const override = pathByEdgeId.get(edge.id);
      const kind = override?.pathKind ?? edge.pathKind ?? "straight";
      const sourcePoint = diagramEdgeAnchorPointV010({
        x: source.x * scaleX, y: source.y * scaleY,
        width: source.width * scaleX, height: source.height * scaleY
      }, override?.sourceAnchor ?? edge.sourceAnchor ?? "auto") ?? { x: x1, y: y1 };
      const targetPoint = diagramEdgeAnchorPointV010({
        x: target.x * scaleX, y: target.y * scaleY,
        width: target.width * scaleX, height: target.height * scaleY
      }, override?.targetAnchor ?? edge.targetAnchor ?? "auto") ?? { x: x2, y: y2 };
      const points = override?.waypoints ?? edge.waypoints;
      const transformed = points?.map(p => ({
        x: (p.x * captured.camera.scale + captured.camera.translateX) * scaleX,
        y: (p.y * captured.camera.scale + captured.camera.translateY) * scaleY
      }));
      const path = transformed?.length
        ? diagramManualEdgeGeometryV010(sourcePoint, targetPoint, { pathKind: kind, waypoints: transformed })
        : diagramEdgeGeometryV010(sourcePoint, targetPoint, kind);
      return `<path d="${xml(path.d)}" fill="none" stroke="#94a3b8" stroke-opacity=".48" stroke-width="1.25"/>`;
    })
    .join("");

  const nodeSvg = visible.map(item => {
    const x = item.x * scaleX;
    const y = item.y * scaleY;
    const width = Math.max(3, item.width * scaleX);
    const height = Math.max(3, item.height * scaleY);
    const rx = item.node.shape === "rounded-rectangle" ? 8 : 3;
    const fill = item.node.kind.toLowerCase().includes("ledger")
      ? "#f4f7fb"
      : "#f7faf9";
    const label = item.node.label.length > 14
      ? item.node.label.slice(0, 13) + "…"
      : item.node.label;
    const showLabel = width >= 52 && height >= 22;
    return [
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="${rx}" fill="${fill}" stroke="#cbd5e1" stroke-width="1"/>`,
      showLabel
        ? `<text x="${(x + width / 2).toFixed(1)}" y="${(y + height / 2 + 3).toFixed(1)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" fill="#334155">${xml(label)}</text>`
        : ""
    ].join("");
  }).join("");

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<g>${edgeSvg}</g>`,
    `<g>${nodeSvg}</g>`,
    `</svg>`
  ].join("");

  return {
    src: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    alt: `${title} ${textFor(locale).thumbnailAltSuffix}`
  };
}

function renameProjection(
  gallery: TemplateProjectionGalleryV010,
  projectionId: string,
  titleValue: unknown,
  locale?: string
): TemplateProjectionGalleryV010 {
  const text = textFor(locale);
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  if (!title) throw new Error("DEFINITION_PROJECTION_TITLE_REQUIRED: " + text.renameRequired);
  if (
    gallery.projections.some(item =>
      item.projectionId !== projectionId
      && item.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase()
    )
  ) {
    throw new Error("DEFINITION_PROJECTION_TITLE_DUPLICATE: " + text.renameDuplicate);
  }
  const next = structuredClone(gallery);
  const projection = next.projections.find(item => item.projectionId === projectionId);
  if (!projection) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
  projection.title = title;
  projection.thumbnail = {
    ...projection.thumbnail,
    alt: `${title} ${text.thumbnailAltSuffix}`
  };
  return next;
}

function setPrimaryProjection(
  gallery: TemplateProjectionGalleryV010,
  projectionId: string
): TemplateProjectionGalleryV010 {
  if (!gallery.projections.some(item => item.projectionId === projectionId)) {
    throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
  }
  if (gallery.primaryProjectionId === projectionId) {
    throw new Error("DEFINITION_PROJECTION_ALREADY_PRIMARY");
  }
  const next = structuredClone(gallery);
  next.primaryProjectionId = projectionId;
  return next;
}

function mergeProjection(
  gallery: TemplateProjectionGalleryV010,
  projectionId: string,
  captured: ReturnType<typeof parsedViewState>,
  diagram: Template2dPreviewV010,
  locale?: string
): TemplateProjectionGalleryV010 {
  const next = structuredClone(gallery);
  const index = next.projections.findIndex(
    item => item.projectionId === projectionId
  );
  if (index < 0) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
  const current = next.projections[index] as TemplateProjectionGalleryItemV010;
  if (captured.edgePaths?.some(item => !diagram.edges.some(edge => edge.id === item.edgeId))) {
    throw new Error("DEFINITION_PROJECTION_EDGE_PATH_UNKNOWN_RELATION");
  }
  const hiddenNodeIds = [...new Set(captured.hiddenNodeIds)];
  const hiddenEdgeIds = [...new Set(captured.hiddenEdgeIds)];
  const hiddenNodes = new Set(hiddenNodeIds);
  const placementMap = new Map(
    (current.view.placements ?? [])
      .filter(item => !hiddenNodes.has(item.nodeId))
      .map(item => [
        item.nodeId,
        { ...item }
      ])
  );
  for (const placement of captured.placements) {
    if (!hiddenNodes.has(placement.nodeId)) {
      placementMap.set(placement.nodeId, { ...placement });
    }
  }
  const {
    hiddenNodeIds: _previousHiddenNodeIds,
    hiddenEdgeIds: _previousHiddenEdgeIds,
    edgePaths: _previousEdgePaths,
    ...currentView
  } = current.view;
  next.projections[index] = {
    ...current,
    thumbnail: thumbnailFromCapturedView(
      diagram,
      captured,
      current.title,
      locale
    ),
    view: {
      ...currentView,
      ...(hiddenNodeIds.length ? { hiddenNodeIds } : {}),
      ...(hiddenEdgeIds.length ? { hiddenEdgeIds } : {}),
      ...((captured.edgePaths ?? current.view.edgePaths)?.length
        ? { edgePaths: (captured.edgePaths ?? current.view.edgePaths)!.map(item => ({ ...item, ...(item.waypoints ? { waypoints: item.waypoints.map(p => ({ ...p })) } : {}) })) }
        : {}),
      placements: [...placementMap.values()],
      camera: { ...captured.camera }
    }
  };
  return next;
}


export function cropDefinitionProjectionToVisibleItemsV010(input: {
  gallery: TemplateProjectionGalleryV010;
  projectionId: string;
  diagram: Template2dPreviewV010;
  visibleNodeIds: readonly string[];
  visibleEdgeIds?: readonly string[];
  locale?: string;
}): TemplateProjectionGalleryV010 {
  const allNodeIds = new Set(input.diagram.nodes.map(node => node.id));
  const visibleNodeIds = [...new Set(
    input.visibleNodeIds.map(value => value.trim()).filter(Boolean)
  )];
  if (visibleNodeIds.length < 1) {
    throw new Error("DEFINITION_PROJECTION_VISIBLE_NODES_REQUIRED");
  }
  if (visibleNodeIds.some(id => !allNodeIds.has(id))) {
    throw new Error("DEFINITION_PROJECTION_VISIBLE_NODE_NOT_FOUND");
  }

  const visibleNodeSet = new Set(visibleNodeIds);
  const candidateEdges = input.diagram.edges.filter(edge =>
    visibleNodeSet.has(edge.source) && visibleNodeSet.has(edge.target)
  );
  const requestedVisibleEdges = input.visibleEdgeIds
    ? [...new Set(input.visibleEdgeIds.map(value => value.trim()).filter(Boolean))]
    : candidateEdges.map(edge => edge.id);
  const candidateEdgeIds = new Set(candidateEdges.map(edge => edge.id));
  if (requestedVisibleEdges.some(id => !candidateEdgeIds.has(id))) {
    throw new Error("DEFINITION_PROJECTION_VISIBLE_EDGE_NOT_FOUND");
  }
  const visibleEdgeSet = new Set(requestedVisibleEdges);

  const current = input.gallery.projections.find(
    item => item.projectionId === input.projectionId
  );
  if (!current) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");

  const camera = current.view.camera ?? {
    scale: 1,
    translateX: 0,
    translateY: 0
  };
  const placements = (
    current.view.placements?.length
      ? current.view.placements
      : input.diagram.nodes.map(node => ({
          nodeId: node.id,
          x: node.x,
          y: node.y
        }))
  ).filter(item => visibleNodeSet.has(item.nodeId));

  return mergeProjection(
    input.gallery,
    input.projectionId,
    {
      hiddenNodeIds: input.diagram.nodes
        .filter(node => !visibleNodeSet.has(node.id))
        .map(node => node.id),
      hiddenEdgeIds: input.diagram.edges
        .filter(edge =>
          !visibleNodeSet.has(edge.source)
          || !visibleNodeSet.has(edge.target)
          || !visibleEdgeSet.has(edge.id)
        )
        .map(edge => edge.id),
      placements,
      camera: { ...camera }
    },
    input.diagram,
    input.locale
  );
}

function projectionCopyTitle(
  gallery: TemplateProjectionGalleryV010,
  sourceTitle: string,
  locale?: string
): string {
  const suffix = textFor(locale).copySuffix;
  const base = `${sourceTitle} ${suffix}`;
  const used = new Set(gallery.projections.map(item => item.title));
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function saveProjectionAsNew(
  gallery: TemplateProjectionGalleryV010,
  sourceProjectionId: string,
  captured: ReturnType<typeof parsedViewState>,
  diagram: Template2dPreviewV010,
  locale: string | undefined,
  projectionIdFactory: () => string
): { gallery: TemplateProjectionGalleryV010; projectionId: string } {
  if (gallery.projections.length >= TEMPLATE_PROJECTION_GALLERY_MAX_ITEMS_V010) {
    throw new Error(
      "DEFINITION_PROJECTION_GALLERY_FULL: " + textFor(locale).galleryFull
    );
  }
  const source = gallery.projections.find(
    item => item.projectionId === sourceProjectionId
  );
  if (!source) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");

  let projectionId = projectionIdFactory().trim();
  while (
    !projectionId
    || gallery.projections.some(item => item.projectionId === projectionId)
  ) {
    projectionId = projectionIdFactory().trim();
  }

  const hiddenNodes = new Set(captured.hiddenNodeIds);
  const next: TemplateProjectionGalleryV010 = structuredClone(gallery);
  const title = projectionCopyTitle(next, source.title, locale);
  next.projections.push({
    projectionId,
    title,
    ...(source.description ? { description: source.description } : {}),
    thumbnail: thumbnailFromCapturedView(diagram, captured, title, locale),
    view: {
      contractVersion: "0.1.0",
      kind: "DIAGRAM_2D",
      ...(captured.hiddenNodeIds.length
        ? { hiddenNodeIds: [...new Set(captured.hiddenNodeIds)] }
        : {}),
      ...(captured.hiddenEdgeIds.length
        ? { hiddenEdgeIds: [...new Set(captured.hiddenEdgeIds)] }
        : {}),
      ...((captured.edgePaths ?? source.view.edgePaths)?.length
        ? { edgePaths: (captured.edgePaths ?? source.view.edgePaths)!.map(item => ({ ...item, ...(item.waypoints ? { waypoints: item.waypoints.map(p => ({ ...p })) } : {}) })) }
        : {}),
      placements: captured.placements
        .filter(item => !hiddenNodes.has(item.nodeId))
        .map(item => ({ ...item })),
      camera: { ...captured.camera }
    }
  });
  return { gallery: next, projectionId };
}

export function createEnterpriseDefinitionProjectionEditorActionHandlersV010(
  input: {
    repository: BusinessDefinitionRepositoryV010;
    projectionStore: DefinitionProjectionStoreV010;
    source: DefinitionProjectionArtifactSourceV010;
    sessions: DefinitionProjectionSessionStoreV010;
    canManageEnterpriseContext(
      principal: PlatformPrincipalV010,
      contextId: string
    ): boolean;
    authorizeProjectionSave(
      context: PlatformRequestContextV010,
      target: {
        enterpriseId: string;
        definitionId: string;
        projectionId: string;
        definitionRevision: number;
      }
    ): Promise<void> | void;
    locale?(context: PlatformRequestContextV010): string | undefined;
    onEditorRead?: (
      context: PlatformRequestContextV010,
      target: {
        enterpriseId: string;
        definitionId: string;
        definitionRevision: number;
        projectionId: string;
        resourceId: string;
      }
    ) => void;
    now?: () => Date;
    projectionIdFactory?: () => string;
  }
): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const projectionIdFactory =
    input.projectionIdFactory ?? (() => `projection:${randomUUID()}`);

  const handler = (
    commandCode: string,
    execute: (
      request: AppActionRequestV010,
      context: PlatformRequestContextV010
    ) => Promise<AppActionExecutionResultV010>
  ): AppActionHandler => ({
    packageId: EOG_2D_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return failure(request, error);
      }
    }
  });

  return [
    handler(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
      async (request, context) => {
        const { artifact, selection } = selectedArtifact({
          source: input.source,
          sessions: input.sessions,
          context,
          values: request.values
        });
        input.onEditorRead?.(context, {
          enterpriseId: selection.enterpriseId,
          definitionId: selection.definitionId,
          definitionRevision: selection.definitionRevision,
          projectionId: selection.projectionId!,
          resourceId:
            `enterprise-definition:${selection.enterpriseId}:${selection.definitionId}@${selection.definitionRevision}#${selection.projectionId!}`
        });
        const selectedAt = now().toISOString();
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, {
            contractVersion: "0.1.0",
            enterpriseId: selection.enterpriseId,
            definitionId: selection.definitionId,
            definitionRevision: selection.definitionRevision,
            projectionId: selection.projectionId,
            selectedAt
          });
        }
        const revision = input.repository.listHistory({
          enterpriseId: selection.enterpriseId,
          definitionId: selection.definitionId
        }).find(item => item.revision === selection.definitionRevision);
        const projectionGallery = input.projectionStore.get({
          enterpriseId: selection.enterpriseId,
          definitionId: selection.definitionId,
          definitionRevision: selection.definitionRevision
        }) ?? revision?.projectionGallery;
        return success(request, editorState({
          artifact,
          locale: input.locale?.(context),
          isPrimary:
            projectionGallery?.primaryProjectionId
            === selection.projectionId
        }));
      }
    ),
    handler(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
      async (request, context) => {
        const { artifact } = selectedArtifact({
          source: input.source,
          sessions: input.sessions,
          context,
          values: request.values
        });
        return success(
          request,
          inspection(artifact, targetFromValue(request.values.target))
        );
      }
    ),
    handler(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      async (request, context) => {
        const scope = activeEnterprise(context);
        if (
          !input.canManageEnterpriseContext(
            context.principal,
            scope.contextId
          )
        ) {
          throw new Error(textFor(input.locale?.(context)).manageRoleRequired);
        }
        const operation = request.values.operation;
        if (
          operation === null
          || typeof operation !== "object"
          || Array.isArray(operation)
          || ![
            "SAVE_PROJECTION_VIEW",
            "SAVE_PROJECTION_AS_NEW",
            "RENAME_PROJECTION",
            "SET_PRIMARY_PROJECTION"
          ].includes(
            String((operation as Record<string, JsonValue>).type)
          )
        ) {
          throw new Error("DEFINITION_PROJECTION_SAVE_OPERATION_INVALID");
        }
        const operationType = String(
          (operation as Record<string, JsonValue>).type
        );
        const expectedRevision = request.values.expectedRevision;
        if (
          typeof expectedRevision !== "number"
          || !Number.isInteger(expectedRevision)
          || expectedRevision < 0
        ) {
          throw new Error("DEFINITION_PROJECTION_REVISION_INVALID");
        }

        const selection = targetForRequest(
          input.sessions,
          context,
          request.values
        );
        if (
          selection.enterpriseId !== scope.enterpriseId
          || !selection.projectionId
        ) {
          throw new Error("DEFINITION_PROJECTION_CONTEXT_MISMATCH");
        }
        const latest = input.repository.getLatest({
          enterpriseId: scope.enterpriseId,
          definitionId: selection.definitionId
        });
        if (!latest) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
        if (
          latest.revision !== expectedRevision
          || selection.definitionRevision !== expectedRevision
        ) {
          throw new Error("DEFINITION_PROJECTION_REVISION_CONFLICT");
        }
        const currentProjectionGallery = input.projectionStore.get({
          enterpriseId: latest.enterpriseId,
          definitionId: latest.definitionId,
          definitionRevision: latest.revision
        }) ?? latest.projectionGallery;
        if (!currentProjectionGallery) {
          throw new Error("DEFINITION_PROJECTION_GALLERY_REQUIRED");
        }

        await input.authorizeProjectionSave(context, {
          enterpriseId: scope.enterpriseId,
          definitionId: selection.definitionId,
          projectionId: selection.projectionId,
          definitionRevision: latest.revision
        });

        const locale = input.locale?.(context);
        const rename = operationType === "RENAME_PROJECTION";
        const saveAs = operationType === "SAVE_PROJECTION_AS_NEW";
        const setPrimary = operationType === "SET_PRIMARY_PROJECTION";
        let nextProjection: {
          gallery: TemplateProjectionGalleryV010;
          projectionId: string;
        };
        if (rename) {
          nextProjection = {
            gallery: renameProjection(
              currentProjectionGallery,
              selection.projectionId,
              (operation as Record<string, JsonValue>).title,
              locale
            ),
            projectionId: selection.projectionId
          };
        } else if (setPrimary) {
          nextProjection = {
            gallery: setPrimaryProjection(
              currentProjectionGallery,
              selection.projectionId
            ),
            projectionId: selection.projectionId
          };
        } else {
          const captured = parsedViewState(request.values.viewState);
          const currentArtifact = input.source.get({
            enterpriseId: latest.enterpriseId,
            definitionId: latest.definitionId,
            definitionRevision: latest.revision,
            projectionId: selection.projectionId,
            includeHidden: true
          });
          if (!currentArtifact?.diagram2d) {
            throw new Error("DEFINITION_PROJECTION_DIAGRAM_NOT_AVAILABLE");
          }
          nextProjection = saveAs
            ? saveProjectionAsNew(
                currentProjectionGallery,
                selection.projectionId,
                captured,
                currentArtifact.diagram2d,
                locale,
                projectionIdFactory
              )
            : {
                gallery: mergeProjection(
                  currentProjectionGallery,
                  selection.projectionId,
                  captured,
                  currentArtifact.diagram2d,
                  locale
                ),
                projectionId: selection.projectionId
              };
        }
        const projectionGallery = nextProjection.gallery;
        const recordedAt = now().toISOString();
        input.projectionStore.put({
          enterpriseId: latest.enterpriseId,
          definitionId: latest.definitionId,
          definitionRevision: latest.revision,
          gallery: projectionGallery,
          updatedAt: recordedAt,
          updatedBySubjectId: context.principal.subjectId
        });

        const nextSelection: DefinitionProjectionSelectionV010 = {
          contractVersion: "0.1.0",
          enterpriseId: latest.enterpriseId,
          definitionId: latest.definitionId,
          definitionRevision: latest.revision,
          projectionId: nextProjection.projectionId,
          selectedAt: recordedAt
        };
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, nextSelection);
        }

        const artifact = input.source.get({
          enterpriseId: latest.enterpriseId,
          definitionId: latest.definitionId,
          definitionRevision: latest.revision,
          projectionId: nextProjection.projectionId,
          includeHidden: true
        });
        if (!artifact) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
        return success(request, {
          ...editorState({
            artifact,
            locale,
            saved: true,
            notice: rename
              ? textFor(locale).renamed
              : setPrimary
                ? textFor(locale).primarySet
                : saveAs
                  ? textFor(locale).savedAs
                  : textFor(locale).saved,
            isPrimary:
              projectionGallery.primaryProjectionId
              === nextProjection.projectionId
          }),
          navigateTo: definition2dEditorRouteV010({
            definitionId: latest.definitionId,
            definitionRevision: latest.revision,
            projectionId: nextProjection.projectionId
          })
        });
      }
    )
  ];
}
