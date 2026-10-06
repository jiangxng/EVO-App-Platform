import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  authorizeMaterialWriteV010
} from "../../manager/material-write-authorization.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
import {
  DEFINITION_2D_PREVIEW_ROUTE_V010,
  type DefinitionProjectionArtifactSourceV010,
  type DefinitionProjectionSessionStoreV010,
  type DefinitionProjectionSelectionV010
} from "../../contracts/definition-projection.js";
import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  TemplateProjectionGalleryItemV010,
  TemplateProjectionGalleryV010,
  TemplateProjectionPlacementV010
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

const DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION =
  "definition.projection.save";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "编辑投影",
        back: "返回查看",
        save: "保存投影",
        empty: "当前投影没有可编辑的图形内容。",
        ready: "拖动节点、调整缩放和视角；完成后点击“保存投影”。这些操作只修改投影，不修改账本规则。",
        saved: "投影已保存。业务定义内容未改变。",
        manageRoleRequired: "需要企业所有者或管理员权限。"
      }
    : {
        title: "Edit projection",
        back: "Back to view",
        save: "Save projection",
        empty: "This projection has no editable diagram content.",
        ready: "Drag nodes and adjust zoom/pan, then choose Save projection. These changes affect only the projection, not ledger rules.",
        saved: "Projection saved. Business-definition content was not changed.",
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

function selectedArtifact(input: {
  source: DefinitionProjectionArtifactSourceV010;
  sessions: DefinitionProjectionSessionStoreV010;
  context: PlatformRequestContextV010;
}) {
  const scope = activeEnterprise(input.context);
  const selection = selectionFor(input.sessions, input.context);
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
    projectionId: selection.projectionId
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
    }],
    notice: input.saved ? text.saved : text.ready
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
      route: DEFINITION_2D_PREVIEW_ROUTE_V010
    }],
    ...(input.camera ? { initialCamera: { ...input.camera } } : {}),
    viewInteraction: {
      zoom: true,
      pan: true,
      localNodeDrag: true
    },
    emptyMessage: text.empty
  };
}

function parsedViewState(value: JsonValue | undefined): {
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
  const placementMap = new Map(
    (current.view.placements ?? []).map(item => [
      item.nodeId,
      { ...item }
    ])
  );
  for (const placement of captured.placements) {
    placementMap.set(placement.nodeId, { ...placement });
  }
  next.projections[index] = {
    ...current,
    view: {
      ...current.view,
      placements: [...placementMap.values()],
      camera: { ...captured.camera }
    }
  };
  return next;
}

export function createEnterpriseDefinitionProjectionEditorActionHandlersV010(
  input: {
    repository: BusinessDefinitionRepositoryV010;
    source: DefinitionProjectionArtifactSourceV010;
    sessions: DefinitionProjectionSessionStoreV010;
    resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
    canManageEnterpriseContext(
      principal: PlatformPrincipalV010,
      contextId: string
    ): boolean;
    locale?(context: PlatformRequestContextV010): string | undefined;
    now?: () => Date;
  }
): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

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
          context
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
          context
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
          || (operation as Record<string, JsonValue>).type !== "SAVE_PROJECTION_VIEW"
        ) {
          throw new Error("DEFINITION_PROJECTION_SAVE_OPERATION_INVALID");
        }
        const expectedRevision = request.values.expectedRevision;
        if (
          typeof expectedRevision !== "number"
          || !Number.isInteger(expectedRevision)
          || expectedRevision < 0
        ) {
          throw new Error("DEFINITION_PROJECTION_REVISION_INVALID");
        }

        const selection = selectionFor(input.sessions, context);
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

        const authorization = await authorizeMaterialWriteV010(
          input.resolveAuthorizationProvider(),
          context,
          {
            action: DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION,
            resource: {
              type: "enterprise.business-definition.projection",
              id: `${selection.definitionId}#${selection.projectionId}`,
              attributes: {
                enterpriseId: scope.enterpriseId,
                definitionRevision: latest.revision
              }
            }
          }
        );
        if (!authorization.allowed) {
          throw new Error(
            `${authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${authorization.policyProviderId}' ${authorization.reasonCodes.join(", ")}`
          );
        }

        const projectionGallery = mergeProjection(
          latest.projectionGallery,
          selection.projectionId,
          parsedViewState(request.values.viewState)
        );
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
          projectionId: selection.projectionId,
          selectedAt: recordedAt
        };
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, nextSelection);
        }

        const artifact = input.source.get({
          enterpriseId: saved.enterpriseId,
          definitionId: saved.definitionId,
          definitionRevision: saved.revision,
          projectionId: selection.projectionId
        });
        if (!artifact) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
        return success(request, editorState({
          artifact,
          locale: input.locale?.(context),
          saved: true
        }));
      }
    )
  ];
}
