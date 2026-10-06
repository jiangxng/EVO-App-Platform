import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID
} from "./package.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
  type EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewStateV010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceStateV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../eog/diagram-projection.js";
import {
  attachEog2dInspectorEditorsV010,
  type Eog2dInspectorEditorBindingV010
} from "../../eog/2d-inspector-editors.js";
import {
  createEogOwnedInspectorEditorBindingsV010
} from "./inspector-editors.js";
import {
  inspectEog2dSelectionV010,
  parseEog2dSelectionTargetV010
} from "../../eog/2d-selection-inspection.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010,
  EOG_APPLY_OPERATION_ACTION,
  EOG_CREATE_ACTION
} from "./enterprise-operating-graph-actions.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  EnterpriseOperatingGraphInspectorPropertyResolverV010
} from "../../contracts/enterprise-operating-graph-inspector.js";
import {
  authorizeMaterialWriteV010
} from "../../actions/material-write-authorization.js";

export const EOG_EDITOR_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/editor";
export const EOG_EDITOR_ROUTE = "/operating-graph";
export const EOG_EDITOR_RESOURCE_ID =
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010;

export const EOG_VIEW_GET_ACTION =
  "enterprise-operating-graph.view.get";
export const EOG_VIEW_OPERATION_ACTION =
  "enterprise-operating-graph.view.operation";
export const EOG_VIEW_SELECTION_GET_ACTION =
  "enterprise-operating-graph.view.selection.get";

export function createEnterpriseOperatingGraphExperienceManifestV010() {
  return {
    contractVersion: "0.1.0" as const,
    experienceId: "evo-enterprise-operating-graph",
    packageId: EOG_2D_DESIGNER_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    defaultRoute: EOG_EDITOR_ROUTE,
    pages: [
      {
        id: "evo-enterprise-operating-graph.editor",
        title: "Enterprise Operating Graph",
        source: EOG_EDITOR_PAGE_SOURCE
      }
    ],
    routes: [
      {
        id: "evo-enterprise-operating-graph.editor",
        path: EOG_EDITOR_ROUTE,
        pageId: "evo-enterprise-operating-graph.editor"
      }
    ],
    navigation: [
      {
        id: "evo-enterprise-operating-graph.nav",
        label: "Operating Graph",
        route: EOG_EDITOR_ROUTE,
        order: 15
      }
    ]
  };
}

function localizedText(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      title: "企业运行图",
      empty: "选择一个应用、账本或关系查看详情。",
      create: "创建企业运行图",
      publish: "发布企业运行图",
      confirm: "确认这条关系",
      hideProjection: "从当前投影隐藏",
      restoreProjection: "恢复全部裁剪",
      guidance: "指导关系",
      confirmed: "企业确认关系",
      missing: "当前企业还没有运行图。",
      ready: "当前只编辑投影与视图状态，不改变应用、账本或运行时定义。"
    };
  }
  if (normalized.startsWith("ja")) {
    return {
      title: "Enterprise Operating Graph",
      empty: "アプリケーション、台帳、または関係を選択してください。",
      create: "Create operating graph",
      publish: "Publish operating graph",
      confirm: "Confirm relation",
      hideProjection: "Hide from projection",
      restoreProjection: "Restore projection",
      guidance: "Guidance",
      confirmed: "Confirmed",
      missing: "No operating graph exists for this enterprise yet.",
      ready: "Projection and view-state edits do not modify authoritative applications, ledgers or runtime definitions."
    };
  }
  return {
    title: "Enterprise Operating Graph",
    empty: "Select an Application, Ledger or relation.",
    create: "Create operating graph",
    publish: "Publish operating graph",
    confirm: "Confirm this relation",
    hideProjection: "Hide from projection",
    restoreProjection: "Restore projection",
    guidance: "Guidance",
    confirmed: "Enterprise confirmed",
    missing: "No operating graph exists for this enterprise yet.",
    ready: "Projection and view-state edits do not modify authoritative applications, ledgers or runtime definitions."
  };
}

