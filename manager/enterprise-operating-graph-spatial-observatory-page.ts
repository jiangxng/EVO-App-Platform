import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "../agents/enterprise-agent/package.js";
import type {
  ActiveContextRefV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import type {
  EogObservationSnapshotV020,
  EogTimeLensV020
} from "../contracts/enterprise-operating-graph-observatory.js";
import {
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewStateV010
} from "../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import type {
  SpatialObservatoryPageV010,
  SpatialObservatoryStateV010
} from "../vendor/eidos/src/spatial/surface.js";
import {
  EOG_EDITOR_RESOURCE_ID
} from "./enterprise-operating-graph-page.js";
import {
  createEnterpriseOperatingGraphObservationBadgesV020,
  createEnterpriseOperatingGraphObservatoryReadPresetsV020
} from "./enterprise-operating-graph-observatory-page.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
import type {
  EnterpriseOperatingGraphViewHostServiceV010
} from "./enterprise-operating-graph-view-service.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "./enterprise-operating-graph-observatory-provider.js";
import {
  parseEogMetricCodesV020,
  parseEogTimeLensInputV020
} from "./enterprise-operating-graph-observatory-input.js";

export const EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-3d";
export const EOG_SPATIAL_OBSERVATORY_ROUTE =
  "/operating-graph/observe/3d";
export const EOG_SPATIAL_OBSERVATORY_VIEW_GET_ACTION =
  "enterprise-operating-graph.observatory.spatial.get";

export function createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020() {
  return {
    contractVersion: "0.1.0" as const,
    experienceId: "evo-enterprise-operating-graph-spatial-observatory",
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    defaultRoute: EOG_SPATIAL_OBSERVATORY_ROUTE,
    pages: [
      {
        id: "evo-enterprise-operating-graph.observatory-3d",
        title: "Enterprise Observatory 3D",
        source: EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE
      }
    ],
    routes: [
      {
        id: "evo-enterprise-operating-graph.observatory-3d",
        path: EOG_SPATIAL_OBSERVATORY_ROUTE,
        pageId: "evo-enterprise-operating-graph.observatory-3d"
      }
    ],
    navigation: [
      {
        id: "evo-enterprise-operating-graph.observatory-3d.nav",
        label: "Observe 3D",
        route: EOG_SPATIAL_OBSERVATORY_ROUTE,
        order: 17
      }
    ]
  };
}

function text(locale?: string) {
  const value = locale?.toLowerCase() ?? "en";
  if (value.startsWith("zh")) {
    return {
      title: "企业运行观测 · 3D",
      empty: "选择一个应用、账本或关系查看运行数据。",
      ready: "3D 与 2D 使用同一个 EOG、Time Lens 和 Runtime Facts。空间位置属于 SPATIAL_3D View State。",
      unavailable: "企业 3D 结构可见，但尚未连接 Runtime Fact Provider。",
      noGraph: "当前企业还没有运行图。请先建立企业运行模型。"
    };
  }
  if (value.startsWith("ja")) {
    return {
      title: "Enterprise Observatory · 3D",
      empty: "オブジェクトまたは関係を選択してください。",
      ready: "3D and 2D consume the same EOG, Time Lens and Runtime Facts. Spatial placement belongs to SPATIAL_3D View State.",
      unavailable: "The 3D enterprise structure is visible, but no Runtime Fact Provider is connected.",
      noGraph: "No Enterprise Operating Graph exists yet."
    };
  }
  return {
    title: "Enterprise Observatory · 3D",
    empty: "Select an Application, Ledger or relation to inspect runtime observations.",
    ready: "3D and 2D consume the same EOG, Time Lens and Runtime Facts. Spatial placement belongs to SPATIAL_3D View State.",
    unavailable: "The 3D enterprise structure is visible, but no Runtime Fact Provider is connected.",
    noGraph: "No Enterprise Operating Graph exists yet."
  };
}

export function createEnterpriseOperatingGraphSpatialObservatoryPageV020(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
  now?: Date;
}): SpatialObservatoryPageV010 {
  const copy = text(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "spatial-observatory",
    id: "evo-enterprise-operating-graph.observatory-3d",
    title: copy.title,
    resourceId: EOG_EDITOR_RESOURCE_ID,
    readCommand: {
      code: EOG_SPATIAL_OBSERVATORY_VIEW_GET_ACTION,
      inputVersion: "0.2.0"
    },
    requestValues: {
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue
    },
    readPresets: createEnterpriseOperatingGraphObservatoryReadPresetsV020(
      input.now ?? new Date()
    ),
    emptyMessage: copy.empty
  };
}

function semanticLabel(refId: string): string {
  const tail = refId.split(":").filter(Boolean).at(-1) ?? refId;
  return tail
    .replaceAll(/[-_.]+/gu, " ")
    .replaceAll(/\b\w/gu, value => value.toUpperCase());
}

function defaultLayerPositions(
  graph: EnterpriseOperatingGraphV010
): Map<string, { x: number; y: number; z: number }> {
  const result = new Map<string, { x: number; y: number; z: number }>();

  for (const kind of ["APPLICATION", "LEDGER"] as const) {
    const nodes = graph.nodes.filter(node => node.kind === kind);
    const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const rows = Math.max(1, Math.ceil(nodes.length / columns));
    nodes.forEach((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      result.set(node.nodeId, {
        x: (column - (columns - 1) / 2) * 260,
        y: ((rows - 1) / 2 - row) * 170,
        z: kind === "APPLICATION" ? 190 : -190
      });
    });
  }

  return result;
}

