import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
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
  type TemplateProjectionGalleryV010,
  type TemplateProjectionPlacementV010
} from "../../contracts/template-projection-gallery.js";
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
        restoreAll: "恢复全部",
        restoreAllNotice: "已恢复当前版本中的全部应用、账本和连线。尚未保存，可继续编辑。",
        removeFromProjection: "从投影移除",
        removedFromProjection: "已从当前投影移除。保存投影后生效；应用、账本及业务定义不会被删除。",
        empty: "当前投影没有可编辑的图形内容。",
        ready: "可拖动节点、调整缩放和视角，也可移除不需要的节点或连线来简化关系图；完成后点击“保存投影”。这些操作只修改当前投影，不修改应用、账本或业务定义。",
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
        restoreAll: "Restore all",
        restoreAllNotice: "All applications, ledgers, and relations from this revision are visible again. Nothing has been saved yet.",
        removeFromProjection: "Remove from projection",
        removedFromProjection: "Removed from this projection. Save the projection to persist it; applications, ledgers, and business definitions are unchanged.",
        empty: "This projection has no editable diagram content.",
        ready: "Drag nodes, adjust zoom/pan, or remove unnecessary nodes and relations to simplify the map; then choose Save projection. These changes affect only the current projection, not applications, ledgers, or business definitions.",
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
      ...(edge.detail ? { detail: edge.detail } : {}),
      ...(edge.properties
        ? { properties: edge.properties.map(property => ({ ...property })) }
        : {})
    })),
    actions: [{
      id: "projection.save",
      label: text.save,
      operation: {
        type: "SAVE_PROJECTION_VIEW"
      },
      captureViewState: true,
      target: { kind: "graph" }
    }, {
      id: "projection.save-as",
      label: text.saveAs,
      operation: {
        type: "SAVE_PROJECTION_AS_NEW"
      },
      captureViewState: true,
      target: { kind: "graph" }
    }],
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
    toolbarActions: [{
      id: "back-to-view",
      label: text.back,
      route: definition2dPreviewRouteV010({
        definitionId: input.definitionId,
        definitionRevision: input.definitionRevision,
        projectionId: input.projectionId
      })
    }],
    ...(input.camera ? { initialCamera: { ...input.camera } } : {}),
    viewInteraction: {
      zoom: true,
      pan: true,
      localNodeDrag: true,
      localSelectionHide: true,
      localSelectionHideLabel: text.removeFromProjection,
      localSelectionHideNotice: text.removedFromProjection,
      localVisibilityReset: true,
      localVisibilityResetLabel: text.restoreAll,
      localVisibilityResetNotice: text.restoreAllNotice
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
    placements,
    camera: {
      scale: camera.scale,
      translateX: camera.translateX,
      translateY: camera.translateY
    }
  };
}

function mergeProjection(
  gallery: TemplateProjectionGalleryV010,
  projectionId: string,
  captured: ReturnType<typeof parsedViewState>
): TemplateProjectionGalleryV010 {
  const next = structuredClone(gallery);
  const index = next.projections.findIndex(
    item => item.projectionId === projectionId
  );
  if (index < 0) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
  const current = next.projections[index] as TemplateProjectionGalleryItemV010;
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
    ...currentView
  } = current.view;
  next.projections[index] = {
    ...current,
    view: {
      ...currentView,
      ...(hiddenNodeIds.length ? { hiddenNodeIds } : {}),
      ...(hiddenEdgeIds.length ? { hiddenEdgeIds } : {}),
      placements: [...placementMap.values()],
      camera: { ...captured.camera }
    }
  };
  return next;
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
  next.projections.push({
    projectionId,
    title: projectionCopyTitle(next, source.title, locale),
    ...(source.description ? { description: source.description } : {}),
    thumbnail: structuredClone(source.thumbnail),
    view: {
      contractVersion: "0.1.0",
      kind: "DIAGRAM_2D",
      ...(captured.hiddenNodeIds.length
        ? { hiddenNodeIds: [...new Set(captured.hiddenNodeIds)] }
        : {}),
      ...(captured.hiddenEdgeIds.length
        ? { hiddenEdgeIds: [...new Set(captured.hiddenEdgeIds)] }
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
        const { artifact } = selectedArtifact({
          source: input.source,
          sessions: input.sessions,
          context,
          values: request.values
        });
        return success(request, editorState({
          artifact,
          locale: input.locale?.(context)
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
          || !["SAVE_PROJECTION_VIEW", "SAVE_PROJECTION_AS_NEW"].includes(
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
        if (!latest.projectionGallery) {
          throw new Error("DEFINITION_PROJECTION_GALLERY_REQUIRED");
        }

        await input.authorizeProjectionSave(context, {
          enterpriseId: scope.enterpriseId,
          definitionId: selection.definitionId,
          projectionId: selection.projectionId,
          definitionRevision: latest.revision
        });

        const captured = parsedViewState(request.values.viewState);
        const saveAs = operationType === "SAVE_PROJECTION_AS_NEW";
        const nextProjection = saveAs
          ? saveProjectionAsNew(
              latest.projectionGallery,
              selection.projectionId,
              captured,
              input.locale?.(context),
              projectionIdFactory
            )
          : {
              gallery: mergeProjection(
                latest.projectionGallery,
                selection.projectionId,
                captured
              ),
              projectionId: selection.projectionId
            };
        const projectionGallery = nextProjection.gallery;
        const actor = {
          actorType: "HUMAN" as const,
          subjectId: context.principal.subjectId
        };
        const recordedAt = now().toISOString();
        const saved = latest.state === "DRAFT"
          ? input.repository.reviseDraft({
              enterpriseId: latest.enterpriseId,
              definitionId: latest.definitionId,
              expectedRevision: latest.revision,
              title: latest.title,
              payload: structuredClone(latest.payload),
              projectionGallery,
              actor,
              recordedAt
            })
          : input.repository.beginDraft({
              enterpriseId: latest.enterpriseId,
              definitionId: latest.definitionId,
              expectedRevision: latest.revision,
              title: latest.title,
              payload: structuredClone(latest.payload),
              projectionGallery,
              actor,
              recordedAt
            });

        const nextSelection: DefinitionProjectionSelectionV010 = {
          contractVersion: "0.1.0",
          enterpriseId: saved.enterpriseId,
          definitionId: saved.definitionId,
          definitionRevision: saved.revision,
          projectionId: nextProjection.projectionId,
          selectedAt: recordedAt
        };
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, nextSelection);
        }

        const artifact = input.source.get({
          enterpriseId: saved.enterpriseId,
          definitionId: saved.definitionId,
          definitionRevision: saved.revision,
          projectionId: nextProjection.projectionId,
          includeHidden: true
        });
        if (!artifact) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
        return success(request, {
          ...editorState({
            artifact,
            locale: input.locale?.(context),
            saved: true,
            notice: saveAs
              ? textFor(input.locale?.(context)).savedAs
              : textFor(input.locale?.(context)).saved
          }),
          navigateTo: definition2dEditorRouteV010({
            definitionId: saved.definitionId,
            definitionRevision: saved.revision,
            projectionId: nextProjection.projectionId
          })
        });
      }
    )
  ];
}