export function createEnterpriseOperatingGraphEditorPageV010(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
}): DiagramWorkspacePageV010 {
  const text = localizedText(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: "evo-enterprise-operating-graph.editor",
    title: text.title,
    resourceId: EOG_EDITOR_RESOURCE_ID,
    readCommand: {
      code: EOG_VIEW_GET_ACTION,
      inputVersion: "0.1.0"
    },
    operationCommand: {
      code: EOG_VIEW_OPERATION_ACTION,
      inputVersion: "0.1.0"
    },
    selectionReadCommand: {
      code: EOG_VIEW_SELECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue
    },
    viewInteraction: {
      zoom: true,
      pan: true
    },
    emptyMessage: text.empty
  };
}

export function projectEnterpriseOperatingGraphEditorStateV010(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010,
  locale?: string,
  editorBindings: readonly Eog2dInspectorEditorBindingV010[] = []
): DiagramWorkspaceStateV010 {
  const text = localizedText(locale);
  const base = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    locale,
    readOnly: false
  });
  const confirmedPairs = new Set(
    graph.enterpriseRelations.map(relation =>
      relation.applicationNodeId + "->" + relation.ledgerNodeId
    )
  );
  const visibleEdgeIds = new Set(base.edges.map(edge => edge.id));

  const semanticActions = graph.state === "DRAFT"
    ? [
        ...graph.guidanceRelations
          .filter(relation =>
            !confirmedPairs.has(
              relation.applicationNodeId + "->" + relation.ledgerNodeId
            )
            && visibleEdgeIds.has("guidance-edge:" + relation.relationId)
          )
          .map(relation => ({
            id: "confirm:" + relation.relationId,
            label: text.confirm,
            operation: {
              type: "CONFIRM_GUIDANCE_RELATION",
              semanticRevision: graph.revision,
              guidanceRelationId: relation.relationId
            } as JsonValue,
            requiresConfirmation: true,
            target: {
              kind: "edge" as const,
              id: "guidance-edge:" + relation.relationId
            }
          })),
        ...(graph.nodes.length > 0
          ? [{
              id: "publish",
              label: text.publish,
              operation: {
                type: "PUBLISH",
                semanticRevision: graph.revision
              } as JsonValue,
              requiresConfirmation: true,
              target: {
                kind: "graph" as const
              }
            }]
          : [])
      ]
    : [];

  const projectionActions = [
    ...base.nodes.map(node => ({
      id: "projection-hide-node:" + node.id,
      label: text.hideProjection,
      operation: {
        type: "PROJECTION_ITEM_VISIBILITY_SET",
        targetKind: "NODE",
        targetId: node.id,
        visible: false
      } as JsonValue,
      target: {
        kind: "node" as const,
        id: node.id
      }
    })),
    ...base.edges.map(edge => ({
      id: "projection-hide-edge:" + edge.id,
      label: text.hideProjection,
      operation: {
        type: "PROJECTION_ITEM_VISIBILITY_SET",
        targetKind: "EDGE",
        targetId: edge.id,
        visible: false
      } as JsonValue,
      target: {
        kind: "edge" as const,
        id: edge.id
      }
    })),
    ...((view.hiddenNodeIds?.length ?? 0) > 0
      || (view.hiddenEdgeIds?.length ?? 0) > 0
      ? [{
          id: "projection-restore-all",
          label: text.restoreProjection,
          operation: {
            type: "PROJECTION_VISIBILITY_RESET"
          } as JsonValue,
          target: {
            kind: "graph" as const
          }
        }]
      : [])
  ];

  const actions = [
    ...semanticActions,
    ...projectionActions
  ];

  const visibleNodeIds = new Set(base.nodes.map(node => node.id));
  const bindings = [
    ...createEogOwnedInspectorEditorBindingsV010(graph),
    ...editorBindings
  ].filter(binding =>
    binding.target.kind === "node"
      ? visibleNodeIds.has(binding.target.id)
      : visibleEdgeIds.has(binding.target.id)
  );
  const interactive = bindings.length
    ? attachEog2dInspectorEditorsV010(base, bindings)
    : base;

  return {
    ...interactive,
    actions,
    notice: text.ready
  };
}

export function projectMissingEnterpriseOperatingGraphEditorStateV010(
  resourceId: string = EOG_EDITOR_RESOURCE_ID,
  locale?: string
): DiagramWorkspaceStateV010 {
  const text = localizedText(locale);
  return {
    contractVersion: "0.1.0",
    resourceId,
    revision: 0,
    lifecycleState: "NOT_CREATED",
    nodes: [],
    edges: [],
    actions: [
      {
        id: "create",
        label: text.create,
        operation: {
          type: "CREATE_GRAPH"
        },
        target: {
          kind: "graph"
        }
      }
    ],
    notice: text.missing
  };
}

