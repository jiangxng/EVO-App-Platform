import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  authorizeMaterialWriteV010
} from "../../actions/material-write-authorization.js";
import type {
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  DefinitionProjectionArtifactSourceV010,
  DefinitionProjectionSessionStoreV010
} from "../../contracts/definition-projection.js";
import {
  assertTemplateProjectionGalleryV010,
  type TemplateProjectionCameraV010,
  type TemplateProjectionGalleryV010,
  type TemplateProjectionPlacementV010
} from "../../contracts/template-projection-gallery.js";
import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  DiagramEditorCapturedViewStateV010,
  DiagramWorkspacePageV010,
  DiagramWorkspaceStateV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  projectDefinition2dWorkspaceStateV010
} from "../../eog/definition-projection-workspace.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_ID,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_ROUTE,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_PACKAGE_ID
} from "../eog-2d/package.js";
import {
  EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION
} from "../eog-2d/package.js";

const SAVE_AUTHORIZATION_ACTION =
  "enterprise.definition.projection.save" as const;

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
        : "DEFINITION_PROJECTION_EDIT_FAILED",
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
    throw new Error(`DEFINITION_PROJECTION_EDIT_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function integerValue(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`DEFINITION_PROJECTION_EDIT_FIELD_INVALID: ${key}`);
  }
  return value;
}

function parseCapturedViewState(
  value: JsonValue | undefined
): DiagramEditorCapturedViewStateV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("DEFINITION_PROJECTION_VIEW_STATE_REQUIRED");
  }
  const source = value as Record<string, JsonValue>;
  if (!Array.isArray(source.placements)) {
    throw new Error("DEFINITION_PROJECTION_PLACEMENTS_INVALID");
  }

  const placements = source.placements.map(raw => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("DEFINITION_PROJECTION_PLACEMENT_INVALID");
    }
    const item = raw as Record<string, JsonValue>;
    if (
      typeof item.nodeId !== "string"
      || !item.nodeId.trim()
      || typeof item.x !== "number"
      || !Number.isFinite(item.x)
      || typeof item.y !== "number"
      || !Number.isFinite(item.y)
    ) {
      throw new Error("DEFINITION_PROJECTION_PLACEMENT_INVALID");
    }
    return {
      nodeId: item.nodeId.trim(),
      x: item.x,
      y: item.y
    };
  });
  if (new Set(placements.map(item => item.nodeId)).size !== placements.length) {
    throw new Error("DEFINITION_PROJECTION_PLACEMENT_DUPLICATE");
  }

  const rawCamera = source.camera;
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

function sessionKeys(context: PlatformRequestContextV010): string[] {
  return [
    context.principal.sessionId?.trim(),
    context.principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function enterpriseScope(
  context: PlatformRequestContextV010,
  enterpriseId: string
): { contextId: string; enterpriseId: string; subjectId: string } {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("DEFINITION_PROJECTION_HUMAN_REQUIRED");
  }
  const active = context.context?.activeContext;
  if (
    active?.kind !== "ENTERPRISE"
    || active.enterpriseId !== enterpriseId
  ) {
    throw new Error("DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return {
    contextId: active.contextId,
    enterpriseId,
    subjectId: context.principal.subjectId
  };
}

function revision(
  repository: BusinessDefinitionRepositoryV010,
  enterpriseId: string,
  definitionId: string,
  definitionRevision: number
): BusinessDefinitionRevisionV010 {
  const item = repository.listHistory({
    enterpriseId,
    definitionId
  }).find(candidate => candidate.revision === definitionRevision);
  if (!item) throw new Error("DEFINITION_PROJECTION_DEFINITION_NOT_FOUND");
  return item;
}

function mergeView(input: {
  gallery: TemplateProjectionGalleryV010;
  projectionId: string;
  viewState: DiagramEditorCapturedViewStateV010;
  visibleNodeIds: Set<string>;
}): TemplateProjectionGalleryV010 {
  const current = assertTemplateProjectionGalleryV010(input.gallery);
  const target = current.projections.find(
    item => item.projectionId === input.projectionId
  );
  if (!target) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");

  for (const placement of input.viewState.placements) {
    if (!input.visibleNodeIds.has(placement.nodeId)) {
      throw new Error("DEFINITION_PROJECTION_PLACEMENT_NODE_INVALID");
    }
  }

  const editedIds = new Set(
    input.viewState.placements.map(item => item.nodeId)
  );
  const placements: TemplateProjectionPlacementV010[] = [
    ...(target.view.placements ?? []).filter(
      item => !editedIds.has(item.nodeId)
    ),
    ...input.viewState.placements.map(item => ({ ...item }))
  ].sort((a, b) => a.nodeId.localeCompare(b.nodeId));

  const camera: TemplateProjectionCameraV010 = {
    ...input.viewState.camera
  };

  return assertTemplateProjectionGalleryV010({
    ...current,
    projections: current.projections.map(item =>
      item.projectionId !== input.projectionId
        ? item
        : {
            ...item,
            view: {
              ...item.view,
              placements,
              camera
            }
          }
    )
  });
}

function editorState(input: {
  source: DefinitionProjectionArtifactSourceV010;
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId: string;
  locale?: string;
}): DiagramWorkspaceStateV010 {
  const artifact = input.source.get({
    enterpriseId: input.enterpriseId,
    definitionId: input.definitionId,
    definitionRevision: input.definitionRevision,
    projectionId: input.projectionId
  });
  if (!artifact) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");

  const zh = input.locale?.toLowerCase().startsWith("zh") === true;
  return projectDefinition2dWorkspaceStateV010({
    resourceId:
      `enterprise-definition:${input.enterpriseId}:${input.definitionId}`
      + `#${input.projectionId}:edit`,
    revision: artifact.definitionRevision,
    lifecycleState: "PROJECTION_EDIT",
    ...(artifact.diagram2d ? { diagram2d: artifact.diagram2d } : {}),
    actions: [{
      id: "projection.save",
      label: zh ? "保存投影" : "Save projection",
      operation: {
        type: "SAVE_PROJECTION_VIEW"
      },
      captureViewState: true,
      target: { kind: "graph" }
    }],
    notice: zh
      ? "拖动节点、缩放或平移不会立即写入数据；点击“保存投影”后一次性创建新版本。"
      : "Drag nodes, zoom or pan locally; Save projection creates one new definition revision."
  });
}