function spatialPositions(
  graph: EnterpriseOperatingGraphV010,
  view: EnterpriseOperatingGraphViewStateV010
): Map<string, { x: number; y: number; z: number }> {
  const result = defaultLayerPositions(graph);
  for (const placement of view.placements) {
    if (placement.z === undefined) continue;
    result.set(placement.nodeId, {
      x: placement.x,
      y: placement.y,
      z: placement.z
    });
  }
  return result;
}

export function projectEnterpriseOperatingGraphSpatialObservatoryStateV020(input: {
  graph: EnterpriseOperatingGraphV010;
  view: EnterpriseOperatingGraphViewStateV010;
  snapshot?: EogObservationSnapshotV020;
  providerAvailable: boolean;
  locale?: string;
}): SpatialObservatoryStateV010 {
  if (
    input.view.graphId !== input.graph.graphId
    || input.view.enterpriseId !== input.graph.enterpriseId
    || input.view.kind !== "SPATIAL_3D"
  ) {
    throw new Error("EOG_SPATIAL_VIEW_PROJECTION_IDENTITY_MISMATCH");
  }

  const positions = spatialPositions(input.graph, input.view);
  const confirmedPairs = new Set(
    input.graph.enterpriseRelations.map(relation =>
      relation.applicationNodeId + "->" + relation.ledgerNodeId
    )
  );

  const objects = input.graph.nodes.map(node => {
    const observations = input.snapshot
      ? createEnterpriseOperatingGraphObservationBadgesV020(
          "NODE:" + node.nodeId,
          input.snapshot,
          input.locale
        )
      : [];
    return {
      id: node.nodeId,
      kind: node.kind === "APPLICATION" ? "application" : "ledger",
      label: semanticLabel(node.semanticRef.refId),
      position: positions.get(node.nodeId)!,
      detail: [
        node.kind,
        node.semanticRef.authority,
        node.semanticRef.kind,
        node.semanticRef.refId
      ].join(" · "),
      ...(observations.length
        ? { observations: observations.map(item => ({ ...item })) }
        : {})
    };
  });

  const guidance = input.graph.guidanceRelations
    .filter(relation =>
      !confirmedPairs.has(
        relation.applicationNodeId + "->" + relation.ledgerNodeId
      )
    )
    .map(relation => {
      const observations = input.snapshot
        ? createEnterpriseOperatingGraphObservationBadgesV020(
            "RELATION:GUIDANCE:" + relation.relationId,
            input.snapshot,
            input.locale
          )
        : [];
      return {
        id: "guidance-edge:" + relation.relationId,
        source: relation.applicationNodeId,
        target: relation.ledgerNodeId,
        kind: "guidance",
        label: "Guidance",
        detail: relation.source.kind + " · " + relation.source.sourceRef,
        ...(observations.length
          ? { observations: observations.map(item => ({ ...item })) }
          : {})
      };
    });

  const enterprise = input.graph.enterpriseRelations.map(relation => {
    const observations = input.snapshot
      ? createEnterpriseOperatingGraphObservationBadgesV020(
          "RELATION:ENTERPRISE:" + relation.relationId,
          input.snapshot,
          input.locale
        )
      : [];
    return {
      id: "enterprise-edge:" + relation.relationId,
      source: relation.applicationNodeId,
      target: relation.ledgerNodeId,
      kind: "enterprise-confirmed",
      label: "Confirmed",
      detail: "Confirmed by " + relation.confirmedBySubjectId,
      ...(observations.length
        ? { observations: observations.map(item => ({ ...item })) }
        : {})
    };
  });

  const copy = text(input.locale);
  return {
    contractVersion: "0.1.0",
    resourceId: input.graph.graphId,
    revision: input.view.revision,
    objects,
    links: [...guidance, ...enterprise],
    camera: input.view.camera ?? {
      position: { x: 760, y: 520, z: 980 },
      target: { x: 0, y: 0, z: 0 }
    },
    notice: input.providerAvailable
      ? copy.ready
      : copy.unavailable
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
        : "EOG_SPATIAL_OBSERVATORY_VIEW_FAILED",
      message
    }
  };
}

function enterpriseId(
  context: PlatformRequestContextV010
): string {
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

export function createEnterpriseOperatingGraphSpatialObservatoryViewActionHandlerV020(
  input: {
    graphService: EnterpriseOperatingGraphHostServiceV010;
    viewService: EnterpriseOperatingGraphViewHostServiceV010;
    providers: EnterpriseOperatingGraphObservatoryProviderResolverV020;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
  }
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode: EOG_SPATIAL_OBSERVATORY_VIEW_GET_ACTION,

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
              camera: {
                position: { x: 760, y: 520, z: 980 },
                target: { x: 0, y: 0, z: 0 }
              },
              notice: text(input.locale?.(context)).noGraph
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

        if (!input.providers.hasRuntimeCandidate()) {
          return success(
            request,
            projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
              graph,
              view,
              providerAvailable: false,
              locale: input.locale?.(context)
            })
          );
        }

        const timeLens = parseEogTimeLensInputV020(
          request.values.timeLens
        ) as EogTimeLensV020;
        const metricCodes = parseEogMetricCodesV020(
          request.values.metricCodes
        );
        const service = input.providers.createService({
          graphService: input.graphService,
          enterpriseId: scopedEnterpriseId
        });
        const snapshot = await service.observe({
          enterpriseId: scopedEnterpriseId,
          graphId,
          timeLens,
          ...(metricCodes?.length ? { metricCodes } : {})
        });

        return success(
          request,
          projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
            graph,
            view,
            snapshot,
            providerAvailable: true,
            locale: input.locale?.(context)
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