function errorResult(
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
        : "EOG_VIEW_ACTION_FAILED",
      message
    }
  };
}

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value))
  };
}

function enterpriseScope(context: PlatformRequestContextV010): {
  enterpriseId: string;
  subjectId: string;
} {
  const active = context.context?.activeContext;
  if (active?.kind !== "ENTERPRISE" || !active.enterpriseId?.trim()) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EOG_HUMAN_ACTION_REQUIRED");
  }
  return {
    enterpriseId: active.enterpriseId.trim(),
    subjectId: context.principal.subjectId
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EOG_VIEW_FIELD_INVALID:" + key);
  }
  return value.trim();
}

function revisionValue(value: unknown, code: string): number {
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 0
  ) {
    throw new Error(code);
  }
  return value;
}

function expectedViewRevision(
  values: Record<string, JsonValue>
): number {
  return revisionValue(
    values.expectedRevision,
    "EOG_VIEW_REVISION_INVALID"
  );
}

function semanticRevision(
  operation: Record<string, JsonValue>
): number {
  return revisionValue(
    operation.semanticRevision,
    "EOG_SEMANTIC_REVISION_INVALID"
  );
}

function operationValue(
  values: Record<string, JsonValue>
): Record<string, JsonValue> {
  const operation = values.operation;
  if (
    operation === null
    || typeof operation !== "object"
    || Array.isArray(operation)
  ) {
    throw new Error("EOG_VIEW_OPERATION_INVALID");
  }
  return operation;
}

function semanticHandler(
  handlers: AppActionHandler[],
  command: string
): AppActionHandler {
  const handler = handlers.find(item => item.commandCode === command);
  if (!handler) throw new Error("EOG_SEMANTIC_HANDLER_REQUIRED");
  return handler;
}

