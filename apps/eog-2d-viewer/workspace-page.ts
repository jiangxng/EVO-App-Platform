import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  ActiveContextRefV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
} from "../../contracts/enterprise-operating-graph.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  EnterpriseOperatingGraphInspectorPropertyResolverV010
} from "../../contracts/enterprise-operating-graph-inspector.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceStateV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../eog/diagram-projection.js";
import {
  inspectEog2dSelectionV010,
  parseEog2dSelectionTargetV010
} from "../../eog/2d-selection-inspection.js";
import {
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
  EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
  EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
  EOG_2D_VIEWER_WORKSPACE_ROUTE,
  EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION
} from "./package.js";

export {
  EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
  EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
  EOG_2D_VIEWER_WORKSPACE_ROUTE,
  EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION
} from "./package.js";
function localizedText(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      title: "企业运行图",
      empty: "选择一个应用、账本或关系查看属性。",
      ready: "交互式查看企业运行图；可选择节点和连线查看属性，但不修改企业图语义。",
      noGraph: "当前企业还没有企业运行图。"
    };
  }
  return {
    title: "Enterprise Operating Graph",
    empty: "Select an Application, Ledger or relation to inspect its properties.",
    ready: "Interactive Enterprise Operating Graph workspace. Inspect and navigate without changing graph semantics.",
    noGraph: "No Enterprise Operating Graph exists for this enterprise yet."
  };
}

export function createEnterpriseOperatingGraphViewerWorkspacePageV010(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
}): DiagramWorkspacePageV010 {
  const text = localizedText(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "diagram-workspace",
    id: EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
    title: text.title,
    resourceId: PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
    readCommand: {
      code: EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
      inputVersion: "0.1.0"
    },
    selectionReadCommand: {
      code: EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION,
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
        : "EOG_2D_VIEWER_ACTION_FAILED",
      message
    }
  };
}

function enterpriseId(context: PlatformRequestContextV010): string {
  const active = context.context?.activeContext;
  if (
    active?.kind !== "ENTERPRISE"
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EOG_HUMAN_ACTION_REQUIRED");
  }
  return active.enterpriseId.trim();
}

export function createEnterpriseOperatingGraphViewerWorkspaceReadActionV010(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    viewService: EnterpriseOperatingGraphViewStateProviderV010;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
  }
): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const scopedEnterpriseId = enterpriseId(context);
        const graphId = typeof request.values.resourceId === "string"
          ? request.values.resourceId.trim()
          : "";
        if (!graphId) throw new Error("EOG_GRAPH_ID_REQUIRED");

        let graph;
        try {
          graph = input.graphService.get({
            enterpriseId: scopedEnterpriseId,
            graphId
          });
        } catch (error) {
          if (
            error instanceof Error
            && error.message === "EOG_GRAPH_NOT_FOUND"
          ) {
            const text = localizedText(input.locale?.(context));
            return success(request, {
              contractVersion: "0.1.0",
              resourceId: graphId,
              revision: 0,
              lifecycleState: "NOT_CREATED",
              nodes: [],
              edges: [],
              actions: [],
              notice: text.noGraph
            } satisfies DiagramWorkspaceStateV010);
          }
          throw error;
        }

        const view = input.viewService.ensure({
          enterpriseId: scopedEnterpriseId,
          graphId,
          viewId: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
          kind: "DIAGRAM_2D"
        });
        const state = projectEnterpriseOperatingGraphDiagramBaseV010({
          graph,
          view,
          locale: input.locale?.(context),
          readOnly: true
        });
        return success(request, {
          ...state,
          notice: localizedText(input.locale?.(context)).ready
        });
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export function createEnterpriseOperatingGraphViewerWorkspaceSelectionReadActionV010(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    inspectorResolver: EnterpriseOperatingGraphInspectorPropertyResolverV010;
  }
): AppActionHandler {
  return {
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    commandCode: EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        const scopedEnterpriseId = enterpriseId(context);
        const graphId = typeof request.values.resourceId === "string"
          ? request.values.resourceId.trim()
          : "";
        if (!graphId) throw new Error("EOG_GRAPH_ID_REQUIRED");
        const graph = input.graphService.get({
          enterpriseId: scopedEnterpriseId,
          graphId
        });
        return success(
          request,
          await inspectEog2dSelectionV010({
            graph,
            target: parseEog2dSelectionTargetV010(
              request.values.target
            ),
            role: "VIEWER",
            resolver: input.inspectorResolver
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