export function createEnterpriseDefinitionProjectionEditorPageV010(input: {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId: string;
  title: string;
  locale?: string;
}): DiagramWorkspacePageV010 {
  const zh = input.locale?.toLowerCase().startsWith("zh") === true;
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_ID,
    title: zh
      ? `编辑关系图 · ${input.title}`
      : `Edit relationship map · ${input.title}`,
    resourceId:
      `enterprise-definition:${input.enterpriseId}:${input.definitionId}`
      + `#${input.projectionId}:edit`,
    readCommand: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    operationCommand: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
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
      projectionId: input.projectionId
    },
    toolbarActions: [{
      id: "back-to-view",
      label: zh ? "返回查看" : "Back to view",
      route: EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE
    }],
    viewInteraction: {
      zoom: true,
      pan: true,
      localNodeDrag: true
    },
    emptyMessage: zh
      ? "拖动节点调整布局；选择节点或关系查看属性。"
      : "Drag nodes to adjust layout; select a node or relation to inspect properties."
  };
}

export function createEnterpriseDefinitionProjectionEditorReadActionV010(input: {
  source: DefinitionProjectionArtifactSourceV010;
}): AppActionHandler {
  return {
    packageId: EOG_2D_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    commandCode: EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return success(
          request,
          editorState({
            source: input.source,
            enterpriseId: stringValue(request.values, "enterpriseId"),
            definitionId: stringValue(request.values, "definitionId"),
            definitionRevision: integerValue(
              request.values,
              "definitionRevision"
            ),
            projectionId: stringValue(request.values, "projectionId"),
            locale: context.locale
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export function createEnterpriseDefinitionProjectionSaveActionV010(input: {
  repository: BusinessDefinitionRepositoryV010;
  source: DefinitionProjectionArtifactSourceV010;
  projectionSessions: DefinitionProjectionSessionStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  now?: () => Date;
}): AppActionHandler {
  const now = input.now ?? (() => new Date());

  return {
    packageId: EOG_2D_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    commandCode: EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const enterpriseId = stringValue(request.values, "enterpriseId");
        const definitionId = stringValue(request.values, "definitionId");
        const projectionId = stringValue(request.values, "projectionId");
        const expectedRevision = integerValue(
          request.values,
          "expectedRevision"
        );
        const scope = enterpriseScope(context, enterpriseId);

        if (
          !input.canManageEnterpriseContext(
            context.principal,
            scope.contextId
          )
        ) {
          throw new Error("DEFINITION_PROJECTION_MANAGE_ROLE_REQUIRED");
        }

        const authorization = await authorizeMaterialWriteV010(
          input.resolveAuthorizationProvider(),
          context,
          {
            action: SAVE_AUTHORIZATION_ACTION,
            resource: {
              type: "enterprise.business-definition.projection",
              id: `${definitionId}#${projectionId}`,
              attributes: {
                enterpriseId,
                definitionRevision: expectedRevision
              }
            }
          }
        );
        if (!authorization.allowed) {
          throw new Error(
            `${authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${authorization.policyProviderId}'`
          );
        }

        const current = input.repository.getLatest({
          enterpriseId,
          definitionId
        });
        if (!current) {
          throw new Error("DEFINITION_PROJECTION_DEFINITION_NOT_FOUND");
        }
        if (current.revision !== expectedRevision) {
          throw new Error("DEFINITION_PROJECTION_REVISION_CONFLICT");
        }
        if (!current.projectionGallery) {
          throw new Error("DEFINITION_PROJECTION_GALLERY_REQUIRED");
        }

        const artifact = input.source.get({
          enterpriseId,
          definitionId,
          definitionRevision: current.revision,
          projectionId
        });
        if (!artifact?.diagram2d) {
          throw new Error("DEFINITION_PROJECTION_NOT_AVAILABLE");
        }

        const viewState = parseCapturedViewState(request.values.viewState);
        const nextGallery = mergeView({
          gallery: current.projectionGallery,
          projectionId,
          viewState,
          visibleNodeIds: new Set(
            artifact.diagram2d.nodes.map(node => node.id)
          )
        });

        const actor = {
          actorType: "HUMAN" as const,
          subjectId: scope.subjectId
        };
        const recordedAt = now().toISOString();
        const next = current.state === "PUBLISHED"
          ? input.repository.beginDraft({
              enterpriseId,
              definitionId,
              expectedRevision: current.revision,
              title: current.title,
              payload: structuredClone(current.payload),
              projectionGallery: nextGallery,
              actor,
              recordedAt
            })
          : input.repository.reviseDraft({
              enterpriseId,
              definitionId,
              expectedRevision: current.revision,
              title: current.title,
              payload: structuredClone(current.payload),
              projectionGallery: nextGallery,
              actor,
              recordedAt
            });

        const selection = {
          contractVersion: "0.1.0" as const,
          enterpriseId,
          definitionId,
          definitionRevision: next.revision,
          projectionId,
          selectedAt: recordedAt
        };
        for (const key of sessionKeys(context)) {
          input.projectionSessions.set(key, selection);
        }

        return success(
          request,
          editorState({
            source: input.source,
            enterpriseId,
            definitionId,
            definitionRevision: next.revision,
            projectionId,
            locale: context.locale
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export const EOG_2D_DEFINITION_PROJECTION_EDIT_ROUTE =
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_ROUTE;