export function createEnterpriseOperatingGraphViewActionHandlersV010(
  dependencies: {
    service: EnterpriseOperatingGraphHostServiceV010;
    viewService: EnterpriseOperatingGraphViewStateProviderV010;
    resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
    inspectorResolver: EnterpriseOperatingGraphInspectorPropertyResolverV010;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
    onEditorRead?: (
      context: PlatformRequestContextV010,
      target: {
        enterpriseId: string;
        graphId: string;
        resourceId: string;
      }
    ) => void;
  }
): AppActionHandler[] {
  const semanticHandlers =
    createEnterpriseOperatingGraphActionHandlersV010({
      service: dependencies.service,
      resolveAuthorizationProvider: dependencies.resolveAuthorizationProvider
    });

  const getGraph = (
    context: PlatformRequestContextV010,
    resourceId: string
  ): EnterpriseOperatingGraphV010 | undefined => {
    const scope = enterpriseScope(context);
    try {
      return dependencies.service.get({
        enterpriseId: scope.enterpriseId,
        graphId: resourceId
      });
    } catch (error) {
      if (
        error instanceof Error
        && error.message === "EOG_GRAPH_NOT_FOUND"
      ) {
        return undefined;
      }
      throw error;
    }
  };

  const diagramView = (
    context: PlatformRequestContextV010,
    graph: EnterpriseOperatingGraphV010
  ): EnterpriseOperatingGraphViewStateV010 => {
    const scope = enterpriseScope(context);
    return dependencies.viewService.ensure({
      enterpriseId: scope.enterpriseId,
      graphId: graph.graphId,
      viewId: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
      kind: "DIAGRAM_2D"
    });
  };

  const project = (
    context: PlatformRequestContextV010,
    graph: EnterpriseOperatingGraphV010
  ): DiagramWorkspaceStateV010 => projectEnterpriseOperatingGraphEditorStateV010(
    graph,
    diagramView(context, graph),
    dependencies.locale?.(context)
  );

  const authorizeViewWrite = async (
    context: PlatformRequestContextV010,
    graphId: string,
    mutationType: string
  ): Promise<void> => {
    const decision = await authorizeMaterialWriteV010(
      dependencies.resolveAuthorizationProvider(),
      context,
      {
        action: "enterprise.operating-graph.view.edit",
        resource: {
          type: "enterprise.operating-graph.view",
          id: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
          attributes: {
            graphId,
            mutationType
          }
        }
      }
    );
    if (!decision.allowed) {
      throw new Error(
        (decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED")
        + ": denied by '" + decision.policyProviderId + "' "
        + decision.reasonCodes.join(", ")
      );
    }
  };

  const handler = (
    commandCode: string,
    execute: (
      request: AppActionRequestV010,
      context: PlatformRequestContextV010
    ) => Promise<AppActionExecutionResultV010>
  ): AppActionHandler => ({
    packageId: EOG_2D_DESIGNER_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return errorResult(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return errorResult(request, error);
      }
    }
  });

  return [
    handler(EOG_VIEW_GET_ACTION, async (request, context) => {
      const resourceId = stringValue(request.values, "resourceId");
      const scope = enterpriseScope(context);
      const graph = getGraph(context, resourceId);
      dependencies.onEditorRead?.(context, {
        enterpriseId: scope.enterpriseId,
        graphId: resourceId,
        resourceId
      });
      return success(
        request,
        graph
          ? project(context, graph)
          : projectMissingEnterpriseOperatingGraphEditorStateV010(
              resourceId,
              dependencies.locale?.(context)
            )
      );
    }),

    handler(EOG_VIEW_SELECTION_GET_ACTION, async (request, context) => {
      const resourceId = stringValue(request.values, "resourceId");
      const graph = getGraph(context, resourceId);
      if (!graph) throw new Error("EOG_GRAPH_NOT_FOUND");

      return success(
        request,
        await inspectEog2dSelectionV010({
          graph,
          target: parseEog2dSelectionTargetV010(
            request.values.target
          ),
          role: "DESIGNER",
          resolver: dependencies.inspectorResolver
        })
      );
    }),

    handler(EOG_VIEW_OPERATION_ACTION, async (request, context) => {
      const resourceId = stringValue(request.values, "resourceId");
      const operation = operationValue(request.values);
      const type = operation.type;
      if (typeof type !== "string" || !type.trim()) {
        throw new Error("EOG_VIEW_OPERATION_INVALID");
      }

      if (type === "CREATE_GRAPH") {
        const semanticResult = await semanticHandler(
          semanticHandlers,
          EOG_CREATE_ACTION
        ).execute(
          {
            ...request,
            command: {
              code: EOG_CREATE_ACTION,
              inputVersion: "0.1.0"
            },
            values: {
              graphId: resourceId
            }
          },
          context
        );
        if (!semanticResult.ok) return semanticResult;
        return success(
          request,
          project(
            context,
            semanticResult.result as unknown as EnterpriseOperatingGraphV010
          )
        );
      }

      const currentGraph = getGraph(context, resourceId);
      if (!currentGraph) throw new Error("EOG_GRAPH_NOT_FOUND");

      if (type === "NODE_SEMANTIC_REF_PATCH") {
        const nodeId = operation.nodeId;
        if (typeof nodeId !== "string" || !nodeId.trim()) {
          throw new Error("EOG_VIEW_NODE_ID_REQUIRED");
        }
        const node = currentGraph.nodes.find(
          item => item.nodeId === nodeId.trim()
        );
        if (!node) throw new Error("EOG_NODE_NOT_FOUND");

        const nextRefId = operation.refId === undefined
          ? node.semanticRef.refId
          : typeof operation.refId === "string"
            ? operation.refId.trim()
            : "";
        if (!nextRefId) {
          throw new Error("EOG_SEMANTIC_REF_REQUIRED");
        }

        const nextVersionRef = operation.versionRef === undefined
          ? node.semanticRef.versionRef
          : typeof operation.versionRef === "string"
            ? operation.versionRef.trim() || undefined
            : undefined;

        const semanticResult = await semanticHandler(
          semanticHandlers,
          EOG_APPLY_OPERATION_ACTION
        ).execute(
          {
            ...request,
            command: {
              code: EOG_APPLY_OPERATION_ACTION,
              inputVersion: "0.1.0"
            },
            values: {
              graphId: resourceId,
              expectedRevision: semanticRevision(operation),
              mutation: {
                type: "NODE_REBIND",
                nodeId: node.nodeId,
                semanticRef: {
                  authority: node.semanticRef.authority,
                  kind: node.semanticRef.kind,
                  refId: nextRefId,
                  ...(nextVersionRef === undefined
                    ? {}
                    : { versionRef: nextVersionRef })
                }
              }
            }
          },
          context
        );
        if (!semanticResult.ok) return semanticResult;
        return success(
          request,
          project(
            context,
            semanticResult.result as unknown as EnterpriseOperatingGraphV010
          )
        );
      }

      if (type === "GUIDANCE_SOURCE_PATCH") {
        const relationId = operation.relationId;
        if (typeof relationId !== "string" || !relationId.trim()) {
          throw new Error("EOG_VIEW_GUIDANCE_RELATION_REQUIRED");
        }
        const relation = currentGraph.guidanceRelations.find(
          item => item.relationId === relationId.trim()
        );
        if (!relation) throw new Error("EOG_GUIDANCE_RELATION_NOT_FOUND");

        const sourceKind = operation.sourceKind === undefined
          ? relation.source.kind
          : typeof operation.sourceKind === "string"
            ? operation.sourceKind
            : "";
        const sourceRef = operation.sourceRef === undefined
          ? relation.source.sourceRef
          : typeof operation.sourceRef === "string"
            ? operation.sourceRef.trim()
            : "";

        if (!sourceRef) {
          throw new Error("EOG_GUIDANCE_SOURCE_INVALID");
        }

        const semanticResult = await semanticHandler(
          semanticHandlers,
          EOG_APPLY_OPERATION_ACTION
        ).execute(
          {
            ...request,
            command: {
              code: EOG_APPLY_OPERATION_ACTION,
              inputVersion: "0.1.0"
            },
            values: {
              graphId: resourceId,
              expectedRevision: semanticRevision(operation),
              mutation: {
                type: "GUIDANCE_RELATION_SOURCE_UPDATE",
                relationId: relation.relationId,
                source: {
                  kind: sourceKind,
                  sourceRef
                }
              }
            }
          },
          context
        );
        if (!semanticResult.ok) return semanticResult;
        return success(
          request,
          project(
            context,
            semanticResult.result as unknown as EnterpriseOperatingGraphV010
          )
        );
      }

      if (type === "PROJECTION_ITEM_VISIBILITY_SET") {
        const targetKind = operation.targetKind;
        const targetId = operation.targetId;
        const visible = operation.visible;
        if (
          (targetKind !== "NODE" && targetKind !== "EDGE")
          || typeof targetId !== "string"
          || !targetId.trim()
          || typeof visible !== "boolean"
        ) {
          throw new Error("EOG_VIEW_PROJECTION_VISIBILITY_INVALID");
        }

        if (
          targetKind === "NODE"
          && !currentGraph.nodes.some(node => node.nodeId === targetId.trim())
        ) {
          throw new Error("EOG_VIEW_PROJECTION_NODE_NOT_FOUND");
        }
        if (targetKind === "EDGE") {
          const edgeExists =
            (
              targetId.startsWith("guidance-edge:")
              && currentGraph.guidanceRelations.some(relation =>
                "guidance-edge:" + relation.relationId === targetId.trim()
              )
            )
            || (
              targetId.startsWith("enterprise-edge:")
              && currentGraph.enterpriseRelations.some(relation =>
                "enterprise-edge:" + relation.relationId === targetId.trim()
              )
            );
          if (!edgeExists) {
            throw new Error("EOG_VIEW_PROJECTION_EDGE_NOT_FOUND");
          }
        }

        await authorizeViewWrite(
          context,
          resourceId,
          "PROJECTION_ITEM_VISIBILITY_SET"
        );
        const view = diagramView(context, currentGraph);
        dependencies.viewService.apply({
          enterpriseId: currentGraph.enterpriseId,
          graphId: currentGraph.graphId,
          viewId: view.viewId,
          expectedRevision: expectedViewRevision(request.values),
          mutation: {
            type: "PROJECTION_ITEM_VISIBILITY_SET",
            target: {
              kind: targetKind,
              id: targetId.trim()
            },
            visible
          }
        });
        return success(
          request,
          project(context, currentGraph)
        );
      }

      if (type === "PROJECTION_VISIBILITY_RESET") {
        await authorizeViewWrite(
          context,
          resourceId,
          "PROJECTION_VISIBILITY_RESET"
        );
        const view = diagramView(context, currentGraph);
        dependencies.viewService.apply({
          enterpriseId: currentGraph.enterpriseId,
          graphId: currentGraph.graphId,
          viewId: view.viewId,
          expectedRevision: expectedViewRevision(request.values),
          mutation: {
            type: "PROJECTION_VISIBILITY_RESET"
          }
        });
        return success(
          request,
          project(context, currentGraph)
        );
      }

      if (type === "MOVE_NODE") {
        const nodeId = operation.nodeId;
        const x = operation.x;
        const y = operation.y;
        if (
          typeof nodeId !== "string"
          || !nodeId.trim()
          || typeof x !== "number"
          || !Number.isFinite(x)
          || typeof y !== "number"
          || !Number.isFinite(y)
          || !currentGraph.nodes.some(node => node.nodeId === nodeId.trim())
        ) {
          throw new Error("EOG_VIEW_MOVE_NODE_INVALID");
        }

        await authorizeViewWrite(context, resourceId, "NODE_POSITION_SET");
        const view = diagramView(context, currentGraph);
        dependencies.viewService.apply({
          enterpriseId: currentGraph.enterpriseId,
          graphId: currentGraph.graphId,
          viewId: view.viewId,
          expectedRevision: expectedViewRevision(request.values),
          mutation: {
            type: "NODE_POSITION_SET",
            placement: {
              nodeId: nodeId.trim(),
              x,
              y
            }
          }
        });
        return success(
          request,
          project(context, currentGraph)
        );
      }

      if (type === "CONFIRM_GUIDANCE_RELATION") {
        if (request.requiresConfirmation !== true) {
          throw new Error("EOG_RELATION_CONFIRMATION_REQUIRED");
        }
        const guidanceRelationId = operation.guidanceRelationId;
        if (
          typeof guidanceRelationId !== "string"
          || !guidanceRelationId.trim()
        ) {
          throw new Error("EOG_VIEW_GUIDANCE_RELATION_REQUIRED");
        }
        const relation = currentGraph.guidanceRelations.find(
          item => item.relationId === guidanceRelationId.trim()
        );
        if (!relation) throw new Error("EOG_GUIDANCE_RELATION_NOT_FOUND");

        const semanticResult = await semanticHandler(
          semanticHandlers,
          EOG_APPLY_OPERATION_ACTION
        ).execute(
          {
            ...request,
            command: {
              code: EOG_APPLY_OPERATION_ACTION,
              inputVersion: "0.1.0"
            },
            values: {
              graphId: resourceId,
              expectedRevision: semanticRevision(operation),
              mutation: {
                type: "ENTERPRISE_RELATION_CONFIRM",
                enterpriseRelationId:
                  "enterprise-confirmed:" + relation.relationId,
                applicationNodeId: relation.applicationNodeId,
                ledgerNodeId: relation.ledgerNodeId,
                guidanceRelationId: relation.relationId
              }
            },
            requiresConfirmation: true
          },
          context
        );
        if (!semanticResult.ok) return semanticResult;
        return success(
          request,
          project(
            context,
            semanticResult.result as unknown as EnterpriseOperatingGraphV010
          )
        );
      }

      if (type === "PUBLISH") {
        if (request.requiresConfirmation !== true) {
          throw new Error("EOG_PUBLISH_CONFIRMATION_REQUIRED");
        }
        const semanticResult = await semanticHandler(
          semanticHandlers,
          EOG_APPLY_OPERATION_ACTION
        ).execute(
          {
            ...request,
            command: {
              code: EOG_APPLY_OPERATION_ACTION,
              inputVersion: "0.1.0"
            },
            values: {
              graphId: resourceId,
              expectedRevision: semanticRevision(operation),
              mutation: {
                type: "PUBLISH"
              }
            },
            requiresConfirmation: true
          },
          context
        );
        if (!semanticResult.ok) return semanticResult;
        return success(
          request,
          project(
            context,
            semanticResult.result as unknown as EnterpriseOperatingGraphV010
          )
        );
      }

      throw new Error("EOG_VIEW_OPERATION_UNSUPPORTED");
    })
  ];
}
