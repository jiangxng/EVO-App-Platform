import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import {
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID
} from "../apps/eog-2d-designer/package.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
  type EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewStateV010
} from "../contracts/enterprise-operating-graph-view.js";
import type {
  DiagramEditorPageV010,
  DiagramEditorStateV010
} from "../vendor/eidos/src/diagram/surface.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010,
  EOG_APPLY_OPERATION_ACTION,
  EOG_CREATE_ACTION
} from "./enterprise-operating-graph-actions.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
import type {
  EnterpriseOperatingGraphViewHostServiceV010
} from "./enterprise-operating-graph-view-service.js";
import {
  authorizeMaterialWriteV010
} from "./material-write-authorization.js";

export const EOG_EDITOR_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/editor";
export const EOG_EDITOR_ROUTE = "/operating-graph";
export const EOG_EDITOR_RESOURCE_ID =
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010;

export const EOG_VIEW_GET_ACTION =
  "enterprise-operating-graph.view.get";
export const EOG_VIEW_OPERATION_ACTION =
  "enterprise-operating-graph.view.operation";

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
      guidance: "指导关系",
      confirmed: "企业确认关系",
      missing: "当前企业还没有运行图。",
      ready: "来自 Host 权威 EOG 的可编辑视图。布局属于 View State，不改变企业语义。"
    };
  }
  if (normalized.startsWith("ja")) {
    return {
      title: "Enterprise Operating Graph",
      empty: "アプリケーション、台帳、または関係を選択してください。",
      create: "Create operating graph",
      publish: "Publish operating graph",
      confirm: "Confirm relation",
      guidance: "Guidance",
      confirmed: "Confirmed",
      missing: "No operating graph exists for this enterprise yet.",
      ready: "Editable projection of the Host-authoritative EOG. Layout is independent View State."
    };
  }
  return {
    title: "Enterprise Operating Graph",
    empty: "Select an Application, Ledger or relation.",
    create: "Create operating graph",
    publish: "Publish operating graph",
    confirm: "Confirm this relation",
    guidance: "Guidance",
    confirmed: "Enterprise confirmed",
    missing: "No operating graph exists for this enterprise yet.",
    ready: "Editable projection of the Host-authoritative EOG. Layout is independent View State."
  };
}

export function createEnterpriseOperatingGraphEditorPageV010(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
}): DiagramEditorPageV010 {
  const text = localizedText(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "diagram-editor",
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
    requestValues: {
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue
    },
    emptyMessage: text.empty
  };
}

function semanticLabel(refId: string): string {
  const tail = refId.split(":").filter(Boolean).at(-1) ?? refId;
  return tail
    .replaceAll(/[-_.]+/gu, " ")
    .replaceAll(/\b\w/gu, value => value.toUpperCase());
}

function positions(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010
): Map<string, { x: number; y: number }> {
  const explicit = new Map(
    view.placements.map(item => [
      item.nodeId,
      { x: item.x, y: item.y }
    ])
  );
  let applicationIndex = 0;
  let ledgerIndex = 0;
  for (const node of graph.nodes) {
    if (explicit.has(node.nodeId)) continue;
    if (node.kind === "APPLICATION") {
      explicit.set(node.nodeId, {
        x: 80,
        y: 70 + applicationIndex * 120
      });
      applicationIndex += 1;
    } else {
      explicit.set(node.nodeId, {
        x: 420,
        y: 70 + ledgerIndex * 120
      });
      ledgerIndex += 1;
    }
  }
  return explicit;
}

export function projectEnterpriseOperatingGraphEditorStateV010(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010,
  locale?: string
): DiagramEditorStateV010 {
  if (
    view.graphId !== graph.graphId
    || view.enterpriseId !== graph.enterpriseId
    || view.kind !== "DIAGRAM_2D"
  ) {
    throw new Error("EOG_VIEW_PROJECTION_IDENTITY_MISMATCH");
  }

  const text = localizedText(locale);
  const nodePositions = positions(graph, view);
  const confirmedPairs = new Set(
    graph.enterpriseRelations.map(relation =>
      relation.applicationNodeId + "->" + relation.ledgerNodeId
    )
  );

  const nodes = graph.nodes.map(node => {
    const position = nodePositions.get(node.nodeId)!;
    return {
      id: node.nodeId,
      kind: node.kind === "APPLICATION" ? "application" : "ledger",
      label: semanticLabel(node.semanticRef.refId),
      shape: node.kind === "APPLICATION"
        ? "rectangle" as const
        : "rounded-rectangle" as const,
      x: position.x,
      y: position.y,
      width: 168,
      height: 68,
      readOnly: false,
      detail: [
        node.kind,
        node.semanticRef.authority,
        node.semanticRef.kind,
        node.semanticRef.refId
      ].join(" · ")
    };
  });

  const guidanceEdges = graph.guidanceRelations
    .filter(relation =>
      !confirmedPairs.has(
        relation.applicationNodeId + "->" + relation.ledgerNodeId
      )
    )
    .map(relation => ({
      id: "guidance-edge:" + relation.relationId,
      source: relation.applicationNodeId,
      target: relation.ledgerNodeId,
      kind: "guidance",
      label: text.guidance,
      style: "dashed" as const,
      detail: relation.source.kind + " · " + relation.source.sourceRef
    }));

  const confirmedEdges = graph.enterpriseRelations.map(relation => ({
    id: "enterprise-edge:" + relation.relationId,
    source: relation.applicationNodeId,
    target: relation.ledgerNodeId,
    kind: "enterprise-confirmed",
    label: text.confirmed,
    style: "solid" as const,
    detail: [
      "Confirmed by " + relation.confirmedBySubjectId,
      relation.confirmedFromGuidanceRelationId
        ? "From " + relation.confirmedFromGuidanceRelationId
        : undefined
    ].filter(Boolean).join(" · ")
  }));

  const actions = graph.state === "DRAFT"
    ? [
        ...graph.guidanceRelations
          .filter(relation =>
            !confirmedPairs.has(
              relation.applicationNodeId + "->" + relation.ledgerNodeId
            )
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

  return {
    contractVersion: "0.1.0",
    resourceId: graph.graphId,
    revision: view.revision,
    lifecycleState: graph.state === "PUBLISHED"
      ? "SEMANTIC_PUBLISHED"
      : "DRAFT",
    nodes,
    edges: [...guidanceEdges, ...confirmedEdges],
    actions,
    notice: text.ready
  };
}

export function projectMissingEnterpriseOperatingGraphEditorStateV010(
  resourceId: string = EOG_EDITOR_RESOURCE_ID,
  locale?: string
): DiagramEditorStateV010 {
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
    viewService: EnterpriseOperatingGraphViewHostServiceV010;
    resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
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
  ): DiagramEditorStateV010 => projectEnterpriseOperatingGraphEditorStateV010(
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
      const graph = getGraph(context, resourceId);
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
