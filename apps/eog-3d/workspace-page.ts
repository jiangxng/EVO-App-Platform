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
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  SpatialWorkspacePageV010
} from "../../vendor/eidos/src/3d/index.js";
import {
  projectEnterpriseOperatingGraphSpatialBaseV010
} from "../../eog/spatial-projection.js";
import {
  EOG_3D_PACKAGE_ID,
  EOG_3D_VIEWER_FEATURE_ID,
  EOG_3D_VIEWER_PAGE_ID,
  EOG_3D_VIEWER_PAGE_SOURCE,
  EOG_3D_VIEWER_ROUTE
} from "./package.js";

export {
  EOG_3D_VIEWER_PAGE_SOURCE,
  EOG_3D_VIEWER_ROUTE
} from "./package.js";

export const EOG_3D_VIEWER_GET_ACTION =
  "enterprise-operating-graph.viewer.spatial.get";

function text(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      title: "企业运行图 3D",
      empty: "选择一个对象或关系查看详情。",
      noGraph: "当前企业还没有企业运行图。"
    };
  }
  return {
    title: "Enterprise Operating Graph 3D",
    empty: "Select an object or relation to inspect it.",
    noGraph: "No Enterprise Operating Graph exists for this enterprise yet."
  };
}

export function createEnterpriseOperatingGraph3dViewerPageV010(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
}): SpatialWorkspacePageV010 {
  const copy = text(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "spatial-workspace",
    id: EOG_3D_VIEWER_PAGE_ID,
    title: copy.title,
    resourceId: PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
    readCommand: {
      code: EOG_3D_VIEWER_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue
    },
    emptyMessage: copy.empty
  };
}

function enterpriseId(context: PlatformRequestContextV010): string {
  const active = context.context?.activeContext;
  if (active?.kind !== "ENTERPRISE" || !active.enterpriseId?.trim()) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EOG_HUMAN_ACTION_REQUIRED");
  }
  return active.enterpriseId.trim();
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
        : "EOG_3D_VIEWER_ACTION_FAILED",
      message
    }
  };
}

export function createEnterpriseOperatingGraph3dViewerReadActionV010(input: {
  graphService: EnterpriseOperatingGraphReadProviderV010;
  viewService: EnterpriseOperatingGraphViewStateProviderV010;
}): AppActionHandler {
  return {
    packageId: EOG_3D_PACKAGE_ID,
    featureId: EOG_3D_VIEWER_FEATURE_ID,
    commandCode: EOG_3D_VIEWER_GET_ACTION,
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
            return success(request, {
              contractVersion: "0.1.0",
              resourceId: graphId,
              revision: 0,
              objects: [],
              links: [],
              notice: text(context.locale).noGraph
            });
          }
          throw error;
        }

        const view = input.viewService.ensure({
          enterpriseId: scopedEnterpriseId,
          graphId,
          viewId: PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
          kind: "SPATIAL_3D"
        });
        return success(
          request,
          projectEnterpriseOperatingGraphSpatialBaseV010({ graph, view })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
